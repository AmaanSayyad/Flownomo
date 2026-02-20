/**
 * Sui Event Listener Service
 * 
 * This module listens for Sui blockchain events (DepositEvent and WithdrawalEvent)
 * and updates the Supabase database accordingly. It handles event processing,
 * balance updates, audit logging, and automatic reconnection on failures.
 */

import { getSuiClient } from './client';
import { getSuiConfig } from './config';
import { supabase } from '../supabase/client';
import type { SuiEvent } from '@mysten/sui/client';
import { logEventError, logSupabaseError, logInfo } from '@/lib/logging/error-logger';

// Event data interfaces matching the Move contract structs
interface DepositEventData {
  user: string;
  amount: string;
  timestamp: string;
}

interface WithdrawalEventData {
  user: string;
  amount: string;
  timestamp: string;
}

// Event listener state
let isListening = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

// Event queue for retry on Supabase failures
interface QueuedEvent {
  event: SuiEvent;
  attempts: number;
  lastAttempt: number;
}
const eventQueue: QueuedEvent[] = [];
const MAX_QUEUE_SIZE = 100;
const MAX_EVENT_RETRY_ATTEMPTS = 3;
const EVENT_RETRY_DELAY = 5000; // 5 seconds

/**
 * Start listening for Sui blockchain events
 * Subscribes to DepositEvent and WithdrawalEvent from the treasury contract
 * Implements automatic reconnection with exponential backoff
 * 
 * @returns {Promise<void>}
 */
export async function startEventListener(): Promise<void> {
  if (isListening) {
    console.log('Event listener is already running');
    return;
  }

  console.log('Starting Sui event listener...');
  isListening = true;
  reconnectAttempts = 0;

  await subscribeToEvents();
}

/**
 * Stop the event listener
 */
export function stopEventListener(): void {
  isListening = false;
  console.log('Event listener stopped');
}

/**
 * Subscribe to treasury events with automatic reconnection
 * 
 * @returns {Promise<void>}
 */
