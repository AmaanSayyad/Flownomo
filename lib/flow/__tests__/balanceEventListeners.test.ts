/**
 * Unit tests for balance event listeners
 * 
 * Task: 5.4 Write unit tests for event listeners
 * Requirements: 1.2, 5.3, 4.2
 */

// Mock @onflow/fcl before importing the module
jest.mock('@onflow/fcl', () => ({
  events: jest.fn(() => ({
    subscribe: jest.fn(() => jest.fn()),
  })),
  config: jest.fn(() => ({
    put: jest.fn(),
  })),
}));

import { handleDepositEvent, handleWithdrawalEvent, handleRoundSettledEvent } from '../balanceEventListeners';

// Mock fetch globally
global.fetch = jest.fn();

describe('Balance Event Listeners', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('handleDepositEvent', () => {
    it('should call deposit API endpoint with correct data', async () => {
      // Arrange
      const mockEvent = {
        userAddress: '0x1234567890abcdef',
        amount: '10.5',
        timestamp: '1234567890',
      };
      const mockTxHash = 'tx_abc123';
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          newBalance: 10.5,
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleDepositEvent(mockEvent, mockTxHash);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/balance/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: '0x1234567890abcdef',
          amount: 10.5,
          txHash: 'tx_abc123',
        }),
      });
    });

    it('should use timestamp as txHash if not provided', async () => {
      // Arrange
      const mockEvent = {
        userAddress: '0x1234567890abcdef',
        amount: '10.5',
        timestamp: '1234567890',
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          newBalance: 10.5,
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleDepositEvent(mockEvent);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/balance/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: '0x1234567890abcdef',
          amount: 10.5,
          txHash: 'tx_1234567890',
        }),
      });
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockEvent = {
        userAddress: '0x1234567890abcdef',
        amount: '10.5',
        timestamp: '1234567890',
      };
      
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Database error',
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await handleDepositEvent(mockEvent);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[DepositHandler] API error:');
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const mockEvent = {
        userAddress: '0x1234567890abcdef',
        amount: '10.5',
        timestamp: '1234567890',
      };
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await handleDepositEvent(mockEvent);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[DepositHandler] Error handling deposit event:');
      
      consoleErrorSpy.mockRestore();
    });

    it('should parse amount as float correctly', async () => {
      // Arrange
      const mockEvent = {
        userAddress: '0x1234567890abcdef',
        amount: '123.456789',
        timestamp: '1234567890',
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          newBalance: 123.456789,
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleDepositEvent(mockEvent);

      // Assert
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.amount).toBe(123.456789);
      expect(typeof callBody.amount).toBe('number');
    });
  });

  describe('handleWithdrawalEvent', () => {
    it('should call withdrawal API endpoint with correct data', async () => {
      // Arrange
      const mockEvent = {
        userAddress: '0x1234567890abcdef',
        amount: '5.25',
        timestamp: '1234567890',
      };
      const mockTxHash = 'tx_xyz789';
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          newBalance: 5.25,
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleWithdrawalEvent(mockEvent, mockTxHash);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/balance/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: '0x1234567890abcdef',
          amount: 5.25,
          txHash: 'tx_xyz789',
        }),
      });
    });

    it('should use timestamp as txHash if not provided', async () => {
      // Arrange
      const mockEvent = {
        userAddress: '0x1234567890abcdef',
        amount: '5.25',
        timestamp: '1234567890',
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          newBalance: 5.25,
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleWithdrawalEvent(mockEvent);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/balance/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: '0x1234567890abcdef',
          amount: 5.25,
          txHash: 'tx_1234567890',
        }),
      });
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockEvent = {
        userAddress: '0x1234567890abcdef',
        amount: '5.25',
        timestamp: '1234567890',
      };
      
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Insufficient balance',
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await handleWithdrawalEvent(mockEvent);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[WithdrawalHandler] API error:');
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const mockEvent = {
        userAddress: '0x1234567890abcdef',
        amount: '5.25',
        timestamp: '1234567890',
      };
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await handleWithdrawalEvent(mockEvent);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[WithdrawalHandler] Error handling withdrawal event:');
      
      consoleErrorSpy.mockRestore();
    });

    it('should parse amount as float correctly', async () => {
      // Arrange
      const mockEvent = {
        userAddress: '0x1234567890abcdef',
        amount: '99.999999',
        timestamp: '1234567890',
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          newBalance: 99.999999,
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleWithdrawalEvent(mockEvent);

      // Assert
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.amount).toBe(99.999999);
      expect(typeof callBody.amount).toBe('number');
    });
  });

  describe('handleRoundSettledEvent', () => {
    it('should call payout API endpoint for winning bets', async () => {
      // Arrange
      const mockEvent = {
        betId: '123',
        player: '0x1234567890abcdef',
        won: true,
        actualPriceChange: '15.5',
        payout: '20.0',
        startPrice: '50000.0',
        endPrice: '50015.5',
        timestamp: '1234567890',
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          newBalance: 30.0,
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleRoundSettledEvent(mockEvent);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/balance/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: '0x1234567890abcdef',
          payoutAmount: 20.0,
          betId: '123',
        }),
      });
    });

    it('should not call API for losing bets', async () => {
      // Arrange
      const mockEvent = {
        betId: '124',
        player: '0x1234567890abcdef',
        won: false,
        actualPriceChange: '-5.0',
        payout: '0.0',
        startPrice: '50000.0',
        endPrice: '49995.0',
        timestamp: '1234567890',
      };
      
      // Spy on console.log
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await handleRoundSettledEvent(mockEvent);

      // Assert
      expect(global.fetch).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[RoundSettledHandler] Bet lost, no payout needed'
      );
      
      consoleLogSpy.mockRestore();
    });

    it('should not call API for zero payout', async () => {
      // Arrange
      const mockEvent = {
        betId: '125',
        player: '0x1234567890abcdef',
        won: true,
        actualPriceChange: '10.0',
        payout: '0.0',
        startPrice: '50000.0',
        endPrice: '50010.0',
        timestamp: '1234567890',
      };
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await handleRoundSettledEvent(mockEvent);

      // Assert
      expect(global.fetch).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[RoundSettledHandler] Invalid payout amount:',
        0
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockEvent = {
        betId: '126',
        player: '0x1234567890abcdef',
        won: true,
        actualPriceChange: '15.5',
        payout: '20.0',
        startPrice: '50000.0',
        endPrice: '50015.5',
        timestamp: '1234567890',
      };
      
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Database error',
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await handleRoundSettledEvent(mockEvent);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[RoundSettledHandler] API error:');
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const mockEvent = {
        betId: '127',
        player: '0x1234567890abcdef',
        won: true,
        actualPriceChange: '15.5',
        payout: '20.0',
        startPrice: '50000.0',
        endPrice: '50015.5',
        timestamp: '1234567890',
      };
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await handleRoundSettledEvent(mockEvent);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[RoundSettledHandler] Error handling round settled event:');
      
      consoleErrorSpy.mockRestore();
    });

    it('should parse payout amount as float correctly', async () => {
      // Arrange
      const mockEvent = {
        betId: '128',
        player: '0x1234567890abcdef',
        won: true,
        actualPriceChange: '15.5',
        payout: '123.456789',
        startPrice: '50000.0',
        endPrice: '50015.5',
        timestamp: '1234567890',
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          newBalance: 123.456789,
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleRoundSettledEvent(mockEvent);

      // Assert
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.payoutAmount).toBe(123.456789);
      expect(typeof callBody.payoutAmount).toBe('number');
    });

    it('should include betId in API call', async () => {
      // Arrange
      const mockEvent = {
        betId: '999',
        player: '0x1234567890abcdef',
        won: true,
        actualPriceChange: '15.5',
        payout: '20.0',
        startPrice: '50000.0',
        endPrice: '50015.5',
        timestamp: '1234567890',
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          newBalance: 30.0,
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleRoundSettledEvent(mockEvent);

      // Assert
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.betId).toBe('999');
    });
  });

  describe('Event handling integration', () => {
    it('should handle multiple deposit events sequentially', async () => {
      // Arrange
      const events = [
        { userAddress: '0xaaa', amount: '10.0', timestamp: '1000' },
        { userAddress: '0xbbb', amount: '20.0', timestamp: '2000' },
        { userAddress: '0xccc', amount: '30.0', timestamp: '3000' },
      ];
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, newBalance: 0 }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      for (const event of events) {
        await handleDepositEvent(event);
      }

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/balance/deposit', expect.any(Object));
      expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/balance/deposit', expect.any(Object));
      expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/balance/deposit', expect.any(Object));
    });

    it('should handle mixed deposit and withdrawal events', async () => {
      // Arrange
      const depositEvent = { userAddress: '0xaaa', amount: '10.0', timestamp: '1000' };
      const withdrawalEvent = { userAddress: '0xaaa', amount: '5.0', timestamp: '2000' };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, newBalance: 0 }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleDepositEvent(depositEvent);
      await handleWithdrawalEvent(withdrawalEvent);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/balance/deposit', expect.any(Object));
      expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/balance/withdraw', expect.any(Object));
    });

    it('should handle deposit, bet win, and withdrawal flow', async () => {
      // Arrange
      const depositEvent = { userAddress: '0xaaa', amount: '10.0', timestamp: '1000' };
      const roundSettledEvent = {
        betId: '1',
        player: '0xaaa',
        won: true,
        actualPriceChange: '15.0',
        payout: '20.0',
        startPrice: '50000.0',
        endPrice: '50015.0',
        timestamp: '2000',
      };
      const withdrawalEvent = { userAddress: '0xaaa', amount: '15.0', timestamp: '3000' };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, newBalance: 0 }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleDepositEvent(depositEvent);
      await handleRoundSettledEvent(roundSettledEvent);
      await handleWithdrawalEvent(withdrawalEvent);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/balance/deposit', expect.any(Object));
      expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/balance/payout', expect.any(Object));
      expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/balance/withdraw', expect.any(Object));
    });

    it('should handle multiple round settlements with mixed outcomes', async () => {
      // Arrange
      const winEvent = {
        betId: '1',
        player: '0xaaa',
        won: true,
        actualPriceChange: '15.0',
        payout: '20.0',
        startPrice: '50000.0',
        endPrice: '50015.0',
        timestamp: '1000',
      };
      const loseEvent = {
        betId: '2',
        player: '0xbbb',
        won: false,
        actualPriceChange: '-10.0',
        payout: '0.0',
        startPrice: '50000.0',
        endPrice: '49990.0',
        timestamp: '2000',
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, newBalance: 0 }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleRoundSettledEvent(winEvent);
      await handleRoundSettledEvent(loseEvent);

      // Assert
      // Only the winning bet should trigger an API call
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/balance/payout', expect.any(Object));
    });
  });
});
