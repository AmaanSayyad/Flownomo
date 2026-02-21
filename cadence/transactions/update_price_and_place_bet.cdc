import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import OverflowGame from "../contracts/OverflowGame.cdc"
import MockPriceOracle from "../contracts/MockPriceOracle.cdc"

transaction(
    price: UFix64,
    confidence: UFix64,
    amount: UFix64,
    targetCellId: UInt8,
    priceChange: Fix64,
    direction: UInt8,
    timeframe: UFix64,
    multiplier: UFix64
) {
    let paymentVault: @{FungibleToken.Vault}
    let playerAddress: Address
    
    prepare(acct: auth(Storage) &Account) {
        // Update the oracle price first
        let adminRef = acct.storage.borrow<&MockPriceOracle.Admin>(
            from: MockPriceOracle.AdminStoragePath
        ) ?? panic("Could not borrow admin reference")
        
        adminRef.updatePrice(price: price, confidence: confidence)
        
        // Store the player's address
        self.playerAddress = acct.address
        
        // Get reference to the signer's FlowToken Vault
        let vaultRef = acct.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow reference to FlowToken Vault")
        
        // Withdraw tokens from the signer's vault
        self.paymentVault <- vaultRef.withdraw(amount: amount)
    }
    
    execute {
        // Create target cell
        let targetCell = OverflowGame.TargetCell(
            id: targetCellId,
            priceChange: priceChange,
            direction: direction == 0 ? OverflowGame.Direction.UP : OverflowGame.Direction.DOWN,
            timeframe: timeframe
        )
        
        // Place bet
        let betId = OverflowGame.placeBet(
            payment: <-self.paymentVault,
            targetCell: targetCell,
            multiplier: multiplier,
            player: self.playerAddress
        )
        
        log("Bet placed successfully with ID: ".concat(betId.toString()))
    }
}
