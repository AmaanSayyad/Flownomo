/**
 * Unit tests for balance reconciliation functions
 * 
 * Tests the reconciliation functions that update Supabase balances to match
 * the Flow blockchain contract balances (source of truth).
 */

import { reconcileUserBalance, reconcileAllUsers } from '../synchronization';
import { supabase } from '../../supabase/client';
import * as fcl from '@onflow/fcl';

// Mock dependencies
jest.mock('../../supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('@onflow/fcl', () => ({
  query: jest.fn(),
}));

describe('Balance Reconciliation', () => {
  const mockUserAddress = '0x1234567890abcdef';
  const mockAdminAddress = '0xadmin123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('reconcileUserBalance', () => {
    it('should reconcile user balance when contract balance is higher', async () => {
      // Mock contract query to return higher balance
      const contractBalance = 150;
      (fcl.query as jest.Mock).mockResolvedValue(contractBalance.toString());
      
      // Mock stored procedure response
      const mockRpcResponse = {
        success: true,
        error: null,
        old_balance: 100,
        new_balance: 150,
        discrepancy: 50,
      };
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      });
      
      // Run reconciliation
      const result = await reconcileUserBalance(mockUserAddress, mockAdminAddress);
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.userAddress).toBe(mockUserAddress);
      expect(result.oldBalance).toBe(100);
      expect(result.newBalance).toBe(150);
      expect(result.discrepancy).toBe(50);
      expect(result.error).toBeUndefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      
      // Verify stored procedure was called correctly
      expect(supabase.rpc).toHaveBeenCalledWith('reconcile_user_balance', {
        p_user_address: mockUserAddress,
        p_contract_balance: contractBalance,
        p_admin_address: mockAdminAddress,
      });
    });
    
    it('should reconcile user balance when contract balance is lower', async () => {
      // Mock contract query to return lower balance
      const contractBalance = 50;
      (fcl.query as jest.Mock).mockResolvedValue(contractBalance.toString());
      
      // Mock stored procedure response
      const mockRpcResponse = {
        success: true,
        error: null,
        old_balance: 100,
        new_balance: 50,
        discrepancy: -50,
      };
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      });
      
      // Run reconciliation
      const result = await reconcileUserBalance(mockUserAddress, mockAdminAddress);
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.oldBalance).toBe(100);
      expect(result.newBalance).toBe(50);
      expect(result.discrepancy).toBe(-50);
    });
    
    it('should handle user not in database (create new record)', async () => {
      // Mock contract query
      const contractBalance = 100;
      (fcl.query as jest.Mock).mockResolvedValue(contractBalance.toString());
      
      // Mock stored procedure response for new user
      const mockRpcResponse = {
        success: true,
        error: null,
        old_balance: 0,
        new_balance: 100,
        discrepancy: 100,
      };
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      });
      
      // Run reconciliation
      const result = await reconcileUserBalance(mockUserAddress, mockAdminAddress);
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.oldBalance).toBe(0);
      expect(result.newBalance).toBe(100);
      expect(result.discrepancy).toBe(100);
    });
    
    it('should handle zero balance reconciliation', async () => {
      // Mock contract query to return zero balance
      const contractBalance = 0;
      (fcl.query as jest.Mock).mockResolvedValue(contractBalance.toString());
      
      // Mock stored procedure response
      const mockRpcResponse = {
        success: true,
        error: null,
        old_balance: 50,
        new_balance: 0,
        discrepancy: -50,
      };
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      });
      
      // Run reconciliation
      const result = await reconcileUserBalance(mockUserAddress, mockAdminAddress);
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(0);
    });
    
    it('should handle contract query errors', async () => {
      // Mock contract query to throw error
      const mockError = new Error('Network timeout');
      (fcl.query as jest.Mock).mockRejectedValue(mockError);
      
      // Run reconciliation
      const result = await reconcileUserBalance(mockUserAddress, mockAdminAddress);
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.error).toContain('Reconciliation failed');
      expect(result.error).toContain('Network timeout');
    });
    
    it('should handle Supabase RPC errors', async () => {
      // Mock contract query
      const contractBalance = 100;
      (fcl.query as jest.Mock).mockResolvedValue(contractBalance.toString());
      
      // Mock stored procedure error
      const mockError = { message: 'Database connection failed' };
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });
      
      // Run reconciliation
      const result = await reconcileUserBalance(mockUserAddress, mockAdminAddress);
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to reconcile balance in Supabase');
      expect(result.error).toContain(mockError.message);
    });
    
    it('should handle stored procedure returning error', async () => {
      // Mock contract query
      const contractBalance = 100;
      (fcl.query as jest.Mock).mockResolvedValue(contractBalance.toString());
      
      // Mock stored procedure response with error
      const mockRpcResponse = {
        success: false,
        error: 'Invalid balance value',
        old_balance: null,
        new_balance: null,
        discrepancy: null,
      };
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      });
      
      // Run reconciliation
      const result = await reconcileUserBalance(mockUserAddress, mockAdminAddress);
      
      // Verify result
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid balance value');
    });
    
    it('should use default admin address when not provided', async () => {
      // Mock contract query
      const contractBalance = 100;
      (fcl.query as jest.Mock).mockResolvedValue(contractBalance.toString());
      
      // Mock stored procedure response
      const mockRpcResponse = {
        success: true,
        error: null,
        old_balance: 100,
        new_balance: 100,
        discrepancy: 0,
      };
      
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      });
      
      // Run reconciliation without admin address
      await reconcileUserBalance(mockUserAddress);
      
      // Verify default admin address was used
      expect(supabase.rpc).toHaveBeenCalledWith('reconcile_user_balance', {
        p_user_address: mockUserAddress,
        p_contract_balance: contractBalance,
        p_admin_address: 'ADMIN',
      });
    });
  });
  
  describe('reconcileAllUsers', () => {
    it('should reconcile all users with discrepancies', async () => {
      // Mock Supabase query to return users
      const mockUsers = [
        { user_address: '0xuser1', balance: 100 },
        { user_address: '0xuser2', balance: 50 },
        { user_address: '0xuser3', balance: 200 },
      ];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      });
      
      // Mock contract queries - need to account for both initial check AND reconciliation call
      // Order: user1 check, user1 reconcile, user2 check, user3 check, user3 reconcile
      (fcl.query as jest.Mock)
        .mockResolvedValueOnce('150') // user1: initial check - discrepancy of +50
        .mockResolvedValueOnce('150') // user1: reconciliation call
        .mockResolvedValueOnce('50')  // user2: initial check - no discrepancy
        .mockResolvedValueOnce('180') // user3: initial check - discrepancy of -20
        .mockResolvedValueOnce('180'); // user3: reconciliation call
      
      // Mock stored procedure responses (only called for users with discrepancies)
      (supabase.rpc as jest.Mock)
        .mockResolvedValueOnce({
          data: {
            success: true,
            error: null,
            old_balance: 100,
            new_balance: 150,
            discrepancy: 50,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            error: null,
            old_balance: 200,
            new_balance: 180,
            discrepancy: -20,
          },
          error: null,
        });
      
      // Run reconciliation
      const results = await reconcileAllUsers(mockAdminAddress, false);
      
      // Verify results - should only reconcile users with discrepancies
      expect(results.length).toBe(2); // user1 and user3
      
      // Verify the users with discrepancies
      const user1Result = results.find(r => r.userAddress === '0xuser1');
      const user3Result = results.find(r => r.userAddress === '0xuser3');
      
      expect(user1Result).toBeDefined();
      expect(user1Result?.discrepancy).toBe(50);
      expect(user1Result?.success).toBe(true);
      
      expect(user3Result).toBeDefined();
      expect(user3Result?.discrepancy).toBe(-20);
      expect(user3Result?.success).toBe(true);
      
      // Verify stored procedure was called twice (once for each user with discrepancy)
      expect(supabase.rpc).toHaveBeenCalledTimes(2);
    });
    
    it('should run in dry-run mode without updating balances', async () => {
      // Mock Supabase query to return users
      const mockUsers = [
        { user_address: '0xuser1', balance: 100 },
      ];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      });
      
      // Mock contract query to return different balance
      (fcl.query as jest.Mock).mockResolvedValue('150');
      
      // Run reconciliation in dry-run mode
      const results = await reconcileAllUsers(mockAdminAddress, true);
      
      // Verify results
      expect(results.length).toBe(1);
      expect(results[0].userAddress).toBe('0xuser1');
      expect(results[0].oldBalance).toBe(100);
      expect(results[0].newBalance).toBe(150);
      expect(results[0].discrepancy).toBe(50);
      
      // Verify stored procedure was NOT called (dry run)
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
    
    it('should handle empty user list', async () => {
      // Mock Supabase query to return no users
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      
      // Run reconciliation
      const results = await reconcileAllUsers(mockAdminAddress, false);
      
      // Verify results
      expect(results.length).toBe(0);
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
      
      // Run reconciliation
      const results = await reconcileAllUsers(mockAdminAddress, false);
      
      // Verify results
      expect(results.length).toBe(0);
    });
    
    it('should continue processing after individual user errors', async () => {
      // Mock Supabase query to return users
      const mockUsers = [
        { user_address: '0xuser1', balance: 100 },
        { user_address: '0xuser2', balance: 50 },
      ];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      });
      
      // Mock contract queries - first fails, second succeeds
      (fcl.query as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('100'); // user2: discrepancy of +50
      
      // Mock stored procedure response for user2
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          error: null,
          old_balance: 50,
          new_balance: 100,
          discrepancy: 50,
        },
        error: null,
      });
      
      // Run reconciliation
      const results = await reconcileAllUsers(mockAdminAddress, false);
      
      // Verify results - should have both users (one failed, one succeeded)
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(false);
      expect(results[0].userAddress).toBe('0xuser1');
      expect(results[0].error).toContain('Network error');
      expect(results[1].success).toBe(true);
      expect(results[1].userAddress).toBe('0xuser2');
    });
    
    it('should tolerate small floating point differences', async () => {
      // Mock Supabase query to return users
      const mockUsers = [
        { user_address: '0xuser1', balance: 100.000000001 },
      ];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      });
      
      // Mock contract query to return slightly different balance (within tolerance)
      (fcl.query as jest.Mock).mockResolvedValue('100.000000002');
      
      // Run reconciliation
      const results = await reconcileAllUsers(mockAdminAddress, false);
      
      // Verify results - should not reconcile due to tolerance
      expect(results.length).toBe(0);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
    
    it('should use default admin address when not provided', async () => {
      // Mock Supabase query to return users
      const mockUsers = [
        { user_address: '0xuser1', balance: 100 },
      ];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      });
      
      // Mock contract query to return different balance
      (fcl.query as jest.Mock).mockResolvedValue('150');
      
      // Mock stored procedure response
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          error: null,
          old_balance: 100,
          new_balance: 150,
          discrepancy: 50,
        },
        error: null,
      });
      
      // Run reconciliation without admin address
      await reconcileAllUsers();
      
      // Verify default admin address was used
      expect(supabase.rpc).toHaveBeenCalledWith('reconcile_user_balance', {
        p_user_address: '0xuser1',
        p_contract_balance: 150,
        p_admin_address: 'ADMIN',
      });
    });
  });
});
