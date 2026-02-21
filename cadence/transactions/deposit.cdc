import OverflowGame from 0xOverflowGame
import FlowToken from 0xFlowToken
import FungibleToken from 0xFungibleToken

/// Deposit FLOW tokens from user's wallet to house balance
/// 
/// Task: 9.2 Implement deposit transaction flow
/// Requirements: 1.1, 8.5, 10.1
///
/// @param amount: Amount of FLOW to deposit to house balance
transaction(amount: UFix64) {
  let paymentVault: @{FungibleToken.Vault}
  
  prepare(signer: auth(BorrowValue, Storage) &Account) {
    // Get reference to the signer's FlowToken Vault
    let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow reference to FlowToken Vault")
    
    // Withdraw tokens from the signer's vault
    self.paymentVault <- vaultRef.withdraw(amount: amount)
  }
  
  execute {
    // Deposit to house balance
    OverflowGame.deposit(vault: <-self.paymentVault)
    
    log("Deposited ".concat(amount.toString()).concat(" FLOW to house balance"))
  }
}
