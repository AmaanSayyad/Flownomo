import Test
import "OverflowGame"

// Test suite for OverflowGame contract
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

// Test that the contract deploys successfully
access(all) fun testContractDeployment() {
    // If setup() succeeded, the contract is deployed
    // This test verifies basic contract structure
}

// Test Direction enum values
access(all) fun testDirectionEnum() {
    let up = OverflowGame.Direction.UP
    let down = OverflowGame.Direction.DOWN
    
    // Verify enum values are distinct
    Test.expect(up.rawValue, Test.equal(UInt8(0)))
    Test.expect(down.rawValue, Test.equal(UInt8(1)))
}

// Test BetStatus enum values
access(all) fun testBetStatusEnum() {
    let active = OverflowGame.BetStatus.ACTIVE
    let settling = OverflowGame.BetStatus.SETTLING
    let won = OverflowGame.BetStatus.WON
    let lost = OverflowGame.BetStatus.LOST
    let refunded = OverflowGame.BetStatus.REFUNDED
    
    // Verify enum values are distinct
    Test.expect(active.rawValue, Test.equal(UInt8(0)))
    Test.expect(settling.rawValue, Test.equal(UInt8(1)))
    Test.expect(won.rawValue, Test.equal(UInt8(2)))
    Test.expect(lost.rawValue, Test.equal(UInt8(3)))
    Test.expect(refunded.rawValue, Test.equal(UInt8(4)))
}

