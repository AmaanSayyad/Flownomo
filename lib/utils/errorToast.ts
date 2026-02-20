/**
 * Error Toast Helper Functions
 * 
 * Task: 13.1 Add error handling utilities
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 * 
 * Provides helper functions for displaying error messages as toast notifications
 * with appropriate context and retry options.
 */

import { useToastStore } from '@/lib/hooks/useToast';
import {
  ErrorCode,
  ErrorCodeType,
  formatErrorForDisplay,
  extractErrorCode,
  HouseBalanceError,
} from './errors';

// ============================================================================
// Toast Error Display Functions
// ============================================================================

/**
 * Shows an error toast notification
 * 
 * @param error - The error to display
 * @param context - Optional context for contextual messages
 */
export function showErrorToast(
  error: unknown,
  context?: 'deposit' | 'bet' | 'withdrawal'
): void {
  const message = formatErrorForDisplay(error, context);
  useToastStore.getState().addToast(message, 'error');
}

/**
 * Shows a success toast notification
 * 
 * @param message - The success message to display
 */
export function showSuccessToast(message: string): void {
  useToastStore.getState().addToast(message, 'success');
}

/**
 * Shows a warning toast notification
 * 
 * @param message - The warning message to display
 */
export function showWarningToast(message: string): void {
  useToastStore.getState().addToast(message, 'warning');
}

/**
 * Shows an info toast notification
 * 
 * @param message - The info message to display
 */
export function showInfoToast(message: string): void {
  useToastStore.getState().addToast(message, 'info');
}

// ============================================================================
// Context-Specific Error Toast Functions
// ============================================================================

/**
 * Shows an error toast for deposit operations
 * Requirement 10.1: Display appropriate error messages for deposit failures
 * 
 * @param error - The error that occurred
 */
export function showDepositErrorToast(error: unknown): void {
  showErrorToast(error, 'deposit');
}

/**
 * Shows a success toast for deposit operations
 * Requirement 8.5: Display toast notification on transaction completion
 * 
 * @param amount - The deposited amount
 * @param newBalance - The new balance after deposit
 */
export function showDepositSuccessToast(amount: number, newBalance: number): void {
  showSuccessToast(
    `Successfully deposited ${amount.toFixed(4)} USDC. New balance: ${newBalance.toFixed(4)} USDC`
  );
}

/**
 * Shows an error toast for bet operations
 * Requirement 10.2: Display appropriate error messages for bet failures
 * 
 * @param error - The error that occurred
 */
export function showBetErrorToast(error: unknown): void {
  showErrorToast(error, 'bet');
}

/**
 * Shows a success toast for bet operations
 * 
 * @param betAmount - The bet amount
 * @param remainingBalance - The remaining balance after bet
 */
export function showBetSuccessToast(betAmount: number, remainingBalance: number): void {
  showSuccessToast(
    `Bet placed: ${betAmount.toFixed(4)} USDC. Remaining balance: ${remainingBalance.toFixed(4)} USDC`
  );
}

/**
 * Shows an error toast for withdrawal operations
 * Requirement 10.3: Display appropriate error messages for withdrawal failures
 * 
 * @param error - The error that occurred
 */
export function showWithdrawalErrorToast(error: unknown): void {
  showErrorToast(error, 'withdrawal');
}

/**
 * Shows a success toast for withdrawal operations
 * Requirement 8.5: Display toast notification on transaction completion
 * 
 * @param amount - The withdrawn amount
 * @param newBalance - The new balance after withdrawal
 */
export function showWithdrawalSuccessToast(amount: number, newBalance: number): void {
  showSuccessToast(
    `Successfully withdrew ${amount.toFixed(4)} USDC. New balance: ${newBalance.toFixed(4)} USDC`
  );
}

// ============================================================================
// Special Error Toast Functions
// ============================================================================

/**
 * Shows an error toast for insufficient balance with a call-to-action
 * 
 * @param context - The operation context (bet or withdrawal)
 * @param currentBalance - The user's current balance
 * @param requiredAmount - The amount required for the operation
 */
export function showInsufficientBalanceToast(
  context: 'bet' | 'withdrawal',
  currentBalance: number,
  requiredAmount: number
): void {
  const shortfall = requiredAmount - currentBalance;
  const message = context === 'bet'
    ? `Insufficient house balance. You need ${shortfall.toFixed(4)} more USDC to place this bet.`
    : `Insufficient house balance. You have ${currentBalance.toFixed(4)} USDC but tried to withdraw ${requiredAmount.toFixed(4)} USDC.`;
  
  useToastStore.getState().addToast(message, 'error');
}

