/**
 * Balance event listeners for house balance system
 * 
 * Task: 5.1 Create event listener for Deposit events
 * Task: 5.2 Create event listener for Withdrawal events
 * Task: 5.3 Create event listener for payout events
 * Requirements: 1.2, 4.2, 4.5
 * 
 * Listens for Deposit, Withdrawal, and RoundSettled events from the OverflowGame contract
 * and updates Supabase balances via API endpoints.
 */

import * as fcl from "@onflow/fcl";

/**
 * Event emitted when a user deposits FLOW tokens to house balance
 */
export interface DepositEvent {
  userAddress: string;
  amount: string;
  timestamp: string;
}

/**
 * Event emitted when a user withdraws FLOW tokens from house balance
 */
export interface WithdrawalEvent {
  userAddress: string;
  amount: string;
  timestamp: string;
}

/**
 * Event emitted when a round is settled (bet outcome determined)
 */
export interface RoundSettledEvent {
  betId: string;
  player: string;
  won: boolean;
  actualPriceChange: string;
  payout: string;
  startPrice: string;
  endPrice: string;
  timestamp: string;
}

/**
 * Subscribe to Deposit events from the OverflowGame contract
 * @param contractAddress - The address of the OverflowGame contract (without 0x prefix)
 * @param onDeposit - Callback function when a deposit event is received
 * @returns Unsubscribe function to stop listening to events
 */
export const subscribeToDepositEvents = (
  contractAddress: string,
  onDeposit: (event: DepositEvent) => void
): (() => void) => {
  // Remove 0x prefix if present
  const cleanAddress = contractAddress.replace(/^0x/, '');
  
  console.log(`[DepositListener] Subscribing to Deposit events from A.${cleanAddress}.OverflowGame.Deposit`);
  
  // Subscribe to Deposit events
  const depositUnsubscribe = fcl.events(`A.${cleanAddress}.OverflowGame.Deposit`)
    .subscribe((event: any) => {
      try {
        console.log('[DepositListener] Received Deposit event:', event);
        
        const eventData = event.data;
        onDeposit({
          userAddress: eventData.userAddress,
          amount: eventData.amount,
          timestamp: eventData.timestamp
        });
      } catch (error) {
        console.error('[DepositListener] Error processing Deposit event:', error);
      }
    });
  
  console.log('[DepositListener] Successfully subscribed to Deposit events');
  
  // Return unsubscribe function
  return () => {
    console.log('[DepositListener] Unsubscribing from Deposit events');
    depositUnsubscribe();
  };
};

/**
 * Subscribe to Withdrawal events from the OverflowGame contract
 * @param contractAddress - The address of the OverflowGame contract (without 0x prefix)
 * @param onWithdrawal - Callback function when a withdrawal event is received
 * @returns Unsubscribe function to stop listening to events
 */
export const subscribeToWithdrawalEvents = (
  contractAddress: string,
  onWithdrawal: (event: WithdrawalEvent) => void
): (() => void) => {
  // Remove 0x prefix if present
  const cleanAddress = contractAddress.replace(/^0x/, '');
  
  console.log(`[WithdrawalListener] Subscribing to Withdrawal events from A.${cleanAddress}.OverflowGame.Withdrawal`);
  
  // Subscribe to Withdrawal events
  const withdrawalUnsubscribe = fcl.events(`A.${cleanAddress}.OverflowGame.Withdrawal`)
    .subscribe((event: any) => {
      try {
        console.log('[WithdrawalListener] Received Withdrawal event:', event);
        
        const eventData = event.data;
        onWithdrawal({
          userAddress: eventData.userAddress,
          amount: eventData.amount,
          timestamp: eventData.timestamp
        });
      } catch (error) {
        console.error('[WithdrawalListener] Error processing Withdrawal event:', error);
      }
    });
  
  console.log('[WithdrawalListener] Successfully subscribed to Withdrawal events');
  
  // Return unsubscribe function
  return () => {
    console.log('[WithdrawalListener] Unsubscribing from Withdrawal events');
    withdrawalUnsubscribe();
  };
};

/**
 * Subscribe to RoundSettled events from the OverflowGame contract
 * @param contractAddress - The address of the OverflowGame contract (without 0x prefix)
 * @param onRoundSettled - Callback function when a round settled event is received
 * @returns Unsubscribe function to stop listening to events
 */
export const subscribeToRoundSettledEvents = (
  contractAddress: string,
  onRoundSettled: (event: RoundSettledEvent) => void
): (() => void) => {
  // Remove 0x prefix if present
  const cleanAddress = contractAddress.replace(/^0x/, '');
  
  console.log(`[RoundSettledListener] Subscribing to RoundSettled events from A.${cleanAddress}.OverflowGame.RoundSettled`);
  
  // Subscribe to RoundSettled events
  const roundSettledUnsubscribe = fcl.events(`A.${cleanAddress}.OverflowGame.RoundSettled`)
    .subscribe((event: any) => {
      try {
        console.log('[RoundSettledListener] Received RoundSettled event:', event);
        
        const eventData = event.data;
        onRoundSettled({
          betId: eventData.betId.toString(),
          player: eventData.player,
          won: eventData.won,
          actualPriceChange: eventData.actualPriceChange,
          payout: eventData.payout,
          startPrice: eventData.startPrice,
          endPrice: eventData.endPrice,
          timestamp: eventData.timestamp
        });
      } catch (error) {
        console.error('[RoundSettledListener] Error processing RoundSettled event:', error);
      }
    });
  
  console.log('[RoundSettledListener] Successfully subscribed to RoundSettled events');
  
  // Return unsubscribe function
  return () => {
    console.log('[RoundSettledListener] Unsubscribing from RoundSettled events');
    roundSettledUnsubscribe();
  };
};