// Test TargetCell struct creation
access(all) fun testTargetCellCreation() {
    let targetCell = OverflowGame.TargetCell(
        id: 1,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    Test.expect(targetCell.id, Test.equal(UInt8(1)))
    // priceChange is Fix64, just verify it's accessible
    Test.assert(targetCell.priceChange > 0.0)
    Test.expect(targetCell.direction, Test.equal(OverflowGame.Direction.UP))
    Test.expect(targetCell.timeframe, Test.equal(30.0))
}

// Test TargetCell with DOWN direction
access(all) fun testTargetCellDownDirection() {
    let targetCell = OverflowGame.TargetCell(
        id: 2,
        priceChange: -10.0,
        direction: OverflowGame.Direction.DOWN,
        timeframe: 30.0
    )
    
    Test.expect(targetCell.id, Test.equal(UInt8(2)))
    // priceChange is Fix64, just verify it's negative
    Test.assert(targetCell.priceChange < 0.0)
    Test.expect(targetCell.direction, Test.equal(OverflowGame.Direction.DOWN))
    Test.expect(targetCell.timeframe, Test.equal(30.0))
}

// Test BetResult struct creation
access(all) fun testBetResultCreation() {
    let betResult = OverflowGame.BetResult(
        betId: 1,
        won: true,
        actualPriceChange: 15.0,
        payout: 20.0,
        timestamp: 1234567890.0
    )
    
    Test.expect(betResult.betId, Test.equal(UInt64(1)))
    Test.expect(betResult.won, Test.equal(true))
    // actualPriceChange is Fix64, just verify it's accessible
    Test.assert(betResult.actualPriceChange > 0.0)
    Test.expect(betResult.payout, Test.equal(20.0))
    Test.expect(betResult.timestamp, Test.equal(1234567890.0))
}

// Test BetResult for losing bet
access(all) fun testBetResultLoss() {
    let betResult = OverflowGame.BetResult(
        betId: 2,
        won: false,
        actualPriceChange: 5.0,
        payout: 0.0,
        timestamp: 1234567890.0
    )
    
    Test.expect(betResult.betId, Test.equal(UInt64(2)))
    Test.expect(betResult.won, Test.equal(false))
    // actualPriceChange is Fix64, just verify it's accessible
    Test.assert(betResult.actualPriceChange > 0.0)
    Test.expect(betResult.payout, Test.equal(0.0))
}

// ========================================
// Bet Resource Tests
// ========================================

// Test Bet resource creation with all required fields
access(all) fun testBetResourceCreation() {
    let targetCell = OverflowGame.TargetCell(
        id: 1,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    let playerAddress = Address(0x01)
    let betAmount = 10.0
    let multiplier = 2.0
    let startPrice = 50000.0
    
    let bet <- OverflowGame.createBet(
        player: playerAddress,
        amount: betAmount,
        targetCell: targetCell,
        multiplier: multiplier,
        startPrice: startPrice
    )
    
    // Verify all fields are set correctly
    Test.expect(bet.player, Test.equal(playerAddress))
    Test.expect(bet.amount, Test.equal(betAmount))
    Test.expect(bet.targetCell.id, Test.equal(UInt8(1)))
    Test.expect(bet.multiplier, Test.equal(multiplier))
    Test.expect(bet.startPrice, Test.equal(startPrice))
    Test.expect(bet.settled, Test.equal(false))
    
    // Verify timestamps are set
    Test.assert(bet.startTime > 0.0)
    Test.assert(bet.endTime > bet.startTime)
    
    // Verify end time is calculated correctly (startTime + timeframe)
    let expectedEndTime = bet.startTime + targetCell.timeframe
    Test.expect(bet.endTime, Test.equal(expectedEndTime))
    
    destroy bet
}

// Test Bet resource getter functions
access(all) fun testBetResourceGetters() {
    let targetCell = OverflowGame.TargetCell(
        id: 2,
        priceChange: 20.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    let playerAddress = Address(0x02)
    let betAmount = 15.0
    let multiplier = 3.0
    let startPrice = 51000.0
    
    let bet <- OverflowGame.createBet(
        player: playerAddress,
        amount: betAmount,
        targetCell: targetCell,
        multiplier: multiplier,
        startPrice: startPrice
    )
    
    // Test all getter functions
    Test.expect(bet.getId(), Test.equal(UInt64(0))) // Placeholder ID
    Test.expect(bet.getPlayer(), Test.equal(playerAddress))
    Test.expect(bet.getAmount(), Test.equal(betAmount))
    Test.expect(bet.getTargetCell().id, Test.equal(UInt8(2)))
    Test.expect(bet.getMultiplier(), Test.equal(multiplier))
    Test.expect(bet.getStartPrice(), Test.equal(startPrice))
    Test.expect(bet.getStartTime(), Test.equal(bet.startTime))
    Test.expect(bet.getEndTime(), Test.equal(bet.endTime))
    Test.expect(bet.isSettled(), Test.equal(false))
    
    destroy bet
}

// Test Bet resource with DOWN direction target
access(all) fun testBetResourceWithDownDirection() {
    let targetCell = OverflowGame.TargetCell(
        id: 3,
        priceChange: -15.0,
        direction: OverflowGame.Direction.DOWN,
        timeframe: 30.0
    )
    
    let playerAddress = Address(0x03)
    let betAmount = 5.0
    let multiplier = 4.0
    let startPrice = 49000.0
    
    let bet <- OverflowGame.createBet(
        player: playerAddress,
        amount: betAmount,
        targetCell: targetCell,
        multiplier: multiplier,
        startPrice: startPrice
    )
    
    // Verify target cell direction is DOWN
    Test.expect(bet.targetCell.direction, Test.equal(OverflowGame.Direction.DOWN))
    Test.assert(bet.targetCell.priceChange < 0.0)
    
    destroy bet
}

// Test Bet resource with different multipliers
access(all) fun testBetResourceMultipliers() {
    let targetCell = OverflowGame.TargetCell(
        id: 4,
        priceChange: 50.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    let playerAddress = Address(0x04)
    let betAmount = 10.0
    let startPrice = 50000.0
    
    // Test with multiplier 1.5
    let bet1 <- OverflowGame.createBet(
        player: playerAddress,
        amount: betAmount,
        targetCell: targetCell,
        multiplier: 1.5,
        startPrice: startPrice
    )
    Test.expect(bet1.getMultiplier(), Test.equal(1.5))
    destroy bet1
    
    // Test with multiplier 10.0
    let bet2 <- OverflowGame.createBet(
        player: playerAddress,
        amount: betAmount,
        targetCell: targetCell,
        multiplier: 10.0,
        startPrice: startPrice
    )
    Test.expect(bet2.getMultiplier(), Test.equal(10.0))
    destroy bet2
}

// Test Bet resource with different bet amounts
access(all) fun testBetResourceAmounts() {
    let targetCell = OverflowGame.TargetCell(
        id: 5,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    let playerAddress = Address(0x05)
    let multiplier = 2.0
    let startPrice = 50000.0
    
    // Test with small bet amount
    let bet1 <- OverflowGame.createBet(
        player: playerAddress,
        amount: 0.1,
        targetCell: targetCell,
        multiplier: multiplier,
        startPrice: startPrice
    )
    Test.expect(bet1.getAmount(), Test.equal(0.1))
    destroy bet1
    
    // Test with large bet amount
    let bet2 <- OverflowGame.createBet(
        player: playerAddress,
        amount: 1000.0,
        targetCell: targetCell,
        multiplier: multiplier,
        startPrice: startPrice
    )
    Test.expect(bet2.getAmount(), Test.equal(1000.0))
    destroy bet2
}

// Test Bet resource with different start prices
access(all) fun testBetResourceStartPrices() {
    let targetCell = OverflowGame.TargetCell(
        id: 6,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    let playerAddress = Address(0x06)
    let betAmount = 10.0
    let multiplier = 2.0
    
    // Test with low BTC price
    let bet1 <- OverflowGame.createBet(
        player: playerAddress,
        amount: betAmount,
        targetCell: targetCell,
        multiplier: multiplier,
        startPrice: 10000.0
    )
    Test.expect(bet1.getStartPrice(), Test.equal(10000.0))
    destroy bet1
    
    // Test with high BTC price
    let bet2 <- OverflowGame.createBet(
        player: playerAddress,
        amount: betAmount,
        targetCell: targetCell,
        multiplier: multiplier,
        startPrice: 100000.0
    )
    Test.expect(bet2.getStartPrice(), Test.equal(100000.0))
    destroy bet2
}

// Test Bet resource end time calculation with different timeframes
access(all) fun testBetResourceEndTimeCalculation() {
    let playerAddress = Address(0x07)
    let betAmount = 10.0
    let multiplier = 2.0
    let startPrice = 50000.0
    
    // Test with 30 second timeframe
    let targetCell30 = OverflowGame.TargetCell(
        id: 7,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    let bet30 <- OverflowGame.createBet(
        player: playerAddress,
        amount: betAmount,
        targetCell: targetCell30,
        multiplier: multiplier,
        startPrice: startPrice
    )
    Test.expect(bet30.endTime - bet30.startTime, Test.equal(30.0))
    destroy bet30
    
    // Test with 60 second timeframe
    let targetCell60 = OverflowGame.TargetCell(
        id: 8,
        priceChange: 20.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 60.0
    )
    let bet60 <- OverflowGame.createBet(
        player: playerAddress,
        amount: betAmount,
        targetCell: targetCell60,
        multiplier: multiplier,
        startPrice: startPrice
    )
    Test.expect(bet60.endTime - bet60.startTime, Test.equal(60.0))
    destroy bet60
}

// Test Bet resource initial settled state
access(all) fun testBetResourceInitialSettledState() {
    let targetCell = OverflowGame.TargetCell(
        id: 9,
        priceChange: 10.0,
        direction: OverflowGame.Direction.UP,
        timeframe: 30.0
    )
    
    let bet <- OverflowGame.createBet(
        player: Address(0x08),
        amount: 10.0,
        targetCell: targetCell,
        multiplier: 2.0,
        startPrice: 50000.0
    )
    
    // Verify bet starts as not settled
    Test.expect(bet.settled, Test.equal(false))
    Test.expect(bet.isSettled(), Test.equal(false))
    
    destroy bet
}


// ========================================
// Treasury Resource Tests
// ========================================

// Test Treasury initialization and balance
access(all) fun testTreasuryInitialization() {
    // Get the treasury balance (should be 0 initially)
    let balance = OverflowGame.getTreasuryBalance()
    Test.expect(balance, Test.equal(0.0))
}

// Test Treasury getBalance function
access(all) fun testTreasuryGetBalance() {
    let treasuryRef = OverflowGame.borrowTreasury()
    let balance = treasuryRef.getBalance()
    
    // Balance should be 0 initially
    Test.expect(balance, Test.equal(0.0))
}

// Test Treasury deposit function
access(all) fun testTreasuryDeposit() {
    // This test requires FlowToken setup which will be done in integration tests
    // For now, we verify the function exists and is accessible
    let treasuryRef = OverflowGame.borrowTreasury()
    
    // Verify treasury reference is valid
    Test.assert(treasuryRef != nil)
}

// Test Treasury balance after operations
access(all) fun testTreasuryBalanceConsistency() {
    // Get initial balance
    let initialBalance = OverflowGame.getTreasuryBalance()
    
    // Get balance again - should be the same
    let balance2 = OverflowGame.getTreasuryBalance()
    Test.expect(balance2, Test.equal(initialBalance))
}

// Test borrowTreasury function returns valid reference
access(all) fun testBorrowTreasury() {
    let treasuryRef = OverflowGame.borrowTreasury()
    
    // Verify we can call methods on the reference
    let balance = treasuryRef.getBalance()
    Test.assert(balance >= 0.0)
}

// Test Treasury deposit functionality
access(all) fun testTreasuryDepositAmount() {
    let treasuryRef = OverflowGame.borrowTreasury()
    
    // Get initial balance
    let initialBalance = treasuryRef.getBalance()
    
    // Deposit 100.0 FLOW
    treasuryRef.deposit(amount: 100.0)
    
    // Verify balance increased
    let newBalance = treasuryRef.getBalance()
    Test.expect(newBalance, Test.equal(initialBalance + 100.0))
}

// Test Treasury multiple deposits
access(all) fun testTreasuryMultipleDeposits() {
    let treasuryRef = OverflowGame.borrowTreasury()
    
    // Get initial balance
    let initialBalance = treasuryRef.getBalance()
    
    // Make multiple deposits
    treasuryRef.deposit(amount: 50.0)
    treasuryRef.deposit(amount: 30.0)
    treasuryRef.deposit(amount: 20.0)
    
    // Verify total balance
    let expectedBalance = initialBalance + 100.0
    let actualBalance = treasuryRef.getBalance()
    Test.expect(actualBalance, Test.equal(expectedBalance))
}

// Test Treasury withdraw functionality
access(all) fun testTreasuryWithdraw() {
    let treasuryRef = OverflowGame.borrowTreasury()
    
    // Deposit some funds first
    treasuryRef.deposit(amount: 200.0)
    let balanceAfterDeposit = treasuryRef.getBalance()
    
    // Withdraw 50.0 FLOW using test helper
    OverflowGame.testWithdrawFromTreasury(amount: 50.0)
    
    // Verify balance decreased
    let newBalance = treasuryRef.getBalance()
    Test.expect(newBalance, Test.equal(balanceAfterDeposit - 50.0))
}

// Test Treasury withdraw all funds
access(all) fun testTreasuryWithdrawAll() {
    let treasuryRef = OverflowGame.borrowTreasury()
    
    // Deposit funds
    treasuryRef.deposit(amount: 100.0)
    let balance = treasuryRef.getBalance()
    
    // Withdraw all funds using test helper
    OverflowGame.testWithdrawFromTreasury(amount: balance)
    
    // Verify balance is 0
    let finalBalance = treasuryRef.getBalance()
    Test.expect(finalBalance, Test.equal(0.0))
}

// Test Treasury balance after deposit and withdraw
access(all) fun testTreasuryDepositAndWithdraw() {
    let treasuryRef = OverflowGame.borrowTreasury()
    
    // Get initial balance
    let initialBalance = treasuryRef.getBalance()
    
    // Deposit 150.0
    treasuryRef.deposit(amount: 150.0)
    
    // Withdraw 50.0 using test helper
    OverflowGame.testWithdrawFromTreasury(amount: 50.0)
    
    // Verify net change is +100.0
    let finalBalance = treasuryRef.getBalance()
    Test.expect(finalBalance, Test.equal(initialBalance + 100.0))
}

// Test getTreasuryBalance function
access(all) fun testGetTreasuryBalanceFunction() {
    let treasuryRef = OverflowGame.borrowTreasury()
    
    // Deposit some funds
    treasuryRef.deposit(amount: 75.0)
    
    // Get balance using both methods
    let balanceFromRef = treasuryRef.getBalance()
    let balanceFromFunction = OverflowGame.getTreasuryBalance()
    
    // Both should return the same value
    Test.expect(balanceFromFunction, Test.equal(balanceFromRef))
}


// ========================================
// placeBet Function Tests
// ========================================

// Test placeBet function with valid inputs
access(all) fun testPlaceBet_Success() {
    // This test requires FlowToken setup which will be done in integration tests
    // For now, we verify the function signature exists
    // Full integration test will be added in task 4.2
}


// ========================================
// Deposit Function Tests (Task 2.1)
// ========================================

// Test deposit function exists and is accessible
access(all) fun testDepositFunctionExists() {
    // Verify the deposit function is accessible
    // Full integration test with FlowToken will be added in integration tests
}

// Test deposit validates positive amounts
access(all) fun testDepositValidatesPositiveAmount() {
    // This test will verify that deposit rejects zero or negative amounts
    // Will be implemented with FlowToken setup in integration tests
}

// Test deposit emits event
access(all) fun testDepositEmitsEvent() {
    // This test will verify that Deposit event is emitted with correct parameters
    // Will be implemented with FlowToken setup in integration tests
}

// Test deposit increases escrow vault balance
access(all) fun testDepositIncreasesEscrowBalance() {
    // This test will verify that deposit increases the escrow vault balance
    // Will be implemented with FlowToken setup in integration tests
}


// ========================================
// placeBet Function Tests (continued)
// ========================================

// Test placeBet prevents double betting
access(all) fun testPlaceBet_PreventDoubleBetting() {
    // This test will be implemented in task 4.2 with property-based testing
    // Property 2: Active Round Prevention
}

// Test placeBet validates bet amount
access(all) fun testPlaceBet_ValidateBetAmount() {
    // This test will be implemented in task 4.2 with property-based testing
    // Property 1: Bet Amount Validation
}

// Test placeBet stores bet data correctly
access(all) fun testPlaceBet_BetDataPersistence() {
    // This test will be implemented in task 4.2 with property-based testing
    // Property 3: Bet Data Persistence
}

// Test placeBet calculates end time correctly
access(all) fun testPlaceBet_EndTimeCalculation() {
    // This test will be implemented in task 4.2 with property-based testing
    // Property 18: Round End Time Calculation
}
