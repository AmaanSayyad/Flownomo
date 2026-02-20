/**
 * Solana Wallet Integration Module
 */

import { useWallet } from '@solana/wallet-adapter-react';
import { useOverflowStore } from '@/lib/store';
import { useEffect } from 'react';
import { logWalletError, logInfo } from '@/lib/logging/error-logger';

export interface WalletState {
    isConnected: boolean;
    address: string | null;
    walletName: string | null;
}

/**
 * Hook for managing Solana wallet connection
 */
export function useWalletConnection() {
    const { connected, publicKey, wallet, disconnect: solanaDisconnect } = useWallet();

    // Get store actions
    const setAddress = useOverflowStore(state => state.setAddress);
    const setIsConnected = useOverflowStore(state => state.setIsConnected);
    const setNetwork = useOverflowStore(state => state.setNetwork);
    const fetchBalance = useOverflowStore(state => state.fetchBalance);
    const refreshWalletBalance = useOverflowStore(state => state.refreshWalletBalance);

    const preferredNetwork = useOverflowStore(state => state.preferredNetwork);

    // Sync wallet state with store
    useEffect(() => {
        // Only update store if this is the preferred network or no preference is set
        if (publicKey && (preferredNetwork === 'SOL' || preferredNetwork === null)) {
            const address = publicKey.toBase58();
            setAddress(address);
            setIsConnected(true);
            setNetwork('SOL');

            // Fetch house and wallet balance when wallet connects
            fetchBalance(address).catch(console.error);
            refreshWalletBalance();

            // Persist session to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('solnomo_wallet_session', JSON.stringify({
                    address: address,
                    walletName: wallet?.adapter.name || null,
                    timestamp: Date.now()
                }));
            }
        } else if (!publicKey && preferredNetwork === 'SOL') {
            // Only clear if we were the active network
            setAddress(null);
            setIsConnected(false);

            // Clear localStorage session
            if (typeof window !== 'undefined') {
                localStorage.removeItem('solnomo_wallet_session');
            }
        }
    }, [publicKey, wallet?.adapter.name, setAddress, setIsConnected, fetchBalance, preferredNetwork]);

    const disconnect = async () => {
        try {
            await solanaDisconnect();
            console.log('Wallet disconnected');
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
        }
    };

    // Build wallet state
    const state: WalletState = {
        isConnected: connected,
        address: publicKey?.toBase58() || null,
        walletName: wallet?.adapter.name || null
    };

    return {
        disconnect,
        state
    };
}

/**
 * Restore wallet session from localStorage
 */
export async function restoreSolanaWalletSession(): Promise<boolean> {
    try {
        if (typeof window === 'undefined') return false;

        const sessionData = localStorage.getItem('solnomo_wallet_session');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            const sessionAge = Date.now() - session.timestamp;
            const maxAge = 24 * 60 * 60 * 1000;

            if (sessionAge < maxAge) {
                console.log('Found recent Solana wallet session');
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error restoring Solana wallet session:', error);
        return false;
    }
}
