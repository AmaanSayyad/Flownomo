/**
 * Sui Network Configuration
 * 
 * This module provides centralized configuration for Sui blockchain integration.
 * It manages network settings, treasury address, and token types.
 */

export type SuiNetwork = 'testnet' | 'mainnet' | 'devnet' | 'localnet';

export interface SuiConfig {
  network: SuiNetwork;
  rpcEndpoint: string;
  treasuryAddress: string;
  treasuryPackageId: string;
  usdcType: string;
}

/**
 * Get Sui configuration from environment variables
 * 
 * @throws {Error} If required environment variables are missing
 * @returns {SuiConfig} The Sui configuration object
 */
export function getSuiConfig(): SuiConfig {
  const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || 'mainnet') as SuiNetwork;
  const rpcEndpoint = process.env.NEXT_PUBLIC_SUI_RPC_ENDPOINT || 'https://fullnode.mainnet.sui.io:443';
  const treasuryAddress = process.env.NEXT_PUBLIC_SUI_TREASURY_ADDRESS;
  const treasuryPackageId = process.env.NEXT_PUBLIC_SUI_TREASURY_PACKAGE_ID || treasuryAddress;
  const usdcType = process.env.NEXT_PUBLIC_USDC_TYPE || '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';

  // Validate required environment variables
  const missingVars: string[] = [];

  if (!rpcEndpoint && !process.env.NEXT_PUBLIC_SUI_RPC_ENDPOINT) missingVars.push('NEXT_PUBLIC_SUI_RPC_ENDPOINT');
  if (!treasuryAddress) missingVars.push('NEXT_PUBLIC_SUI_TREASURY_ADDRESS');
  if (!usdcType && !process.env.NEXT_PUBLIC_USDC_TYPE) missingVars.push('NEXT_PUBLIC_USDC_TYPE');

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Sui environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  return {
    network,
    rpcEndpoint: rpcEndpoint!,
    treasuryAddress: treasuryAddress!,
    treasuryPackageId: treasuryPackageId!,
    usdcType: usdcType!,
  };
}

/**
 * Validate that all required environment variables are present
 * Call this during application startup to fail fast if configuration is invalid
 * 
 * @throws {Error} If required environment variables are missing
 */
export function validateSuiConfig(): void {
  getSuiConfig();
}
