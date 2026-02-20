-- Migration: Create reconciliation stored procedure
-- Task: 12.2 Create reconciliation admin function
-- Requirements: 9.4, 9.5

-- ============================================================================
-- Procedure: reconcile_user_balance
-- Description: Reconciles a user's balance in Supabase with the contract balance
--              Treats the contract balance as the source of truth
-- Parameters:
--   p_user_address: User's Sui wallet address
--   p_contract_balance: The balance from the contract (source of truth)
--   p_admin_address: Address of the admin performing reconciliation
-- Returns: JSON object with success status, old balance, and new balance
-- ============================================================================
CREATE OR REPLACE FUNCTION reconcile_user_balance(
    p_user_address TEXT,
    p_contract_balance NUMERIC,
    p_admin_address TEXT DEFAULT 'ADMIN'
)
RETURNS JSON AS $$
DECLARE
    v_current_balance NUMERIC;
    v_discrepancy NUMERIC;
    v_result JSON;
BEGIN
    -- Validate input parameters
    IF p_contract_balance < 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Contract balance cannot be negative',
            'old_balance', NULL,
            'new_balance', NULL,
            'discrepancy', NULL
        );
    END IF;

    -- Lock the row for update to prevent race conditions
    SELECT balance INTO v_current_balance
    FROM user_balances
    WHERE user_address = p_user_address
    FOR UPDATE;
    
    -- Check if user exists, if not create a new record
    IF v_current_balance IS NULL THEN
        -- Insert new user with contract balance
        INSERT INTO user_balances (user_address, balance, updated_at, created_at)
        VALUES (p_user_address, p_contract_balance, NOW(), NOW());
        
        v_current_balance := 0;
        v_discrepancy := p_contract_balance;
    ELSE
        -- Calculate discrepancy
        v_discrepancy := p_contract_balance - v_current_balance;
        
        -- Update balance to match contract
        UPDATE user_balances
        SET balance = p_contract_balance,
            updated_at = NOW()
        WHERE user_address = p_user_address;
    END IF;
    
    -- Insert audit log entry for reconciliation
    INSERT INTO balance_audit_log (
        user_address,
        operation_type,
        amount,
        balance_before,
        balance_after,
        transaction_hash
    ) VALUES (
        p_user_address,
        'reconciliation',
        v_discrepancy,
        v_current_balance,
        p_contract_balance,
        'reconciliation_by_' || p_admin_address
    );
    
    -- Return success result
    RETURN json_build_object(
        'success', true,
        'error', NULL,
        'old_balance', v_current_balance,
        'new_balance', p_contract_balance,
        'discrepancy', v_discrepancy
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Handle any unexpected errors
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'old_balance', NULL,
            'new_balance', NULL,
            'discrepancy', NULL
        );
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION reconcile_user_balance IS 'Reconciles a user balance in Supabase with the contract balance (source of truth) and logs the action';
