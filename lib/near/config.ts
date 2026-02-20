// NEAR configuration for mainnet
export const NEAR_CONFIG = {
    networkId: "mainnet",
    nodeUrl: "https://rpc.mainnet.near.org",
    walletUrl: "https://wallet.near.org",
    helperUrl: "https://helper.mainnet.near.org",
    explorerUrl: "https://explorer.near.org",
    headers: {}
};

export const BINOMO_NEAR_TREASURY = process.env.NEXT_PUBLIC_NEAR_TREASURY_ADDRESS || "bynomo.near";
export const NEAR_CONTRACT_ID = process.env.NEXT_PUBLIC_NEAR_CONTRACT_ID || process.env.NEXT_PUBLIC_NEAR_TREASURY_ADDRESS || "bynomo.near";
