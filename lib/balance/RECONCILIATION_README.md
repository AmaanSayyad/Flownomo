# Balance Reconciliation System

## Overview

The balance reconciliation system ensures that user balances in Supabase remain synchronized with the Flow blockchain contract. It treats the contract as the source of truth and provides administrative functions to detect and fix discrepancies.

## Components

### 1. Reconciliation Functions (`lib/balance/synchronization.ts`)

#### `reconcileUserBalance(userAddress, adminAddress?)`

Reconciles a single user's balance between Supabase and the contract.

**Parameters:**
- `userAddress` (string): The Flow address of the user to reconcile
- `adminAddress` (string, optional): The address of the admin performing reconciliation (default: 'ADMIN')

**Returns:** `ReconciliationResult` containing:
- `success`: Whether the reconciliation was successful
- `userAddress`: User address that was reconciled
- `oldBalance`: Balance in Supabase before reconciliation
- `newBalance`: Balance in Supabase after reconciliation (matches contract)
- `discrepancy`: Difference between new and old balance
- `timestamp`: When the reconciliation occurred
- `error`: Error message if reconciliation failed

**Example:**
```typescript
import { reconcileUserBalance } from '@/lib/balance/synchronization';

const result = await reconcileUserBalance('0x1234567890abcdef', '0xadmin123');
console.log(`Reconciled ${result.userAddress}: ${result.oldBalance} -> ${result.newBalance}`);
```

#### `reconcileAllUsers(adminAddress?, dryRun?)`

Reconciles all users with balance discrepancies.

**Parameters:**
- `adminAddress` (string, optional): The address of the admin performing reconciliation (default: 'ADMIN')
- `dryRun` (boolean, optional): If true, only reports discrepancies without updating (default: false)

**Returns:** Array of `ReconciliationResult` objects for users with discrepancies

**Example:**
```typescript
import { reconcileAllUsers } from '@/lib/balance/synchronization';

// Dry run - only report discrepancies
const discrepancies = await reconcileAllUsers('0xadmin123', true);
console.log(`Found ${discrepancies.length} users with discrepancies`);

// Actually reconcile all users
const results = await reconcileAllUsers('0xadmin123', false);
console.log(`Reconciled ${results.length} users`);
```

### 2. Reconciliation Script (`scripts/reconcile-balance.ts`)

Command-line script for running reconciliation operations.

**Usage:**

```bash
# Reconcile a specific user
npm run reconcile -- --user 0x1234567890abcdef

# Reconcile all users (dry run - only report discrepancies)
npm run reconcile -- --all --dry-run

# Reconcile all users (actually update balances)
npm run reconcile -- --all

# Specify admin address
npm run reconcile -- --user 0x1234567890abcdef --admin 0xadmin123
```

