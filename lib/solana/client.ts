/**
 * Solana SDK Integration Module
 */

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getSolanaConfig } from './config';
import { logTransactionError, logInfo } from '@/lib/logging/error-logger';

// Singleton Connection instance
let connection: Connection | null = null;

/**
 * Get or create a Solana connection instance
 */
export function getSolanaConnection(): Connection {
    if (!connection) {
        const config = getSolanaConfig();
        connection = new Connection(config.rpcEndpoint, 'confirmed');
    }
    return connection;
}

/**
 * Build a deposit transaction
 * Creates a transaction that transfers SOL to the treasury wallet
 */
export async function buildDepositTransaction(
    amount: number,
    userAddress: string
): Promise<Transaction> {
    const config = getSolanaConfig();
    const connection = getSolanaConnection();

    const userPublicKey = new PublicKey(userAddress);
    const treasuryPublicKey = new PublicKey(config.treasuryAddress);

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: treasuryPublicKey,
            lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
    );

    // Retry logic for blockhash fetching
    let blockhash: string = '';
    const publicRpcs = [
        config.rpcEndpoint,
        'https://solana-rpc.publicnode.com',
        'https://api.mainnet-beta.solana.com',
        'https://rpc.ankr.com/solana'
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    for (const rpc of publicRpcs) {
        try {
            const conn = new Connection(rpc, 'confirmed');
            const result = await conn.getLatestBlockhash();
            blockhash = result.blockhash;
            if (blockhash) break;
        } catch (err) {
            console.warn(`Failed to get blockhash from ${rpc}, trying next...`);
        }
    }

    if (!blockhash) {
        throw new Error('All Solana RPC regions failed to provide a blockhash. Please try again in a moment.');
    }

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    return transaction;
}

/**
 * Build a token deposit transaction
 */
export async function buildTokenDepositTransaction(
    amount: number,
    userAddress: string,
    mintAddress: string
): Promise<Transaction> {
    const {
        getAssociatedTokenAddress,
        createTransferInstruction,
        getMint
    } = await import('@solana/spl-token');

    const config = getSolanaConfig();
    const connection = getSolanaConnection();

    const userPublicKey = new PublicKey(userAddress);
    const treasuryPublicKey = new PublicKey(config.treasuryAddress);
    const mintPublicKey = new PublicKey(mintAddress);

    // Get mint info for decimals
    const mintInfo = await getMint(connection, mintPublicKey);
    const decimals = mintInfo.decimals;

    // Get ATAs
    const userTokenAccount = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);
    const treasuryTokenAccount = await getAssociatedTokenAddress(mintPublicKey, treasuryPublicKey);

    const transaction = new Transaction().add(
        createTransferInstruction(
            userTokenAccount,
            treasuryTokenAccount,
            userPublicKey,
            Math.floor(amount * Math.pow(10, decimals))
        )
    );

    // Add blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    return transaction;
}

/**
 * Get SOL balance for a given address with robust RPC fallback
 */
export async function getSOLBalance(address: string): Promise<number> {
    if (!address) return 0;

    // Trim address to avoid whitespace issues
    const cleanAddress = address.trim();
    const config = getSolanaConfig();

    // Comprehensive list of reliable public providers
    const publicRpcs = [
        config.rpcEndpoint,
        'https://solana-rpc.publicnode.com',
        'https://rpc.ankr.com/solana',
        'https://api.mainnet-beta.solana.com',
        'https://solana-mainnet.rpc.extrnode.com',
        'https://solana.api.onfinality.io/public',
        'https://mainnet.helius-rpc.com/?api-key=dummy-key'
    ].filter((value, index, self) => value && self.indexOf(value) === index);

    for (const rpc of publicRpcs) {
        try {
            // Validation
            const publicKey = new PublicKey(cleanAddress);
            if (!PublicKey.isOnCurve(publicKey.toBytes())) {
                console.error(`Invalid SOL address: ${cleanAddress}`);
                return 0;
            }

            const conn = new Connection(rpc, {
                commitment: 'confirmed',
                disableRetryOnRateLimit: true,
                // Increase internal timeout
                confirmTransactionInitialTimeout: 10000
            });

            const balance = await conn.getBalance(publicKey);
            return balance / LAMPORTS_PER_SOL;
        } catch (error: any) {
            const errorMsg = error?.message || 'Connection Error';
            console.warn(`Solana RPC Fail: ${rpc} | Error: ${errorMsg}`);

            if (rpc === publicRpcs[publicRpcs.length - 1]) {
                // Final fetch-based attempt with correct parameters
                try {
                    console.log('Attempting final direct fetch bakiye sorgusu...');
                    const response = await fetch(publicRpcs[0], {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            id: 1,
                            method: 'getBalance',
                            params: [cleanAddress, { commitment: 'confirmed' }]
                        })
                    });
                    const data = await response.json();

                    if (data?.result?.value !== undefined) {
                        return data.result.value / LAMPORTS_PER_SOL;
                    } else if (data?.error) {
                        console.error('RPC Error Response:', data.error);
                    }
                } catch (fetchErr) {
                    console.error('All SOL balance retrieval methods failed completely.');
                }
                return 0;
            }
            continue;
        }
    }
    return 0;
}

/**
 * Get SPL token balance for a given address and mint
 */
export async function getTokenBalance(address: string, mintAddress: string): Promise<number> {
    if (!address || !mintAddress) return 0;

    try {
        const connection = getSolanaConnection();
        const owner = new PublicKey(address);
        const mint = new PublicKey(mintAddress);

        const response = await connection.getParsedTokenAccountsByOwner(owner, {
            mint: mint,
        });

        if (response.value.length === 0) return 0;

        // Sum up balances if multiple accounts exist (unlikely for most users)
        let totalBalance = 0;
        for (const account of response.value) {
            const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
            totalBalance += amount || 0;
        }

        return totalBalance;
    } catch (error) {
        console.error(`Error fetching token balance for ${mintAddress}:`, error);
        return 0;
    }
}

/**
 * Get treasury balance
 */
export async function getTreasuryBalance(): Promise<number> {
    const config = getSolanaConfig();
    return getSOLBalance(config.treasuryAddress);
}

/**
 * Handle transaction errors
 */
export function handleTransactionError(error: any): Error {
    const errorMessage = error?.message?.toLowerCase() || '';

    if (
        errorMessage.includes('rejected') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('cancelled') ||
        error?.code === 4001
    ) {
        return new Error('Transaction was cancelled by user.');
    }

    if (errorMessage.includes('insufficient funds') || errorMessage.includes('0x1')) {
        return new Error('Insufficient SOL balance for this transaction.');
    }

    if (error instanceof Error) {
        return new Error(`Transaction failed: ${error.message}`);
    }

    return new Error('Transaction failed. Please try again.');
}
