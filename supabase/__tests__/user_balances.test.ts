/**
 * Tests for user_balances table schema
 * Task 1.1: Create user_balances table with schema
 * Requirements: 6.1, 6.5
 */

import { supabase } from '@/lib/supabase/client';

describe('user_balances table schema', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await supabase.from('user_balances').delete().like('user_address', '0xtest%');
  });

  describe('Table structure', () => {
    it('should have the correct columns', async () => {
      // Insert a test record to verify column structure
      const testAddress = '0xtest123';
      const { data, error } = await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: 100.5,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toHaveProperty('user_address');
      expect(data).toHaveProperty('balance');
      expect(data).toHaveProperty('updated_at');
      expect(data).toHaveProperty('created_at');
    });

    it('should use user_address as primary key', async () => {
      const testAddress = '0xtest456';
      
      // Insert first record
      const { error: error1 } = await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: 50,
        });

      expect(error1).toBeNull();

      // Try to insert duplicate - should fail
      const { error: error2 } = await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: 100,
        });

      expect(error2).not.toBeNull();
      expect(error2?.message).toContain('duplicate key');
    });

    it('should set default balance to 0', async () => {
      const testAddress = '0xtest789';
      
      // Insert without specifying balance
      const { data, error } = await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.balance).toBe('0'); // Numeric type returns as string
    });

    it('should automatically set created_at and updated_at timestamps', async () => {
      const testAddress = '0xtestTimestamp';
      const beforeInsert = new Date();
      
      const { data, error } = await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: 25,
        })
        .select()
        .single();

      const afterInsert = new Date();

      expect(error).toBeNull();
      expect(data?.created_at).toBeDefined();
      expect(data?.updated_at).toBeDefined();
      
      const createdAt = new Date(data!.created_at);
      const updatedAt = new Date(data!.updated_at);
      
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
    });
  });

  describe('Balance constraints (Requirement 6.1)', () => {
    it('should enforce non-negative balance constraint', async () => {
      const testAddress = '0xtestNegative';
      
      // Try to insert negative balance - should fail
      const { error } = await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: -10,
        });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('check constraint');
    });

    it('should allow zero balance', async () => {
      const testAddress = '0xtestZero';
      
      const { data, error } = await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: 0,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.balance).toBe('0');
    });

    it('should allow positive balances', async () => {
      const testAddress = '0xtestPositive';
      
      const { data, error } = await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: 123.456789,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(parseFloat(data!.balance)).toBeCloseTo(123.456789, 6);
    });

    it('should handle large balance values with 8 decimal places', async () => {
      const testAddress = '0xtestLarge';
      const largeBalance = 999999999999.12345678;
      
      const { data, error } = await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: largeBalance,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(parseFloat(data!.balance)).toBeCloseTo(largeBalance, 8);
    });
  });

  describe('Index on user_address (Requirement 6.5)', () => {
    it('should efficiently query by user_address', async () => {
      // Insert multiple test records
      const testAddresses = [
        '0xtestIndex1',
        '0xtestIndex2',
        '0xtestIndex3',
      ];

      for (const address of testAddresses) {
        await supabase
          .from('user_balances')
          .insert({
            user_address: address,
            balance: Math.random() * 100,
          });
      }

      // Query by specific address
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_address', testAddresses[1])
        .single();

      expect(error).toBeNull();
      expect(data?.user_address).toBe(testAddresses[1]);
    });

    it('should return null for non-existent user', async () => {
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_address', '0xNonExistent')
        .maybeSingle();

      expect(error).toBeNull();
      expect(data).toBeNull();
    });
  });

  describe('CRUD operations', () => {
    it('should insert a new user balance', async () => {
      const testAddress = '0xtestInsert';
      const testBalance = 50.25;

      const { data, error } = await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: testBalance,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.user_address).toBe(testAddress);
      expect(parseFloat(data!.balance)).toBeCloseTo(testBalance, 2);
    });

    it('should read an existing user balance', async () => {
      const testAddress = '0xtestRead';
      const testBalance = 75.5;

      // Insert
      await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: testBalance,
        });

      // Read
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_address', testAddress)
        .single();

      expect(error).toBeNull();
      expect(data?.user_address).toBe(testAddress);
      expect(parseFloat(data!.balance)).toBeCloseTo(testBalance, 2);
    });

    it('should update an existing user balance', async () => {
      const testAddress = '0xtestUpdate';
      const initialBalance = 100;
      const updatedBalance = 150;

      // Insert
      await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: initialBalance,
        });

      // Update
      const { data, error } = await supabase
        .from('user_balances')
        .update({ balance: updatedBalance })
        .eq('user_address', testAddress)
        .select()
        .single();

      expect(error).toBeNull();
      expect(parseFloat(data!.balance)).toBeCloseTo(updatedBalance, 2);
    });

    it('should delete a user balance', async () => {
      const testAddress = '0xtestDelete';

      // Insert
      await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: 50,
        });

      // Delete
      const { error: deleteError } = await supabase
        .from('user_balances')
        .delete()
        .eq('user_address', testAddress);

      expect(deleteError).toBeNull();

      // Verify deletion
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_address', testAddress)
        .maybeSingle();

      expect(error).toBeNull();
      expect(data).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle Sui address format correctly', async () => {
      const suiAddresses = [
        '0x1234567890abcdef',
        '0xf8d6e0586b0a20c7',
        '0x0000000000000001',
      ];

      for (const address of flowAddresses) {
        const { data, error } = await supabase
          .from('user_balances')
          .insert({
            user_address: address,
            balance: 10,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.user_address).toBe(address);
      }
    });

    it('should handle very small balance values', async () => {
      const testAddress = '0xtestSmall';
      const smallBalance = 0.00000001; // 1 satoshi equivalent

      const { data, error } = await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: smallBalance,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(parseFloat(data!.balance)).toBeCloseTo(smallBalance, 8);
    });

    it('should handle concurrent reads correctly', async () => {
      const testAddress = '0xtestConcurrent';
      const testBalance = 100;

      // Insert
      await supabase
        .from('user_balances')
        .insert({
          user_address: testAddress,
          balance: testBalance,
        });

      // Perform multiple concurrent reads
      const reads = await Promise.all([
        supabase.from('user_balances').select('*').eq('user_address', testAddress).single(),
        supabase.from('user_balances').select('*').eq('user_address', testAddress).single(),
        supabase.from('user_balances').select('*').eq('user_address', testAddress).single(),
      ]);

      // All reads should succeed
      reads.forEach(({ data, error }) => {
        expect(error).toBeNull();
        expect(data?.user_address).toBe(testAddress);
        expect(parseFloat(data!.balance)).toBeCloseTo(testBalance, 2);
      });
    });
  });
});
