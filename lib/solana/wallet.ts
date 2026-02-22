/**
 * Solana Wallet Integration Module (legacy / no-op for Flow-only Flownomo)
 * Store only supports FLOW; this hook no longer syncs Solana to avoid type errors.
 */

import { useWallet } from '@solana/wallet-adapter-react';

export interface WalletState {
    isConnected: boolean;
    address: string | null;
    walletName: string | null;
}

/**
 * Hook for Solana wallet connection state. No-op in Flow-only app—does not sync to store.
 */
export function useWalletConnection() {
    const { connected, publicKey, wallet, disconnect: solanaDisconnect } = useWallet();
    const address = publicKey?.toBase58() ?? null;

    const disconnect = async () => {
        try {
            await solanaDisconnect();
            console.log('Wallet disconnected');
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
        }
    };

    const state: WalletState = {
        isConnected: connected,
        address,
        walletName: wallet?.adapter.name ?? null
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