/**
 * Subscribe to all balance-related events (Deposit, Withdrawal, and RoundSettled)
 * @param contractAddress - The address of the OverflowGame contract (without 0x prefix)
 * @param onDeposit - Callback function when a deposit event is received
 * @param onWithdrawal - Callback function when a withdrawal event is received
 * @param onRoundSettled - Callback function when a round settled event is received
 * @returns Unsubscribe function to stop listening to all events
 */
export const subscribeToBalanceEvents = (
  contractAddress: string,
  onDeposit: (event: DepositEvent) => void,
  onWithdrawal: (event: WithdrawalEvent) => void,
  onRoundSettled: (event: RoundSettledEvent) => void
): (() => void) => {
  console.log('[BalanceListener] Starting balance event listeners');
  
  // Subscribe to Deposit, Withdrawal, and RoundSettled events
  const unsubscribeDeposit = subscribeToDepositEvents(contractAddress, onDeposit);
  const unsubscribeWithdrawal = subscribeToWithdrawalEvents(contractAddress, onWithdrawal);
  const unsubscribeRoundSettled = subscribeToRoundSettledEvents(contractAddress, onRoundSettled);
  
  // Return combined unsubscribe function
  return () => {
    console.log('[BalanceListener] Stopping all balance event listeners');
    unsubscribeDeposit();
    unsubscribeWithdrawal();
    unsubscribeRoundSettled();
  };
};

/**
 * Handle a Deposit event by calling the API endpoint
 * @param event - The deposit event data
 * @param txHash - The transaction hash (optional, will be extracted from event if not provided)
 */
export const handleDepositEvent = async (
  event: DepositEvent,
  txHash?: string
): Promise<void> => {
  try {
    console.log('[DepositHandler] Processing deposit event:', event);
    
    // Extract transaction hash from event or use provided one
    const transactionHash = txHash || `tx_${event.timestamp}`;
    
    // Call the deposit API endpoint
    const response = await fetch('/api/balance/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress: event.userAddress,
        amount: parseFloat(event.amount),
        txHash: transactionHash,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[DepositHandler] API error:', errorData);
      throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('[DepositHandler] Successfully updated balance:', result);
  } catch (error) {
    console.error('[DepositHandler] Error handling deposit event:', error);
    // Log the error but don't throw - we don't want to crash the listener
    // In production, you might want to implement retry logic or dead letter queue
  }
};

/**
 * Handle a Withdrawal event by calling the API endpoint
 * @param event - The withdrawal event data
 * @param txHash - The transaction hash (optional, will be extracted from event if not provided)
 */
export const handleWithdrawalEvent = async (
  event: WithdrawalEvent,
  txHash?: string
): Promise<void> => {
  try {
    console.log('[WithdrawalHandler] Processing withdrawal event:', event);
    
    // Extract transaction hash from event or use provided one
    const transactionHash = txHash || `tx_${event.timestamp}`;
    
    // Call the withdrawal API endpoint
    const response = await fetch('/api/balance/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress: event.userAddress,
        amount: parseFloat(event.amount),
        txHash: transactionHash,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WithdrawalHandler] API error:', errorData);
      throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('[WithdrawalHandler] Successfully updated balance:', result);
  } catch (error) {
    console.error('[WithdrawalHandler] Error handling withdrawal event:', error);
    // Log the error but don't throw - we don't want to crash the listener
    // In production, you might want to implement retry logic or dead letter queue
  }
};

/**
 * Handle a RoundSettled event by calling the payout API endpoint for winners
 * @param event - The round settled event data
 */
export const handleRoundSettledEvent = async (
  event: RoundSettledEvent
): Promise<void> => {
  try {
    console.log('[RoundSettledHandler] Processing round settled event:', event);
    
    // Only process winning bets
    if (!event.won) {
      console.log('[RoundSettledHandler] Bet lost, no payout needed');
      return;
    }
    
    // Parse payout amount
    const payoutAmount = parseFloat(event.payout);
    
    // Validate payout amount
    if (payoutAmount <= 0) {
      console.error('[RoundSettledHandler] Invalid payout amount:', payoutAmount);
      return;
    }
    
    // Call the payout API endpoint
    const response = await fetch('/api/balance/payout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress: event.player,
        payoutAmount: payoutAmount,
        betId: event.betId,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[RoundSettledHandler] API error:', errorData);
      throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('[RoundSettledHandler] Successfully credited payout to balance:', result);
  } catch (error) {
    console.error('[RoundSettledHandler] Error handling round settled event:', error);
    // Log the error but don't throw - we don't want to crash the listener
    // In production, you might want to implement retry logic or dead letter queue
  }
};

/**
 * Start listening to balance events and automatically handle them
 * @param contractAddress - The address of the OverflowGame contract (without 0x prefix)
 * @param apiBaseUrl - Base URL for API calls (optional, defaults to relative URLs)
 * @returns Unsubscribe function to stop listening
 */
export const startBalanceEventListener = (
  contractAddress: string,
  apiBaseUrl?: string
): (() => void) => {
  console.log('[BalanceListener] Starting automated balance event listener');
  
  // Create handlers that call the API endpoints
  const depositHandler = async (event: DepositEvent) => {
    await handleDepositEvent(event);
  };
  
  const withdrawalHandler = async (event: WithdrawalEvent) => {
    await handleWithdrawalEvent(event);
  };
  
  const roundSettledHandler = async (event: RoundSettledEvent) => {
    await handleRoundSettledEvent(event);
  };
  
  // Subscribe to events with automatic handling
  return subscribeToBalanceEvents(
    contractAddress,
    depositHandler,
    withdrawalHandler,
    roundSettledHandler
  );
};