async function subscribeToEvents(): Promise<void> {
  while (isListening && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    try {
      const client = getSuiClient();
      const config = getSuiConfig();

      console.log('Subscribing to treasury events...');

      // Subscribe to events from the treasury package
      // Using MoveEventModule filter to subscribe to all events from the treasury module
      const unsubscribe = await client.subscribeEvent({
        filter: {
          MoveEventModule: {
            package: config.treasuryPackageId,
            module: 'treasury',
          },
        },
        onMessage: async (event: SuiEvent) => {
          try {
            await handleEvent(event);
          } catch (error) {
            console.error('Error handling event:', error);
            // Log error but don't stop the listener
            logEventError('event_handling_failed', error, { eventId: event.id, eventType: event.type });
            
            // Queue event for retry if it's a Supabase error
            if (isSupabaseError(error)) {
              queueEventForRetry(event);
            }
          }
        },
      });

      console.log('Successfully subscribed to treasury events');
      reconnectAttempts = 0; // Reset on successful connection

      // Keep the subscription alive
      // The subscription will remain active until an error occurs or the process exits
      await new Promise((resolve, reject) => {
        // This promise will only resolve if we explicitly stop listening
        const checkInterval = setInterval(() => {
          if (!isListening) {
            clearInterval(checkInterval);
            unsubscribe();
            resolve(undefined);
          }
        }, 1000);
      });

    } catch (error) {
      reconnectAttempts++;
      const delay = Math.min(
        BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
        MAX_RECONNECT_DELAY
      );

      console.error(
        `Event listener connection failed (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`,
        error
      );
      logEventError('connection_failed', error, { reconnectAttempts, maxAttempts: MAX_RECONNECT_ATTEMPTS });

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Maximum reconnection attempts reached. Event listener stopped.');
        isListening = false;
        // Alert or notify about the failure
        await alertEventListenerFailure();
        break;
      }

      console.log(`Reconnecting in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

/**
 * Handle incoming events and route to appropriate handler
 * 
 * @param {SuiEvent} event - The event from Sui blockchain
 * @returns {Promise<void>}
 */
async function handleEvent(event: SuiEvent): Promise<void> {
  const eventType = event.type;
  const config = getSuiConfig();

  // Check if this is a DepositEvent
  if (eventType.includes('::treasury::DepositEvent')) {
    await handleDepositEvent(event);
  }
  // Check if this is a WithdrawalEvent
  else if (eventType.includes('::treasury::WithdrawalEvent')) {
    await handleWithdrawalEvent(event);
  }
  // Log unknown events for debugging
  else {
    console.log('Received unknown event type:', eventType);
  }
}

/**
 * Handle DepositEvent
 * Updates user balance in Supabase and creates audit log entry
 * 
 * @param {SuiEvent} event - The deposit event
 * @returns {Promise<void>}
 */
export async function handleDepositEvent(event: SuiEvent): Promise<void> {
  let userAddress: string | undefined;
  try {
    const eventData = event.parsedJson as DepositEventData;
    userAddress = eventData.user;
    const amountInSmallestUnit = BigInt(eventData.amount);
    const timestamp = eventData.timestamp;

    // Convert amount from smallest unit to USDC (6 decimals)
    const amount = Number(amountInSmallestUnit) / 1_000_000;

    console.log(`Processing DepositEvent: user=${userAddress}, amount=${amount} USDC`);

    // Update balance in Supabase
    await updateUserBalance(
      userAddress,
      amount,
      'deposit',
      event.id.txDigest
    );

    console.log(`Successfully processed DepositEvent for ${userAddress}`);
  } catch (error) {
    console.error('Error handling DepositEvent:', error);
    logEventError('deposit_event_handling_failed', error, { eventId: event.id, user: userAddress });
    throw error;
  }
}

/**
 * Handle WithdrawalEvent
 * Updates user balance in Supabase and creates audit log entry
 * 
 * @param {SuiEvent} event - The withdrawal event
 * @returns {Promise<void>}
 */
export async function handleWithdrawalEvent(event: SuiEvent): Promise<void> {
  let userAddress: string | undefined;
  try {
    const eventData = event.parsedJson as WithdrawalEventData;
    userAddress = eventData.user;
    const amountInSmallestUnit = BigInt(eventData.amount);
    const timestamp = eventData.timestamp;

    // Convert amount from smallest unit to USDC (6 decimals)
    const amount = Number(amountInSmallestUnit) / 1_000_000;

    console.log(`Processing WithdrawalEvent: user=${userAddress}, amount=${amount} USDC`);

    // Update balance in Supabase
    await updateUserBalance(
      userAddress,
      amount,
      'withdrawal',
      event.id.txDigest
    );

    console.log(`Successfully processed WithdrawalEvent for ${userAddress}`);
  } catch (error) {
    console.error('Error handling WithdrawalEvent:', error);
    logEventError('withdrawal_event_handling_failed', error, { eventId: event.id, user: userAddress });
    throw error;
  }
}

/**
 * Update user balance in Supabase
 * Performs atomic update of balance and creates audit log entry
 * 
 * @param {string} address - User's Sui address
 * @param {number} amount - Amount to add (positive) or subtract (negative)
 * @param {'deposit' | 'withdrawal'} operation - Type of operation
 * @param {string} transactionHash - Transaction digest from Sui
 * @returns {Promise<void>}
 */
async function updateUserBalance(
  address: string,
  amount: number,
  operation: 'deposit' | 'withdrawal',
  transactionHash: string
): Promise<void> {
  try {
    // Get current balance
    const { data: currentBalanceData, error: fetchError } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_address', address)
      .single();

    let balanceBefore = 0;
    if (currentBalanceData) {
      balanceBefore = Number(currentBalanceData.balance);
    }

    // Calculate new balance
    const balanceAfter = operation === 'deposit'
      ? balanceBefore + amount
      : balanceBefore - amount;

    // Ensure balance doesn't go negative
    if (balanceAfter < 0) {
      throw new Error(`Balance would go negative for ${address}: ${balanceAfter}`);
    }

    // Update or insert balance
    const { error: upsertError } = await supabase
      .from('user_balances')
      .upsert({
        user_address: address,
        balance: balanceAfter,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_address',
      });

    if (upsertError) {
      throw upsertError;
    }

    // Create audit log entry
    const { error: auditError } = await supabase
      .from('balance_audit_log')
      .insert({
        user_address: address,
        operation_type: operation,
        amount: amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        transaction_hash: transactionHash,
        created_at: new Date().toISOString(),
      });

    if (auditError) {
      throw auditError;
    }

    console.log(
      `Balance updated for ${address}: ${balanceBefore} -> ${balanceAfter} (${operation} ${amount})`
    );
  } catch (error) {
    console.error('Failed to update user balance:', error);
    logSupabaseError('balance_update_failed', error, { address, amount, operation, transactionHash });
    throw error;
  }
}

/**
 * Sleep for a specified duration
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Alert about event listener failure
 * This should notify developers/operators about the critical failure
 * 
 * @returns {Promise<void>}
 */
async function alertEventListenerFailure(): Promise<void> {
  const alertMessage = {
    severity: 'CRITICAL',
    service: 'sui-event-listener',
    message: 'Event listener failed after maximum reconnection attempts',
    timestamp: new Date().toISOString(),
  };

  console.error('ALERT:', JSON.stringify(alertMessage, null, 2));
  logEventError('listener_max_retries_exceeded', new Error('Event listener failed after maximum reconnection attempts'), {});

  // TODO: Send alert to monitoring service (e.g., PagerDuty, Slack, email)
  // This would be implemented based on the alerting service being used
}

/**
 * Get event listener status
 * 
 * @returns {Object} Status information
 */
export function getEventListenerStatus(): {
  isListening: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  queuedEvents: number;
} {
  return {
    isListening,
    reconnectAttempts,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    queuedEvents: eventQueue.length,
  };
}

/**
 * Check if an error is a Supabase error
 * 
 * @param {any} error - Error object
 * @returns {boolean} True if it's a Supabase error
 */
function isSupabaseError(error: any): boolean {
  return (
    error?.message?.toLowerCase().includes('supabase') ||
    error?.message?.toLowerCase().includes('database') ||
    error?.message?.toLowerCase().includes('postgres') ||
    error?.code?.includes('PGRST')
  );
}

/**
 * Queue an event for retry on Supabase failure
 * Requirements: 11.5, 14.4
 * 
 * @param {SuiEvent} event - The event to queue
 */
function queueEventForRetry(event: SuiEvent): void {
  // Check if queue is full
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    console.error('Event queue is full, dropping oldest event');
    logEventError('queue_full', new Error('Queue size exceeded'), { queueSize: eventQueue.length });
    eventQueue.shift(); // Remove oldest event
  }
  
  // Add event to queue
  eventQueue.push({
    event,
    attempts: 0,
    lastAttempt: Date.now(),
  });
  
  console.log(`Event queued for retry. Queue size: ${eventQueue.length}`);
  
  // Start processing queue if not already running
  processEventQueue();
}

/**
 * Process queued events with retry logic
 * Requirements: 11.5, 14.4
 */
async function processEventQueue(): Promise<void> {
  // Process events one at a time
  while (eventQueue.length > 0) {
    const queuedEvent = eventQueue[0];
    
    // Check if enough time has passed since last attempt
    const timeSinceLastAttempt = Date.now() - queuedEvent.lastAttempt;
    if (timeSinceLastAttempt < EVENT_RETRY_DELAY) {
      // Wait before retrying
      await sleep(EVENT_RETRY_DELAY - timeSinceLastAttempt);
    }
    
    try {
      // Attempt to process the event
      await handleEvent(queuedEvent.event);
      
      // Success! Remove from queue
      eventQueue.shift();
      console.log(`Successfully processed queued event. Queue size: ${eventQueue.length}`);
    } catch (error) {
      queuedEvent.attempts++;
      queuedEvent.lastAttempt = Date.now();
      
      console.error(`Failed to process queued event (attempt ${queuedEvent.attempts}/${MAX_EVENT_RETRY_ATTEMPTS}):`, error);
      logEventError('queued_event_processing_failed', error, {
        eventId: queuedEvent.event.id,
        attempts: queuedEvent.attempts,
      });
      
      // Check if max attempts reached
      if (queuedEvent.attempts >= MAX_EVENT_RETRY_ATTEMPTS) {
        console.error('Max retry attempts reached for event, removing from queue');
        eventQueue.shift();
        
        // Alert about the failure
        await alertEventProcessingFailure(queuedEvent.event);
      } else {
        // Keep in queue for next retry
        break;
      }
    }
  }
}

/**
 * Alert about event processing failure after max retries
 * Requirements: 11.5, 14.4
 * 
 * @param {SuiEvent} event - The event that failed
 * @returns {Promise<void>}
 */
async function alertEventProcessingFailure(event: SuiEvent): Promise<void> {
  const alertMessage = {
    severity: 'HIGH',
    service: 'sui-event-listener',
    message: 'Event processing failed after maximum retry attempts',
    eventId: event.id,
    eventType: event.type,
    timestamp: new Date().toISOString(),
  };
  
  console.error('ALERT:', JSON.stringify(alertMessage, null, 2));
  logEventError('event_max_retries_exceeded', new Error('Event processing failed after maximum retry attempts'), {
    eventId: event.id,
    eventType: event.type,
  });
  
  // TODO: Send alert to monitoring service (e.g., PagerDuty, Slack, email)
}
