/**
 * BNB Wallet Integration Module (legacy / no-op for Flow-only Flownomo)
 * Store only supports FLOW; this hook no longer syncs BNB to avoid type errors.
 */

import { useAccount } from 'wagmi';

/**
 * Hook for BNB wallet connection state. No-op in Flow-only app—does not sync to store.
 */
export function useWalletConnection() {
    const { address, isConnected, connector } = useAccount();
    return {
        address: isConnected ? address : undefined,
        isConnected,
        walletName: connector?.name ?? null
    };
}
