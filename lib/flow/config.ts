import * as fcl from "@onflow/fcl";

export type FlowNetwork = 'testnet' | 'emulator' | 'mainnet';

interface NetworkConfig {
  accessNode: string;
  discoveryWallet: string;
  contractAddress: string;
}

const getNetworkConfig = (): NetworkConfig => {
  return {
    accessNode: process.env.NEXT_PUBLIC_TESTNET_ACCESS_NODE || "https://rest-testnet.onflow.org",
    discoveryWallet: process.env.NEXT_PUBLIC_TESTNET_DISCOVERY_WALLET || "https://fcl-discovery.onflow.org/testnet/authn",
    contractAddress: process.env.NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS || ""
  };
};

export const configureFlow = () => {
  const config = getNetworkConfig();

  // Testnet Flow contract addresses
  const flowTokenAddress = '0x7e60df042a9c0868';
  const fungibleTokenAddress = '0x9a0766d93b6608b7';

  fcl.config()
    .put("app.detail.title", process.env.NEXT_PUBLIC_APP_NAME || "Overflow")
    .put("app.detail.icon", "https://placekitten.com/g/200/200")
    .put("accessNode.api", config.accessNode)
    .put("discovery.wallet", config.discoveryWallet)
    .put("walletconnect.projectId", process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "")
    .put("0xOverflowGame", config.contractAddress)
    .put("0xMockPriceOracle", config.contractAddress)
    .put("0xFlowToken", flowTokenAddress)
    .put("0xFungibleToken", fungibleTokenAddress);

  console.log(`Flow configured for testnet network`);
  console.log(`Access Node: ${config.accessNode}`);
  console.log(`Contract Address: ${config.contractAddress}`);
  console.log(`FlowToken: ${flowTokenAddress}`);
  console.log(`FungibleToken: ${fungibleTokenAddress}`);
};

export const getCurrentNetwork = (): FlowNetwork => {
  return 'testnet';
};

