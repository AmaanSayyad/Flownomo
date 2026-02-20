-- Migration to update stored procedures for multi-currency support
-- This updates the core balance management functions to handle the 'currency' parameter.

-- 1. deduct_balance_for_bet
CREATE OR REPLACE FUNCTION deduct_balance_for_bet(
    p_user_address TEXT,
    p_bet_amount NUMERIC,
    p_currency TEXT DEFAULT 'BNB'
)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    IF p_bet_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Bet amount must be greater than zero', 'new_balance', NULL);
    END IF;

    -- Lock the row for update with currency filter
    SELECT balance INTO v_current_balance
    FROM user_balances
    WHERE user_address = p_user_address AND currency = p_currency
    FOR UPDATE;
    
    IF v_current_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User balance not found for this currency', 'new_balance', NULL);
    END IF;
    
    IF v_current_balance < p_bet_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance', 'new_balance', v_current_balance);
    END IF;
    
    v_new_balance := v_current_balance - p_bet_amount;
    
    UPDATE user_balances
    SET balance = v_new_balance, updated_at = NOW()
    WHERE user_address = p_user_address AND currency = p_currency;
    
    INSERT INTO balance_audit_log (user_address, currency, operation_type, amount, balance_before, balance_after)
    VALUES (p_user_address, p_currency, 'bet_placed', p_bet_amount, v_current_balance, v_new_balance);
    
    RETURN json_build_object('success', true, 'error', NULL, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;

-- 2. credit_balance_for_payout
CREATE OR REPLACE FUNCTION credit_balance_for_payout(
    p_user_address TEXT,
    p_payout_amount NUMERIC,
    p_currency TEXT DEFAULT 'BNB',
    p_bet_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    IF p_payout_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Payout amount must be greater than zero', 'new_balance', NULL);
    END IF;

    SELECT balance INTO v_current_balance
    FROM user_balances
    WHERE user_address = p_user_address AND currency = p_currency
    FOR UPDATE;
    
    IF v_current_balance IS NULL THEN
        INSERT INTO user_balances (user_address, currency, balance, updated_at, created_at)
        VALUES (p_user_address, p_currency, p_payout_amount, NOW(), NOW());
        v_current_balance := 0;
        v_new_balance := p_payout_amount;
    ELSE
        v_new_balance := v_current_balance + p_payout_amount;
        UPDATE user_balances
        SET balance = v_new_balance, updated_at = NOW()
        WHERE user_address = p_user_address AND currency = p_currency;
    END IF;
    
    INSERT INTO balance_audit_log (user_address, currency, operation_type, amount, balance_before, balance_after, bet_id)
    VALUES (p_user_address, p_currency, 'bet_won', p_payout_amount, v_current_balance, v_new_balance, p_bet_id);
    
    RETURN json_build_object('success', true, 'error', NULL, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;

-- 3. update_balance_for_deposit
CREATE OR REPLACE FUNCTION update_balance_for_deposit(
    p_user_address TEXT,
    p_deposit_amount NUMERIC,
    p_currency TEXT DEFAULT 'BNB',
    p_transaction_hash TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    IF p_deposit_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Deposit amount must be greater than zero', 'new_balance', NULL);
    END IF;

    SELECT balance INTO v_current_balance
    FROM user_balances
    WHERE user_address = p_user_address AND currency = p_currency
    FOR UPDATE;
    
    IF v_current_balance IS NULL THEN
        INSERT INTO user_balances (user_address, currency, balance, updated_at, created_at)
        VALUES (p_user_address, p_currency, p_deposit_amount, NOW(), NOW());
        v_current_balance := 0;
        v_new_balance := p_deposit_amount;
    ELSE
        v_new_balance := v_current_balance + p_deposit_amount;
        UPDATE user_balances
        SET balance = v_new_balance, updated_at = NOW()
        WHERE user_address = p_user_address AND currency = p_currency;
    END IF;
    
    INSERT INTO balance_audit_log (user_address, currency, operation_type, amount, balance_before, balance_after, transaction_hash)
    VALUES (p_user_address, p_currency, 'deposit', p_deposit_amount, v_current_balance, v_new_balance, p_transaction_hash);
    
    RETURN json_build_object('success', true, 'error', NULL, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;

-- 4. update_balance_for_withdrawal
CREATE OR REPLACE FUNCTION update_balance_for_withdrawal(
    p_user_address TEXT,
    p_withdrawal_amount NUMERIC,
    p_currency TEXT DEFAULT 'BNB',
    p_transaction_hash TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    IF p_withdrawal_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Withdrawal amount must be greater than zero', 'new_balance', NULL);
    END IF;

    SELECT balance INTO v_current_balance
    FROM user_balances
    WHERE user_address = p_user_address AND currency = p_currency
    FOR UPDATE;
    
    IF v_current_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found for this currency', 'new_balance', NULL);
    END IF;
    
    IF v_current_balance < p_withdrawal_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance', 'new_balance', v_current_balance);
    END IF;
    
    v_new_balance := v_current_balance - p_withdrawal_amount;
    
    UPDATE user_balances
    SET balance = v_new_balance, updated_at = NOW()
    WHERE user_address = p_user_address AND currency = p_currency;
    
    INSERT INTO balance_audit_log (user_address, currency, operation_type, amount, balance_before, balance_after, transaction_hash)
    VALUES (p_user_address, p_currency, 'withdrawal', p_withdrawal_amount, v_current_balance, v_new_balance, p_transaction_hash);
    
    RETURN json_build_object('success', true, 'error', NULL, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;
