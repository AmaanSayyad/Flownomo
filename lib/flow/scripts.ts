import * as fcl from "@onflow/fcl";

/**
 * Flow script templates for querying blockchain state
 */

/**
 * Script to get FLOW token balance for an address
 * @param address - The Flow address to query
 * @returns Cadence script code
 */
export const getBalanceScript = (address: string) => {
  return `
import FlowToken from 0xFlowToken
import FungibleToken from 0xFungibleToken

access(all) fun main(address: Address): UFix64 {
  let account = getAccount(address)
  let vaultRef = account.capabilities.get<&FlowToken.Vault>(/public/flowTokenBalance)
    .borrow()
    ?? panic("Could not borrow Balance reference")
  
  return vaultRef.balance
}
`;
};

/**
 * Get FLOW token balance for an address
 * @param address - The Flow address to query
 * @returns The balance as a number
 */
export const getFlowBalance = async (address: string): Promise<number> => {
  if (!address) return 0;
  try {
    const accessNode = fcl.config().get("accessNode.api");
    if (!accessNode) {
      // Ensure Flow is configured if not already
      const { configureFlow } = await import('./config');
      configureFlow();
    }

    const result = await fcl.query({
      cadence: getBalanceScript(address),
      args: (arg: any, t: any) => [arg(address, t.Address)]
    });
    return parseFloat(result);
  } catch (error) {
    console.error("Error fetching Flow balance:", error);
    return 0;
  }
};

/**
 * Script to get bet status information
 * @param betId - The unique bet ID to query
 * @returns Cadence script code
 */
export const getBetStatusScript = (betId: string) => {
  return `
import OverflowGame from 0xOverflowGame

access(all) fun main(betId: UInt64): OverflowGame.BetStatusInfo? {
  return OverflowGame.getBetStatus(betId: betId)
}
`;
};

/**
 * Script to get all available target cells with multipliers
 * @returns Cadence script code
 */
export const getTargetCellsScript = () => {
  return `
import OverflowGame from 0xOverflowGame

access(all) fun main(): [OverflowGame.TargetCellInfo] {
  return OverflowGame.getTargetCells()
}
`;
};

/**
 * Script to get active bet for a user
 * @param address - The player's address
 * @returns Cadence script code
 */
export const getUserActiveBetScript = (address: string) => {
  return `
import OverflowGame from 0xOverflowGame

access(all) fun main(player: Address): OverflowGame.BetStatusInfo? {
  return OverflowGame.getUserActiveBet(player: player)
}
`;
};

/**
 * Script to check if game is paused
 * @returns Cadence script code
 */
export const isGamePausedScript = () => {
  return `
import OverflowGame from 0xOverflowGame

access(all) fun main(): Bool {
  return OverflowGame.isGamePaused()
}
`;
};

/**
 * Script to get treasury balance
 * @returns Cadence script code
 */
export const getTreasuryBalanceScript = () => {
  return `
import OverflowGame from 0xOverflowGame

access(all) fun main(): UFix64 {
  return OverflowGame.getTreasuryBalance()
}
`;
};

/**
 * Script to get pending payout for a bet
 * @param betId - The unique bet ID to query
 * @returns Cadence script code
 */
export const getPendingPayoutScript = (betId: string) => {
  return `
import OverflowGame from 0xOverflowGame

access(all) fun main(betId: UInt64): UFix64? {
  return OverflowGame.getPendingPayout(betId: betId)
}
`;
};

/**
 * Script to get current BTC price from oracle
 * @returns Cadence script code
 */
export const getCurrentPriceScript = () => {
  return `
import MockPriceOracle from 0xMockPriceOracle

access(all) fun main(): UFix64 {
  let priceData = MockPriceOracle.getFreshPrice()
  return priceData.price
}
`;
};

/**
 * Script to get escrow vault balance
 * @returns Cadence script code
 */
export const getEscrowVaultBalanceScript = () => {
  return `
import FlowToken from 0xFlowToken
import OverflowGame from 0xOverflowGame

access(all) fun main(contractAddress: Address): UFix64 {
  let account = getAccount(contractAddress)
  let vaultRef = account.storage.borrow<&FlowToken.Vault>(
    from: /storage/OverflowGameEscrowVault
  ) ?? panic("Could not borrow reference to Escrow Vault")
  
  return vaultRef.balance
}
`;
};

/**
 * Script to get user balance from contract
 * Note: This queries the contract's internal balance tracking for a specific user
 * @returns Cadence script code
 */
export const getUserBalanceFromContractScript = () => {
  return `
import OverflowGame from 0xOverflowGame

access(all) fun main(userAddress: Address): UFix64 {
  return OverflowGame.getUserBalance(userAddress: userAddress)
}
`;
};
