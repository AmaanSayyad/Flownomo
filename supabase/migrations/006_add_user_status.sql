-- Migration to add status to user_balances and track win streaks
-- This allows admins to manage users (active, frozen, banned)

-- 1. Add status column to user_balances
ALTER TABLE user_balances ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 2. Add indices for status
CREATE INDEX IF NOT EXISTS idx_user_balances_status ON user_balances(status);

-- 3. Add comment
COMMENT ON COLUMN user_balances.status IS 'Account status: active, frozen, or banned';
