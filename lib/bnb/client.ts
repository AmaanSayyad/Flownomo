/**
 * BNB Smart Chain (BSC) SDK Integration Module
 */

import { ethers } from 'ethers';
import { getBNBConfig } from './config';

// Singleton Provider instance
let provider: ethers.JsonRpcProvider | null = null;

/**
 * Get or create a BNB provider instance
 */
export function getBNBProvider(): ethers.JsonRpcProvider {
    if (!provider) {
        const config = getBNBConfig();
        provider = new ethers.JsonRpcProvider(config.rpcEndpoint);
    }
    return provider;
}

/**
 * Get BNB balance for a given address
 */
export async function getBNBBalance(address: string): Promise<number> {
    const provider = getBNBProvider();

    try {
        const balance = await provider.getBalance(address);
        return parseFloat(ethers.formatEther(balance));
    } catch (error) {
        console.error('Failed to get BNB balance:', error);
        return 0;
    }
}

/**
 * Get treasury balance
 */
export async function getTreasuryBalance(): Promise<number> {
    const config = getBNBConfig();
    if (!config.treasuryAddress) return 0;
    return getBNBBalance(config.treasuryAddress);
}

/**
 * Handle transaction errors
 */
export function handleTransactionError(error: any): Error {
    const errorMessage = error?.message?.toLowerCase() || '';

    if (
        errorMessage.includes('user rejected') ||
        errorMessage.includes('action_rejected') ||
        errorMessage.includes('user_rejected')
    ) {
        return new Error('Transaction was cancelled by user.');
    }

    if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
        return new Error('Insufficient BNB balance for this transaction.');
    }

    if (error instanceof Error) {
        return new Error(`Transaction failed: ${error.message}`);
    }

    return new Error('Transaction failed. Please try again.');
}