**Options:**
- `--user, -u <address>`: Reconcile a specific user address
- `--all, -a`: Reconcile all users
- `--dry-run, -d`: Dry run mode (only report discrepancies, don't update)
- `--admin <address>`: Admin address performing reconciliation (default: ADMIN)
- `--help, -h`: Show help message

### 3. Stored Procedure (`supabase/migrations/004_create_reconciliation_procedure.sql`)

#### `reconcile_user_balance(p_user_address, p_contract_balance, p_admin_address?)`

PostgreSQL stored procedure that atomically updates a user's balance to match the contract.

**Parameters:**
- `p_user_address` (TEXT): User's Flow wallet address
- `p_contract_balance` (NUMERIC): The balance from the contract (source of truth)
- `p_admin_address` (TEXT, optional): Address of the admin performing reconciliation (default: 'ADMIN')

**Returns:** JSON object with:
- `success`: Whether the operation succeeded
- `error`: Error message if failed
- `old_balance`: Balance before reconciliation
- `new_balance`: Balance after reconciliation
- `discrepancy`: Difference between new and old balance

**Features:**
- Uses row-level locking (`FOR UPDATE`) to prevent race conditions
- Creates new user record if user doesn't exist in database
- Logs reconciliation action in `balance_audit_log` table
- Validates that contract balance is non-negative

### 4. Flow Script (`lib/flow/scripts.ts`)

#### `getUserBalanceFromContractScript()`

Cadence script to query a user's balance from the contract.

**Note:** This assumes the OverflowGame contract has a `getUserBalance(userAddress: Address)` function. If the contract doesn't track individual user balances, this will need to be implemented differently.

## How It Works

### Reconciliation Process

1. **Query Contract Balance**: Query the user's balance from the Flow blockchain contract using the `getUserBalance` script
2. **Lock Database Row**: Use `FOR UPDATE` to lock the user's row in Supabase
3. **Calculate Discrepancy**: Compare contract balance with Supabase balance
4. **Update Balance**: Update Supabase balance to match contract (source of truth)
5. **Log Action**: Insert audit log entry with operation type 'reconciliation'

### Bulk Reconciliation Process

1. **Query All Users**: Fetch all users from Supabase `user_balances` table
2. **Check Each User**: For each user:
   - Query contract balance
   - Calculate discrepancy
   - If discrepancy exceeds tolerance (1e-8 FLOW), reconcile the user
3. **Report Results**: Return array of reconciliation results

### Dry Run Mode

In dry run mode, the system:
- Queries all users and their contract balances
- Calculates discrepancies
- Reports which users would be reconciled
- **Does NOT** update any balances in Supabase
- **Does NOT** create audit log entries

This is useful for:
- Checking for discrepancies without making changes
- Verifying the reconciliation logic
- Generating reports for administrators

## Audit Logging

All reconciliation operations are logged in the `balance_audit_log` table with:
- `user_address`: The user whose balance was reconciled
- `operation_type`: 'reconciliation'
- `amount`: The discrepancy amount (positive or negative)
- `balance_before`: Balance in Supabase before reconciliation
- `balance_after`: Balance in Supabase after reconciliation (matches contract)
- `transaction_hash`: 'reconciliation_by_<admin_address>'
- `created_at`: Timestamp of the reconciliation

## Error Handling

The reconciliation system handles various error scenarios:

### Contract Query Errors
- Network timeouts
- Contract not deployed
- Invalid user address
- Contract function not found

**Behavior:** Returns error result without updating database

### Database Errors
- Connection failures
- Lock timeouts
- Constraint violations
- Invalid balance values

**Behavior:** Returns error result, database remains unchanged

### Partial Failures
When reconciling multiple users, if one user fails:
- Error is logged for that user
- Processing continues for remaining users
- Failed user is included in results with error details

## Requirements Validation

This implementation satisfies the following requirements:

### Requirement 9.4
> THE System SHALL provide an administrative function to reconcile balances between the Escrow_Vault and Supabase

✅ Implemented via:
- `reconcileUserBalance()` function for single users
- `reconcileAllUsers()` function for bulk reconciliation
- Command-line script for administrative access

### Requirement 9.5
> WHEN reconciliation is performed, THE System SHALL treat the Escrow_Vault balance as the source of truth and update Supabase accordingly

✅ Implemented via:
- Contract balance is queried first
- Supabase balance is updated to match contract
- Stored procedure enforces contract as source of truth
- Audit log records the reconciliation action

## Testing

Unit tests are provided in `lib/balance/__tests__/reconciliation.test.ts`:

- ✅ Reconcile user balance when contract balance is higher
- ✅ Reconcile user balance when contract balance is lower
- ✅ Handle user not in database (create new record)
- ✅ Handle zero balance reconciliation
- ✅ Handle contract query errors
- ✅ Handle Supabase RPC errors
- ✅ Handle stored procedure returning error
- ✅ Use default admin address when not provided
- ✅ Reconcile all users with discrepancies
- ✅ Run in dry-run mode without updating balances
- ✅ Handle empty user list
- ✅ Handle Supabase query errors
- ✅ Continue processing after individual user errors
- ✅ Tolerate small floating point differences
- ✅ Use default admin address when not provided

Run tests:
```bash
npm test -- lib/balance/__tests__/reconciliation.test.ts
```

## Example Workflows

### Check for Discrepancies

```bash
# Run dry-run to see which users have discrepancies
npm run reconcile -- --all --dry-run
```

### Reconcile a Specific User

```bash
# If you know a specific user has a discrepancy
npm run reconcile -- --user 0x1234567890abcdef
```

### Reconcile All Users

```bash
# Fix all discrepancies
npm run reconcile -- --all
```

### Programmatic Usage

```typescript
import { reconcileUserBalance, reconcileAllUsers } from '@/lib/balance/synchronization';

// Check and reconcile a specific user
async function fixUserBalance(userAddress: string) {
  const result = await reconcileUserBalance(userAddress);
  
  if (result.success) {
    console.log(`✓ Reconciled ${userAddress}`);
    console.log(`  Old: ${result.oldBalance} FLOW`);
    console.log(`  New: ${result.newBalance} FLOW`);
    console.log(`  Discrepancy: ${result.discrepancy} FLOW`);
  } else {
    console.error(`✗ Failed to reconcile ${userAddress}: ${result.error}`);
  }
}

// Check all users and report discrepancies
async function checkAllBalances() {
  const discrepancies = await reconcileAllUsers('ADMIN', true);
  
  if (discrepancies.length === 0) {
    console.log('✓ All balances are synchronized');
  } else {
    console.log(`⚠️  Found ${discrepancies.length} discrepancies:`);
    discrepancies.forEach(d => {
      console.log(`  ${d.userAddress}: ${d.discrepancy.toFixed(8)} FLOW`);
    });
  }
}
```

## Security Considerations

1. **Admin Access**: The reconciliation functions should only be accessible to administrators
2. **Audit Trail**: All reconciliations are logged for accountability
3. **Source of Truth**: Contract balance is always treated as authoritative
4. **Atomic Updates**: Database updates use row-level locking to prevent race conditions
5. **Validation**: Contract balances are validated before updating database

## Future Enhancements

Potential improvements for the reconciliation system:

1. **Automated Reconciliation**: Schedule periodic reconciliation checks
2. **Alert System**: Send notifications when discrepancies are detected
3. **Reconciliation Dashboard**: Web UI for administrators to view and fix discrepancies
4. **Batch Processing**: Optimize bulk reconciliation for large numbers of users
5. **Rollback Capability**: Ability to undo reconciliation if needed
6. **Detailed Reports**: Generate CSV/PDF reports of reconciliation operations
