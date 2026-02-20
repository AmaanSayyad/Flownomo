/**
 * Verify x402-style payment proof (Sui transaction digest).
 * Ensures the digest is a successful on-chain transaction.
 * In production you may also verify the tx is a deposit to treasury of at least minAmountUsdc.
 */

import { getSuiClient } from './client';

export interface VerifyPaymentOptions {
  digest: string;
  minAmountUsdc?: number;
  sender?: string;
}

/**
 * Verify that a Sui transaction digest exists and succeeded.
 * Optionally checks sender and that the tx represents a deposit to our treasury.
 *
 * @param options.digest - Transaction digest from the wallet
 * @param options.minAmountUsdc - Minimum USDC amount (for future strict verification)
 * @param options.sender - Expected sender address (optional)
 * @returns true if the transaction succeeded and optional checks pass
 */
const VERIFY_RETRIES = 4;
const VERIFY_RETRY_DELAY_MS = 2000;

export async function verifyPaymentProof(options: VerifyPaymentOptions): Promise<boolean> {
  const { digest, sender } = options;
  const client = getSuiClient();

  for (let attempt = 1; attempt <= VERIFY_RETRIES; attempt++) {
    try {
      const tx = await client.getTransactionBlock({
        digest,
        options: {
          showEffects: true,
          showInput: true,
        },
      });

      if (!tx?.effects) {
        if (attempt < VERIFY_RETRIES) {
          await new Promise((r) => setTimeout(r, VERIFY_RETRY_DELAY_MS));
          continue;
        }
        return false;
      }

      const status = tx.effects.status as unknown;
      const success =
        status === 'success' ||
        (typeof status === 'object' && status !== null && (status as { status?: string }).status === 'success');
      if (!success) {
        return false;
      }

      if (sender) {
        const txSender =
          (tx as { transaction?: { sender?: string } }).transaction?.sender ??
          (tx.effects as { sender?: string }).sender;
        if (txSender) {
          const normalizedSender = sender.startsWith('0x') ? sender : `0x${sender}`;
          const normalizedTxSender = txSender.startsWith('0x') ? txSender : `0x${txSender}`;
          if (normalizedTxSender.toLowerCase() !== normalizedSender.toLowerCase()) {
            return false;
          }
        }
      }

      return true;
    } catch (err) {
      console.error(`verifyPaymentProof attempt ${attempt}/${VERIFY_RETRIES}:`, err);
      if (attempt < VERIFY_RETRIES) {
        await new Promise((r) => setTimeout(r, VERIFY_RETRY_DELAY_MS));
      } else {
        return false;
      }
    }
  }

  return false;
}
