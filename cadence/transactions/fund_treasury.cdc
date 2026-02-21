import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import OverflowGame from "../contracts/OverflowGame.cdc"

transaction(amount: UFix64) {
    
    prepare(acct: auth(Storage, Contracts) &Account) {
        // Get reference to the signer's FlowToken Vault
        let vaultRef = acct.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow reference to FlowToken Vault")
        
        // Withdraw tokens from the signer's vault
        let paymentVault <- vaultRef.withdraw(amount: amount)
        
        // Get reference to treasury from the contract account
        let treasuryRef = acct.storage.borrow<&OverflowGame.Treasury>(
            from: OverflowGame.TreasuryStoragePath
        ) ?? panic("Could not borrow reference to Treasury")
        
        // Deposit to treasury (just the amount, vault is destroyed)
        treasuryRef.deposit(amount: amount)
        
        // Destroy the vault since we're just tracking balance
        destroy paymentVault
        
        log("Treasury funded with: ".concat(amount.toString()))
    }
}
