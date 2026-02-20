import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupBitgetWallet } from "@near-wallet-selector/bitget-wallet";
import { NEAR_CONFIG, NEAR_CONTRACT_ID } from "./config";
import "@near-wallet-selector/modal-ui/styles.css";
import { JsonRpcProvider, parseNearAmount } from "near-api-js";
import { actionCreators } from "@near-js/transactions";

let selector: any = null;
let modal: any = null;

export const initNearSelector = async () => {
    if (selector) return { selector, modal };

    selector = await setupWalletSelector({
        network: "mainnet",
        modules: [
            setupMyNearWallet(),
            setupSender(), // Note: Sender wallet doesn't support Transfer actions, only FunctionCall
            setupHereWallet(),
            setupBitgetWallet()
        ],
    });

    // Don't pass contractId to setupModal - this ensures no contractId restrictions
    // If contractId is set, wallets like Sender create function-call access keys
    // which can ONLY call functions on that contract, not make Transfer actions
    modal = setupModal(selector, {});

    return { selector, modal };
};

export const connectNearWallet = async () => {
    const { modal } = await initNearSelector();
    modal.show();

    return new Promise((resolve) => {
        // Check current state first to avoid sync subscription issues
        const currentState = selector.store.getState();
        if (currentState.accounts.length > 0) {
            resolve(currentState.accounts[0].accountId);
            return;
        }

        let subscription: any;
        subscription = selector.store.observable.subscribe((state: any) => {
            if (state.accounts.length > 0) {
                if (subscription) {
                    subscription.unsubscribe();
                }
                resolve(state.accounts[0].accountId);
            }
        });
    });
};

export const getNearBalance = async (accountId: string) => {
    const provider = new JsonRpcProvider({ url: NEAR_CONFIG.nodeUrl });

    try {
        const account: any = await provider.query({
            request_type: "view_account",
            finality: "final",
            account_id: accountId,
        });
        // NEAR is 10^24 yoctoNEAR
        return parseFloat(account.amount) / 10 ** 24;
    } catch (error) {
        console.error("Error fetching NEAR balance:", error);
        return 0;
    }
};

export const depositNEAR = async (amount: string) => {
    const { selector, modal } = await initNearSelector();

    // Ensure we have a signed in account
    const state = selector.store.getState();
    const accountId = state.accounts[0]?.accountId;

    if (!accountId) {
        modal.show();
        throw new Error("Please connect your wallet first");
    }

    const wallet = await selector.wallet();
    
    // Check if using Sender wallet and warn user upfront
    const walletId = wallet.id;
    if (walletId === 'sender') {
        throw new Error("Sender wallet is not supported for deposits. Please use MyNearWallet, HereWallet, or Bitget Wallet instead.");
    }

    const amountInYocto = parseNearAmount(amount as `${number}`);

    if (!amountInYocto) throw new Error("Invalid NEAR amount");

    const treasuryAddress = process.env.NEXT_PUBLIC_NEAR_TREASURY_ADDRESS;
    if (!treasuryAddress) {
        throw new Error("NEAR treasury address not configured");
    }

    // Send transfer action to treasury account using actionCreators
    const result = await wallet.signAndSendTransaction({
        receiverId: treasuryAddress,
        actions: [actionCreators.transfer(BigInt(amountInYocto))],
    });

    if (!result) throw new Error("Transaction failed");

    // Extract transaction hash from various possible response formats
    // Different wallets return different structures
    let txHash: string | undefined;

    if (typeof result === 'string') {
        // Some wallets return hash directly as string
        txHash = result;
    } else if (typeof result === 'object') {
        // Try different possible paths for transaction hash
        txHash = (result as any).transaction?.hash ||
            (result as any).transaction_outcome?.id ||
            (result as any).hash ||
            (result as any).transactionHashes?.[0];
    }

    if (!txHash) {
        console.error("Could not extract transaction hash from result:", result);
        throw new Error("Transaction completed but hash could not be retrieved");
    }

    return txHash;
};
