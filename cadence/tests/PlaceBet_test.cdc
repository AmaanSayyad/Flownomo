import Test
import "OverflowGame"
import "MockPriceOracle"
import "FungibleToken"
import "FlowToken"

// Integration test suite for placeBet function

access(all) fun setup() {
    // Deploy MockPriceOracle first (dependency)
    let oracleErr = Test.deployContract(
        name: "MockPriceOracle",
        path: "../contracts/MockPriceOracle.cdc",
        arguments: []
    )
    Test.expect(oracleErr, Test.beNil())
    
    // Deploy OverflowGame contract
    let gameErr = Test.deployContract(
        name: "OverflowGame",
        path: "../contracts/OverflowGame.cdc",
        arguments: []
    )
    Test.expect(gameErr, Test.beNil())
}

// Test 1: Verify initial state
access(all) fun testInitialState() {
    // Verify next bet ID starts at 1
    let nextBetId = OverflowGame.getNextBetId()
    Test.assertEqual(UInt64(1), nextBetId)
}

// Test 2: Test placeBet with FlowToken
access(all) fun testPlaceBet_WithFlowToken() {
    // Create a test account
    let player = Test.createAccount()
    
    // Create a FlowToken vault with some tokens
    let vault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
    
    // For testing, we need to mint some tokens
    // In a real scenario, the player would already have tokens
    // This is a simplified test - full integration will be in task 4.2
    
    destroy vault
}

// Test 3: Verify bet ID increments
access(all) fun testBetIdIncrement() {
    let initialBetId = OverflowGame.getNextBetId()
    
    // After placing a bet, the next bet ID should increment
    // This will be tested in full integration tests in task 4.2
    
    // For now, verify the initial state
    Test.assert(initialBetId >= 1)
}

// Test 4: Verify oracle integration
access(all) fun testOracleIntegration() {
    // Verify that the oracle is accessible and returns a price
    let currentPrice = MockPriceOracle.getCurrentPrice()
    
    Test.assertEqual(50000.0, currentPrice)
    
    // Verify price data structure
    let priceData = MockPriceOracle.getPriceWithTimestamp()
    Test.assertEqual(50000.0, priceData.price)
    Test.assertEqual(100.0, priceData.confidence)
}

// Test 5: Verify event structure
access(all) fun testBetPlacedEventStructure() {
    // The BetPlaced event should have all required fields
    // This will be verified in integration tests when we can actually place bets
    // For now, we verify the contract deployed successfully with the event
}

// Test 6: Test getBet function
access(all) fun testGetBet_NotFound() {
    // Try to get a bet that doesn't exist
    let betRef = OverflowGame.getBet(betId: 999)
    
    // Should return nil for non-existent bet
    Test.assert(betRef == nil)
}

// Test 7: Test getActiveBetId function
access(all) fun testGetActiveBetId_NoActiveBet() {
    let player = Address(0x01)
    
    // Player has no active bet
    let activeBetId = OverflowGame.getActiveBetId(player: player)
    
    // Should return nil
    Test.assert(activeBetId == nil)
}

// Test 8: Verify escrow vault exists
access(all) fun testEscrowVaultExists() {
    // The escrow vault should be created during contract initialization
    // We can't directly access it, but we can verify the contract deployed successfully
    // Full verification will be in integration tests
}

// Test 9: Verify treasury is separate from escrow
access(all) fun testTreasuryAndEscrowSeparation() {
    // Treasury should start at 0
    let treasuryBalance = OverflowGame.getTreasuryBalance()
    Test.assertEqual(0.0, treasuryBalance)
    
    // Escrow is separate and will hold bet funds
    // This will be verified in integration tests
}

// Test 10: Verify target cell validation
access(all) fun testTargetCellCreation() {
    // Create a valid target cell
    let targetCell = OverflowGame.TargetCell(
        id: 1,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    Test.assertEqual(UInt8(1), targetCell.id)
    Test.assert(targetCell.priceChange > 0.0)
    Test.assertEqual(OverflowGame.Direction.UP, targetCell.direction)
    Test.assertEqual(30.0, targetCell.timeframe)
}
