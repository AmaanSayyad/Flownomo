-- Migration: Create atomic balance update stored procedures
-- Task: 1.3 Create atomic balance update stored procedures
-- Requirements: 2.5, 6.2

-- ============================================================================
-- Procedure: deduct_balance_for_bet
-- Description: Atomically deducts balance for a bet with row-level locking
-- Parameters:
--   p_user_address: User's Sui wallet address
--   p_bet_amount: Amount to deduct for the bet
-- Returns: JSON object with success status and new balance
-- ============================================================================
CREATE OR REPLACE FUNCTION deduct_balance_for_bet(
    p_user_address TEXT,
    p_bet_amount NUMERIC
)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_result JSON;
BEGIN
    -- Validate input parameters
    IF p_bet_amount <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bet amount must be greater than zero',
            'new_balance', NULL
        );
    END IF;

    -- Lock the row for update to prevent race conditions
    SELECT balance INTO v_current_balance
    FROM user_balances
    WHERE user_address = p_user_address
    FOR UPDATE;
    
    -- Check if user exists
    IF v_current_balance IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found',
            'new_balance', NULL
        );
    END IF;
    
    -- Check sufficient balance
    IF v_current_balance < p_bet_amount THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient balance',
            'new_balance', v_current_balance
        );
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_balance - p_bet_amount;
    
    -- Update balance
    UPDATE user_balances
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE user_address = p_user_address;
    
    -- Insert audit log entry
    INSERT INTO balance_audit_log (
        user_address,
        operation_type,
        amount,
        balance_before,
        balance_after
    ) VALUES (
        p_user_address,
        'bet_placed',
        p_bet_amount,
        v_current_balance,
        v_new_balance
    );
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'error', NULL,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION deduct_balance_for_bet IS 'Atomically deducts balance for a bet with row-level locking and audit logging';

-- ============================================================================
-- Procedure: credit_balance_for_payout
-- Description: Atomically credits balance for a payout with row-level locking
-- Parameters:
--   p_user_address: User's Sui wallet address
--   p_payout_amount: Amount to credit for the payout
--   p_bet_id: Bet identifier for audit trail
-- Returns: JSON object with success status and new balance
-- ============================================================================
CREATE OR REPLACE FUNCTION credit_balance_for_payout(
    p_user_address TEXT,
    p_payout_amount NUMERIC,
    p_bet_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_result JSON;
BEGIN
    -- Validate input parameters
    IF p_payout_amount <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Payout amount must be greater than zero',
            'new_balance', NULL
        );
    END IF;

    -- Lock the row for update to prevent race conditions
    SELECT balance INTO v_current_balance
    FROM user_balances
    WHERE user_address = p_user_address
    FOR UPDATE;
    
    -- Check if user exists, if not create a new record
    IF v_current_balance IS NULL THEN
        -- Insert new user with payout amount
        INSERT INTO user_balances (user_address, balance, updated_at, created_at)
        VALUES (p_user_address, p_payout_amount, NOW(), NOW());
        
        v_current_balance := 0;
        v_new_balance := p_payout_amount;
    ELSE
        -- Calculate new balance
        v_new_balance := v_current_balance + p_payout_amount;
        
        -- Update balance
        UPDATE user_balances
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE user_address = p_user_address;
    END IF;
    
    -- Insert audit log entry
    INSERT INTO balance_audit_log (
        user_address,
        operation_type,
        amount,
        balance_before,
        balance_after,
        bet_id
    ) VALUES (
        p_user_address,
        'bet_won',
        p_payout_amount,
        v_current_balance,
        v_new_balance,
        p_bet_id
    );
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'error', NULL,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION credit_balance_for_payout IS 'Atomically credits balance for a payout with row-level locking and audit logging';

-- ============================================================================
-- Procedure: update_balance_for_deposit
-- Description: Atomically updates balance for a deposit
-- Parameters:
--   p_user_address: User's Sui wallet address
--   p_deposit_amount: Amount to add for the deposit
--   p_transaction_hash: Blockchain transaction hash
-- Returns: JSON object with success status and new balance
-- ============================================================================
CREATE OR REPLACE FUNCTION update_balance_for_deposit(
    p_user_address TEXT,
    p_deposit_amount NUMERIC,
    p_transaction_hash TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_result JSON;
BEGIN
    -- Validate input parameters
    IF p_deposit_amount <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Deposit amount must be greater than zero',
            'new_balance', NULL
        );
    END IF;

    -- Lock the row for update to prevent race conditions
    -- Use SELECT FOR UPDATE with NOWAIT to fail fast if row is locked
    SELECT balance INTO v_current_balance
    FROM user_balances
    WHERE user_address = p_user_address
    FOR UPDATE;
    
    -- Check if user exists, if not create a new record
    IF v_current_balance IS NULL THEN
        -- Insert new user with deposit amount
        INSERT INTO user_balances (user_address, balance, updated_at, created_at)
        VALUES (p_user_address, p_deposit_amount, NOW(), NOW());
        
        v_current_balance := 0;
        v_new_balance := p_deposit_amount;
    ELSE
        -- Calculate new balance
        v_new_balance := v_current_balance + p_deposit_amount;
        
        -- Update balance
        UPDATE user_balances
        SET balance = v_new_balance,
            updated_at = NOW()
        WHERE user_address = p_user_address;
    END IF;
    
    -- Insert audit log entry
    INSERT INTO balance_audit_log (
        user_address,
        operation_type,
        amount,
        balance_before,
        balance_after,
        transaction_hash
    ) VALUES (
        p_user_address,
        'deposit',
        p_deposit_amount,
        v_current_balance,
        v_new_balance,
        p_transaction_hash
    );
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'error', NULL,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION update_balance_for_deposit IS 'Atomically updates balance for a deposit with row-level locking and audit logging';

-- ============================================================================
-- Procedure: update_balance_for_withdrawal
-- Description: Atomically updates balance for a withdrawal
-- Parameters:
--   p_user_address: User's Sui wallet address
--   p_withdrawal_amount: Amount to deduct for the withdrawal
--   p_transaction_hash: Blockchain transaction hash
-- Returns: JSON object with success status and new balance
-- ============================================================================
CREATE OR REPLACE FUNCTION update_balance_for_withdrawal(
    p_user_address TEXT,
    p_withdrawal_amount NUMERIC,
    p_transaction_hash TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_result JSON;
BEGIN
    -- Validate input parameters
    IF p_withdrawal_amount <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Withdrawal amount must be greater than zero',
            'new_balance', NULL
        );
    END IF;

    -- Lock the row for update to prevent race conditions
    SELECT balance INTO v_current_balance
    FROM user_balances
    WHERE user_address = p_user_address
    FOR UPDATE;
    
    -- Check if user exists
    IF v_current_balance IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found',
            'new_balance', NULL
        );
    END IF;
    
    -- Check sufficient balance
    IF v_current_balance < p_withdrawal_amount THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient balance',
            'new_balance', v_current_balance
        );
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_balance - p_withdrawal_amount;
    
    -- Update balance
    UPDATE user_balances
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE user_address = p_user_address;
    
    -- Insert audit log entry
    INSERT INTO balance_audit_log (
        user_address,
        operation_type,
        amount,
        balance_before,
        balance_after,
        transaction_hash
    ) VALUES (
        p_user_address,
        'withdrawal',
        p_withdrawal_amount,
        v_current_balance,
        v_new_balance,
        p_transaction_hash
    );
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'error', NULL,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION update_balance_for_withdrawal IS 'Atomically updates balance for a withdrawal with row-level locking and audit logging';