/**
 * Shows an error toast for blockchain transaction failures with retry option
 * Requirement 10.5: Display transaction error message and provide retry option
 * 
 * @param error - The blockchain error
 * @param onRetry - Optional callback for retry action
 */
export function showTransactionErrorToast(error: unknown, onRetry?: () => void): void {
  const errorCode = extractErrorCode(error);
  let message = formatErrorForDisplay(error);
  
  // Add specific guidance based on error type
  if (errorCode === ErrorCode.TX_TIMEOUT) {
    message += ' Check your wallet for the transaction status.';
  } else if (errorCode === ErrorCode.NETWORK_ERROR) {
    message += ' Please check your internet connection.';
  } else if (errorCode === ErrorCode.TX_FAILED) {
    // For transaction failures, try to extract the actual blockchain error
    if (error instanceof Error) {
      message = error.message;
    }
  }
  
  useToastStore.getState().addToast(message, 'error');
  
  // If retry callback provided, show info toast with retry suggestion
  if (onRetry) {
    setTimeout(() => {
      showInfoToast('You can try the transaction again.');
    }, 1000);
  }
}

/**
 * Shows an error toast for database/service errors
 * Requirement 10.4: Display appropriate error for service unavailability
 * 
 * @param error - The database error
 */
export function showDatabaseErrorToast(error: unknown): void {
  const errorCode = extractErrorCode(error);
  
  if (errorCode === ErrorCode.DB_CONNECTION_ERROR) {
    showErrorToast(error);
    // Add helpful info after a delay
    setTimeout(() => {
      showInfoToast('If the problem persists, please contact support.');
    }, 1000);
  } else {
    showErrorToast(error);
  }
}

/**
 * Shows an error toast for authorization failures
 * 
 * @param error - The authorization error
 */
export function showAuthorizationErrorToast(error: unknown): void {
  showErrorToast(error);
  
  // Add helpful guidance
  setTimeout(() => {
    showInfoToast('Please ensure you are using the correct wallet.');
  }, 1000);
}

/**
 * Shows an error toast for validation failures
 * 
 * @param error - The validation error
 */
export function showValidationErrorToast(error: unknown): void {
  showErrorToast(error);
}

/**
 * Shows a critical error toast for synchronization issues
 * 
 * @param userAddress - The affected user address
 */
export function showSyncErrorToast(userAddress: string): void {
  showErrorToast(
    new HouseBalanceError(
      ErrorCode.SYNC_ERROR,
      'Balance synchronization error detected. Please contact support.'
    )
  );
  
  console.error('CRITICAL: Balance synchronization error for user:', userAddress);
}

// ============================================================================
// Batch Error Handling
// ============================================================================

/**
 * Handles an error and shows appropriate toast based on error type
 * This is a convenience function that routes errors to the appropriate handler
 * 
 * @param error - The error to handle
 * @param context - Optional operation context
 * @param onRetry - Optional retry callback for blockchain errors
 */
export function handleErrorWithToast(
  error: unknown,
  context?: 'deposit' | 'bet' | 'withdrawal',
  onRetry?: () => void
): void {
  const errorCode = extractErrorCode(error);
  
  // Route to appropriate handler based on error type
  if (errorCode === ErrorCode.TX_FAILED || 
      errorCode === ErrorCode.TX_TIMEOUT || 
      errorCode === ErrorCode.NETWORK_ERROR) {
    showTransactionErrorToast(error, onRetry);
  } else if (errorCode === ErrorCode.DB_CONNECTION_ERROR || 
             errorCode === ErrorCode.DB_QUERY_ERROR) {
    showDatabaseErrorToast(error);
  } else if (errorCode === ErrorCode.UNAUTHORIZED || 
             errorCode === ErrorCode.SIGNER_MISMATCH) {
    showAuthorizationErrorToast(error);
  } else if (errorCode === ErrorCode.INVALID_AMOUNT || 
             errorCode === ErrorCode.INVALID_ADDRESS) {
    showValidationErrorToast(error);
  } else if (context) {
    // Use context-specific handler
    showErrorToast(error, context);
  } else {
    // Generic error handler
    showErrorToast(error);
  }
}
