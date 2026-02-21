// MockPriceOracle.cdc
// Mock oracle contract for testing
// Implements IPriceOracle interface for development and testing purposes

access(all) contract MockPriceOracle {
    
    // Events
    access(all) event PriceUpdated(price: UFix64, timestamp: UFix64, confidence: UFix64)
    access(all) event AdminUpdated(newAdmin: Address)
    
    // Storage paths
    access(all) let AdminStoragePath: StoragePath
    
    // Price data storage
    access(self) var currentPriceData: PriceData
    
    // Price freshness window (60 seconds)
    access(all) let FRESHNESS_WINDOW: UFix64
    
    // PriceData struct containing price, timestamp, and confidence
    access(all) struct PriceData {
        access(all) let price: UFix64
        access(all) let timestamp: UFix64
        access(all) let confidence: UFix64
        
        init(price: UFix64, timestamp: UFix64, confidence: UFix64) {
            self.price = price
            self.timestamp = timestamp
            self.confidence = confidence
        }
    }
    
    // Admin resource for controlling price updates
    access(all) resource Admin {
        
        // Update the current price (admin-controlled)
        access(all) fun updatePrice(price: UFix64, confidence: UFix64) {
            pre {
                price > 0.0: "Price must be greater than zero"
                confidence > 0.0 && confidence <= 100.0: "Confidence must be between 0 and 100"
            }
            
            let timestamp = getCurrentBlock().timestamp
            let newPriceData = PriceData(
                price: price,
                timestamp: timestamp,
                confidence: confidence
            )
            
            MockPriceOracle.currentPriceData = newPriceData
            
            emit PriceUpdated(price: price, timestamp: timestamp, confidence: confidence)
        }
    }
    
    // Get current BTC price in USD
    access(all) fun getCurrentPrice(): UFix64 {
        return self.currentPriceData.price
    }
    
    // Get price with timestamp validation
    access(all) fun getPriceWithTimestamp(): PriceData {
        return self.currentPriceData
    }
    
    // Validate price freshness (within 60 seconds)
    access(all) fun isPriceFresh(timestamp: UFix64): Bool {
        let currentTime = getCurrentBlock().timestamp
        let timeDifference = currentTime - timestamp
        return timeDifference <= self.FRESHNESS_WINDOW
    }
    
    // Check if the current stored price is fresh
    access(all) fun isCurrentPriceFresh(): Bool {
        return self.isPriceFresh(timestamp: self.currentPriceData.timestamp)
    }
    
    // Get fresh price data or panic if stale
    access(all) fun getFreshPrice(): PriceData {
        // Check freshness manually to avoid view context issues
        let currentTime = getCurrentBlock().timestamp
        let timeDifference = currentTime - self.currentPriceData.timestamp
        assert(timeDifference <= self.FRESHNESS_WINDOW, message: "Price data is stale (older than 60 seconds)")
        
        return self.currentPriceData
    }
    
    init() {
        // Set storage paths
        self.AdminStoragePath = /storage/MockPriceOracleAdmin
        
        // Set freshness window to 60 seconds
        self.FRESHNESS_WINDOW = 60.0
        
        // Initialize with a default BTC price (e.g., $50,000)
        // Using current block timestamp
        let initialTimestamp = getCurrentBlock().timestamp
        self.currentPriceData = PriceData(
            price: 50000.0,
            timestamp: initialTimestamp,
            confidence: 100.0
        )
        
        // Create and store Admin resource
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
        
        emit PriceUpdated(price: 50000.0, timestamp: initialTimestamp, confidence: 100.0)
    }
}
