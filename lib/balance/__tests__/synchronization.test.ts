/**
 * Unit tests for balance synchronization module
 * 
 * Tests the synchronization check function that compares Supabase balances
 * with the Flow blockchain escrow vault balance.
 */

import { checkBalanceSynchronization } from '../synchronization';
import { supabase } from '../../supabase/client';
import * as fcl from '@onflow/fcl';

// Mock dependencies
jest.mock('../../supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@onflow/fcl', () => ({
  query: jest.fn(),
}));

describe('Balance Synchronization', () => {
  const mockContractAddress = '0xf8d6e0586b0a20c7';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('checkBalanceSynchronization', () => {
    it('should return synchronized=true when balances match', async () => {
      // Mock Supabase query to return user balances
      const mockSupabaseData = [
        { balance: 100 },
        { balance: 50 },
        { balance: 25.5 },
      ];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockSupabaseData,
          error: null,
        }),
      });
      
      // Mock FCL query to return escrow vault balance
      const expectedTotal = 175.5;
      (fcl.query as jest.Mock).mockResolvedValue(expectedTotal.toString());
      
      // Run synchronization check
      const result = await checkBalanceSynchronization(mockContractAddress);
      
      // Verify result
      expect(result.synchronized).toBe(true);
      expect(result.supabaseTotal).toBe(expectedTotal);
      expect(result.escrowVaultBalance).toBe(expectedTotal);
      expect(result.discrepancy).toBe(0);
      expect(result.error).toBeUndefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });
    
    it('should return synchronized=false when balances mismatch', async () => {
      // Mock Supabase query to return user balances
      const mockSupabaseData = [
        { balance: 100 },
        { balance: 50 },
      ];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockSupabaseData,
          error: null,
        }),
      });
      
      // Mock FCL query to return different escrow vault balance
      const supabaseTotal = 150;
      const escrowBalance = 200;
      (fcl.query as jest.Mock).mockResolvedValue(escrowBalance.toString());
      
      // Mock insert for audit log
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'balance_audit_log') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {
          select: jest.fn().mockResolvedValue({
            data: mockSupabaseData,
            error: null,
          }),
        };
      });
      
      // Run synchronization check
      const result = await checkBalanceSynchronization(mockContractAddress);
      
      // Verify result
      expect(result.synchronized).toBe(false);
      expect(result.supabaseTotal).toBe(supabaseTotal);
      expect(result.escrowVaultBalance).toBe(escrowBalance);
      expect(result.discrepancy).toBe(50);
      expect(result.error).toBeUndefined();
      
      // Verify critical error was logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL'),
        expect.any(Object)
      );
    });
    
    it('should handle empty Supabase balances', async () => {
      // Mock Supabase query to return no balances
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      
      // Mock FCL query to return zero escrow vault balance
      (fcl.query as jest.Mock).mockResolvedValue('0');
      
      // Run synchronization check
      const result = await checkBalanceSynchronization(mockContractAddress);
      
      // Verify result
      expect(result.synchronized).toBe(true);
      expect(result.supabaseTotal).toBe(0);
      expect(result.escrowVaultBalance).toBe(0);
      expect(result.discrepancy).toBe(0);
    });
    
    it('should handle Supabase query errors', async () => {
      // Mock Supabase query to return error
      const mockError = { message: 'Database connection failed' };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });
      
      // Run synchronization check
      const result = await checkBalanceSynchronization(mockContractAddress);
      
      // Verify result
      expect(result.synchronized).toBe(false);
      expect(result.supabaseTotal).toBe(0);
      expect(result.escrowVaultBalance).toBe(0);
      expect(result.error).toContain('Failed to query Supabase balances');
      expect(result.error).toContain(mockError.message);
    });
    
    it('should handle Flow blockchain query errors', async () => {
      // Mock Supabase query to return user balances
      const mockSupabaseData = [{ balance: 100 }];
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockSupabaseData,
          error: null,
        }),
      });
      
      // Mock FCL query to throw error
      const mockError = new Error('Network timeout');
      (fcl.query as jest.Mock).mockRejectedValue(mockError);
      
      // Run synchronization check
      const result = await checkBalanceSynchronization(mockContractAddress);
      
      // Verify result
      expect(result.synchronized).toBe(false);
      expect(result.error).toContain('Synchronization check failed');
      expect(result.error).toContain('Network timeout');
    });
    
    it('should tolerate small floating point differences', async () => {
      // Mock Supabase query to return user balances
      const mockSupabaseData = [{ balance: 100.000000001 }];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockSupabaseData,
          error: null,
        }),
      });
      
      // Mock FCL query to return slightly different balance (within tolerance)
      (fcl.query as jest.Mock).mockResolvedValue('100.000000002');
      
      // Run synchronization check
      const result = await checkBalanceSynchronization(mockContractAddress);
      
      // Verify result - should be synchronized despite tiny difference
      expect(result.synchronized).toBe(true);
      expect(Math.abs(result.discrepancy)).toBeLessThan(0.00000001);
    });
    
    it('should log discrepancy to audit log when mismatch detected', async () => {
      // Mock Supabase query to return user balances
      const mockSupabaseData = [{ balance: 100 }];
      
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'balance_audit_log') {
          return { insert: mockInsert };
        }
        return {
          select: jest.fn().mockResolvedValue({
            data: mockSupabaseData,
            error: null,
          }),
        };
      });
      
      // Mock FCL query to return different balance
      (fcl.query as jest.Mock).mockResolvedValue('150');
      
      // Run synchronization check
      await checkBalanceSynchronization(mockContractAddress);
      
      // Verify audit log was called
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_address: 'SYSTEM',
          operation_type: 'sync_check',
          amount: 50,
          balance_before: 100,
          balance_after: 150,
        })
      );
    });
    
    it('should calculate correct total from multiple user balances', async () => {
      // Mock Supabase query with various balance amounts
      const mockSupabaseData = [
        { balance: 10.5 },
        { balance: 25.75 },
        { balance: 100 },
        { balance: 0.25 },
        { balance: 50 },
      ];
      
      const expectedTotal = 186.5;
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockSupabaseData,
          error: null,
        }),
      });
      
      // Mock FCL query to return matching total
      (fcl.query as jest.Mock).mockResolvedValue(expectedTotal.toString());
      
      // Run synchronization check
      const result = await checkBalanceSynchronization(mockContractAddress);
      
      // Verify correct total calculation
      expect(result.supabaseTotal).toBe(expectedTotal);
      expect(result.synchronized).toBe(true);
    });
  });
});
