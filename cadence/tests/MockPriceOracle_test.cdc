import Test
import "MockPriceOracle"

// Test suite for MockPriceOracle contract

access(all) fun setup() {
    let err = Test.deployContract(
        name: "MockPriceOracle",
        path: "../contracts/MockPriceOracle.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
}

// Test 1: Contract initialization
access(all) fun testInitialization() {
    let priceData = MockPriceOracle.getPriceWithTimestamp()
    
    // Check initial price is set to 50000.0
    Test.assertEqual(50000.0, priceData.price)
    
    // Check confidence is 100%
    Test.assertEqual(100.0, priceData.confidence)
    
    // Check timestamp is set
    Test.assert(priceData.timestamp > 0.0)
}

// Test 2: Get current price
access(all) fun testGetCurrentPrice() {
    let price = MockPriceOracle.getCurrentPrice()
    
    // Should return the initial price
    Test.assertEqual(50000.0, price)
}

// Test 3: Price freshness validation - fresh price
access(all) fun testPriceFreshness_Fresh() {
    // Get current price data
    let priceData = MockPriceOracle.getPriceWithTimestamp()
    
    // Check if price is fresh (should be true since it was just initialized)
    let isFresh = MockPriceOracle.isPriceFresh(timestamp: priceData.timestamp)
    Test.assert(isFresh)
}

// Test 4: Price freshness validation - current price is fresh
access(all) fun testCurrentPriceFresh() {
    // Check if current stored price is fresh
    let isFresh = MockPriceOracle.isCurrentPriceFresh()
    Test.assert(isFresh)
}

// Test 5: Get fresh price succeeds when price is fresh
access(all) fun testGetFreshPrice_Success() {
    let freshPrice = MockPriceOracle.getFreshPrice()
    
    // Should return price data without panicking
    Test.assertEqual(50000.0, freshPrice.price)
    Test.assertEqual(100.0, freshPrice.confidence)
}

// Test 6: Freshness window is 60 seconds
access(all) fun testFreshnessWindow() {
    let freshnessWindow = MockPriceOracle.FRESHNESS_WINDOW
    Test.assertEqual(60.0, freshnessWindow)
}

// Test 7: Price exactly 60 seconds old should be considered fresh
access(all) fun testPriceFreshness_ExactlyAtWindow() {
    let currentTime = getCurrentBlock().timestamp
    let exactlyAtWindow = currentTime - 60.0
    
    let isFresh = MockPriceOracle.isPriceFresh(timestamp: exactlyAtWindow)
    Test.assert(isFresh)
}

// Test 8: Price older than 60 seconds should not be fresh
access(all) fun testPriceFreshness_Stale() {
    let currentTime = getCurrentBlock().timestamp
    let staleTimestamp = currentTime - 61.0
    
    let isFresh = MockPriceOracle.isPriceFresh(timestamp: staleTimestamp)
    Test.assert(!isFresh)
}

// Test 9: PriceData struct contains all required fields
access(all) fun testPriceDataStructure() {
    let priceData = MockPriceOracle.getPriceWithTimestamp()
    
    // Verify all fields are accessible
    Test.assert(priceData.price > 0.0)
    Test.assert(priceData.timestamp > 0.0)
    Test.assert(priceData.confidence > 0.0)
    Test.assert(priceData.confidence <= 100.0)
}
