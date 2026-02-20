/**
 * Sui Network Configuration for dapp-kit
 * 
 * This module provides network configuration for @mysten/dapp-kit's SuiClientProvider.
 */

import { getFullnodeUrl } from '@mysten/sui/client';
import { createNetworkConfig } from '@mysten/dapp-kit';

const { networkConfig, useNetworkVariable } = createNetworkConfig({
  testnet: {
    url: getFullnodeUrl('testnet'),
  },
  mainnet: {
    url: getFullnodeUrl('mainnet'),
  },
  devnet: {
    url: getFullnodeUrl('devnet'),
  },
  localnet: {
    url: 'http://127.0.0.1:9000',
  },
});

/**
 * Get network configuration for the current environment
 * 
 * @returns {Object} Network configuration object for SuiClientProvider
 */
export function getNetworkConfig() {
  return networkConfig;
}

/**
 * Hook to get network-specific variables
 * Use this hook to access network-specific configuration values
 */
export { useNetworkVariable };
