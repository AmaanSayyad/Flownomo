/**
 * Tests for balance_audit_log table schema
 * Task 1.2: Create balance_audit_log table with schema
 * Requirements: 7.5
 */

import { supabase } from '@/lib/supabase/client';

describe('balance_audit_log table schema', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await supabase.from('balance_audit_log').delete().like('user_address', '0xtest%');
  });

  describe('Table structure', () => {
    it('should have the correct columns', async () => {
      // Insert a test record to verify column structure
      const testAddress = '0xtest123';
      const { data, error } = await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'deposit',
          amount: 100.5,
          balance_before: 0,
          balance_after: 100.5,
          transaction_hash: '0xtxhash123',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('user_address');
      expect(data).toHaveProperty('operation_type');
      expect(data).toHaveProperty('amount');
      expect(data).toHaveProperty('balance_before');
      expect(data).toHaveProperty('balance_after');
      expect(data).toHaveProperty('transaction_hash');
      expect(data).toHaveProperty('bet_id');
      expect(data).toHaveProperty('created_at');
    });

    it('should auto-increment id as primary key', async () => {
      const testAddress = '0xtest456';
      
      // Insert first record
      const { data: data1, error: error1 } = await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'deposit',
          amount: 50,
          balance_before: 0,
          balance_after: 50,
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(data1?.id).toBeDefined();
      expect(typeof data1?.id).toBe('number');

      // Insert second record
      const { data: data2, error: error2 } = await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'bet_placed',
          amount: 10,
          balance_before: 50,
          balance_after: 40,
        })
        .select()
        .single();

      expect(error2).toBeNull();
      expect(data2?.id).toBeDefined();
      expect(data2!.id).toBeGreaterThan(data1!.id);
    });

    it('should automatically set created_at timestamp', async () => {
      const testAddress = '0xtestTimestamp';
      const beforeInsert = new Date();
      
      const { data, error } = await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'withdrawal',
          amount: 25,
          balance_before: 100,
          balance_after: 75,
        })
        .select()
        .single();

      const afterInsert = new Date();

      expect(error).toBeNull();
      expect(data?.created_at).toBeDefined();
      
      const createdAt = new Date(data!.created_at);
      
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
    });

    it('should allow null transaction_hash and bet_id', async () => {
      const testAddress = '0xtestNullable';
      
      const { data, error } = await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'bet_placed',
          amount: 10,
          balance_before: 50,
          balance_after: 40,
          // transaction_hash and bet_id not provided
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.transaction_hash).toBeNull();
      expect(data?.bet_id).toBeNull();
    });
  });

  describe('Operation types (Requirement 7.5)', () => {
    const testAddress = '0xtestOperations';
    const operationTypes = ['deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost'];

    operationTypes.forEach((opType) => {
      it(`should accept operation_type: ${opType}`, async () => {
        const { data, error } = await supabase
          .from('balance_audit_log')
          .insert({
            user_address: testAddress,
            operation_type: opType,
            amount: 10,
            balance_before: 100,
            balance_after: opType === 'deposit' || opType === 'bet_won' ? 110 : 90,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.operation_type).toBe(opType);
      });
    });
  });

  describe('Index on (user_address, created_at DESC) (Requirement 7.5)', () => {
    it('should efficiently query audit logs by user_address', async () => {
      const testAddress = '0xtestIndex1';
      
      // Insert multiple audit log entries
      const operations = [
        { operation_type: 'deposit', amount: 100, balance_before: 0, balance_after: 100 },
        { operation_type: 'bet_placed', amount: 10, balance_before: 100, balance_after: 90 },
        { operation_type: 'bet_won', amount: 20, balance_before: 90, balance_after: 110 },
      ];

      for (const op of operations) {
        await supabase
          .from('balance_audit_log')
          .insert({
            user_address: testAddress,
            ...op,
          });
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Query by user_address
      const { data, error } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testAddress)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
      expect(data![0].operation_type).toBe('bet_won'); // Most recent
      expect(data![2].operation_type).toBe('deposit'); // Oldest
    });

    it('should return logs in descending order by created_at', async () => {
      const testAddress = '0xtestOrder';
      
      // Insert entries with delays to ensure different timestamps
      await supabase.from('balance_audit_log').insert({
        user_address: testAddress,
        operation_type: 'deposit',
        amount: 100,
        balance_before: 0,
        balance_after: 100,
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await supabase.from('balance_audit_log').insert({
        user_address: testAddress,
        operation_type: 'bet_placed',
        amount: 10,
        balance_before: 100,
        balance_after: 90,
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await supabase.from('balance_audit_log').insert({
        user_address: testAddress,
        operation_type: 'withdrawal',
        amount: 50,
        balance_before: 90,
        balance_after: 40,
      });

      // Query with descending order
      const { data, error } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testAddress)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
      
      // Verify descending order
      const timestamps = data!.map(entry => new Date(entry.created_at).getTime());
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    });

    it('should filter logs for specific user', async () => {
      const user1 = '0xtestUser1';
      const user2 = '0xtestUser2';
      
      // Insert logs for user1
      await supabase.from('balance_audit_log').insert({
        user_address: user1,
        operation_type: 'deposit',
        amount: 100,
        balance_before: 0,
        balance_after: 100,
      });
      
      // Insert logs for user2
      await supabase.from('balance_audit_log').insert({
        user_address: user2,
        operation_type: 'deposit',
        amount: 200,
        balance_before: 0,
        balance_after: 200,
      });

      // Query for user1 only
      const { data, error } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', user1);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].user_address).toBe(user1);
      expect(parseFloat(data![0].amount)).toBeCloseTo(100, 2);
    });
  });

  describe('CRUD operations', () => {
    it('should insert a deposit audit log entry', async () => {
      const testAddress = '0xtestDeposit';
      const txHash = '0xtxhash123';

      const { data, error } = await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'deposit',
          amount: 50.25,
          balance_before: 0,
          balance_after: 50.25,
          transaction_hash: txHash,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.user_address).toBe(testAddress);
      expect(data?.operation_type).toBe('deposit');
      expect(parseFloat(data!.amount)).toBeCloseTo(50.25, 2);
      expect(data?.transaction_hash).toBe(txHash);
    });

    it('should insert a bet_placed audit log entry', async () => {
      const testAddress = '0xtestBet';
      const betId = 'bet_12345';

      const { data, error } = await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'bet_placed',
          amount: 10,
          balance_before: 100,
          balance_after: 90,
          bet_id: betId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.user_address).toBe(testAddress);
      expect(data?.operation_type).toBe('bet_placed');
      expect(parseFloat(data!.amount)).toBeCloseTo(10, 2);
      expect(data?.bet_id).toBe(betId);
    });

    it('should read audit log entries', async () => {
      const testAddress = '0xtestRead';

      // Insert
      await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'withdrawal',
          amount: 75.5,
          balance_before: 100,
          balance_after: 24.5,
          transaction_hash: '0xtxread',
        });

      // Read
      const { data, error } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testAddress)
        .single();

      expect(error).toBeNull();
      expect(data?.user_address).toBe(testAddress);
      expect(data?.operation_type).toBe('withdrawal');
      expect(parseFloat(data!.amount)).toBeCloseTo(75.5, 2);
    });

    it('should query audit logs by transaction_hash', async () => {
      const testAddress = '0xtestTxHash';
      const txHash = '0xuniqueHash123';

      // Insert
      await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'deposit',
          amount: 100,
          balance_before: 0,
          balance_after: 100,
          transaction_hash: txHash,
        });

      // Query by transaction_hash
      const { data, error } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('transaction_hash', txHash)
        .single();

      expect(error).toBeNull();
      expect(data?.transaction_hash).toBe(txHash);
      expect(data?.user_address).toBe(testAddress);
    });

    it('should query audit logs by bet_id', async () => {
      const testAddress = '0xtestBetId';
      const betId = 'bet_unique_789';

      // Insert
      await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'bet_won',
          amount: 50,
          balance_before: 100,
          balance_after: 150,
          bet_id: betId,
        });

      // Query by bet_id
      const { data, error } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('bet_id', betId)
        .single();

      expect(error).toBeNull();
      expect(data?.bet_id).toBe(betId);
      expect(data?.operation_type).toBe('bet_won');
    });
  });

  describe('Balance tracking accuracy', () => {
    it('should accurately track balance changes through multiple operations', async () => {
      const testAddress = '0xtestTracking';
      let currentBalance = 0;

      // Deposit
      currentBalance += 100;
      await supabase.from('balance_audit_log').insert({
        user_address: testAddress,
        operation_type: 'deposit',
        amount: 100,
        balance_before: 0,
        balance_after: currentBalance,
      });

      // Bet placed
      const betAmount = 10;
      await supabase.from('balance_audit_log').insert({
        user_address: testAddress,
        operation_type: 'bet_placed',
        amount: betAmount,
        balance_before: currentBalance,
        balance_after: currentBalance - betAmount,
      });
      currentBalance -= betAmount;

      // Bet won
      const winAmount = 20;
      await supabase.from('balance_audit_log').insert({
        user_address: testAddress,
        operation_type: 'bet_won',
        amount: winAmount,
        balance_before: currentBalance,
        balance_after: currentBalance + winAmount,
      });
      currentBalance += winAmount;

      // Query all logs
      const { data, error } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testAddress)
        .order('created_at', { ascending: true });

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
      
      // Verify balance progression
      expect(parseFloat(data![0].balance_after)).toBeCloseTo(100, 2);
      expect(parseFloat(data![1].balance_after)).toBeCloseTo(90, 2);
      expect(parseFloat(data![2].balance_after)).toBeCloseTo(110, 2);
    });

    it('should handle decimal amounts correctly', async () => {
      const testAddress = '0xtestDecimals';
      const amount = 123.45678912;

      const { data, error } = await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'deposit',
          amount: amount,
          balance_before: 0,
          balance_after: amount,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(parseFloat(data!.amount)).toBeCloseTo(amount, 8);
      expect(parseFloat(data!.balance_after)).toBeCloseTo(amount, 8);
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
          .from('balance_audit_log')
          .insert({
            user_address: address,
            operation_type: 'deposit',
            amount: 10,
            balance_before: 0,
            balance_after: 10,
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.user_address).toBe(address);
      }
    });

    it('should handle very small amounts', async () => {
      const testAddress = '0xtestSmallAmount';
      const smallAmount = 0.00000001;

      const { data, error } = await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'bet_placed',
          amount: smallAmount,
          balance_before: 1,
          balance_after: 1 - smallAmount,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(parseFloat(data!.amount)).toBeCloseTo(smallAmount, 8);
    });

    it('should handle large amounts', async () => {
      const testAddress = '0xtestLargeAmount';
      const largeAmount = 999999999999.12345678;

      const { data, error } = await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'deposit',
          amount: largeAmount,
          balance_before: 0,
          balance_after: largeAmount,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(parseFloat(data!.amount)).toBeCloseTo(largeAmount, 8);
    });

    it('should handle multiple concurrent inserts', async () => {
      const testAddress = '0xtestConcurrent';

      // Perform multiple concurrent inserts
      const inserts = await Promise.all([
        supabase.from('balance_audit_log').insert({
          user_address: testAddress,
          operation_type: 'deposit',
          amount: 100,
          balance_before: 0,
          balance_after: 100,
        }),
        supabase.from('balance_audit_log').insert({
          user_address: testAddress,
          operation_type: 'bet_placed',
          amount: 10,
          balance_before: 100,
          balance_after: 90,
        }),
        supabase.from('balance_audit_log').insert({
          user_address: testAddress,
          operation_type: 'withdrawal',
          amount: 50,
          balance_before: 90,
          balance_after: 40,
        }),
      ]);

      // All inserts should succeed
      inserts.forEach(({ error }) => {
        expect(error).toBeNull();
      });

      // Verify all entries were created
      const { data, error } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testAddress);

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
    });

    it('should handle long transaction hashes', async () => {
      const testAddress = '0xtestLongHash';
      const longHash = '0x' + 'a'.repeat(64); // 64 character hash

      const { data, error } = await supabase
        .from('balance_audit_log')
        .insert({
          user_address: testAddress,
          operation_type: 'deposit',
          amount: 100,
          balance_before: 0,
          balance_after: 100,
          transaction_hash: longHash,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.transaction_hash).toBe(longHash);
    });
  });

  describe('Audit trail completeness (Requirement 7.5)', () => {
    it('should maintain complete audit trail for user operations', async () => {
      const testAddress = '0xtestAuditTrail';
      
      // Simulate a complete user journey
      const operations = [
        { operation_type: 'deposit', amount: 100, balance_before: 0, balance_after: 100, transaction_hash: '0xdeposit1' },
        { operation_type: 'bet_placed', amount: 10, balance_before: 100, balance_after: 90, bet_id: 'bet_1' },
        { operation_type: 'bet_lost', amount: 10, balance_before: 90, balance_after: 90, bet_id: 'bet_1' },
        { operation_type: 'bet_placed', amount: 20, balance_before: 90, balance_after: 70, bet_id: 'bet_2' },
        { operation_type: 'bet_won', amount: 40, balance_before: 70, balance_after: 110, bet_id: 'bet_2' },
        { operation_type: 'withdrawal', amount: 50, balance_before: 110, balance_after: 60, transaction_hash: '0xwithdraw1' },
      ];

      // Insert all operations
      for (const op of operations) {
        await supabase.from('balance_audit_log').insert({
          user_address: testAddress,
          ...op,
        });
        await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      }

      // Query complete audit trail
      const { data, error } = await supabase
        .from('balance_audit_log')
        .select('*')
        .eq('user_address', testAddress)
        .order('created_at', { ascending: true });

      expect(error).toBeNull();
      expect(data).toHaveLength(6);
      
      // Verify each operation is recorded correctly
      operations.forEach((op, index) => {
        expect(data![index].operation_type).toBe(op.operation_type);
        expect(parseFloat(data![index].amount)).toBeCloseTo(op.amount, 2);
        expect(parseFloat(data![index].balance_before)).toBeCloseTo(op.balance_before, 2);
        expect(parseFloat(data![index].balance_after)).toBeCloseTo(op.balance_after, 2);
      });
    });
  });
});
