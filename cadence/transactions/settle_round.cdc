import OverflowGame from "../contracts/OverflowGame.cdc"

transaction(betId: UInt64) {
    prepare(acct: auth(Storage) &Account) {
        // No preparation needed
    }
    
    execute {
        let result = OverflowGame.settleRound(betId: betId)
        
        if result.won {
            log("Round won! Payout: ".concat(result.payout.toString()))
        } else {
            log("Round lost. Better luck next time!")
        }
        
        log("Actual price change: ".concat(result.actualPriceChange.toString()))
    }
}
