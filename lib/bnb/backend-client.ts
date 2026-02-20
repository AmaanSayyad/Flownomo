/**
 * BNB Smart Chain (BSC) Backend Client
 * Used for administrative operations like withdrawals
 */

import { ethers } from 'ethers';
import { getBNBConfig } from './config';

/**
 * Get the treasury wallet for backend operations
 */
export function getTreasuryWallet(): ethers.Wallet {
    const config = getBNBConfig();
    const secretKey = process.env.BNB_TREASURY_SECRET_KEY;

    if (!secretKey) {
        throw new Error('BNB_TREASURY_SECRET_KEY is not configured');
    }

    const provider = new ethers.JsonRpcProvider(config.rpcEndpoint);
    return new ethers.Wallet(secretKey, provider);
}

/**
 * Transfer BNB from treasury to a user
 */
export async function transferBNBFromTreasury(
    toAddress: string,
    amountBNB: number
): Promise<string> {
    try {
        const wallet = getTreasuryWallet();
        const amountWei = ethers.parseEther(amountBNB.toString());

        const tx = await wallet.sendTransaction({
            to: toAddress,
            value: amountWei,
        });

        console.log(`Withdrawal transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log(`Withdrawal transaction confirmed: ${tx.hash}`);

        return tx.hash;
    } catch (error) {
        console.error('Failed to transfer BNB from treasury:', error);
        throw error;
    }
}
