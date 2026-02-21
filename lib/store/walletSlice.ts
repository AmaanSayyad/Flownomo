/**
 * Wallet state slice for Zustand store
 * Manages wallet connection status and address
 * 
 * Note: This slice is now primarily used for storing wallet state.
 * Actual wallet connection is handled by Flow FCL integration.
 */

import { StateCreator } from "zustand";

export interface WalletState {
  // State
  address: string | null;
  walletBalance: number;
  isConnected: boolean;
  isConnecting: boolean;
  network: 'FLOW' | null;
  preferredNetwork: 'FLOW' | null;
  selectedCurrency: string | null;
  error: string | null;
  isConnectModalOpen: boolean;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshWalletBalance: () => Promise<void>;
  clearError: () => void;
  setConnectModalOpen: (open: boolean) => void;

  // Setters for wallet integration
  setAddress: (address: string | null) => void;
  setIsConnected: (connected: boolean) => void;
  setNetwork: (network: 'FLOW' | null) => void;
  setPreferredNetwork: (network: 'FLOW' | null) => void;
  setSelectedCurrency: (currency: string | null) => void;
}

/**
 * Create wallet slice for Zustand store
 * Handles wallet state management for Flow integration
 */
export const createWalletSlice: StateCreator<WalletState> = (set, get) => ({
  // Initial state
  address: null,
  walletBalance: 0,
  isConnected: false,
  isConnecting: false,
  network: null,
  preferredNetwork: typeof window !== 'undefined' ? localStorage.getItem('flownomo_preferred_network') as 'FLOW' | null : null,
  selectedCurrency: null,
  error: null,
  isConnectModalOpen: false,

  /**
   * Connect wallet
   * Note: Actual connection is handled by Flow FCL
   */
  connect: async () => {
    set({ isConnectModalOpen: true });
  },

  /**
   * Disconnect wallet
   * Note: Actual disconnection is handled by Flow FCL
   */
  disconnect: () => {
    console.log('Disconnect called');
    const state = get() as any;
    const accountType = state.accountType;

    // Reset state
    set({
      address: null,
      walletBalance: 0,
      isConnected: false,
      isConnecting: false,
      network: null,
      selectedCurrency: null,
      error: null
    } as any);

    // Only clear profile data if we are NOT in demo mode AND don't have an access code
    const currentAccessCode = state.accessCode;
    if (accountType !== 'demo' && !currentAccessCode) {
      set({
        // @ts-ignore - Profile slice fields
        username: null,
        // @ts-ignore - Profile slice fields
        accessCode: null
      } as any);
    }
  },

  /**
   * Refresh token balance for connected wallet
   */
  refreshWalletBalance: async () => {
    const { address, isConnected, network } = get();

    if (!isConnected || !address || network !== 'FLOW') {
      return;
    }

    try {
      const { getFlowBalance } = await import('@/lib/flow/scripts');
      const bal = await getFlowBalance(address);
      set({ walletBalance: bal });
    } catch (error) {
      console.error("Error refreshing wallet balance:", error);
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Set connect modal visibility
   */
  setConnectModalOpen: (open: boolean) => {
    set({ isConnectModalOpen: open });
  },

  /**
   * Set address (used by wallet integration)
   */
  setAddress: (address: string | null) => {
    set({ address });
  },

  /**
   * Set connected status (used by wallet integration)
   */
  setIsConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  /**
   * Set active network (FLOW only)
   */
  setNetwork: (network: 'FLOW' | null) => {
    set({ network });
  },

  /**
   * Set preferred network (FLOW only)
   */
  setPreferredNetwork: (network: 'FLOW' | null) => {
    set({ preferredNetwork: network });
    if (typeof window !== 'undefined') {
      if (network) {
        localStorage.setItem('flownomo_preferred_network', network);
      } else {
        localStorage.removeItem('flownomo_preferred_network');
      }
    }
  },

  /**
   * Set selected currency for the current network
   */
  setSelectedCurrency: (currency: string | null) => {
    set({ selectedCurrency: currency });
    // Trigger balance refresh when currency changes
    const { isConnected, address } = get();
    if (isConnected && address) {
      get().refreshWalletBalance();
    }
  }
});
