import OverflowGame from 0xOverflowGame
import FlowToken from 0xFlowToken
import FungibleToken from 0xFungibleToken

/// Withdraw FLOW tokens from house balance to user's wallet
/// 
/// Task: 10.2 Implement withdrawal transaction flow
/// Requirements: 5.1, 5.2, 8.5, 10.3
///
/// @param amount: Amount of FLOW to withdraw from house balance
transaction(amount: UFix64) {
  let receiverRef: &{FungibleToken.Receiver}
  
  prepare(signer: auth(BorrowValue) &Account) {
    // Get reference to the signer's FlowToken receiver
    self.receiverRef = signer.capabilities.borrow<&{FungibleToken.Receiver}>(
      /public/flowTokenReceiver
    ) ?? panic("Could not borrow reference to FlowToken receiver")
  }
  
  execute {
    // Withdraw from house balance
    let withdrawnVault <- OverflowGame.withdraw(amount: amount)
    
    // Deposit to user's wallet
    self.receiverRef.deposit(from: <-withdrawnVault)
    
    log("Withdrew ".concat(amount.toString()).concat(" FLOW from house balance"))
  }
}
