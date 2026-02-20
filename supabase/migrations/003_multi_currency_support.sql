-- Migration to support multi-currency balances per user address
-- This allows the same house balance system to track BNB, SOL, SUI, XLM, and XTZ separately.

-- 1. Create temporary table for migration
CREATE TABLE IF NOT EXISTS user_balances_new (
  user_address TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BNB',
  balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_address, currency)
);

-- 2. Migrate existing data (assuming old data is BNB-based House Balance)
-- We check if the table exists first to avoid errors if run multiple times
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_balances') THEN
        INSERT INTO user_balances_new (user_address, currency, balance, updated_at, created_at)
        SELECT user_address, 'BNB', balance, updated_at, created_at FROM user_balances;
        
        DROP TABLE user_balances;
    END IF;
END $$;

-- 3. Rename new table to original name
ALTER TABLE user_balances_new RENAME TO user_balances;

-- 4. Update balance_audit_log to include currency
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'balance_audit_log' AND column_name = 'currency') THEN
        ALTER TABLE balance_audit_log ADD COLUMN currency TEXT NOT NULL DEFAULT 'BNB';
    END IF;
END $$;

-- 5. Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_user_balances_currency ON user_balances (currency);
CREATE INDEX IF NOT EXISTS idx_audit_log_currency ON balance_audit_log (currency);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_currency ON balance_audit_log (user_address, currency);
