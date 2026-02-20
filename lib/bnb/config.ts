/**
 * BNB Smart Chain (BSC) Network Configuration
 */

export interface BNBConfig {
    network: string;
    rpcEndpoint: string;
    chainId: number;
    treasuryAddress: string;
}

/**
 * Get BNB configuration from environment variables
 */
export function getBNBConfig(): BNBConfig {
    const network = process.env.NEXT_PUBLIC_BNB_NETWORK || 'testnet';
    const rpcEndpoint = process.env.NEXT_PUBLIC_BNB_RPC_ENDPOINT || 'https://bsc-testnet.publicnode.com';
    const chainId = network === 'mainnet' ? 56 : 97;
    const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '';

    if (!treasuryAddress) {
        console.warn('Missing NEXT_PUBLIC_TREASURY_ADDRESS. Please set it in your .env file.');
    }

    return {
        network,
        rpcEndpoint,
        chainId,
        treasuryAddress,
    };
}
