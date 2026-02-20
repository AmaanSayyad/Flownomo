-- Migration: Add user_tier column to user_balances
-- This allows tracking the tier (free, standard, gold, vip) for each user.

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_balances' AND column_name = 'user_tier') THEN
        ALTER TABLE user_balances ADD COLUMN user_tier TEXT NOT NULL DEFAULT 'free';
    END IF;
END $$;

-- Add comment to column
COMMENT ON COLUMN user_balances.user_tier IS 'User tier: free, standard, gold, vip';
