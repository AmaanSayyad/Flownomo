import OverflowGame from "../contracts/OverflowGame.cdc"
import MockPriceOracle from "../contracts/MockPriceOracle.cdc"

transaction(price: UFix64, confidence: UFix64, betId: UInt64) {
    let callerAddress: Address
    
    prepare(acct: auth(Storage) &Account) {
        self.callerAddress = acct.address
        
        // Update the oracle price first
        let adminRef = acct.storage.borrow<&MockPriceOracle.Admin>(
            from: MockPriceOracle.AdminStoragePath
        ) ?? panic("Could not borrow admin reference")
        
        adminRef.updatePrice(price: price, confidence: confidence)
    }
    
    execute {
        let result = OverflowGame.settleRound(betId: betId, caller: self.callerAddress)
        
        if result.won {
            log("Round won! Payout: ".concat(result.payout.toString()))
        } else {
            log("Round lost. Better luck next time!")
        }
        
        log("Actual price change: ".concat(result.actualPriceChange.toString()))
    }
}
