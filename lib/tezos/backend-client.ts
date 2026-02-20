/**
 * Tezos Backend Client
 * Used for administrative operations like withdrawals signing with Treasury Private Key
 * Uses dynamic imports so the build does not require @taquito/* at bundle time.
 */

/**
 * Get the Tezos provider with Treasury signer
 */
export async function getTezosTreasuryClient() {
    const [{ TezosToolkit }, { InMemorySigner }] = await Promise.all([
        import('@taquito/taquito'),
        import('@taquito/signer'),
    ]);

    const rpcUrl = process.env.NEXT_PUBLIC_TEZOS_RPC_URL || 'https://rpc.tzkt.io/mainnet';
    const secretKey = process.env.TEZOS_TREASURY_SECRET_KEY;

    if (!secretKey) {
        throw new Error('TEZOS_TREASURY_SECRET_KEY is not configured');
    }

    const tezos = new TezosToolkit(rpcUrl);
    tezos.setSignerProvider(new InMemorySigner(secretKey));

    return tezos;
}

/**
 * Transfer XTZ from treasury to a user
 */
export async function transferXTZFromTreasury(
    toAddress: string,
    amountXTZ: number
): Promise<string> {
    try {
        const tezos = await getTezosTreasuryClient();

        // Convert XTZ to mutez (integer) to avoid float precision issues
        const amountMutez = Math.round(amountXTZ * 1_000_000);

        console.log(`Initiating Tezos withdrawal: ${amountXTZ} XTZ (${amountMutez} mutez) to ${toAddress}`);

        const op = await tezos.contract.transfer({
            to: toAddress,
            amount: amountMutez,
            mutez: true,
        });

        console.log(`Tezos withdrawal operation sent: ${op.hash}`);
        await op.confirmation(1);
        console.log(`Tezos withdrawal confirmed!`);

        return op.hash;
    } catch (error) {
        console.error('Failed to transfer XTZ from treasury:', error);
        throw error;
    }
}
