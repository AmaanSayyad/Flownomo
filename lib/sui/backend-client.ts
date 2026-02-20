/**
 * Sui Backend Client
 * Used for administrative operations like withdrawals and treasury management.
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { getSuiConfig } from './config';

// Singleton Sui client instance
let suiClient: SuiClient | null = null;

/**
 * Get or create a Sui client instance
 */
export function getBackendSuiClient(): SuiClient {
    if (!suiClient) {
        const config = getSuiConfig();
        suiClient = new SuiClient({ url: config.rpcEndpoint });
    }
    return suiClient;
}

/**
 * Get the treasury keypair from environment variable
 */
export function getTreasuryKeypair(): Ed25519Keypair {
    const secretKey = process.env.SUI_TREASURY_SECRET_KEY;

    if (!secretKey) {
        throw new Error('SUI_TREASURY_SECRET_KEY is not configured');
    }

    try {
        const { secretKey: decodedSecretKey } = decodeSuiPrivateKey(secretKey);
        return Ed25519Keypair.fromSecretKey(decodedSecretKey);
    } catch (error) {
        console.error('Failed to parse Sui treasury secret key:', error);
        throw new Error('Invalid SUI_TREASURY_SECRET_KEY format');
    }
}

/**
 * Transfer USDC from treasury to a user address
 */
export async function transferUSDCFromTreasury(
    toAddress: string,
    amountUSDC: number
): Promise<string> {
    try {
        const config = getSuiConfig();
        const client = getBackendSuiClient();
        const keypair = getTreasuryKeypair();
        const treasuryAddress = keypair.toSuiAddress();

        const tx = new Transaction();
        const amountInSmallestUnit = Math.floor(amountUSDC * 1_000_000);

        // Get treasury's USDC coins
        const coins = await client.getCoins({
            owner: treasuryAddress,
            coinType: config.usdcType,
        });

        if (coins.data.length === 0) {
            throw new Error('Treasury has no USDC coins');
        }

        const totalBalance = coins.data.reduce((sum: number, c: any) => sum + parseInt(c.balance), 0);
        if (totalBalance < amountInSmallestUnit) {
            throw new Error('Treasury has insufficient USDC balance');
        }

        // Merge and split
        const coinIds = coins.data.map((c: any) => c.coinObjectId);
        const primaryCoin = tx.object(coinIds[0]);
        if (coinIds.length > 1) {
            tx.mergeCoins(primaryCoin, coinIds.slice(1).map((id: string) => tx.object(id)));
        }

        const [withdrawCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(amountInSmallestUnit)]);

        // Transfer to user
        tx.transferObjects([withdrawCoin], tx.pure.address(toAddress));

        // Execute the transaction
        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: {
                showEffects: true,
            },
        });

        if (result.effects?.status.status !== 'success') {
            throw new Error(`Withdrawal failed: ${result.effects?.status.error || 'Unknown error'}`);
        }

        console.log(`USDC Withdrawal successful: ${result.digest}`);
        return result.digest;
    } catch (error) {
        console.error('Failed to transfer USDC from treasury:', error);
        throw error;
    }
}
