/**
 * Unit Tests for Error Handling Utilities
 * 
 * Task: 13.1 Add error handling utilities
 * Requirements: 6.3, 10.1, 10.2, 10.3, 10.4, 10.5
 */

import {
  ErrorCode,
  ErrorMessages,
  HouseBalanceError,
  InsufficientBalanceError,
  ValidationError,
  AuthorizationError,
  DatabaseError,
  BlockchainError,
  SynchronizationError,
  getErrorMessage,
  extractErrorCode,
  formatErrorForDisplay,
  isRetryableError,
  calculateRetryDelay,
  withRetry,
  executeDatabaseOperation,
  DEFAULT_RETRY_CONFIG,
  logError,
  logSecurityEvent,
} from '../errors';

describe('Error Code Constants', () => {
  test('should have all required error codes', () => {
    expect(ErrorCode.INSUFFICIENT_WALLET_BALANCE).toBe('INSUFFICIENT_WALLET_BALANCE');
    expect(ErrorCode.INSUFFICIENT_HOUSE_BALANCE).toBe('INSUFFICIENT_HOUSE_BALANCE');
    expect(ErrorCode.INVALID_AMOUNT).toBe('INVALID_AMOUNT');
    expect(ErrorCode.INVALID_ADDRESS).toBe('INVALID_ADDRESS');
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCode.SIGNER_MISMATCH).toBe('SIGNER_MISMATCH');
    expect(ErrorCode.DB_CONNECTION_ERROR).toBe('DB_CONNECTION_ERROR');
    expect(ErrorCode.DB_QUERY_ERROR).toBe('DB_QUERY_ERROR');
    expect(ErrorCode.CONSTRAINT_VIOLATION).toBe('CONSTRAINT_VIOLATION');
    expect(ErrorCode.TX_FAILED).toBe('TX_FAILED');
    expect(ErrorCode.TX_TIMEOUT).toBe('TX_TIMEOUT');
    expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorCode.SYNC_ERROR).toBe('SYNC_ERROR');
  });
});

describe('Error Message Mapping', () => {
  test('should have messages for all error codes', () => {
    Object.values(ErrorCode).forEach(code => {
      expect(ErrorMessages[code]).toBeDefined();
      expect(typeof ErrorMessages[code]).toBe('string');
      expect(ErrorMessages[code].length).toBeGreaterThan(0);
    });
  });

  test('should have correct messages for insufficient balance errors', () => {
    expect(ErrorMessages[ErrorCode.INSUFFICIENT_WALLET_BALANCE]).toBe(
      'Insufficient wallet balance for deposit'
    );
    expect(ErrorMessages[ErrorCode.INSUFFICIENT_HOUSE_BALANCE]).toBe(
      'Insufficient house balance. Please deposit more FLOW.'
    );
  });

  test('should have correct messages for validation errors', () => {
    expect(ErrorMessages[ErrorCode.INVALID_AMOUNT]).toBe(
      'Amount must be greater than zero'
    );
    expect(ErrorMessages[ErrorCode.INVALID_ADDRESS]).toBe(
      'Invalid wallet address format'
    );
  });

  test('should have correct messages for database errors', () => {
    expect(ErrorMessages[ErrorCode.DB_CONNECTION_ERROR]).toBe(
      'Service temporarily unavailable. Please try again.'
    );
    expect(ErrorMessages[ErrorCode.DB_QUERY_ERROR]).toBe(
      'An error occurred processing your request'
    );
  });
});

