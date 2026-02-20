/**
 * Sui Wallet Integration Module
 * 
 * This module provides wallet connection functionality using @mysten/dapp-kit.
 * It manages wallet state and provides hooks for connecting/disconnecting wallets.
 */

import { useConnectWallet, useCurrentWallet, useCurrentAccount, useDisconnectWallet, useWallets } from '@mysten/dapp-kit';
import { useOverflowStore } from '@/lib/store';
import { useEffect } from 'react';
import { logWalletError, logInfo } from '@/lib/logging/error-logger';

/**
 * Wallet state interface
 */
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  walletName: string | null;
}

/**
 * Hook for managing Sui wallet connection
 * 
 * This hook provides wallet connection functionality using @mysten/dapp-kit hooks.
 * It automatically syncs wallet state with the Zustand store.
 * 
 * @returns {Object} Wallet connection methods and state
 * @returns {Function} connect - Function to initiate wallet connection
 * @returns {Function} disconnect - Function to disconnect wallet
 * @returns {WalletState} state - Current wallet state
 */
export function useWalletConnection() {
  const { mutate: connectWallet } = useConnectWallet();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const currentWallet = useCurrentWallet();
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();

  // Get store actions
  const setAddress = useOverflowStore(state => state.setAddress);
  const setIsConnected = useOverflowStore(state => state.setIsConnected);
  const fetchBalance = useOverflowStore(state => state.fetchBalance);

  // Sync wallet state with store
  useEffect(() => {
    if (currentAccount?.address) {
      setAddress(currentAccount.address);
      setIsConnected(true);

      // Fetch house balance when wallet connects
      fetchBalance(currentAccount.address).catch(console.error);

      // Persist session to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('overflow_sui_wallet_session', JSON.stringify({
          address: currentAccount.address,
          walletName: currentWallet.currentWallet?.name || null,
          timestamp: Date.now()
        }));
      }
    } else {
      setAddress(null);
      setIsConnected(false);

      // Clear localStorage session
      if (typeof window !== 'undefined') {
        localStorage.removeItem('overflow_sui_wallet_session');
      }
    }
  }, [currentAccount?.address, currentWallet.currentWallet?.name, setAddress, setIsConnected, fetchBalance]);

  /**
   * Connect to a Sui wallet
   */
  const connect = async () => {
    try {
      // Pick a wallet: either the current one, the first available one, or fail
      const walletToConnect = currentWallet.currentWallet || wallets[0];

      if (!walletToConnect) {
        throw new Error('No Sui wallet found. Please install a Sui wallet extension.');
      }

      connectWallet(
        { wallet: walletToConnect },
        {
          onSuccess: () => {
            console.log('Wallet connected successfully:', walletToConnect.name);
            logInfo('wallet', 'connect_success', { walletName: walletToConnect.name });
          },
          onError: (error: any) => {
            console.error('Wallet connection failed:', error);
            logWalletError('connect_failed', error, { walletName: walletToConnect.name });
            throw handleWalletError(error);
          }
        }
      );
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      logWalletError('connect_exception', error, {});
      throw handleWalletError(error);
    }
  };

  /**
   * Disconnect the current wallet
   */
  const disconnect = () => {
    try {
      disconnectWallet();
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  };

  // Build wallet state
  const state: WalletState = {
    isConnected: currentWallet.isConnected,
    address: currentAccount?.address || null,
    walletName: currentWallet.currentWallet?.name || null
  };

  return {
    connect,
    disconnect,
    state
  };
}

/**
 * Restore wallet session from localStorage
 * Should be called on app initialization
 * 
 * This function checks if there's a recent wallet session in localStorage
 * and attempts to restore it. The actual connection is handled by dapp-kit's
 * auto-connect feature.
 * 
 * @returns {Promise<boolean>} True if a session was found and is recent
 */
export async function restoreSuiWalletSession(): Promise<boolean> {
  try {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return false;
    }

    // Check localStorage for previous session
    const sessionData = localStorage.getItem('overflow_sui_wallet_session');

    if (sessionData) {
      const session = JSON.parse(sessionData);

      // Check if session is recent (within 24 hours)
      const sessionAge = Date.now() - session.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge < maxAge) {
        console.log('Found recent Sui wallet session');
        return true;
      } else {
        // Session expired, clear it
        localStorage.removeItem('overflow_sui_wallet_session');
        console.log('Sui wallet session expired');
      }
    }

    return false;
  } catch (error) {
    console.error('Error restoring Sui wallet session:', error);
    logWalletError('session_restore_failed', error, {});
    // Clear invalid session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('overflow_sui_wallet_session');
    }
    return false;
  }
}

/**
 * Handle wallet errors and convert to user-friendly messages
 * 
 * @param {any} error - The error from wallet connection
 * @returns {Error} A new error with user-friendly message
 */
function handleWalletError(error: any): Error {
  // User rejection
  if (
    error?.message?.toLowerCase().includes('rejected') ||
    error?.message?.toLowerCase().includes('denied') ||
    error?.message?.toLowerCase().includes('cancelled') ||
    error?.code === 4001 || // Standard rejection code
    error?.code === 'USER_REJECTED'
  ) {
    return new Error('Connection rejected by user. Please try again.');
  }

  // Wallet not found
  if (
    error?.message?.toLowerCase().includes('not found') ||
    error?.message?.toLowerCase().includes('not installed') ||
    error?.message?.toLowerCase().includes('no wallet')
  ) {
    return new Error('Sui wallet not found. Please install a Sui wallet extension (Sui Wallet, Suiet, or Ethos).');
  }

  // Network issues
  if (
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('timeout') ||
    error?.message?.toLowerCase().includes('connection') ||
    error?.code === 'NETWORK_ERROR'
  ) {
    return new Error('Network connection issue. Please check your internet connection and try again.');
  }

  // Generic error
  if (error instanceof Error) {
    return new Error(`Failed to connect wallet: ${error.message}`);
  }

  return new Error('Failed to connect wallet. Please try again.');
}
