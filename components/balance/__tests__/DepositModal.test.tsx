/**
 * Unit tests for DepositModal component
 * 
 * Task: 9.4 Write unit tests for DepositModal
 * Requirements: 8.2, 8.4, 8.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DepositModal } from '../DepositModal';
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

describe('DepositModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const mockDepositFunds = jest.fn();
  
  const defaultStoreState = {
    address: '0x1234567890abcdef',
    balance: '100.0',
    houseBalance: 50.0,
    depositFunds: mockDepositFunds,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useOverflowStore as unknown as jest.Mock).mockReturnValue(defaultStoreState);
  });
  
  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <DepositModal
          isOpen={false}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.queryByText('Deposit FLOW')).not.toBeInTheDocument();
    });
    
    it('should render when isOpen is true', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('Deposit FLOW')).toBeInTheDocument();
    });
    
    it('should display wallet balance', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
      expect(screen.getByText('100.0000 FLOW')).toBeInTheDocument();
    });
    
    it('should render amount input field', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', '0.00');
    });
    
    it('should render quick select buttons', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('1 FLOW')).toBeInTheDocument();
      expect(screen.getByText('5 FLOW')).toBeInTheDocument();
      expect(screen.getByText('10 FLOW')).toBeInTheDocument();
      expect(screen.getByText('25 FLOW')).toBeInTheDocument();
    });
    
    it('should render max button', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('Use Max')).toBeInTheDocument();
    });
    
    it('should render action buttons', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Deposit')).toBeInTheDocument();
    });
  });
  
  describe('Input Validation', () => {
    it('should accept valid numeric input', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '10.5' } });
      
      expect(input.value).toBe('10.5');
    });
    
    it('should accept decimal numbers', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '0.123' } });
      
      expect(input.value).toBe('0.123');
    });
    
    it('should reject non-numeric input', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'abc' } });
      
      expect(input.value).toBe('');
    });
    
    it('should reject negative numbers', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '-5' } });
      
      expect(input.value).toBe('');
    });
    
    it('should disable deposit button when amount is empty', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const depositButton = screen.getByText('Deposit');
      expect(depositButton).toBeDisabled();
    });
    
    it('should disable deposit button when amount is zero', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '0' } });
      
      const depositButton = screen.getByText('Deposit');
      expect(depositButton).toBeDisabled();
    });
    
    it('should disable deposit button when amount exceeds wallet balance', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '150' } });
      
      const depositButton = screen.getByText('Deposit');
      expect(depositButton).toBeDisabled();
    });
  });
  
  describe('Quick Select Buttons', () => {
    it('should set amount when quick select button is clicked', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const quickButton = screen.getByText('5 FLOW');
      fireEvent.click(quickButton);
      
      const input = screen.getByLabelText('Deposit Amount') as HTMLInputElement;
      expect(input.value).toBe('5');
    });
    
    it('should disable quick select buttons that exceed wallet balance', () => {
      (useOverflowStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreState,
        balance: '15.0',
      });
      
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const button25 = screen.getByText('25 FLOW');
      expect(button25).toBeDisabled();
      
      const button10 = screen.getByText('10 FLOW');
      expect(button10).not.toBeDisabled();
    });
    
    it('should highlight selected quick amount', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const quickButton = screen.getByText('10 FLOW');
      fireEvent.click(quickButton);
      
      expect(quickButton).toHaveClass('bg-[#FF006E]');
    });
  });
  
  describe('Max Button', () => {
    it('should set amount to wallet balance when max button is clicked', () => {
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const maxButton = screen.getByText('Use Max');
      fireEvent.click(maxButton);
      
      const input = screen.getByLabelText('Deposit Amount') as HTMLInputElement;
      expect(input.value).toBe('100.0');
    });
    
    it('should not set amount when wallet balance is zero', () => {
      (useOverflowStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreState,
        balance: '0.0',
      });
      
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const maxButton = screen.getByText('Use Max');
      fireEvent.click(maxButton);
      
      const input = screen.getByLabelText('Deposit Amount') as HTMLInputElement;
      expect(input.value).toBe('');
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
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
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
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
      await waitFor(() => {
        expect(input).toBeDisabled();
      });
    });
    
    it('should call depositFunds on successful transaction', async () => {
      const mockTxId = 'tx123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);
      (fcl.tx as jest.Mock).mockReturnValue({
        onceSealed: jest.fn().mockResolvedValue({ status: 4 }),
      });
      mockDepositFunds.mockResolvedValue(undefined);
      
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
      await waitFor(() => {
        expect(mockDepositFunds).toHaveBeenCalledWith('0x1234567890abcdef', 10, mockTxId);
      });
    });
    
    it('should call onSuccess callback on successful transaction', async () => {
      const mockTxId = 'tx123';
      (fcl.mutate as jest.Mock).mockResolvedValue(mockTxId);
      (fcl.tx as jest.Mock).mockReturnValue({
        onceSealed: jest.fn().mockResolvedValue({ status: 4 }),
      });
      mockDepositFunds.mockResolvedValue(undefined);
      
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
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
      mockDepositFunds.mockResolvedValue(undefined);
      
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
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
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
          onError={mockOnError}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
    
    it('should call onError callback on transaction failure', async () => {
      const errorMessage = 'Transaction failed';
      (fcl.mutate as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
          onError={mockOnError}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(errorMessage);
      });
    });
    
    it('should not close modal on transaction failure', async () => {
      (fcl.mutate as jest.Mock).mockRejectedValue(new Error('Transaction failed'));
      
      render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
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
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please connect your wallet')).toBeInTheDocument();
      });
    });
  });
  
  describe('State Reset', () => {
    it('should reset amount when modal closes', () => {
      const { rerender } = render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '10' } });
      expect(input.value).toBe('10');
      
      rerender(
        <DepositModal
          isOpen={false}
          onClose={mockOnClose}
        />
      );
      
      rerender(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const newInput = screen.getByLabelText('Deposit Amount') as HTMLInputElement;
      expect(newInput.value).toBe('');
    });
    
    it('should reset error when modal closes', async () => {
      (fcl.mutate as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      const { rerender } = render(
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
      
      // Close modal
      rerender(
        <DepositModal
          isOpen={false}
          onClose={mockOnClose}
        />
      );
      
      // Reopen modal
      rerender(
        <DepositModal
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
        <DepositModal
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
        <DepositModal
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      
      const input = screen.getByLabelText('Deposit Amount');
      fireEvent.change(input, { target: { value: '10' } });
      
      const depositButton = screen.getByText('Deposit');
      fireEvent.click(depositButton);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        expect(cancelButton).toBeDisabled();
      });
    });
  });
});
