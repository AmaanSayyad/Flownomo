/**
 * Flow transaction templates for Overflow game
 */

/**
 * Transaction to place a bet using house balance
 * @param amount - Bet amount in FLOW tokens (e.g., "1.0")
 * @param targetCellId - ID of the target cell (1-8)
 * @param multiplier - Payout multiplier (e.g., "2.0")
 * @param priceChange - Expected price change
 * @param direction - 0 for UP, 1 for DOWN
 * @returns Cadence transaction code
 */
export const placeBetTransaction = (
  amount: string,
  targetCellId: string,
  multiplier: string,
  priceChange: string,
  direction: number
) => {
  return `
import OverflowGame from 0xOverflowGame

transaction(amount: UFix64, targetCellId: UInt8, priceChange: Fix64, direction: UInt8, multiplier: UFix64) {
  let playerAddress: Address
  
  prepare(signer: auth(BorrowValue) &Account) {
    // Store player address
    self.playerAddress = signer.address
  }
  
  execute {
    // Create target cell
    let targetCell = OverflowGame.TargetCell(
      id: targetCellId,
      priceChange: priceChange,
      direction: direction == 0 ? OverflowGame.Direction.UP : OverflowGame.Direction.DOWN,
      timeframe: 30.0
    )
    
    // Place bet from house balance
    let betId = OverflowGame.placeBetFromHouseBalance(
      player: self.playerAddress,
      targetCell: targetCell,
      betAmount: amount,
      multiplier: multiplier
    )
    
    log("Bet placed successfully from house balance with ID: ".concat(betId.toString()))
  }
}
`;
};

/**
 * Transaction to settle a round
 * @param betId - The unique bet ID to settle
 * @returns Cadence transaction code
 */
export const settleRoundTransaction = (betId: string) => {
  return `
import OverflowGame from 0xOverflowGame

transaction(betId: UInt64) {
  let callerAddress: Address
  
  prepare(signer: auth(BorrowValue) &Account) {
    self.callerAddress = signer.address
  }
  
  execute {
    // Settle the round
    let result = OverflowGame.settleRound(betId: betId, caller: self.callerAddress)
    
    if result.won {
      log("Round won! Payout: ".concat(result.payout.toString()).concat(" FLOW"))
    } else {
      log("Round lost. Better luck next time!")
    }
    
    log("Actual price change: ".concat(result.actualPriceChange.toString()))
  }
}
`;
};

/**
 * Transaction to claim a pending payout (retry mechanism)
 * @param betId - The unique bet ID with pending payout
 * @returns Cadence transaction code
 */
export const claimPayoutTransaction = (betId: string) => {
  return `
import OverflowGame from 0xOverflowGame

transaction(betId: UInt64) {
  let callerAddress: Address
  
  prepare(signer: auth(BorrowValue) &Account) {
    self.callerAddress = signer.address
  }
  
  execute {
    // Claim the pending payout
    OverflowGame.claimPayout(betId: betId, caller: self.callerAddress)
    
    log("Payout claimed successfully!")
  }
}
`;
};

/**
 * Transaction to deposit FLOW tokens to Flownomo treasury
 * Sends FLOW directly from the user's wallet to the treasury address.
 * Treasury address is passed as an argument (from NEXT_PUBLIC_FLOW_TREASURY_ADDRESS).
 */
export const depositTransaction = () => {
  return `
import FlowToken from 0xFlowToken
import FungibleToken from 0xFungibleToken

transaction(amount: UFix64, treasury: Address) {
  let sentVault: @FlowToken.Vault

  prepare(signer: auth(BorrowValue) &Account) {
    let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow Flow Token vault reference")

    self.sentVault <- vaultRef.withdraw(amount: amount) as! @FlowToken.Vault
  }

  execute {
    let receiverRef = getAccount(treasury).capabilities
      .borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
      ?? panic("Could not borrow receiver reference from treasury account")
    receiverRef.deposit(from: <-self.sentVault)
  }
}
`;
};


/**
 * Transaction to withdraw FLOW tokens from house balance
 * @returns Cadence transaction code
 */
export const withdrawTransaction = () => {
  return `
import OverflowGame from 0xOverflowGame
import FlowToken from 0xFlowToken
import FungibleToken from 0xFungibleToken

transaction(amount: UFix64) {
  let receiverRef: &{FungibleToken.Receiver}
  
  prepare(signer: auth(BorrowValue) &Account) {
    self.receiverRef = signer.capabilities.borrow<&{FungibleToken.Receiver}>(
      /public/flowTokenReceiver
    ) ?? panic("Could not borrow reference to FlowToken receiver")
  }
  
  execute {
    let withdrawnVault <- OverflowGame.withdraw(amount: amount)
    self.receiverRef.deposit(from: <-withdrawnVault)
  }
}
`;
};
