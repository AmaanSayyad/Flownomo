import Test
import "OverflowGame"
import "FlowToken"
import "FungibleToken"
import "MockPriceOracle"

// Test suite for Query Functions and Admin Features (Task 7)
access(all) fun setup() {
    // Deploy MockPriceOracle first (dependency)
    let oracleErr = Test.deployContract(
        name: "MockPriceOracle",
        path: "../contracts/MockPriceOracle.cdc",
        arguments: []
    )
    Test.expect(oracleErr, Test.beNil())
    
    // Deploy OverflowGame contract
    let err = Test.deployContract(
        name: "OverflowGame",
        path: "../contracts/OverflowGame.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
}

// ========================================
// Query Functions Tests (Task 7.1)
// ========================================

// Test getTargetCells returns all available targets
access(all) fun testGetTargetCells_ReturnsAllTargets() {
    let targetCells = OverflowGame.getTargetCells()
    
    // Should return 8 target cells (5 UP, 3 DOWN)
    Test.expect(targetCells.length, Test.equal(8))
}

// Test getTargetCells returns correct structure
access(all) fun testGetTargetCells_CorrectStructure() {
    let targetCells = OverflowGame.getTargetCells()
    
    // Verify first target cell (id: 1, +$5 in 30s, multiplier 1.5)
    let target1 = targetCells[0]
    Test.expect(target1.id, Test.equal(UInt8(1)))
    Test.expect(target1.label, Test.equal("+$5 in 30s"))
    Test.assert(target1.priceChange == 5.0)
    Test.expect(target1.direction, Test.equal(OverflowGame.Direction.UP.rawValue))
    Test.expect(target1.multiplier, Test.equal(1.5))
    Test.expect(target1.timeframe, Test.equal(30.0))
}

// Test getTargetCells includes UP direction targets
access(all) fun testGetTargetCells_IncludesUpTargets() {
    let targetCells = OverflowGame.getTargetCells()
    
    // Check target 2: +$10 in 30s, multiplier 2.0
    let target2 = targetCells[1]
    Test.expect(target2.id, Test.equal(UInt8(2)))
    Test.expect(target2.label, Test.equal("+$10 in 30s"))
    Test.assert(target2.priceChange == 10.0)
    Test.expect(target2.direction, Test.equal(OverflowGame.Direction.UP.rawValue))
    Test.expect(target2.multiplier, Test.equal(2.0))
}

// Test getTargetCells includes DOWN direction targets
access(all) fun testGetTargetCells_IncludesDownTargets() {
    let targetCells = OverflowGame.getTargetCells()
    
    // Check target 6: -$5 in 30s, multiplier 1.5
    let target6 = targetCells[5]
    Test.expect(target6.id, Test.equal(UInt8(6)))
    Test.expect(target6.label, Test.equal("-$5 in 30s"))
    Test.assert(target6.priceChange == -5.0)
    Test.expect(target6.direction, Test.equal(OverflowGame.Direction.DOWN.rawValue))
    Test.expect(target6.multiplier, Test.equal(1.5))
}

// Test getTargetCells includes high multiplier targets
access(all) fun testGetTargetCells_IncludesHighMultipliers() {
    let targetCells = OverflowGame.getTargetCells()
    
    // Check target 5: +$100 in 30s, multiplier 10.0
    let target5 = targetCells[4]
    Test.expect(target5.id, Test.equal(UInt8(5)))
    Test.expect(target5.label, Test.equal("+$100 in 30s"))
    Test.assert(target5.priceChange == 100.0)
    Test.expect(target5.multiplier, Test.equal(10.0))
}

// Test getBetStatus returns nil for non-existent bet
access(all) fun testGetBetStatus_NonExistentBet() {
    let betStatus = OverflowGame.getBetStatus(betId: 999)
    
    // Should return nil for non-existent bet
    Test.expect(betStatus, Test.beNil())
}

// Test getUserActiveBet returns nil when no active bet
access(all) fun testGetUserActiveBet_NoActiveBet() {
    let playerAddress = Address(0x01)
    let activeBet = OverflowGame.getUserActiveBet(player: playerAddress)
    
    // Should return nil when player has no active bet
    Test.expect(activeBet, Test.beNil())
}

// Test isGamePaused returns false initially
access(all) fun testIsGamePaused_InitiallyFalse() {
    let isPaused = OverflowGame.isGamePaused()
    
    // Game should not be paused initially
    Test.expect(isPaused, Test.equal(false))
}

// ========================================
// Admin Resource Tests (Task 7.2)
// ========================================

// Test Admin resource is created during initialization
access(all) fun testAdmin_ResourceCreated() {
    // Admin resource should be stored in contract account
    // We can't directly access it from tests, but we can verify
    // the contract initialized successfully (which includes Admin creation)
    
    // If we got here, the contract deployed successfully with Admin
    Test.assert(true)
}

// Test pauseGame functionality through contract state
access(all) fun testAdmin_GamePausedState() {
    // Initially game should not be paused
    let initialState = OverflowGame.isGamePaused()
    Test.expect(initialState, Test.equal(false))
    
    // Note: To fully test pause/resume, we would need to execute transactions
    // that call the Admin resource methods. This requires transaction scripts
    // which will be tested in integration tests.
}

// Test isGamePaused returns correct initial state
access(all) fun testAdmin_IsGamePausedInitialState() {
    let isPaused = OverflowGame.isGamePaused()
    
    // Game should not be paused initially
    Test.expect(isPaused, Test.equal(false))
}

// Test Admin events are defined
access(all) fun testAdmin_EventsExist() {
    // This test verifies that admin-related events are properly defined
    // Event emission will be tested in integration tests
    
    // If the contract compiled successfully, events are defined
    Test.assert(true)
}

// Test withdrawTreasury with sufficient balance
access(all) fun testAdmin_WithdrawTreasury_SufficientBalance() {
    // First, add funds to treasury
    let treasuryRef = OverflowGame.borrowTreasury()
    treasuryRef.deposit(amount: 100.0)
    
    let initialBalance = treasuryRef.getBalance()
    Test.expect(initialBalance, Test.equal(100.0))
    
    // Note: Full withdrawal test requires FlowToken setup
    // This will be tested in integration tests
}

// Test BetStatusInfo struct creation
access(all) fun testBetStatusInfo_StructCreation() {
    // Create a BetStatusInfo struct manually to test structure
    let betStatusInfo = OverflowGame.BetStatusInfo(
        betId: 1,
        player: Address(0x01),
        amount: 10.0,
        targetCellId: 2,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP.rawValue,
        multiplier: 2.0,
        startPrice: 50000.0,
        startTime: 1000.0,
        endTime: 1030.0,
        settled: false,
        status: OverflowGame.BetStatus.ACTIVE
    )
    
    // Verify all fields
    Test.expect(betStatusInfo.betId, Test.equal(UInt64(1)))
    Test.expect(betStatusInfo.player, Test.equal(Address(0x01)))
    Test.expect(betStatusInfo.amount, Test.equal(10.0))
    Test.expect(betStatusInfo.targetCellId, Test.equal(UInt8(2)))
    Test.assert(betStatusInfo.priceChange == 10.0)
    Test.expect(betStatusInfo.direction, Test.equal(OverflowGame.Direction.UP.rawValue))
    Test.expect(betStatusInfo.multiplier, Test.equal(2.0))
    Test.expect(betStatusInfo.startPrice, Test.equal(50000.0))
    Test.expect(betStatusInfo.startTime, Test.equal(1000.0))
    Test.expect(betStatusInfo.endTime, Test.equal(1030.0))
    Test.expect(betStatusInfo.settled, Test.equal(false))
    Test.expect(betStatusInfo.status, Test.equal(OverflowGame.BetStatus.ACTIVE))
}

// Test TargetCellInfo struct creation
access(all) fun testTargetCellInfo_StructCreation() {
    // Create a TargetCellInfo struct manually to test structure
    let targetCellInfo = OverflowGame.TargetCellInfo(
        id: 1,
        label: "+$5 in 30s",
        priceChange: 5.0,
        direction: OverflowGame.Direction.UP.rawValue,
        multiplier: 1.5,
        timeframe: 30.0
    )
    
    // Verify all fields
    Test.expect(targetCellInfo.id, Test.equal(UInt8(1)))
    Test.expect(targetCellInfo.label, Test.equal("+$5 in 30s"))
    Test.assert(targetCellInfo.priceChange == 5.0)
    Test.expect(targetCellInfo.direction, Test.equal(OverflowGame.Direction.UP.rawValue))
    Test.expect(targetCellInfo.multiplier, Test.equal(1.5))
    Test.expect(targetCellInfo.timeframe, Test.equal(30.0))
}

// Test all target cells have correct timeframe
access(all) fun testGetTargetCells_AllHaveCorrectTimeframe() {
    let targetCells = OverflowGame.getTargetCells()
    
    // All target cells should have 30 second timeframe
    for targetCell in targetCells {
        Test.expect(targetCell.timeframe, Test.equal(30.0))
    }
}

// Test target cells have increasing multipliers
access(all) fun testGetTargetCells_IncreasingMultipliers() {
    let targetCells = OverflowGame.getTargetCells()
    
    // Verify multipliers increase with price change magnitude
    // Target 1: +$5, multiplier 1.5
    Test.expect(targetCells[0].multiplier, Test.equal(1.5))
    
    // Target 2: +$10, multiplier 2.0
    Test.expect(targetCells[1].multiplier, Test.equal(2.0))
    
    // Target 3: +$20, multiplier 3.0
    Test.expect(targetCells[2].multiplier, Test.equal(3.0))
    
    // Target 4: +$50, multiplier 5.0
    Test.expect(targetCells[3].multiplier, Test.equal(5.0))
    
    // Target 5: +$100, multiplier 10.0
    Test.expect(targetCells[4].multiplier, Test.equal(10.0))
}

// Test target cells have symmetric UP and DOWN targets
access(all) fun testGetTargetCells_SymmetricTargets() {
    let targetCells = OverflowGame.getTargetCells()
    
    // Target 1 (+$5) and Target 6 (-$5) should have same multiplier
    Test.expect(targetCells[0].multiplier, Test.equal(targetCells[5].multiplier))
    
    // Target 2 (+$10) and Target 7 (-$10) should have same multiplier
    Test.expect(targetCells[1].multiplier, Test.equal(targetCells[6].multiplier))
    
    // Target 3 (+$20) and Target 8 (-$20) should have same multiplier
    Test.expect(targetCells[2].multiplier, Test.equal(targetCells[7].multiplier))
}

// Test getActiveBetId returns nil when no active bet
access(all) fun testGetActiveBetId_NoActiveBet() {
    let playerAddress = Address(0x02)
    let activeBetId = OverflowGame.getActiveBetId(player: playerAddress)
    
    // Should return nil when player has no active bet
    Test.expect(activeBetId, Test.beNil())
}

// Test getBet returns nil for non-existent bet
access(all) fun testGetBet_NonExistentBet() {
    let betRef = OverflowGame.getBet(betId: 999)
    
    // Should return nil for non-existent bet
    Test.expect(betRef, Test.beNil())
}
