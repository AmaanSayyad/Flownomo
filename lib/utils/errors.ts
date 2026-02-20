/**
 * Error Handling Utilities
 * 
 * Task: 13.1 Add error handling utilities
 * Requirements: 6.3, 10.1, 10.2, 10.3, 10.4, 10.5
 * 
 * Provides centralized error code constants, error message mapping,
 * error toast helper functions, and retry logic for database operations.
 */

// ============================================================================
// Error Code Constants
// ============================================================================

/**
 * Error codes for the house balance system
 * These codes are used to identify specific error types across the application
 */
export const ErrorCode = {
  // Insufficient Balance Errors
  INSUFFICIENT_WALLET_BALANCE: 'INSUFFICIENT_WALLET_BALANCE',
  INSUFFICIENT_HOUSE_BALANCE: 'INSUFFICIENT_HOUSE_BALANCE',

  // Validation Errors
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_ADDRESS: 'INVALID_ADDRESS',

  // Authorization Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  SIGNER_MISMATCH: 'SIGNER_MISMATCH',

  // Database Errors
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',

  // Blockchain Errors
  TX_FAILED: 'TX_FAILED',
  TX_TIMEOUT: 'TX_TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Synchronization Errors
  SYNC_ERROR: 'SYNC_ERROR',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// ============================================================================
// Error Message Mapping
// ============================================================================

/**
 * Maps error codes to user-friendly error messages
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
export const ErrorMessages: Record<ErrorCodeType, string> = {
  // Insufficient Balance Errors
  [ErrorCode.INSUFFICIENT_WALLET_BALANCE]: 'Insufficient wallet balance for deposit',
  [ErrorCode.INSUFFICIENT_HOUSE_BALANCE]: 'Insufficient house balance. Please deposit more USDC.',

  // Validation Errors
  [ErrorCode.INVALID_AMOUNT]: 'Amount must be greater than zero',
  [ErrorCode.INVALID_ADDRESS]: 'Invalid wallet address format',

  // Authorization Errors
  [ErrorCode.UNAUTHORIZED]: 'You are not authorized to perform this operation',
  [ErrorCode.SIGNER_MISMATCH]: 'Transaction signer does not match user address',

  // Database Errors
  [ErrorCode.DB_CONNECTION_ERROR]: 'Service temporarily unavailable. Please try again.',
  [ErrorCode.DB_QUERY_ERROR]: 'An error occurred processing your request',
  [ErrorCode.CONSTRAINT_VIOLATION]: 'Operation would result in invalid balance',

  // Blockchain Errors
  [ErrorCode.TX_FAILED]: 'Transaction failed. Please try again.',
  [ErrorCode.TX_TIMEOUT]: 'Transaction timed out. Please check your wallet.',
  [ErrorCode.NETWORK_ERROR]: 'Unable to connect to blockchain. Please check your connection.',

  // Synchronization Errors
  [ErrorCode.SYNC_ERROR]: 'Balance synchronization error detected',
};

/**
 * Context-specific error messages for different operations
 */
export const ContextualErrorMessages: Record<'deposit' | 'bet' | 'withdrawal', Partial<Record<ErrorCodeType, string>>> = {
  deposit: {
    [ErrorCode.INSUFFICIENT_WALLET_BALANCE]: 'Insufficient wallet balance for deposit',
    [ErrorCode.INSUFFICIENT_HOUSE_BALANCE]: 'Insufficient wallet balance for deposit',
  },
  bet: {
    [ErrorCode.INSUFFICIENT_HOUSE_BALANCE]: 'Insufficient house balance. Please deposit more USDC.',
  },
  withdrawal: {
    [ErrorCode.INSUFFICIENT_HOUSE_BALANCE]: 'Insufficient house balance for withdrawal',
  },
};

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Base error class for house balance system errors
 */
export class HouseBalanceError extends Error {
  constructor(
    public code: ErrorCodeType,
    message?: string,
    public details?: unknown
  ) {
    super(message || ErrorMessages[code]);
    this.name = 'HouseBalanceError';
  }
}

/**
 * Error class for insufficient balance errors
 */
export class InsufficientBalanceError extends HouseBalanceError {
  constructor(
    code: typeof ErrorCode.INSUFFICIENT_WALLET_BALANCE | typeof ErrorCode.INSUFFICIENT_HOUSE_BALANCE,
    message?: string,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'InsufficientBalanceError';
  }
}

/**
 * Error class for validation errors
 */
export class ValidationError extends HouseBalanceError {
  constructor(
    code: typeof ErrorCode.INVALID_AMOUNT | typeof ErrorCode.INVALID_ADDRESS,
    message?: string,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'ValidationError';
  }
}

/**
 * Error class for authorization errors
 */
export class AuthorizationError extends HouseBalanceError {
  constructor(
    code: typeof ErrorCode.UNAUTHORIZED | typeof ErrorCode.SIGNER_MISMATCH,
    message?: string,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Error class for database errors
 */
export class DatabaseError extends HouseBalanceError {
  constructor(
    code: typeof ErrorCode.DB_CONNECTION_ERROR | typeof ErrorCode.DB_QUERY_ERROR | typeof ErrorCode.CONSTRAINT_VIOLATION,
    message?: string,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Error class for blockchain errors
 */
export class BlockchainError extends HouseBalanceError {
  constructor(
    code: typeof ErrorCode.TX_FAILED | typeof ErrorCode.TX_TIMEOUT | typeof ErrorCode.NETWORK_ERROR,
    message?: string,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'BlockchainError';
  }
}

/**
 * Error class for synchronization errors
 */
export class SynchronizationError extends HouseBalanceError {
  constructor(message?: string, details?: unknown) {
    super(ErrorCode.SYNC_ERROR, message, details);
    this.name = 'SynchronizationError';
  }
}

// ============================================================================
// Error Message Helpers
// ============================================================================

/**
 * Gets the appropriate error message for a given error code and context
 * 
 * @param code - The error code
 * @param context - Optional context (deposit, bet, withdrawal)
 * @returns User-friendly error message
 */
export function getErrorMessage(
  code: ErrorCodeType,
  context?: 'deposit' | 'bet' | 'withdrawal'
): string {
  // Check for context-specific message first
  if (context && ContextualErrorMessages[context]?.[code]) {
    return ContextualErrorMessages[context][code];
  }

  // Fall back to default message
  return ErrorMessages[code];
}

/**
 * Extracts error code from various error types
 * 
 * @param error - The error object
 * @returns Error code or undefined
 */
export function extractErrorCode(error: unknown): ErrorCodeType | undefined {
  if (error instanceof HouseBalanceError) {
    return error.code;
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code;
    if (Object.values(ErrorCode).includes(code as ErrorCodeType)) {
      return code as ErrorCodeType;
    }
  }

  return undefined;
}

/**
 * Formats an error for display to the user
 * 
 * @param error - The error object
 * @param context - Optional context for contextual messages
 * @returns Formatted error message
 */
export function formatErrorForDisplay(
  error: unknown,
  context?: 'deposit' | 'bet' | 'withdrawal'
): string {
  // Handle HouseBalanceError instances
  if (error instanceof HouseBalanceError) {
    return getErrorMessage(error.code, context);
  }

  // Handle errors with error codes
  const errorCode = extractErrorCode(error);
  if (errorCode) {
    return getErrorMessage(errorCode, context);
  }

  // Handle Error instances with messages
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Default fallback
  return 'An unexpected error occurred';
}

// ============================================================================
// Retry Logic for Database Operations
// ============================================================================

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 * Requirement 6.3: Retry up to 3 times with exponential backoff
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Determines if an error is retryable
 * 
 * @param error - The error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  // Retry database connection errors
  if (error instanceof DatabaseError && error.code === ErrorCode.DB_CONNECTION_ERROR) {
    return true;
  }

  // Retry network errors
  if (error instanceof BlockchainError && error.code === ErrorCode.NETWORK_ERROR) {
    return true;
  }

  // Check for Supabase connection errors
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as { message?: string; code?: string };

    // Common Supabase connection error patterns
    if (errorObj.message?.includes('connection') ||
      errorObj.message?.includes('timeout') ||
      errorObj.message?.includes('ECONNREFUSED') ||
      errorObj.code === 'PGRST301' || // Connection error
      errorObj.code === 'PGRST504') { // Gateway timeout
      return true;
    }
  }

  return false;
}

/**
 * Calculates the delay for the next retry attempt using exponential backoff
 * 
 * @param attempt - The current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Sleeps for the specified duration
 * 
 * @param ms - Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes a database operation with automatic retry logic
 * Requirement 6.3: Retry database operations up to 3 times with exponential backoff
 * 
 * @param operation - The async operation to execute
 * @param config - Optional retry configuration
 * @returns Result of the operation
 * @throws The last error if all retry attempts fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      // Execute the operation
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (!isRetryableError(error)) {
        // Not a retryable error, throw immediately
        throw error;
      }

      // Check if we have more attempts
      if (attempt < config.maxAttempts - 1) {
        // Calculate delay and wait before retrying
        const delay = calculateRetryDelay(attempt, config);
        console.warn(
          `Database operation failed (attempt ${attempt + 1}/${config.maxAttempts}). ` +
          `Retrying in ${delay}ms...`,
          error
        );
        await sleep(delay);
      } else {
        // No more attempts, log final failure
        console.error(
          `Database operation failed after ${config.maxAttempts} attempts.`,
          error
        );
      }
    }
  }

  // All attempts failed, throw the last error
  throw lastError;
}

/**
 * Wraps a database operation with retry logic and error handling
 * 
 * @param operation - The async operation to execute
 * @param errorContext - Context for error messages
 * @param config - Optional retry configuration
 * @returns Result of the operation
 * @throws DatabaseError if all retry attempts fail
 */
export async function executeDatabaseOperation<T>(
  operation: () => Promise<T>,
  errorContext: string,
  config?: RetryConfig
): Promise<T> {
  try {
    return await withRetry(operation, config);
  } catch (error) {
    // Wrap in DatabaseError if not already
    if (error instanceof DatabaseError) {
      throw error;
    }

    // Determine error code based on error type
    const isConnectionError = isRetryableError(error);
    const errorCode = isConnectionError
      ? ErrorCode.DB_CONNECTION_ERROR
      : ErrorCode.DB_QUERY_ERROR;

    throw new DatabaseError(errorCode, `${errorContext}: ${formatErrorForDisplay(error)}`, error);
  }
}

// ============================================================================
// Error Logging Helpers
// ============================================================================

/**
 * Logs an error with appropriate severity and context
 * 
 * @param error - The error to log
 * @param context - Additional context information
 * @param severity - Error severity level
 */
export function logError(
  error: unknown,
  context: Record<string, unknown>,
  severity: 'error' | 'warn' | 'critical' = 'error'
): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    severity,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof HouseBalanceError && { code: error.code, details: error.details }),
    } : error,
    context,
  };

  if (severity === 'critical') {
    console.error('CRITICAL ERROR:', JSON.stringify(errorInfo, null, 2));
  } else if (severity === 'warn') {
    console.warn('Warning:', JSON.stringify(errorInfo, null, 2));
  } else {
    console.error('Error:', JSON.stringify(errorInfo, null, 2));
  }
}

/**
 * Logs a security event (unauthorized access attempts)
 * 
 * @param event - Description of the security event
 * @param context - Additional context information
 */
export function logSecurityEvent(event: string, context: Record<string, unknown>): void {
  console.warn('SECURITY EVENT:', {
    timestamp: new Date().toISOString(),
    event,
    context,
  });
}
