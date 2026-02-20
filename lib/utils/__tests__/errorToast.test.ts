/**
 * Unit Tests for Error Toast Helper Functions
 * 
 * Task: 13.1 Add error handling utilities
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { useToastStore } from '@/lib/hooks/useToast';
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  showInfoToast,
  showDepositErrorToast,
  showDepositSuccessToast,
  showBetErrorToast,
  showBetSuccessToast,
  showWithdrawalErrorToast,
  showWithdrawalSuccessToast,
  showInsufficientBalanceToast,
  showTransactionErrorToast,
  showDatabaseErrorToast,
  showAuthorizationErrorToast,
  showValidationErrorToast,
  showSyncErrorToast,
  handleErrorWithToast,
} from '../errorToast';
import {
  ErrorCode,
  HouseBalanceError,
  InsufficientBalanceError,
  ValidationError,
  AuthorizationError,
  DatabaseError,
  BlockchainError,
} from '../errors';

// Mock the toast store
jest.mock('@/lib/hooks/useToast', () => ({
  useToastStore: {
    getState: jest.fn(() => ({
      addToast: jest.fn(),
    })),
  },
}));

describe('Error Toast Helper Functions', () => {
  let mockAddToast: jest.Mock;

  beforeEach(() => {
    mockAddToast = jest.fn();
    (useToastStore.getState as jest.Mock).mockReturnValue({
      addToast: mockAddToast,
    });
    jest.clearAllMocks();
  });

  describe('Basic Toast Functions', () => {
    test('showErrorToast should display error message', () => {
      const error = new Error('Test error');
      showErrorToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith('Test error', 'error');
    });

    test('showSuccessToast should display success message', () => {
      showSuccessToast('Operation successful');
      
      expect(mockAddToast).toHaveBeenCalledWith('Operation successful', 'success');
    });

    test('showWarningToast should display warning message', () => {
      showWarningToast('Warning message');
      
      expect(mockAddToast).toHaveBeenCalledWith('Warning message', 'warning');
    });

    test('showInfoToast should display info message', () => {
      showInfoToast('Info message');
      
      expect(mockAddToast).toHaveBeenCalledWith('Info message', 'info');
    });
  });

  describe('Deposit Toast Functions', () => {
    test('showDepositErrorToast should display deposit error', () => {
      const error = new InsufficientBalanceError(ErrorCode.INSUFFICIENT_WALLET_BALANCE);
      showDepositErrorToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Insufficient wallet balance for deposit',
        'error'
      );
    });

    test('showDepositSuccessToast should display success with amounts', () => {
      showDepositSuccessToast(10.5, 25.75);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Successfully deposited 10.5000 FLOW. New balance: 25.7500 FLOW',
        'success'
      );
    });
  });

  describe('Bet Toast Functions', () => {
    test('showBetErrorToast should display bet error with context', () => {
      const error = new InsufficientBalanceError(ErrorCode.INSUFFICIENT_HOUSE_BALANCE);
      showBetErrorToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Insufficient house balance. Please deposit more FLOW.',
        'error'
      );
    });

    test('showBetSuccessToast should display success with amounts', () => {
      showBetSuccessToast(5.0, 15.5);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Bet placed: 5.0000 FLOW. Remaining balance: 15.5000 FLOW',
        'success'
      );
    });
  });

  describe('Withdrawal Toast Functions', () => {
    test('showWithdrawalErrorToast should display withdrawal error with context', () => {
      const error = new InsufficientBalanceError(ErrorCode.INSUFFICIENT_HOUSE_BALANCE);
      showWithdrawalErrorToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Insufficient house balance for withdrawal',
        'error'
      );
    });

    test('showWithdrawalSuccessToast should display success with amounts', () => {
      showWithdrawalSuccessToast(8.25, 12.5);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Successfully withdrew 8.2500 FLOW. New balance: 12.5000 FLOW',
        'success'
      );
    });
  });

  describe('Special Error Toast Functions', () => {
    test('showInsufficientBalanceToast should show shortfall for bet', () => {
      showInsufficientBalanceToast('bet', 5.0, 10.0);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Insufficient house balance. You need 5.0000 more FLOW to place this bet.',
        'error'
      );
    });

    test('showInsufficientBalanceToast should show amounts for withdrawal', () => {
      showInsufficientBalanceToast('withdrawal', 5.0, 10.0);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Insufficient house balance. You have 5.0000 FLOW but tried to withdraw 10.0000 FLOW.',
        'error'
      );
    });

    test('showTransactionErrorToast should display transaction error', () => {
      const error = new BlockchainError(ErrorCode.TX_FAILED, 'Transaction reverted');
      showTransactionErrorToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Transaction reverted',
        'error'
      );
    });

    test('showTransactionErrorToast should add guidance for timeout', () => {
      jest.useFakeTimers();
      const error = new BlockchainError(ErrorCode.TX_TIMEOUT);
      showTransactionErrorToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('check your wallet'),
        'error'
      );
      
      jest.runAllTimers();
      jest.useRealTimers();
    });

    test('showTransactionErrorToast should add guidance for network error', () => {
      const error = new BlockchainError(ErrorCode.NETWORK_ERROR);
      showTransactionErrorToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('check your internet connection'),
        'error'
      );
    });

    test('showTransactionErrorToast should suggest retry when callback provided', () => {
      jest.useFakeTimers();
      const error = new BlockchainError(ErrorCode.TX_FAILED);
      const onRetry = jest.fn();
      
      showTransactionErrorToast(error, onRetry);
      
      expect(mockAddToast).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(1000);
      
      expect(mockAddToast).toHaveBeenCalledTimes(2);
      expect(mockAddToast).toHaveBeenLastCalledWith(
        'You can try the transaction again.',
        'info'
      );
      
      jest.useRealTimers();
    });

    test('showDatabaseErrorToast should display database error', () => {
      const error = new DatabaseError(ErrorCode.DB_CONNECTION_ERROR);
      showDatabaseErrorToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Service temporarily unavailable. Please try again.',
        'error'
      );
    });

    test('showDatabaseErrorToast should add support message for connection errors', () => {
      jest.useFakeTimers();
      const error = new DatabaseError(ErrorCode.DB_CONNECTION_ERROR);
      
      showDatabaseErrorToast(error);
      
      jest.advanceTimersByTime(1000);
      
      expect(mockAddToast).toHaveBeenCalledTimes(2);
      expect(mockAddToast).toHaveBeenLastCalledWith(
        'If the problem persists, please contact support.',
        'info'
      );
      
      jest.useRealTimers();
    });

    test('showAuthorizationErrorToast should display auth error with guidance', () => {
      jest.useFakeTimers();
      const error = new AuthorizationError(ErrorCode.UNAUTHORIZED);
      
      showAuthorizationErrorToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'You are not authorized to perform this operation',
        'error'
      );
      
      jest.advanceTimersByTime(1000);
      
      expect(mockAddToast).toHaveBeenLastCalledWith(
        'Please ensure you are using the correct wallet.',
        'info'
      );
      
      jest.useRealTimers();
    });

    test('showValidationErrorToast should display validation error', () => {
      const error = new ValidationError(ErrorCode.INVALID_AMOUNT);
      showValidationErrorToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Amount must be greater than zero',
        'error'
      );
    });

    test('showSyncErrorToast should display sync error', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      showSyncErrorToast('0x123456');
      
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Balance synchronization error'),
        'error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'CRITICAL: Balance synchronization error for user:',
        '0x123456'
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleErrorWithToast', () => {
    test('should route blockchain errors to transaction handler', () => {
      const error = new BlockchainError(ErrorCode.TX_FAILED);
      handleErrorWithToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.any(String),
        'error'
      );
    });

    test('should route database errors to database handler', () => {
      jest.useFakeTimers();
      const error = new DatabaseError(ErrorCode.DB_CONNECTION_ERROR);
      handleErrorWithToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Service temporarily unavailable. Please try again.',
        'error'
      );
      
      jest.useRealTimers();
    });

    test('should route authorization errors to auth handler', () => {
      jest.useFakeTimers();
      const error = new AuthorizationError(ErrorCode.UNAUTHORIZED);
      handleErrorWithToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'You are not authorized to perform this operation',
        'error'
      );
      
      jest.useRealTimers();
    });

    test('should route validation errors to validation handler', () => {
      const error = new ValidationError(ErrorCode.INVALID_AMOUNT);
      handleErrorWithToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Amount must be greater than zero',
        'error'
      );
    });

    test('should use context-specific handler when context provided', () => {
      const error = new InsufficientBalanceError(ErrorCode.INSUFFICIENT_HOUSE_BALANCE);
      handleErrorWithToast(error, 'withdrawal');
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Insufficient house balance for withdrawal',
        'error'
      );
    });

    test('should handle generic errors', () => {
      const error = new Error('Generic error');
      handleErrorWithToast(error);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'Generic error',
        'error'
      );
    });

    test('should pass retry callback to transaction handler', () => {
      jest.useFakeTimers();
      const error = new BlockchainError(ErrorCode.TX_FAILED);
      const onRetry = jest.fn();
      
      handleErrorWithToast(error, undefined, onRetry);
      
      jest.advanceTimersByTime(1000);
      
      expect(mockAddToast).toHaveBeenCalledWith(
        'You can try the transaction again.',
        'info'
      );
      
      jest.useRealTimers();
    });
  });
});
