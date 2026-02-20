/**
 * Test Suite: Atomic Balance Update Stored Procedures
 * Task: 1.3 Create atomic balance update stored procedures
 * Requirements: 2.5, 6.2
 * 
 * This test suite validates the four atomic balance update stored procedures:
 * 1. deduct_balance_for_bet - Deducts balance for bet placement
 * 2. credit_balance_for_payout - Credits balance for bet winnings
 * 3. update_balance_for_deposit - Updates balance for deposits
 * 4. update_balance_for_withdrawal - Updates balance for withdrawals
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Helper function to clean up test data
async function cleanupTestUser(userAddress: string) {
  await supabase.from('balance_audit_log').delete().eq('user_address', userAddress);
  await supabase.from('user_balances').delete().eq('user_address', userAddress);
}

// Helper function to create a test user with initial balance
async function createTestUser(userAddress: string, initialBalance: number) {
  const { error } = await supabase.from('user_balances').insert({
    user_address: userAddress,
    balance: initialBalance,
  });
  if (error) throw error;
}

// Helper function to get user balance
async function getUserBalance(userAddress: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('user_balances')
    .select('balance')
    .eq('user_address', userAddress)
    .single();
  
  if (error) return null;
  return data?.balance || null;
}

// Helper function to get audit log count
async function getAuditLogCount(userAddress: string): Promise<number> {
  const { data, error } = await supabase
    .from('balance_audit_log')
    .select('id', { count: 'exact' })
    .eq('user_address', userAddress);
  
  if (error) return 0;
  return data?.length || 0;
}

describe('Atomic Balance Update Stored Procedures', () => {
  const testUser1 = '0xtest_procedures_user1';
  const testUser2 = '0xtest_procedures_user2';
  const testUser3 = '0xtest_procedures_user3';
  const testUser4 = '0xtest_procedures_user4';

  // Clean up before and after all tests
  beforeAll(async () => {
    await cleanupTestUser(testUser1);
    await cleanupTestUser(testUser2);
    await cleanupTestUser(testUser3);
    await cleanupTestUser(testUser4);
  });

  afterAll(async () => {
    await cleanupTestUser(testUser1);
    await cleanupTestUser(testUser2);
    await cleanupTestUser(testUser3);
    await cleanupTestUser(testUser4);
  });

  describe('deduct_balance_for_bet', () => {
    beforeEach(async () => {
      await cleanupTestUser(testUser1);
    });

    test('should successfully deduct balance for a bet with sufficient funds', async () => {
      // Create user with 100 USDC
      await createTestUser(testUser1, 100);

      // Deduct 25 USDC for a bet
      const { data, error } = await supabase.rpc('deduct_balance_for_bet', {
        p_user_address: testUser1,
        p_bet_amount: 25,
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: true,
        error: null,
        new_balance: 75,
      });

      // Verify balance was updated
      const balance = await getUserBalance(testUser1);
      expect(balance).toBe(75);

      // Verify audit log entry was created
      const auditCount = await getAuditLogCount(testUser1);
      expect(auditCount).toBe(1);

      // Verify audit log details
      const { data: auditLog } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testUser1)
        .single();

      expect(auditLog).toMatchObject({
        user_address: testUser1,
        operation_type: 'bet_placed',
        amount: '25',
        balance_before: '100',
        balance_after: '75',
      });
    });

    test('should fail to deduct balance with insufficient funds', async () => {
      // Create user with 10 USDC
      await createTestUser(testUser1, 10);

      // Try to deduct 25 USDC for a bet
      const { data, error } = await supabase.rpc('deduct_balance_for_bet', {
        p_user_address: testUser1,
        p_bet_amount: 25,
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: false,
        error: 'Insufficient balance',
        new_balance: 10,
      });

      // Verify balance was not changed
      const balance = await getUserBalance(testUser1);
      expect(balance).toBe(10);

      // Verify no audit log entry was created
      const auditCount = await getAuditLogCount(testUser1);
      expect(auditCount).toBe(0);
    });

    test('should fail to deduct balance for non-existent user', async () => {
      // Try to deduct from non-existent user
      const { data, error } = await supabase.rpc('deduct_balance_for_bet', {
        p_user_address: testUser1,
        p_bet_amount: 25,
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: false,
        error: 'User not found',
        new_balance: null,
      });

      // Verify no audit log entry was created
      const auditCount = await getAuditLogCount(testUser1);
      expect(auditCount).toBe(0);
    });

    test('should fail to deduct zero or negative amount', async () => {
      await createTestUser(testUser1, 100);

      // Try to deduct zero
      const { data: data1 } = await supabase.rpc('deduct_balance_for_bet', {
        p_user_address: testUser1,
        p_bet_amount: 0,
      });

      expect(data1).toMatchObject({
        success: false,
        error: 'Bet amount must be greater than zero',
      });

      // Try to deduct negative amount
      const { data: data2 } = await supabase.rpc('deduct_balance_for_bet', {
        p_user_address: testUser1,
        p_bet_amount: -10,
      });

      expect(data2).toMatchObject({
        success: false,
        error: 'Bet amount must be greater than zero',
      });

      // Verify balance unchanged
      const balance = await getUserBalance(testUser1);
      expect(balance).toBe(100);
    });

    test('should handle decimal amounts correctly', async () => {
      await createTestUser(testUser1, 100.12345678);

      const { data } = await supabase.rpc('deduct_balance_for_bet', {
        p_user_address: testUser1,
        p_bet_amount: 25.5,
      });

      expect(data.success).toBe(true);
      expect(parseFloat(data.new_balance)).toBeCloseTo(74.62345678, 8);
    });
  });

  describe('credit_balance_for_payout', () => {
    beforeEach(async () => {
      await cleanupTestUser(testUser2);
    });

    test('should successfully credit balance for a payout', async () => {
      // Create user with 50 USDC
      await createTestUser(testUser2, 50);

      // Credit 75 USDC for a payout
      const { data, error } = await supabase.rpc('credit_balance_for_payout', {
        p_user_address: testUser2,
        p_payout_amount: 75,
        p_bet_id: 'bet_123',
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: true,
        error: null,
        new_balance: 125,
      });

      // Verify balance was updated
      const balance = await getUserBalance(testUser2);
      expect(balance).toBe(125);

      // Verify audit log entry was created
      const { data: auditLog } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testUser2)
        .single();

      expect(auditLog).toMatchObject({
        user_address: testUser2,
        operation_type: 'bet_won',
        amount: '75',
        balance_before: '50',
        balance_after: '125',
        bet_id: 'bet_123',
      });
    });

    test('should create new user if not exists when crediting payout', async () => {
      // Credit payout to non-existent user
      const { data, error } = await supabase.rpc('credit_balance_for_payout', {
        p_user_address: testUser2,
        p_payout_amount: 100,
        p_bet_id: 'bet_456',
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: true,
        error: null,
        new_balance: 100,
      });

      // Verify user was created with correct balance
      const balance = await getUserBalance(testUser2);
      expect(balance).toBe(100);

      // Verify audit log shows balance_before as 0
      const { data: auditLog } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testUser2)
        .single();

      expect(auditLog).toMatchObject({
        balance_before: '0',
        balance_after: '100',
      });
    });

    test('should fail to credit zero or negative amount', async () => {
      await createTestUser(testUser2, 50);

      // Try to credit zero
      const { data: data1 } = await supabase.rpc('credit_balance_for_payout', {
        p_user_address: testUser2,
        p_payout_amount: 0,
      });

      expect(data1).toMatchObject({
        success: false,
        error: 'Payout amount must be greater than zero',
      });

      // Try to credit negative amount
      const { data: data2 } = await supabase.rpc('credit_balance_for_payout', {
        p_user_address: testUser2,
        p_payout_amount: -50,
      });

      expect(data2).toMatchObject({
        success: false,
        error: 'Payout amount must be greater than zero',
      });
    });

    test('should handle decimal amounts correctly', async () => {
      await createTestUser(testUser2, 50.5);

      const { data } = await supabase.rpc('credit_balance_for_payout', {
        p_user_address: testUser2,
        p_payout_amount: 25.12345678,
      });

      expect(data.success).toBe(true);
      expect(parseFloat(data.new_balance)).toBeCloseTo(75.62345678, 8);
    });
  });

  describe('update_balance_for_deposit', () => {
    beforeEach(async () => {
      await cleanupTestUser(testUser3);
    });

    test('should successfully update balance for a deposit', async () => {
      // Create user with 100 USDC
      await createTestUser(testUser3, 100);

      // Deposit 50 USDC
      const { data, error } = await supabase.rpc('update_balance_for_deposit', {
        p_user_address: testUser3,
        p_deposit_amount: 50,
        p_transaction_hash: '0xtxhash123',
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: true,
        error: null,
        new_balance: 150,
      });

      // Verify balance was updated
      const balance = await getUserBalance(testUser3);
      expect(balance).toBe(150);

      // Verify audit log entry was created
      const { data: auditLog } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testUser3)
        .single();

      expect(auditLog).toMatchObject({
        user_address: testUser3,
        operation_type: 'deposit',
        amount: '50',
        balance_before: '100',
        balance_after: '150',
        transaction_hash: '0xtxhash123',
      });
    });

    test('should create new user if not exists when depositing', async () => {
      // Deposit to non-existent user
      const { data, error } = await supabase.rpc('update_balance_for_deposit', {
        p_user_address: testUser3,
        p_deposit_amount: 200,
        p_transaction_hash: '0xtxhash456',
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: true,
        error: null,
        new_balance: 200,
      });

      // Verify user was created with correct balance
      const balance = await getUserBalance(testUser3);
      expect(balance).toBe(200);

      // Verify audit log shows balance_before as 0
      const { data: auditLog } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testUser3)
        .single();

      expect(auditLog).toMatchObject({
        balance_before: '0',
        balance_after: '200',
      });
    });

    test('should fail to deposit zero or negative amount', async () => {
      await createTestUser(testUser3, 100);

      // Try to deposit zero
      const { data: data1 } = await supabase.rpc('update_balance_for_deposit', {
        p_user_address: testUser3,
        p_deposit_amount: 0,
      });

      expect(data1).toMatchObject({
        success: false,
        error: 'Deposit amount must be greater than zero',
      });

      // Try to deposit negative amount
      const { data: data2 } = await supabase.rpc('update_balance_for_deposit', {
        p_user_address: testUser3,
        p_deposit_amount: -100,
      });

      expect(data2).toMatchObject({
        success: false,
        error: 'Deposit amount must be greater than zero',
      });
    });

    test('should handle decimal amounts correctly', async () => {
      await createTestUser(testUser3, 100.5);

      const { data } = await supabase.rpc('update_balance_for_deposit', {
        p_user_address: testUser3,
        p_deposit_amount: 50.12345678,
      });

      expect(data.success).toBe(true);
      expect(parseFloat(data.new_balance)).toBeCloseTo(150.62345678, 8);
    });
  });

  describe('update_balance_for_withdrawal', () => {
    beforeEach(async () => {
      await cleanupTestUser(testUser4);
    });

    test('should successfully update balance for a withdrawal', async () => {
      // Create user with 100 USDC
      await createTestUser(testUser4, 100);

      // Withdraw 30 USDC
      const { data, error } = await supabase.rpc('update_balance_for_withdrawal', {
        p_user_address: testUser4,
        p_withdrawal_amount: 30,
        p_transaction_hash: '0xtxhash789',
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: true,
        error: null,
        new_balance: 70,
      });

      // Verify balance was updated
      const balance = await getUserBalance(testUser4);
      expect(balance).toBe(70);

      // Verify audit log entry was created
      const { data: auditLog } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testUser4)
        .single();

      expect(auditLog).toMatchObject({
        user_address: testUser4,
        operation_type: 'withdrawal',
        amount: '30',
        balance_before: '100',
        balance_after: '70',
        transaction_hash: '0xtxhash789',
      });
    });

    test('should fail to withdraw with insufficient funds', async () => {
      // Create user with 50 USDC
      await createTestUser(testUser4, 50);

      // Try to withdraw 100 USDC
      const { data, error } = await supabase.rpc('update_balance_for_withdrawal', {
        p_user_address: testUser4,
        p_withdrawal_amount: 100,
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: false,
        error: 'Insufficient balance',
        new_balance: 50,
      });

      // Verify balance was not changed
      const balance = await getUserBalance(testUser4);
      expect(balance).toBe(50);

      // Verify no audit log entry was created
      const auditCount = await getAuditLogCount(testUser4);
      expect(auditCount).toBe(0);
    });

    test('should fail to withdraw from non-existent user', async () => {
      // Try to withdraw from non-existent user
      const { data, error } = await supabase.rpc('update_balance_for_withdrawal', {
        p_user_address: testUser4,
        p_withdrawal_amount: 50,
      });

      expect(error).toBeNull();
      expect(data).toMatchObject({
        success: false,
        error: 'User not found',
        new_balance: null,
      });

      // Verify no audit log entry was created
      const auditCount = await getAuditLogCount(testUser4);
      expect(auditCount).toBe(0);
    });

    test('should fail to withdraw zero or negative amount', async () => {
      await createTestUser(testUser4, 100);

      // Try to withdraw zero
      const { data: data1 } = await supabase.rpc('update_balance_for_withdrawal', {
        p_user_address: testUser4,
        p_withdrawal_amount: 0,
      });

      expect(data1).toMatchObject({
        success: false,
        error: 'Withdrawal amount must be greater than zero',
      });

      // Try to withdraw negative amount
      const { data: data2 } = await supabase.rpc('update_balance_for_withdrawal', {
        p_user_address: testUser4,
        p_withdrawal_amount: -50,
      });

      expect(data2).toMatchObject({
        success: false,
        error: 'Withdrawal amount must be greater than zero',
      });
    });

    test('should handle decimal amounts correctly', async () => {
      await createTestUser(testUser4, 100.12345678);

      const { data } = await supabase.rpc('update_balance_for_withdrawal', {
        p_user_address: testUser4,
        p_withdrawal_amount: 25.5,
      });

      expect(data.success).toBe(true);
      expect(parseFloat(data.new_balance)).toBeCloseTo(74.62345678, 8);
    });

    test('should allow withdrawing entire balance', async () => {
      await createTestUser(testUser4, 100);

      const { data } = await supabase.rpc('update_balance_for_withdrawal', {
        p_user_address: testUser4,
        p_withdrawal_amount: 100,
      });

      expect(data).toMatchObject({
        success: true,
        new_balance: 0,
      });

      const balance = await getUserBalance(testUser4);
      expect(balance).toBe(0);
    });
  });

  describe('Atomicity and Concurrency (Requirement 2.5)', () => {
    const concurrentUser = '0xtest_concurrent_user';

    beforeEach(async () => {
      await cleanupTestUser(concurrentUser);
      await createTestUser(concurrentUser, 1000);
    });

    afterEach(async () => {
      await cleanupTestUser(concurrentUser);
    });

    test('should handle multiple sequential operations correctly', async () => {
      // Deposit 100
      await supabase.rpc('update_balance_for_deposit', {
        p_user_address: concurrentUser,
        p_deposit_amount: 100,
      });

      // Deduct 50 for bet
      await supabase.rpc('deduct_balance_for_bet', {
        p_user_address: concurrentUser,
        p_bet_amount: 50,
      });

      // Credit 75 for payout
      await supabase.rpc('credit_balance_for_payout', {
        p_user_address: concurrentUser,
        p_payout_amount: 75,
      });

      // Withdraw 200
      await supabase.rpc('update_balance_for_withdrawal', {
        p_user_address: concurrentUser,
        p_withdrawal_amount: 200,
      });

      // Final balance should be: 1000 + 100 - 50 + 75 - 200 = 925
      const balance = await getUserBalance(concurrentUser);
      expect(balance).toBe(925);

      // Verify all 4 audit log entries were created
      const auditCount = await getAuditLogCount(concurrentUser);
      expect(auditCount).toBe(4);
    });

    test('should maintain consistency with concurrent operations', async () => {
      // Simulate concurrent operations
      const operations = [
        supabase.rpc('deduct_balance_for_bet', {
          p_user_address: concurrentUser,
          p_bet_amount: 10,
        }),
        supabase.rpc('deduct_balance_for_bet', {
          p_user_address: concurrentUser,
          p_bet_amount: 20,
        }),
        supabase.rpc('credit_balance_for_payout', {
          p_user_address: concurrentUser,
          p_payout_amount: 15,
        }),
      ];

      // Execute all operations concurrently
      const results = await Promise.all(operations);

      // All operations should succeed
      results.forEach((result) => {
        expect(result.data.success).toBe(true);
      });

      // Final balance should be: 1000 - 10 - 20 + 15 = 985
      const balance = await getUserBalance(concurrentUser);
      expect(balance).toBe(985);

      // Verify all 3 audit log entries were created
      const auditCount = await getAuditLogCount(concurrentUser);
      expect(auditCount).toBe(3);
    });
  });

  describe('Audit Logging (Requirement 6.2)', () => {
    const auditUser = '0xtest_audit_user';

    beforeEach(async () => {
      await cleanupTestUser(auditUser);
    });

    afterEach(async () => {
      await cleanupTestUser(auditUser);
    });

    test('should create audit log entries for all operations', async () => {
      // Deposit
      await supabase.rpc('update_balance_for_deposit', {
        p_user_address: auditUser,
        p_deposit_amount: 100,
        p_transaction_hash: '0xdeposit',
      });

      // Bet
      await supabase.rpc('deduct_balance_for_bet', {
        p_user_address: auditUser,
        p_bet_amount: 25,
      });

      // Payout
      await supabase.rpc('credit_balance_for_payout', {
        p_user_address: auditUser,
        p_payout_amount: 50,
        p_bet_id: 'bet_789',
      });

      // Withdrawal
      await supabase.rpc('update_balance_for_withdrawal', {
        p_user_address: auditUser,
        p_withdrawal_amount: 75,
        p_transaction_hash: '0xwithdrawal',
      });

      // Verify all audit log entries
      const { data: auditLogs } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', auditUser)
        .order('created_at', { ascending: true });

      expect(auditLogs).toHaveLength(4);

      // Verify deposit log
      expect(auditLogs![0]).toMatchObject({
        operation_type: 'deposit',
        amount: '100',
        balance_before: '0',
        balance_after: '100',
        transaction_hash: '0xdeposit',
      });

      // Verify bet log
      expect(auditLogs![1]).toMatchObject({
        operation_type: 'bet_placed',
        amount: '25',
        balance_before: '100',
        balance_after: '75',
      });

      // Verify payout log
      expect(auditLogs![2]).toMatchObject({
        operation_type: 'bet_won',
        amount: '50',
        balance_before: '75',
        balance_after: '125',
        bet_id: 'bet_789',
      });

      // Verify withdrawal log
      expect(auditLogs![3]).toMatchObject({
        operation_type: 'withdrawal',
        amount: '75',
        balance_before: '125',
        balance_after: '50',
        transaction_hash: '0xwithdrawal',
      });
    });
  });
});
