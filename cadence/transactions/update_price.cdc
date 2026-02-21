import MockPriceOracle from "../contracts/MockPriceOracle.cdc"

transaction(price: UFix64, confidence: UFix64) {
    prepare(acct: auth(Storage) &Account) {
        let adminRef = acct.storage.borrow<&MockPriceOracle.Admin>(
            from: MockPriceOracle.AdminStoragePath
        ) ?? panic("Could not borrow admin reference")
        
        adminRef.updatePrice(price: price, confidence: confidence)
    }
}
