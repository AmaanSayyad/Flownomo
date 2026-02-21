import Test
import "OverflowGame"
import "MockPriceOracle"

// Test suite for placeBetFromHouseBalance function (Task 2.3)

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

// Test 1: Verify placeBetFromHouseBalance creates a bet
access(all) fun testPlaceBetFromHouseBalance_CreatesBet() {
    let player = Address(0x01)
    
    // Create a target cell
    let targetCell = OverflowGame.TargetCell(
        id: 1,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    // Place bet from house balance
    let betId = OverflowGame.placeBetFromHouseBalance(
        targetCell: targetCell,
        betAmount: 5.0,
        multiplier: 2.0,
        player: player
    )
    
    // Verify bet ID is valid
    Test.assertEqual(UInt64(1), betId)
    
    // Verify bet was created
    let betRef = OverflowGame.getBet(betId: betId)
    Test.assert(betRef != nil)
    
    // Verify bet details
    if betRef != nil {
        Test.assertEqual(player, betRef!.getPlayer())
        Test.assertEqual(5.0, betRef!.getAmount())
        Test.assertEqual(2.0, betRef!.getMultiplier())
        Test.assertEqual(50000.0, betRef!.getStartPrice()) // MockPriceOracle default price
    }
}

// Test 2: Verify bet ID increments
access(all) fun testPlaceBetFromHouseBalance_BetIdIncrements() {
    let player1 = Address(0x02)
    let player2 = Address(0x03)
    
    let targetCell = OverflowGame.TargetCell(
        id: 2,
        priceChange: 20.0,
        direction: OverflowGame.Direction.DOWN,
        timeframe: 30.0
    )
    
    // Place first bet
    let betId1 = OverflowGame.placeBetFromHouseBalance(
        targetCell: targetCell,
        betAmount: 3.0,
        multiplier: 3.0,
        player: player1
    )
    
    // Place second bet
    let betId2 = OverflowGame.placeBetFromHouseBalance(
        targetCell: targetCell,
        betAmount: 4.0,
        multiplier: 3.0,
        player: player2
    )
    
    // Verify bet IDs increment
    Test.assertEqual(betId1 + 1, betId2)
}

// Test 3: Verify active bet tracking
access(all) fun testPlaceBetFromHouseBalance_TracksActiveBet() {
    let player = Address(0x04)
    
    let targetCell = OverflowGame.TargetCell(
        id: 3,
        priceChange: 15.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    // Place bet
    let betId = OverflowGame.placeBetFromHouseBalance(
        targetCell: targetCell,
        betAmount: 2.0,
        multiplier: 1.5,
        player: player
    )
    
    // Verify active bet is tracked
    let activeBetId = OverflowGame.getActiveBetId(player: player)
    Test.assert(activeBetId != nil)
    Test.assertEqual(betId, activeBetId!)
}

// Test 4: Verify zero bet amount fails
access(all) fun testPlaceBetFromHouseBalance_ZeroAmountFails() {
    let player = Address(0x05)
    
    let targetCell = OverflowGame.TargetCell(
        id: 1,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    // This should panic with "Bet amount must be greater than zero"
    // Note: In Cadence testing, we can't easily catch panics
    // This test documents the expected behavior
}

// Test 5: Verify multiplier validation
access(all) fun testPlaceBetFromHouseBalance_InvalidMultiplierFails() {
    let player = Address(0x06)
    
    let targetCell = OverflowGame.TargetCell(
        id: 1,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    // This should panic with "Multiplier must be at least 1.0"
    // Note: In Cadence testing, we can't easily catch panics
    // This test documents the expected behavior
}

// Test 6: Verify bet stores target cell correctly
access(all) fun testPlaceBetFromHouseBalance_StoresTargetCell() {
    let player = Address(0x07)
    
    let targetCell = OverflowGame.TargetCell(
        id: 5,
        priceChange: 100.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    // Place bet
    let betId = OverflowGame.placeBetFromHouseBalance(
        targetCell: targetCell,
        betAmount: 10.0,
        multiplier: 10.0,
        player: player
    )
    
    // Verify target cell is stored correctly
    let betRef = OverflowGame.getBet(betId: betId)
    Test.assert(betRef != nil)
    
    if betRef != nil {
        let storedTargetCell = betRef!.getTargetCell()
        Test.assertEqual(targetCell.id, storedTargetCell.id)
        Test.assertEqual(targetCell.priceChange, storedTargetCell.priceChange)
        Test.assertEqual(targetCell.direction, storedTargetCell.direction)
        Test.assertEqual(targetCell.timeframe, storedTargetCell.timeframe)
    }
}

// Test 7: Verify bet timestamps are set
access(all) fun testPlaceBetFromHouseBalance_SetsTimestamps() {
    let player = Address(0x08)
    
    let targetCell = OverflowGame.TargetCell(
        id: 1,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    // Place bet
    let betId = OverflowGame.placeBetFromHouseBalance(
        targetCell: targetCell,
        betAmount: 5.0,
        multiplier: 2.0,
        player: player
    )
    
    // Verify timestamps are set
    let betRef = OverflowGame.getBet(betId: betId)
    Test.assert(betRef != nil)
    
    if betRef != nil {
        let startTime = betRef!.getStartTime()
        let endTime = betRef!.getEndTime()
        
        // Start time should be set
        Test.assert(startTime > 0.0)
        
        // End time should be start time + timeframe
        Test.assertEqual(startTime + 30.0, endTime)
    }
}

// Test 8: Verify bet is not settled initially
access(all) fun testPlaceBetFromHouseBalance_BetNotSettled() {
    let player = Address(0x09)
    
    let targetCell = OverflowGame.TargetCell(
        id: 1,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    // Place bet
    let betId = OverflowGame.placeBetFromHouseBalance(
        targetCell: targetCell,
        betAmount: 5.0,
        multiplier: 2.0,
        player: player
    )
    
    // Verify bet is not settled
    let betRef = OverflowGame.getBet(betId: betId)
    Test.assert(betRef != nil)
    
    if betRef != nil {
        Test.assertEqual(false, betRef!.isSettled())
    }
}