describe('Error Classes', () => {
  describe('HouseBalanceError', () => {
    test('should create error with code and default message', () => {
      const error = new HouseBalanceError(ErrorCode.INVALID_AMOUNT);
      expect(error.code).toBe(ErrorCode.INVALID_AMOUNT);
      expect(error.message).toBe(ErrorMessages[ErrorCode.INVALID_AMOUNT]);
      expect(error.name).toBe('HouseBalanceError');
    });

    test('should create error with custom message', () => {
      const customMessage = 'Custom error message';
      const error = new HouseBalanceError(ErrorCode.INVALID_AMOUNT, customMessage);
      expect(error.message).toBe(customMessage);
    });

    test('should store error details', () => {
      const details = { field: 'amount', value: -5 };
      const error = new HouseBalanceError(ErrorCode.INVALID_AMOUNT, undefined, details);
      expect(error.details).toEqual(details);
    });
  });

  describe('InsufficientBalanceError', () => {
    test('should create insufficient balance error', () => {
      const error = new InsufficientBalanceError(ErrorCode.INSUFFICIENT_HOUSE_BALANCE);
      expect(error.code).toBe(ErrorCode.INSUFFICIENT_HOUSE_BALANCE);
      expect(error.name).toBe('InsufficientBalanceError');
    });
  });

  describe('ValidationError', () => {
    test('should create validation error', () => {
      const error = new ValidationError(ErrorCode.INVALID_AMOUNT);
      expect(error.code).toBe(ErrorCode.INVALID_AMOUNT);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('AuthorizationError', () => {
    test('should create authorization error', () => {
      const error = new AuthorizationError(ErrorCode.UNAUTHORIZED);
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.name).toBe('AuthorizationError');
    });
  });

  describe('DatabaseError', () => {
    test('should create database error', () => {
      const error = new DatabaseError(ErrorCode.DB_CONNECTION_ERROR);
      expect(error.code).toBe(ErrorCode.DB_CONNECTION_ERROR);
      expect(error.name).toBe('DatabaseError');
    });
  });

  describe('BlockchainError', () => {
    test('should create blockchain error', () => {
      const error = new BlockchainError(ErrorCode.TX_FAILED);
      expect(error.code).toBe(ErrorCode.TX_FAILED);
      expect(error.name).toBe('BlockchainError');
    });
  });

  describe('SynchronizationError', () => {
    test('should create synchronization error', () => {
      const error = new SynchronizationError();
      expect(error.code).toBe(ErrorCode.SYNC_ERROR);
      expect(error.name).toBe('SynchronizationError');
    });
  });
});

describe('getErrorMessage', () => {
  test('should return default message without context', () => {
    const message = getErrorMessage(ErrorCode.INSUFFICIENT_HOUSE_BALANCE);
    expect(message).toBe(ErrorMessages[ErrorCode.INSUFFICIENT_HOUSE_BALANCE]);
  });

  test('should return contextual message for bet context', () => {
    const message = getErrorMessage(ErrorCode.INSUFFICIENT_HOUSE_BALANCE, 'bet');
    expect(message).toBe('Insufficient house balance. Please deposit more FLOW.');
  });

  test('should return contextual message for withdrawal context', () => {
    const message = getErrorMessage(ErrorCode.INSUFFICIENT_HOUSE_BALANCE, 'withdrawal');
    expect(message).toBe('Insufficient house balance for withdrawal');
  });

  test('should fall back to default message if no contextual message exists', () => {
    const message = getErrorMessage(ErrorCode.INVALID_AMOUNT, 'bet');
    expect(message).toBe(ErrorMessages[ErrorCode.INVALID_AMOUNT]);
  });
});

describe('extractErrorCode', () => {
  test('should extract code from HouseBalanceError', () => {
    const error = new HouseBalanceError(ErrorCode.INVALID_AMOUNT);
    expect(extractErrorCode(error)).toBe(ErrorCode.INVALID_AMOUNT);
  });

  test('should extract code from object with code property', () => {
    const error = { code: ErrorCode.DB_CONNECTION_ERROR };
    expect(extractErrorCode(error)).toBe(ErrorCode.DB_CONNECTION_ERROR);
  });

  test('should return undefined for invalid code', () => {
    const error = { code: 'INVALID_CODE' };
    expect(extractErrorCode(error)).toBeUndefined();
  });

  test('should return undefined for error without code', () => {
    const error = new Error('Generic error');
    expect(extractErrorCode(error)).toBeUndefined();
  });
});

describe('formatErrorForDisplay', () => {
  test('should format HouseBalanceError', () => {
    const error = new HouseBalanceError(ErrorCode.INVALID_AMOUNT);
    expect(formatErrorForDisplay(error)).toBe(ErrorMessages[ErrorCode.INVALID_AMOUNT]);
  });

  test('should format HouseBalanceError with context', () => {
    const error = new InsufficientBalanceError(ErrorCode.INSUFFICIENT_HOUSE_BALANCE);
    expect(formatErrorForDisplay(error, 'withdrawal')).toBe(
      'Insufficient house balance for withdrawal'
    );
  });

  test('should format Error with message', () => {
    const error = new Error('Custom error message');
    expect(formatErrorForDisplay(error)).toBe('Custom error message');
  });

  test('should format string error', () => {
    expect(formatErrorForDisplay('String error')).toBe('String error');
  });

  test('should return default message for unknown error', () => {
    expect(formatErrorForDisplay(null)).toBe('An unexpected error occurred');
  });
});

describe('Retry Logic', () => {
  describe('isRetryableError', () => {
    test('should identify database connection errors as retryable', () => {
      const error = new DatabaseError(ErrorCode.DB_CONNECTION_ERROR);
      expect(isRetryableError(error)).toBe(true);
    });

    test('should identify network errors as retryable', () => {
      const error = new BlockchainError(ErrorCode.NETWORK_ERROR);
      expect(isRetryableError(error)).toBe(true);
    });

    test('should identify Supabase connection errors as retryable', () => {
      const error = { message: 'connection refused', code: 'PGRST301' };
      expect(isRetryableError(error)).toBe(true);
    });

    test('should not identify validation errors as retryable', () => {
      const error = new ValidationError(ErrorCode.INVALID_AMOUNT);
      expect(isRetryableError(error)).toBe(false);
    });

    test('should not identify authorization errors as retryable', () => {
      const error = new AuthorizationError(ErrorCode.UNAUTHORIZED);
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    test('should calculate exponential backoff delays', () => {
      const config = DEFAULT_RETRY_CONFIG;
      
      // First retry: 100ms * 2^0 = 100ms
      expect(calculateRetryDelay(0, config)).toBe(100);
      
      // Second retry: 100ms * 2^1 = 200ms
      expect(calculateRetryDelay(1, config)).toBe(200);
      
      // Third retry: 100ms * 2^2 = 400ms
      expect(calculateRetryDelay(2, config)).toBe(400);
    });

    test('should cap delay at maxDelayMs', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, maxDelayMs: 300 };
      
      // Would be 400ms but capped at 300ms
      expect(calculateRetryDelay(2, config)).toBe(300);
    });
  });

  describe('withRetry', () => {
    test('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should retry on retryable error and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new DatabaseError(ErrorCode.DB_CONNECTION_ERROR))
        .mockResolvedValueOnce('success');
      
      const result = await withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    test('should not retry on non-retryable error', async () => {
      const error = new ValidationError(ErrorCode.INVALID_AMOUNT);
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(withRetry(operation)).rejects.toThrow(error);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should throw after max attempts', async () => {
      const error = new DatabaseError(ErrorCode.DB_CONNECTION_ERROR);
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(withRetry(operation, { ...DEFAULT_RETRY_CONFIG, maxAttempts: 3 }))
        .rejects.toThrow(error);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should use custom retry config', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new DatabaseError(ErrorCode.DB_CONNECTION_ERROR))
        .mockRejectedValueOnce(new DatabaseError(ErrorCode.DB_CONNECTION_ERROR))
        .mockResolvedValueOnce('success');
      
      const config = {
        maxAttempts: 5,
        initialDelayMs: 50,
        maxDelayMs: 500,
        backoffMultiplier: 2,
      };
      
      const result = await withRetry(operation, config);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('executeDatabaseOperation', () => {
    test('should execute operation successfully', async () => {
      const operation = jest.fn().mockResolvedValue({ data: 'test' });
      const result = await executeDatabaseOperation(operation, 'Test operation');
      
      expect(result).toEqual({ data: 'test' });
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should wrap error in DatabaseError', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Database failed'));
      
      await expect(executeDatabaseOperation(operation, 'Test operation'))
        .rejects.toThrow(DatabaseError);
    });

    test('should preserve DatabaseError', async () => {
      const error = new DatabaseError(ErrorCode.DB_CONNECTION_ERROR);
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(executeDatabaseOperation(operation, 'Test operation'))
        .rejects.toThrow(error);
    });

    test('should use correct error code for connection errors', async () => {
      const operation = jest.fn().mockRejectedValue({ message: 'connection timeout' });
      
      try {
        await executeDatabaseOperation(operation, 'Test operation');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).code).toBe(ErrorCode.DB_CONNECTION_ERROR);
      }
    });
  });
});

describe('Error Logging', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('logError', () => {
    test('should log error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', operation: 'deposit' };
      
      logError(error, context);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
      expect(loggedData.severity).toBe('error');
      expect(loggedData.error.message).toBe('Test error');
      expect(loggedData.context).toEqual(context);
    });

    test('should log critical errors', () => {
      const error = new SynchronizationError();
      const context = { userId: '123' };
      
      logError(error, context, 'critical');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'CRITICAL ERROR:',
        expect.any(String)
      );
    });

    test('should log warnings', () => {
      const error = new Error('Warning');
      const context = { operation: 'test' };
      
      logError(error, context, 'warn');
      
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    test('should include error code for HouseBalanceError', () => {
      const error = new HouseBalanceError(ErrorCode.INVALID_AMOUNT);
      const context = { field: 'amount' };
      
      logError(error, context);
      
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
      expect(loggedData.error.code).toBe(ErrorCode.INVALID_AMOUNT);
    });
  });

  describe('logSecurityEvent', () => {
    test('should log security event', () => {
      const event = 'Unauthorized access attempt';
      const context = { userId: '123', resource: 'balance' };
      
      logSecurityEvent(event, context);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'SECURITY EVENT:',
        expect.objectContaining({
          event,
          context,
        })
      );
    });
  });
});
