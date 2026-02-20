-- Migration: Create balance_audit_log table
-- Task: 1.2 Create balance_audit_log table with schema
-- Requirements: 7.5

-- Create balance_audit_log table with schema
CREATE TABLE IF NOT EXISTS balance_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_address TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    amount NUMERIC(20, 8) NOT NULL,
    balance_before NUMERIC(20, 8) NOT NULL,
    balance_after NUMERIC(20, 8) NOT NULL,
    transaction_hash TEXT,
    bet_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on (user_address, created_at DESC) for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON balance_audit_log(user_address, created_at DESC);

-- Add comment to table
COMMENT ON TABLE balance_audit_log IS 'Audit log for all balance changes in the house balance system';

-- Add comments to columns
COMMENT ON COLUMN balance_audit_log.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN balance_audit_log.user_address IS 'Sui wallet address (0x...)';
COMMENT ON COLUMN balance_audit_log.operation_type IS 'Type of operation: deposit, withdrawal, bet_placed, bet_won, bet_lost';
COMMENT ON COLUMN balance_audit_log.amount IS 'Amount of USDC tokens involved in the operation';
COMMENT ON COLUMN balance_audit_log.balance_before IS 'User balance before the operation';
COMMENT ON COLUMN balance_audit_log.balance_after IS 'User balance after the operation';
COMMENT ON COLUMN balance_audit_log.transaction_hash IS 'Blockchain transaction hash (for deposits/withdrawals)';
COMMENT ON COLUMN balance_audit_log.bet_id IS 'Bet identifier (for bet-related operations)';
COMMENT ON COLUMN balance_audit_log.created_at IS 'Timestamp when the operation occurred';
