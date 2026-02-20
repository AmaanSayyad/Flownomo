/**
 * Solana Network Configuration
 * 
 * This module provides centralized configuration for Solana blockchain integration.
 */

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

export interface SolanaConfig {
    network: WalletAdapterNetwork;
    rpcEndpoint: string;
    treasuryAddress: string;
}

/**
 * Get Solana configuration from environment variables
 * 
 * @throws {Error} If required environment variables are missing
 * @returns {SolanaConfig} The Solana configuration object
 */
export function getSolanaConfig(): SolanaConfig {
    const networkStr = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'testnet';
    let network: WalletAdapterNetwork;

    switch (networkStr) {
        case 'mainnet-beta':
            network = WalletAdapterNetwork.Mainnet;
            break;
        case 'devnet':
            network = WalletAdapterNetwork.Devnet;
            break;
        case 'testnet':
        default:
            network = WalletAdapterNetwork.Testnet;
            break;
    }

    const publicRpcs = [
        'https://solana-rpc.publicnode.com',
        'https://api.mainnet-beta.solana.com',
        'https://solana-mainnet.rpc.extrnode.com',
        'https://rpc.ankr.com/solana',
    ];

    const rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || publicRpcs[0];
    const treasuryAddress = process.env.NEXT_PUBLIC_SOL_TREASURY_ADDRESS;

    // Validate required environment variables
    if (!treasuryAddress) {
        throw new Error(
            'Missing required Solana environment variable: NEXT_PUBLIC_SOL_TREASURY_ADDRESS. ' +
            'Please check your .env file and ensure it is set.'
        );
    }

    return {
        network,
        rpcEndpoint,
        treasuryAddress,
    };
}

/**
 * Validate that all required environment variables are present
 */
export function validateSolanaConfig(): void {
    getSolanaConfig();
}
