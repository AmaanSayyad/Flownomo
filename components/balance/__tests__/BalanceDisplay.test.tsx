/**
 * Unit tests for BalanceDisplay component
 * 
 * Task: 8.2 Write unit tests for BalanceDisplay (optional)
 * Requirements: 8.1
 * 
 * Tests:
 * - Balance rendering
 * - Loading state
 * - Button clicks
 * - Balance formatting
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BalanceDisplay } from '../BalanceDisplay';
import { useHouseBalance, useIsLoadingBalance, useBalanceActions, useWalletAddress } from '@/lib/store';

// Mock the store hooks
jest.mock('@/lib/store', () => ({
  useHouseBalance: jest.fn(),
  useIsLoadingBalance: jest.fn(),
  useBalanceActions: jest.fn(),
  useWalletAddress: jest.fn(),
}));

describe('BalanceDisplay', () => {
  const mockFetchBalance = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useHouseBalance as jest.Mock).mockReturnValue(0);
    (useIsLoadingBalance as jest.Mock).mockReturnValue(false);
    (useWalletAddress as jest.Mock).mockReturnValue('0x1234567890abcdef');
    (useBalanceActions as jest.Mock).mockReturnValue({
      fetchBalance: mockFetchBalance,
    });
  });

  describe('Balance Rendering', () => {
    it('should render the component with title', () => {
      render(<BalanceDisplay />);
      
      expect(screen.getByText('House Balance')).toBeInTheDocument();
    });

    it('should display balance formatted to 4 decimal places', () => {
      (useHouseBalance as jest.Mock).mockReturnValue(123.456789);
      
      render(<BalanceDisplay />);
      
      expect(screen.getByText('123.4568')).toBeInTheDocument();
      expect(screen.getByText('FLOW')).toBeInTheDocument();
    });

    it('should display zero balance formatted to 4 decimal places', () => {
      (useHouseBalance as jest.Mock).mockReturnValue(0);
      
      render(<BalanceDisplay />);
      
      expect(screen.getByText('0.0000')).toBeInTheDocument();
    });

    it('should display large balance correctly', () => {
      (useHouseBalance as jest.Mock).mockReturnValue(9999.9999);
      
      render(<BalanceDisplay />);
      
      expect(screen.getByText('9999.9999')).toBeInTheDocument();
    });

    it('should display small balance correctly', () => {
      (useHouseBalance as jest.Mock).mockReturnValue(0.0001);
      
      render(<BalanceDisplay />);
      
      expect(screen.getByText('0.0001')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      (useIsLoadingBalance as jest.Mock).mockReturnValue(true);
      
      render(<BalanceDisplay />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('0.0000')).not.toBeInTheDocument();
    });

    it('should show balance when isLoading is false', () => {
      (useIsLoadingBalance as jest.Mock).mockReturnValue(false);
      (useHouseBalance as jest.Mock).mockReturnValue(50.5);
      
      render(<BalanceDisplay />);
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('50.5000')).toBeInTheDocument();
    });

    it('should show loading animation during refresh', () => {
      (useIsLoadingBalance as jest.Mock).mockReturnValue(true);
      
      render(<BalanceDisplay />);
      
      // Check for loading animation (pulse effect)
      const loadingElement = screen.getByText('Loading...').previousElementSibling;
      expect(loadingElement).toHaveClass('animate-pulse');
    });
  });

  describe('Refresh Button', () => {
    it('should render refresh button', () => {
      render(<BalanceDisplay />);
      
      const refreshButton = screen.getByTitle('Refresh balance');
      expect(refreshButton).toBeInTheDocument();
    });

    it('should call fetchBalance when refresh button is clicked', async () => {
      const mockAddress = '0x1234567890abcdef';
      (useWalletAddress as jest.Mock).mockReturnValue(mockAddress);
      mockFetchBalance.mockResolvedValue(undefined);
      
      render(<BalanceDisplay />);
      
      const refreshButton = screen.getByTitle('Refresh balance');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(mockFetchBalance).toHaveBeenCalledWith(mockAddress);
      });
    });

    it('should disable refresh button when no wallet is connected', () => {
      (useWalletAddress as jest.Mock).mockReturnValue(null);
      
      render(<BalanceDisplay />);
      
      const refreshButton = screen.getByTitle('Refresh balance');
      expect(refreshButton).toBeDisabled();
    });

    it('should disable refresh button when loading', () => {
      (useIsLoadingBalance as jest.Mock).mockReturnValue(true);
      
      render(<BalanceDisplay />);
      
      const refreshButton = screen.getByTitle('Refresh balance');
      expect(refreshButton).toBeDisabled();
    });

    it('should show spinning animation during refresh', async () => {
      mockFetchBalance.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<BalanceDisplay />);
      
      const refreshButton = screen.getByTitle('Refresh balance');
      fireEvent.click(refreshButton);
      
      // Check for spinning animation
      const svg = refreshButton.querySelector('svg');
      expect(svg).toHaveClass('animate-spin');
    });

    it('should handle refresh errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetchBalance.mockRejectedValue(new Error('Network error'));
      
      render(<BalanceDisplay />);
      
      const refreshButton = screen.getByTitle('Refresh balance');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error refreshing balance:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Deposit Button', () => {
    it('should render deposit button', () => {
      render(<BalanceDisplay />);
      
      expect(screen.getByText('Deposit')).toBeInTheDocument();
    });

    it('should enable deposit button when wallet is connected', () => {
      (useWalletAddress as jest.Mock).mockReturnValue('0x1234567890abcdef');
      
      render(<BalanceDisplay />);
      
      const depositButton = screen.getByText('Deposit');
      expect(depositButton).not.toBeDisabled();
    });

    it('should disable deposit button when no wallet is connected', () => {
      (useWalletAddress as jest.Mock).mockReturnValue(null);
      
      render(<BalanceDisplay />);
      
      const depositButton = screen.getByText('Deposit');
      expect(depositButton).toBeDisabled();
    });

    it('should disable deposit button when loading', () => {
      (useIsLoadingBalance as jest.Mock).mockReturnValue(true);
      
      render(<BalanceDisplay />);
      
      const depositButton = screen.getByText('Deposit');
      expect(depositButton).toBeDisabled();
    });

    it('should log message when deposit button is clicked', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<BalanceDisplay />);
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Deposit clicked - modal to be implemented');
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('Withdraw Button', () => {
    it('should render withdraw button', () => {
      render(<BalanceDisplay />);
      
      expect(screen.getByText('Withdraw')).toBeInTheDocument();
    });

    it('should enable withdraw button when wallet is connected and balance > 0', () => {
      (useWalletAddress as jest.Mock).mockReturnValue('0x1234567890abcdef');
      (useHouseBalance as jest.Mock).mockReturnValue(10);
      
      render(<BalanceDisplay />);
      
      const withdrawButton = screen.getByText('Withdraw');
      expect(withdrawButton).not.toBeDisabled();
    });

    it('should disable withdraw button when no wallet is connected', () => {
      (useWalletAddress as jest.Mock).mockReturnValue(null);
      (useHouseBalance as jest.Mock).mockReturnValue(10);
      
      render(<BalanceDisplay />);
      
      const withdrawButton = screen.getByText('Withdraw');
      expect(withdrawButton).toBeDisabled();
    });

    it('should disable withdraw button when balance is zero', () => {
      (useWalletAddress as jest.Mock).mockReturnValue('0x1234567890abcdef');
      (useHouseBalance as jest.Mock).mockReturnValue(0);
      
      render(<BalanceDisplay />);
      
      const withdrawButton = screen.getByText('Withdraw');
      expect(withdrawButton).toBeDisabled();
    });

    it('should disable withdraw button when loading', () => {
      (useIsLoadingBalance as jest.Mock).mockReturnValue(true);
      (useHouseBalance as jest.Mock).mockReturnValue(10);
      
      render(<BalanceDisplay />);
      
      const withdrawButton = screen.getByText('Withdraw');
      expect(withdrawButton).toBeDisabled();
    });

    it('should log message when withdraw button is clicked', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      (useHouseBalance as jest.Mock).mockReturnValue(10);
      
      render(<BalanceDisplay />);
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Withdraw clicked - modal to be implemented');
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('Wallet Connection Message', () => {
    it('should show connection message when wallet is not connected', () => {
      (useWalletAddress as jest.Mock).mockReturnValue(null);
      
      render(<BalanceDisplay />);
      
      expect(screen.getByText('Connect your wallet to view balance')).toBeInTheDocument();
    });

    it('should not show connection message when wallet is connected', () => {
      (useWalletAddress as jest.Mock).mockReturnValue('0x1234567890abcdef');
      
      render(<BalanceDisplay />);
      
      expect(screen.queryByText('Connect your wallet to view balance')).not.toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should have proper styling classes for balance display', () => {
      (useHouseBalance as jest.Mock).mockReturnValue(100);
      
      render(<BalanceDisplay />);
      
      const balanceText = screen.getByText('100.0000');
      expect(balanceText).toHaveClass('text-neon-blue', 'text-3xl', 'font-bold', 'font-mono');
    });

    it('should have gradient background for balance container', () => {
      render(<BalanceDisplay />);
      
      const balanceContainer = screen.getByText('Available Balance').parentElement;
      expect(balanceContainer).toHaveClass('bg-gradient-to-br', 'from-neon-blue/10', 'to-purple-500/10');
    });
  });
});
