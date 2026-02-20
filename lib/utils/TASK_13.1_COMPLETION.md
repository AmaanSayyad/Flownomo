# Task 13.1 Completion: Add Error Handling Utilities

## Task Description
Create error handling utilities including error code constants, error message mapping, error toast helper functions, and retry logic for database operations.

**Requirements:** 6.3, 10.1, 10.2, 10.3, 10.4, 10.5

## Implementation Summary

### Files Created

1. **lib/utils/errors.ts** - Core error handling utilities
   - Error code constants for all error types
   - Error message mapping with contextual messages
   - Custom error classes (HouseBalanceError, InsufficientBalanceError, ValidationError, etc.)
   - Error message helper functions (getErrorMessage, formatErrorForDisplay, extractErrorCode)
   - Retry logic with exponential backoff for database operations
   - Error logging helpers (logError, logSecurityEvent)

2. **lib/utils/errorToast.ts** - Toast notification helpers
   - Basic toast functions (showErrorToast, showSuccessToast, etc.)
   - Context-specific error toast functions for deposit, bet, and withdrawal operations
   - Special error toast functions for insufficient balance, transactions, database errors, etc.
   - Batch error handling with automatic routing (handleErrorWithToast)

3. **lib/utils/__tests__/errors.test.ts** - Unit tests for error utilities
   - 48 passing tests covering all error handling functionality
   - Tests for error code constants and message mapping
   - Tests for all custom error classes
   - Tests for error message helpers
   - Tests for retry logic with exponential backoff
   - Tests for error logging

4. **lib/utils/__tests__/errorToast.test.ts** - Unit tests for toast helpers
   - 28 passing tests covering all toast notification functionality
   - Tests for basic toast functions
   - Tests for context-specific toast functions
   - Tests for special error toast functions
   - Tests for batch error handling

## Key Features Implemented

### 1. Error Code Constants (Requirement 10.1, 10.2, 10.3, 10.4, 10.5)

Defined comprehensive error codes for all error categories:
- Insufficient Balance Errors: `INSUFFICIENT_WALLET_BALANCE`, `INSUFFICIENT_HOUSE_BALANCE`
- Validation Errors: `INVALID_AMOUNT`, `INVALID_ADDRESS`
- Authorization Errors: `UNAUTHORIZED`, `SIGNER_MISMATCH`
- Database Errors: `DB_CONNECTION_ERROR`, `DB_QUERY_ERROR`, `CONSTRAINT_VIOLATION`
- Blockchain Errors: `TX_FAILED`, `TX_TIMEOUT`, `NETWORK_ERROR`
- Synchronization Errors: `SYNC_ERROR`

### 2. Error Message Mapping (Requirement 10.1, 10.2, 10.3, 10.4, 10.5)

Created user-friendly error messages for each error code with contextual variations:
- Default messages for all error codes
- Context-specific messages for deposit, bet, and withdrawal operations
- Example: `INSUFFICIENT_HOUSE_BALANCE` has different messages for bet vs. withdrawal contexts

### 3. Custom Error Classes

Implemented typed error classes for better error handling:
- `HouseBalanceError` - Base error class with code and details
- `InsufficientBalanceError` - For balance-related errors
- `ValidationError` - For input validation errors
- `AuthorizationError` - For authorization failures
- `DatabaseError` - For database operation errors
- `BlockchainError` - For blockchain transaction errors
- `SynchronizationError` - For balance synchronization errors

### 4. Retry Logic for Database Operations (Requirement 6.3)

Implemented automatic retry with exponential backoff:
- Default configuration: 3 attempts with 100ms, 200ms, 400ms delays
- Configurable retry parameters (maxAttempts, initialDelayMs, maxDelayMs, backoffMultiplier)
- Smart retry detection - only retries connection errors, not validation/authorization errors
- `withRetry()` function for wrapping any async operation
- `executeDatabaseOperation()` function for database-specific operations with error wrapping

### 5. Error Toast Helper Functions (Requirement 10.1, 10.2, 10.3, 10.4, 10.5)

