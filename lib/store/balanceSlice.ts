/**
 * Balance state slice for Zustand store
 * Manages house balance state and operations (deposit, withdraw, bet)
 * 
 * Task: 8.2 Update balance slice for BNB migration
 * Requirements: 3.5
 */

import { StateCreator } from "zustand";

export interface BalanceState {
  // State
  houseBalance: number;
  demoBalance: number;
  accountType: 'real' | 'demo';
  userTier: 'free' | 'standard' | 'vip';
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBalance: (address: string) => Promise<void>;
  setBalance: (balance: number) => void;
  updateBalance: (amount: number, operation: 'add' | 'subtract') => void;
  depositFunds: (address: string, amount: number, txHash: string) => Promise<any>;
  withdrawFunds: (address: string, amount: number) => Promise<any>;
  toggleAccountType: () => void;
  clearError: () => void;
}

/**
 * Create balance slice for Zustand store
 * Handles house balance fetching, updates, deposits, and withdrawals
 */
export const createBalanceSlice: StateCreator<BalanceState> = (set, get) => ({
  // Initial state
  houseBalance: 0,
  demoBalance: 10000, // 10,000 demo BNB to start
  accountType: (typeof window !== 'undefined' && localStorage.getItem('bynomo_account_type') as 'real' | 'demo') || 'real', // Persist account type
  userTier: 'free',
  isLoading: false,
  error: null,

  /**
   * Fetch house balance for a user address
   * Queries the balance API endpoint
   * @param address - Wallet address
   */
  fetchBalance: async (address: string) => {
    const { accountType } = get();
    // Access network and currency from combined store if available
    let network = (get() as any).network || 'BNB';
    const selectedCurrency = (get() as any).selectedCurrency;
    let currency = (network === 'SOL' && selectedCurrency) ? selectedCurrency : network;

    if (address && (address.endsWith('.near') || address.endsWith('.testnet') || /^[0-9a-fA-F]{64}$/.test(address))) {
      currency = 'NEAR';
    } else if (address && /^(tz1|tz2|tz3|KT1)[a-zA-Z0-9]{33}$/.test(address)) {
      currency = 'XTZ';
    }

    // Skip API fetch for demo mode as it uses local state only
    if (!address || accountType === 'demo' || address.startsWith('0xDEMO')) {
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`/api/balance/${address}?currency=${currency}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch balance');
      }

      const data = await response.json();

      set({
        houseBalance: data.balance || 0,
        userTier: data.tier || 'free',
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance'
      });
    }
  },

  /**
   * Set house balance directly
   * Used by event listeners and after successful operations
   * @param balance - New balance value
   */
  setBalance: (balance: number) => {
    set({ houseBalance: balance });
  },

  /**
   * Update house balance by adding or subtracting an amount
   * Used for optimistic updates before API confirmation
   * @param amount - Amount to add or subtract
   * @param operation - 'add' to increase balance, 'subtract' to decrease
   */
  updateBalance: (amount: number, operation: 'add' | 'subtract') => {
    const { houseBalance, demoBalance, accountType } = get();

    if (accountType === 'demo') {
      const newDemoBalance = operation === 'add'
        ? demoBalance + amount
        : Math.max(0, demoBalance - amount);
      set({ demoBalance: newDemoBalance });
      return;
    }

    const newBalance = operation === 'add'
      ? houseBalance + amount
      : Math.max(0, houseBalance - amount);

    set({ houseBalance: newBalance });
  },

  /**
   * Toggle between real and demo accounts
   */
  toggleAccountType: () => {
    const { accountType } = get();
    const newType = accountType === 'real' ? 'demo' : 'real';
    set({ accountType: newType });
    if (typeof window !== 'undefined') {
      localStorage.setItem('bynomo_account_type', newType);
    }
  },

  /**
   * Process deposit funds operation
   * Called after deposit transaction completes to update database
   * @param address - User wallet address
   * @param amount - Deposit amount
   * @param txHash - Transaction hash for audit trail
   */
  depositFunds: async (address: string, amount: number, txHash: string) => {
    let network = (get() as any).network || 'BNB';
    const selectedCurrency = (get() as any).selectedCurrency;
    let currency = (network === 'SOL' && selectedCurrency) ? selectedCurrency : network;

    // Override network for NEAR addresses
    if (address.endsWith('.near') || address.endsWith('.testnet') || /^[0-9a-fA-F]{64}$/.test(address)) {
      currency = 'NEAR';
    }

    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/balance/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          amount,
          txHash,
          currency: currency
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process deposit');
      }

      const data = await response.json();

      set({
        houseBalance: data.newBalance,
        isLoading: false,
        error: null
      });

      // Secondary check after a delay to ensure eventual consistency
      setTimeout(() => get().fetchBalance(address), 1500);

      return data;
    } catch (error) {
      console.error('Error processing deposit:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process deposit'
      });
      throw error;
    }
  },

  /**
   * Process withdraw funds operation
   * Called after withdrawal transaction completes to update database
   * @param address - User wallet address
   * @param amount - Withdrawal amount
   */
  withdrawFunds: async (address: string, amount: number) => {
    const network = (get() as any).network || 'BNB';
    const selectedCurrency = (get() as any).selectedCurrency;
    const currency = (network === 'SOL' && selectedCurrency) ? selectedCurrency : network;

    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/balance/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          amount,
          currency: currency
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process withdrawal');
      }

      const data = await response.json();

      set({
        houseBalance: data.newBalance,
        isLoading: false,
        error: null
      });

      // Secondary check after a delay to ensure eventual consistency
      setTimeout(() => get().fetchBalance(address), 1500);

      return data;
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process withdrawal'
      });
      throw error;
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  }
});
