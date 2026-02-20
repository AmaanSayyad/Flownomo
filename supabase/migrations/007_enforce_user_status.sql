-- Migration to update balance procedures to respect user status
-- Frozen or Banned users cannot place bets or withdraw funds.

-- 1. Update deduct_balance_for_bet
CREATE OR REPLACE FUNCTION deduct_balance_for_bet(
    p_user_address TEXT,
    p_bet_amount NUMERIC
)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC;
    v_status TEXT;
    v_new_balance NUMERIC;
BEGIN
    -- Validate input
    IF p_bet_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Bet amount must be greater than zero');
    END IF;

    -- Lock row and check status
    SELECT balance, status INTO v_current_balance, v_status
    FROM user_balances
    WHERE user_address = p_user_address
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;

    IF v_status = 'frozen' THEN
        RETURN json_build_object('success', false, 'error', 'Account is frozen. Please contact support.');
    END IF;

    IF v_status = 'banned' THEN
        RETURN json_build_object('success', false, 'error', 'Account is banned.');
    END IF;

    IF v_current_balance < p_bet_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    v_new_balance := v_current_balance - p_bet_amount;

    UPDATE user_balances
    SET balance = v_new_balance, updated_at = NOW()
    WHERE user_address = p_user_address;

    INSERT INTO balance_audit_log (user_address, operation_type, amount, balance_before, balance_after)
    VALUES (p_user_address, 'bet_placed', p_bet_amount, v_current_balance, v_new_balance);

    RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;

-- 2. Update update_balance_for_withdrawal
CREATE OR REPLACE FUNCTION update_balance_for_withdrawal(
    p_user_address TEXT,
    p_withdrawal_amount NUMERIC,
    p_transaction_hash TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC;
    v_status TEXT;
    v_new_balance NUMERIC;
BEGIN
    IF p_withdrawal_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Withdrawal amount must be greater than zero');
    END IF;

    SELECT balance, status INTO v_current_balance, v_status
    FROM user_balances
    WHERE user_address = p_user_address
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;

    IF v_status = 'frozen' THEN
        RETURN json_build_object('success', false, 'error', 'Account is frozen. Withdrawals are disabled.');
    END IF;

    IF v_status = 'banned' THEN
        RETURN json_build_object('success', false, 'error', 'Account is banned.');
    END IF;

    IF v_current_balance < p_withdrawal_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    v_new_balance := v_current_balance - p_withdrawal_amount;

    UPDATE user_balances
    SET balance = v_new_balance, updated_at = NOW()
    WHERE user_address = p_user_address;

    INSERT INTO balance_audit_log (user_address, operation_type, amount, balance_before, balance_after, transaction_hash)
    VALUES (p_user_address, 'withdrawal', p_withdrawal_amount, v_current_balance, v_new_balance, p_transaction_hash);

    RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql;