Created comprehensive toast notification helpers:
- **Basic functions**: showErrorToast, showSuccessToast, showWarningToast, showInfoToast
- **Context-specific functions**: 
  - Deposit: showDepositErrorToast, showDepositSuccessToast
  - Bet: showBetErrorToast, showBetSuccessToast
  - Withdrawal: showWithdrawalErrorToast, showWithdrawalSuccessToast
- **Special functions**:
  - showInsufficientBalanceToast - Shows shortfall amount
  - showTransactionErrorToast - Adds retry guidance
  - showDatabaseErrorToast - Adds support contact info
  - showAuthorizationErrorToast - Suggests wallet check
  - showSyncErrorToast - Logs critical error
- **Batch handler**: handleErrorWithToast - Automatically routes errors to appropriate handler

### 6. Error Logging Helpers

Implemented structured error logging:
- `logError()` - Logs errors with context and severity (error, warn, critical)
- `logSecurityEvent()` - Logs unauthorized access attempts
- Structured JSON logging with timestamps and context
- Includes error details, stack traces, and custom error codes

## Testing

### Test Coverage
- **errors.test.ts**: 48 tests, all passing
  - Error code constants validation
  - Error message mapping validation
  - Custom error class creation
  - Error message helper functions
  - Retry logic with various scenarios
  - Error logging functionality

- **errorToast.test.ts**: 28 tests, all passing
  - Basic toast functions
  - Context-specific toast functions
  - Special error toast functions
  - Batch error handling

### Test Results
```
Test Suites: 2 passed, 2 total
Tests:       76 passed, 76 total
```

## Usage Examples

### Using Error Classes
```typescript
import { InsufficientBalanceError, ErrorCode } from '@/lib/utils/errors';

throw new InsufficientBalanceError(
  ErrorCode.INSUFFICIENT_HOUSE_BALANCE,
  undefined,
  { currentBalance: 5.0, requiredAmount: 10.0 }
);
```

### Using Retry Logic
```typescript
import { executeDatabaseOperation } from '@/lib/utils/errors';

const result = await executeDatabaseOperation(
  async () => {
    return await supabase.rpc('deduct_balance_for_bet', {
      p_user_address: userAddress,
      p_bet_amount: betAmount,
    });
  },
  'Deduct balance for bet'
);
```

### Using Toast Helpers
```typescript
import { showBetErrorToast, showBetSuccessToast } from '@/lib/utils/errorToast';

try {
  const result = await placeBet(betAmount);
  showBetSuccessToast(betAmount, result.remainingBalance);
} catch (error) {
  showBetErrorToast(error);
}
```

### Using Batch Error Handler
```typescript
import { handleErrorWithToast } from '@/lib/utils/errorToast';

try {
  await depositFunds(amount);
} catch (error) {
  handleErrorWithToast(error, 'deposit', () => retryDeposit());
}
```

## Integration Points

These error handling utilities are designed to be used throughout the house balance system:

1. **API Routes** - Use `executeDatabaseOperation()` for database calls with automatic retry
2. **Frontend Components** - Use toast helpers for user-facing error messages
3. **Event Listeners** - Use error logging for tracking failures
4. **Store Actions** - Use error classes for typed error handling

## Requirements Validation

✅ **Requirement 6.3**: Database retry logic implemented with exponential backoff (100ms, 200ms, 400ms)
✅ **Requirement 10.1**: Error messages for deposit failures ("Insufficient wallet balance for deposit")
✅ **Requirement 10.2**: Error messages for bet failures ("Insufficient house balance. Please deposit more FLOW.")
✅ **Requirement 10.3**: Error messages for withdrawal failures ("Insufficient house balance for withdrawal")
✅ **Requirement 10.4**: Error messages for service unavailability ("Service temporarily unavailable. Please try again.")
✅ **Requirement 10.5**: Transaction error messages with retry option

## Next Steps

The error handling utilities are now ready to be integrated into:
- API routes (update existing error handling to use new utilities)
- Frontend components (replace inline error handling with toast helpers)
- Database operations (wrap with retry logic)
- Event listeners (add structured error logging)

## Notes

- All error messages follow the exact wording specified in the design document
- Retry logic only retries connection errors, not validation or authorization errors
- Toast helpers automatically format amounts to 4 decimal places for FLOW tokens
- Error logging includes structured JSON for easy parsing and monitoring
- Custom error classes enable type-safe error handling throughout the application
