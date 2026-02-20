-- Migration: Create user_balances table
-- Task: 1.1 Create user_balances table with schema
-- Requirements: 6.1, 6.5

-- Create user_balances table with schema
CREATE TABLE IF NOT EXISTS user_balances (
    user_address TEXT PRIMARY KEY,
    balance NUMERIC(20, 8) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_address column for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_balances_address ON user_balances(user_address);

-- Add comment to table
COMMENT ON TABLE user_balances IS 'Tracks USDC token balances for users in the house balance system';

-- Add comments to columns
COMMENT ON COLUMN user_balances.user_address IS 'Sui wallet address (0x...)';
COMMENT ON COLUMN user_balances.balance IS 'Current house balance in USDC tokens (up to 8 decimal places)';
COMMENT ON COLUMN user_balances.updated_at IS 'Timestamp of last balance update';
COMMENT ON COLUMN user_balances.created_at IS 'Timestamp when user first deposited';
