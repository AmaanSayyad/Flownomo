/**
 * Unit tests for WithdrawModal component
 * 
 * Task: 10.4 Write unit tests for WithdrawModal
 * Requirements: 8.3, 8.4, 8.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WithdrawModal } from '../WithdrawModal';
import { useOverflowStore } from '@/lib/store';
import * as fcl from '@onflow/fcl';

// Mock FCL
jest.mock('@onflow/fcl', () => ({
  mutate: jest.fn(),
  tx: jest.fn(),
}));

// Mock the store
jest.mock('@/lib/store', () => ({
  useOverflowStore: jest.fn(),
}));

// Mock the toast hook
jest.mock('@/lib/hooks/useToast', () => ({
  useToast: jest.fn(() => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  })),
}));

describe('WithdrawModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const mockWithdrawFunds = jest.fn();
  
  const defaultStoreState = {
    address: '0x1234567890abcdef',
    balance: '100.0',
    houseBalance: 50.0,
    withdrawFunds: mockWithdrawFunds,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useOverflowStore as unknown as jest.Mock).mockReturnValue(defaultStoreState);
  });
  
  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <WithdrawModal
          isOpen={false}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.queryByText('Withdraw FLOW')).not.toBeInTheDocument();
    });
    
    it('should render when isOpen is true', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('Withdraw FLOW')).toBeInTheDocument();
    });
    
    it('should display house balance', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('House Balance')).toBeInTheDocument();
      expect(screen.getByText('50.0000 FLOW')).toBeInTheDocument();
    });
    
    it('should render amount input field', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', '0.00');
    });
    
    it('should render max button', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('Withdraw Max')).toBeInTheDocument();
    });
    
    it('should render action buttons', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Withdraw')).toBeInTheDocument();
    });
  });
  
  describe('Input Validation', () => {
    it('should accept valid numeric input', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '10.5' } });
      
      expect(input.value).toBe('10.5');
    });
    
    it('should accept decimal numbers', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '0.123' } });
      
      expect(input.value).toBe('0.123');
    });
    
    it('should reject non-numeric input', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'abc' } });
      
      expect(input.value).toBe('');
    });
    
    it('should reject negative numbers', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '-5' } });
      
      expect(input.value).toBe('');
    });
    
    it('should disable withdraw button when amount is empty', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const withdrawButton = screen.getByText('Withdraw');
      expect(withdrawButton).toBeDisabled();
    });
    
    it('should disable withdraw button when amount is zero', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '0' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      expect(withdrawButton).toBeDisabled();
    });
    
    it('should disable withdraw button when amount exceeds house balance', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '100' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      expect(withdrawButton).toBeDisabled();
    });
  });
  
  describe('Max Button', () => {
    it('should set amount to house balance when max button is clicked', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const maxButton = screen.getByText('Withdraw Max');
      fireEvent.click(maxButton);
      
      const input = screen.getByLabelText('Withdrawal Amount') as HTMLInputElement;
      expect(input.value).toBe('50');
    });
    
    it('should not set amount when house balance is zero', () => {
      (useOverflowStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreState,
        houseBalance: 0,
      });
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const maxButton = screen.getByText('Withdraw Max');
      fireEvent.click(maxButton);
      
      const input = screen.getByLabelText('Withdrawal Amount') as HTMLInputElement;
      expect(input.value).toBe('');
    });
    
    it('should disable max button when house balance is zero', () => {
      (useOverflowStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreState,
        houseBalance: 0,
      });
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const maxButton = screen.getByText('Withdraw Max');
      expect(maxButton).toBeDisabled();
    });
  });
  
  describe('Transaction Flow', () => {
    it('should show loading state during transaction', async () => {
      const mockTxId = 'tx123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);
      (fcl.tx as jest.Mock).mockReturnValue({
        onceSealed: jest.fn().mockResolvedValue({ status: 4 }),
      });
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
    });
    
    it('should disable inputs during transaction', async () => {
      const mockTxId = 'tx123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);
      (fcl.tx as jest.Mock).mockReturnValue({
        onceSealed: jest.fn().mockResolvedValue({ status: 4 }),
      });
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(input).toBeDisabled();
      });
    });
    
    it('should call withdrawFunds on successful transaction', async () => {
      const mockTxId = 'tx123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);
      (fcl.tx as jest.Mock).mockReturnValue({
        onceSealed: jest.fn().mockResolvedValue({ status: 4 }),
      });
      mockWithdrawFunds.mockResolvedValue(undefined);
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(mockWithdrawFunds).toHaveBeenCalledWith('0x1234567890abcdef', 10, mockTxId);
      });
    });
    
    it('should call onSuccess callback on successful transaction', async () => {
      const mockTxId = 'tx123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);
      (fcl.tx as jest.Mock).mockReturnValue({
        onceSealed: jest.fn().mockResolvedValue({ status: 4 }),
      });
      mockWithdrawFunds.mockResolvedValue(undefined);
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(10, mockTxId);
      });
    });
    
    it('should close modal on successful transaction', async () => {
      const mockTxId = 'tx123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);
      (fcl.tx as jest.Mock).mockReturnValue({
        onceSealed: jest.fn().mockResolvedValue({ status: 4 }),
      });
      mockWithdrawFunds.mockResolvedValue(undefined);
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should display error message on transaction failure', async () => {
      const errorMessage = 'Transaction failed';
      (fcl.mutate as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
          onError={mockOnError}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
    
    it('should call onError callback on transaction failure', async () => {
      const errorMessage = 'Transaction failed';
      (fcl.mutate as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
          onError={mockOnError}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(errorMessage);
      });
    });
    
    it('should not close modal on transaction failure', async () => {
      (fcl.mutate as jest.Mock).mockRejectedValue(new Error('Transaction failed'));
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(screen.getByText('Transaction failed')).toBeInTheDocument();
      });
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
    
    it('should show error when wallet is not connected', async () => {
      (useOverflowStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreState,
        address: null,
      });
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please connect your wallet')).toBeInTheDocument();
      });
    });
    
    it('should show specific error for insufficient house balance', async () => {
      (fcl.mutate as jest.Mock).mockRejectedValue(new Error('Insufficient house balance'));
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(screen.getByText('Insufficient house balance for withdrawal')).toBeInTheDocument();
      });
    });
    
    it('should show specific error for cancelled transaction', async () => {
      (fcl.mutate as jest.Mock).mockRejectedValue(new Error('Declined: Externally Halted'));
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        expect(screen.getByText('Transaction was cancelled')).toBeInTheDocument();
      });
    });
  });
  
  describe('State Reset', () => {
    it('should reset amount when modal closes', () => {
      const { rerender } = render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '10' } });
      expect(input.value).toBe('10');
      
      rerender(
        <WithdrawModal
          isOpen={false}
          onClose={mockOnClose}
        />
      );
      
      rerender(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const newInput = screen.getByLabelText('Withdrawal Amount') as HTMLInputElement;
      expect(newInput.value).toBe('');
    });
    
    it('should reset error when modal closes', async () => {
      (fcl.mutate as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      const { rerender } = render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
      
      // Close modal
      rerender(
        <WithdrawModal
          isOpen={false}
          onClose={mockOnClose}
        />
      );
      
      // Reopen modal
      rerender(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      // Error should be cleared
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });
  
  describe('Cancel Button', () => {
    it('should call onClose when cancel button is clicked', () => {
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
    
    it('should disable cancel button during transaction', async () => {
      const mockTxId = 'tx123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);
      (fcl.tx as jest.Mock).mockReturnValue({
        onceSealed: jest.fn().mockResolvedValue({ status: 4 }),
      });
      
      render(
        <WithdrawModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Withdrawal Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        expect(cancelButton).toBeDisabled();
      });
    });
  });
});
