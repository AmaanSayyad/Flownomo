import { Account, KeyPair, JsonRpcProvider, KeyPairSigner } from "near-api-js";
import { NEAR_CONFIG } from "./config";

export const transferNEARFromTreasury = async (
    receiverId: string,
    amount: number
): Promise<string> => {
    const accountId = process.env.NEAR_TREASURY_ACCOUNT_ID;
    const privateKey = process.env.NEAR_TREASURY_PRIVATE_KEY;

    if (!accountId || !privateKey) {
        throw new Error("Missing NEAR treasury credentials in environment");
    }

    // Create provider
    const provider = new JsonRpcProvider({ url: NEAR_CONFIG.nodeUrl });

    // Create signer from private key
    const keyPair = KeyPair.fromString(privateKey as any);
    const signer = new KeyPairSigner(keyPair);

    // Create account instance
    const account = new Account(accountId, provider, signer);

    // Convert amount to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
    // Use BigInt math to avoid precision and scientific notation issues
    const NEAR_NOMINATION = BigInt("1000000000000000000000000"); // 10^24

    // Convert float amount to a large integer first to maintain precision
    const amountInYocto = (BigInt(Math.floor(amount * 1e8)) * NEAR_NOMINATION / BigInt(1e8)).toString();

    // Transfer NEAR tokens
    const result = await account.transfer({
        receiverId,
        amount: amountInYocto
    });

    return result.transaction.hash;
};
