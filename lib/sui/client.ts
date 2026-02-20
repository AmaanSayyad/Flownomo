/**
 * Sui SDK Integration Module
 * 
 * This module provides functions for interacting with the Sui blockchain,
 * including client initialization, transaction building, and execution.
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { getSuiConfig } from './config';
import { logTransactionError, logInfo } from '@/lib/logging/error-logger';

// Singleton Sui client instance
let suiClient: SuiClient | null = null;

/**
 * Get or create a Sui client instance
 */
export function getSuiClient(): SuiClient {
  if (!suiClient) {
    const config = getSuiConfig();
    suiClient = new SuiClient({ url: config.rpcEndpoint });
  }
  return suiClient;
}

/**
 * Build a deposit transaction
 * Simple transfer of USDC to the treasury address
 */
export async function buildDepositTransaction(
  amount: number,
  userAddress: string
): Promise<Transaction> {
  const config = getSuiConfig();
  const client = getSuiClient();
  const tx = new Transaction();

  // Convert amount to smallest unit (USDC has 6 decimals)
  const amountInSmallestUnit = Math.floor(amount * 1_000_000);

  // Get user's USDC coins
  const coins = await client.getCoins({
    owner: userAddress,
    coinType: config.usdcType,
  });

  if (coins.data.length === 0) {
    throw new Error('No USDC coins found in wallet');
  }

  // Calculate total balance
  const totalBalance = coins.data.reduce((sum: number, coin: any) => sum + parseInt(coin.balance), 0);

  if (totalBalance < amountInSmallestUnit) {
    throw new Error(`Insufficient USDC balance. Have: ${totalBalance / 1_000_000}, Need: ${amount}`);
  }

  // Split the required amount from the primary coin or merge if needed
  let primaryCoin;
  if (coins.data.length === 1) {
    primaryCoin = tx.object(coins.data[0].coinObjectId);
  } else {
    // Merge all coins into the first one
    const coinIds = coins.data.map((c: any) => c.coinObjectId);
    const primaryCoinId = coinIds[0];
    const otherCoinIds = coinIds.slice(1);

    primaryCoin = tx.object(primaryCoinId);
    tx.mergeCoins(primaryCoin, otherCoinIds.map((id: string) => tx.object(id)));
  }

  const [payCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(amountInSmallestUnit)]);

  // Transfer to treasury address
  tx.transferObjects([payCoin], tx.pure.address(config.treasuryAddress));

  tx.setSender(userAddress);

  return tx;
}

/**
 * Execute a transaction (Placeholder for Privy integration)
 * Note: Actual execution is usually done via useSignAndExecuteTransaction hook or Privy sdk
 */
export async function executeTransaction(
  tx: Transaction,
  signAndExecuteTransaction: any
): Promise<any> {
  try {
    const result = await signAndExecuteTransaction(
      {
        transaction: tx,
      },
      {
        onSuccess: (result: any) => {
          console.log('Transaction executed successfully:', result.digest);
        },
        onError: (error: any) => {
          console.error('Transaction execution failed:', error);
          throw error;
        },
      }
    );

    return result;
  } catch (error) {
    console.error('Failed to execute transaction:', error);
    throw error;
  }
}

/**
 * Get USDC balance for a given address
 */
export async function getUSDCBalance(address: string): Promise<number> {
  if (!address) return 0;

  const client = getSuiClient();
  const config = getSuiConfig();

  try {
    const balance = await client.getBalance({
      owner: address,
      coinType: config.usdcType,
    });

    return parseInt(balance.totalBalance) / 1_000_000;
  } catch (error) {
    console.warn(`Failed to get Sui USDC balance for ${address}:`, error);
    return 0;
  }
}

/**
 * Get treasury balance
 */
export async function getTreasuryBalance(): Promise<number> {
  const config = getSuiConfig();
  return getUSDCBalance(config.treasuryAddress);
}
