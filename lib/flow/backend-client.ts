/**
 * Flow Backend Client
 * Server-side treasury operations for Flownomo
 * Handles FLOW token transfers from treasury to users via the Flow Access Node REST API
 */

import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import { SHA3 } from 'sha3';
import elliptic from 'elliptic';

const ACCESS_NODE_URL =
    process.env.NEXT_PUBLIC_TESTNET_ACCESS_NODE || 'https://access-testnet.onflow.org';

/**
 * Configure FCL for server-side / testnet use.
 * Call this before any server-side FCL operation.
 */
function configureServerFCL() {
    fcl.config({
        'accessNode.api': ACCESS_NODE_URL,
        'flow.network': process.env.FLOW_NETWORK || 'testnet',
    });
}

/**
 * Transfer FLOW tokens from the treasury wallet to a recipient.
 *
 * NOTE: Full server-side signing requires a custom authorisation function using
 * the treasury private key. For now, this implementation constructs and submits
 * the Cadence transaction using FCL's `mutate` API. In production you should
 * replace the `authz` function with a proper server-side signer (e.g.,
 * @onflow/flow-js-testing's InMemoryECPrivateKey authorizer, or your own).
 *
 * @param recipientAddress - Flow address of the recipient (e.g., "0xabc123...")
 * @param amount           - Amount of FLOW to transfer (e.g., 1.5)
 * @returns Sealed transaction ID
 */
export async function transferFlowFromTreasury(
    recipientAddress: string,
    amount: number
): Promise<string> {
    const treasuryAddress = process.env.FLOW_TREASURY_ADDRESS;
    const treasuryPrivateKey = process.env.FLOW_TREASURY_PRIVATE_KEY;

    if (!treasuryAddress || !treasuryPrivateKey) {
        throw new Error(
            'Flow treasury not configured. ' +
            'Set FLOW_TREASURY_ADDRESS and FLOW_TREASURY_PRIVATE_KEY environment variables.'
        );
    }

    configureServerFCL();

    // Amount must be a UFix64 string with 8 decimal places
    const ufix64Amount = amount.toFixed(8);

    // Use correct contract addresses for testnet
    const flowTokenAddress = '0x7e60df042a9c0868';
    const fungibleTokenAddress = '0x9a0766d93b6608b7';

    const cadence = `
    import FlowToken from ${flowTokenAddress}
    import FungibleToken from ${fungibleTokenAddress}

    transaction(amount: UFix64, recipient: Address) {
      let sentVault: @{FungibleToken.Vault}

      prepare(signer: auth(BorrowValue) &Account) {
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
          from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow Token vault from treasury signer")

        self.sentVault <- vaultRef.withdraw(amount: amount)
      }

      execute {
        let receiverRef = getAccount(recipient).capabilities
          .borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
          ?? panic("Could not borrow flow token receiver for recipient")

        receiverRef.deposit(from: <-self.sentVault)
      }
    }
  `;

    // Build a server-side authorizer using elliptic for ECDSA P-256
    const EC = elliptic.ec;
    const ec = new EC('p256');
    const keyPair = ec.keyFromPrivate(Buffer.from(treasuryPrivateKey, 'hex'));

    /**
     * Build an FCL-compatible authorisation function.
     * FCL calls this to get an account + sign the transaction.
     */
    const serverAuthz = async (account: any) => {
        return {
            ...account,
            addr: fcl.withPrefix(treasuryAddress),
            keyId: 0,
            signingFunction: async ({ message }: { message: string }) => {
                // Hash the message with SHA3-256
                const sha3 = new SHA3(256);
                sha3.update(Buffer.from(message, 'hex'));
                const hashedMessage = sha3.digest();

                // Sign with the private key
                const signature = keyPair.sign(hashedMessage);
                const r = signature.r.toArrayLike(Buffer, 'be', 32);
                const s = signature.s.toArrayLike(Buffer, 'be', 32);
                const signatureBuffer = Buffer.concat([r, s]);

                return {
                    addr: fcl.withPrefix(treasuryAddress),
                    keyId: 0,
                    signature: signatureBuffer.toString('hex'),
                };
            },
        };
    };

    const txId = await fcl.mutate({
        cadence,
        args: () => [
            fcl.arg(ufix64Amount, t.UFix64),
            fcl.arg(recipientAddress, t.Address),
        ],
        proposer: serverAuthz as any,
        payer: serverAuthz as any,
        authorizations: [serverAuthz as any],
        limit: 999,
    });

    // Wait for the transaction to be sealed before returning
    const txStatus = await fcl.tx(txId).onceSealed();

    if (txStatus.errorMessage) {
        throw new Error(`Flow treasury transfer failed: ${txStatus.errorMessage}`);
    }

    return txId as string;
}
