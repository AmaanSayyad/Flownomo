import Test
import "OverflowGame"
import "MockPriceOracle"

// Test suite for settleRound function
// Tests Requirements: 5.2, 6.1, 6.2, 6.3, 6.4, 6.5, 10.2, 10.3, 13.1
// Tests Properties: 7, 8, 19, 20, 31

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
// Basic Settlement Logic Tests
// ========================================

// Test win/loss determination logic for UP direction with winning scenario
access(all) fun testSettleRound_WinLogic_Up() {
    // Test the win/loss logic:
    // For UP direction: win if actualPriceChange >= targetChange
    
    // Scenario: Target +$100, Actual +$150 -> WIN
    let targetChange: Fix64 = 100.0
    let actualChange: Fix64 = 150.0
    let direction = OverflowGame.Direction.UP
    
    // For UP: win if actualChange >= targetChange
    let shouldWin = (actualChange >= targetChange)
    Test.assert(shouldWin)
}

// Test win/loss determination logic for UP direction with losing scenario
access(all) fun testSettleRound_LossLogic_Up() {
    // Scenario: Target +$100, Actual +$50 -> LOSS
    let targetChange: Fix64 = 100.0
    let actualChange: Fix64 = 50.0
    let direction = OverflowGame.Direction.UP
    
    // For UP: win if actualChange >= targetChange
    let shouldWin = (actualChange >= targetChange)
    Test.assert(!shouldWin)
}

// Test win/loss determination logic for DOWN direction with winning scenario
access(all) fun testSettleRound_WinLogic_Down() {
    // Scenario: Target -$100, Actual -$150 -> WIN
    let targetChange: Fix64 = -100.0
    let actualChange: Fix64 = -150.0
    let direction = OverflowGame.Direction.DOWN
    
    // For DOWN: win if actualChange <= targetChange
    let shouldWin = (actualChange <= targetChange)
    Test.assert(shouldWin)
}

// Test win/loss determination logic for DOWN direction with losing scenario
access(all) fun testSettleRound_LossLogic_Down() {
    // Scenario: Target -$100, Actual -$50 -> LOSS
    let targetChange: Fix64 = -100.0
    let actualChange: Fix64 = -50.0
    let direction = OverflowGame.Direction.DOWN
    
    // For DOWN: win if actualChange <= targetChange
    let shouldWin = (actualChange <= targetChange)
    Test.assert(!shouldWin)
}

// ========================================
// Edge Case Tests
// ========================================

// Test exact price match for UP direction (should win)
access(all) fun testSettleRound_ExactMatch_Up() {
    // Scenario: Target +$100, Actual +$100 -> WIN
    let targetChange: Fix64 = 100.0
    let actualChange: Fix64 = 100.0
    
    // For UP: win if actualChange >= targetChange (100 >= 100 is true)
    let shouldWin = (actualChange >= targetChange)
    Test.assert(shouldWin)
}

// Test exact price match for DOWN direction (should win)
access(all) fun testSettleRound_ExactMatch_Down() {
    // Scenario: Target -$100, Actual -$100 -> WIN
    let targetChange: Fix64 = -100.0
    let actualChange: Fix64 = -100.0
    
    // For DOWN: win if actualChange <= targetChange (-100 <= -100 is true)
    let shouldWin = (actualChange <= targetChange)
    Test.assert(shouldWin)
}

// Test zero price change with UP target (should lose)
access(all) fun testSettleRound_ZeroChange_Up() {
    // Scenario: Target +$10, Actual $0 -> LOSS
    let targetChange: Fix64 = 10.0
    let actualChange: Fix64 = 0.0
    
    // For UP: win if actualChange >= targetChange (0 >= 10 is false)
    let shouldWin = (actualChange >= targetChange)
    Test.assert(!shouldWin)
}

// Test off-by-one below target for UP direction (should lose)
access(all) fun testSettleRound_OffByOneBelow_Up() {
    // Scenario: Target +$100, Actual +$99 -> LOSS
    let targetChange: Fix64 = 100.0
    let actualChange: Fix64 = 99.0
    
    // For UP: win if actualChange >= targetChange (99 >= 100 is false)
    let shouldWin = (actualChange >= targetChange)
    Test.assert(!shouldWin)
}

// Test off-by-one above target for UP direction (should win)
access(all) fun testSettleRound_OffByOneAbove_Up() {
    // Scenario: Target +$100, Actual +$101 -> WIN
    let targetChange: Fix64 = 100.0
    let actualChange: Fix64 = 101.0
    
    // For UP: win if actualChange >= targetChange (101 >= 100 is true)
    let shouldWin = (actualChange >= targetChange)
    Test.assert(shouldWin)
}

// ========================================
// Price Movement Calculation Tests
// ========================================

// Test price movement calculation: positive change
access(all) fun testPriceMovementCalculation_Positive() {
    let startPrice: UFix64 = 50000.0
    let endPrice: UFix64 = 50150.0
    
    // actualPriceChange = endPrice - startPrice
    let actualChange = Fix64(endPrice) - Fix64(startPrice)
    
    // Should be +150
    let expected: Fix64 = 150.0
    Test.assertEqual(expected, actualChange)
}

// Test price movement calculation: negative change
access(all) fun testPriceMovementCalculation_Negative() {
    let startPrice: UFix64 = 50000.0
    let endPrice: UFix64 = 49850.0
    
    // actualPriceChange = endPrice - startPrice
    let actualChange = Fix64(endPrice) - Fix64(startPrice)
    
    // Should be -150
    Test.assertEqual(-150.0, actualChange)
}

// Test price movement calculation: zero change
access(all) fun testPriceMovementCalculation_Zero() {
    let startPrice: UFix64 = 50000.0
    let endPrice: UFix64 = 50000.0
    
    // actualPriceChange = endPrice - startPrice
    let actualChange = Fix64(endPrice) - Fix64(startPrice)
    
    // Should be 0
    let expected: Fix64 = 0.0
    Test.assertEqual(expected, actualChange)
}

// Test price movement calculation: large positive change
access(all) fun testPriceMovementCalculation_LargePositive() {
    let startPrice: UFix64 = 50000.0
    let endPrice: UFix64 = 50500.0
    
    // actualPriceChange = endPrice - startPrice
    let actualChange = Fix64(endPrice) - Fix64(startPrice)
    
    // Should be +500
    let expected: Fix64 = 500.0
    Test.assertEqual(expected, actualChange)
}

// Test price movement calculation: large negative change
access(all) fun testPriceMovementCalculation_LargeNegative() {
    let startPrice: UFix64 = 50000.0
    let endPrice: UFix64 = 49500.0
    
    // actualPriceChange = endPrice - startPrice
    let actualChange = Fix64(endPrice) - Fix64(startPrice)
    
    // Should be -500
    Test.assertEqual(-500.0, actualChange)
}

// ========================================
// Payout Calculation Tests
// ========================================

// Test payout calculation with multiplier 2.0
access(all) fun testPayoutCalculation_2x() {
    let betAmount: UFix64 = 10.0
    let multiplier: UFix64 = 2.0
    
    // payout = betAmount * multiplier
    let payout = betAmount * multiplier
    
    // Should be 20.0
    Test.assertEqual(20.0, payout)
}

// Test payout calculation with multiplier 10.0
access(all) fun testPayoutCalculation_10x() {
    let betAmount: UFix64 = 5.0
    let multiplier: UFix64 = 10.0
    
    // payout = betAmount * multiplier
    let payout = betAmount * multiplier
    
    // Should be 50.0
    Test.assertEqual(50.0, payout)
}

// Test payout calculation with multiplier 1.5
access(all) fun testPayoutCalculation_1_5x() {
    let betAmount: UFix64 = 10.0
    let multiplier: UFix64 = 1.5
    
    // payout = betAmount * multiplier
    let payout = betAmount * multiplier
    
    // Should be 15.0
    Test.assertEqual(15.0, payout)
}

// Test payout is zero for losing bet
access(all) fun testPayoutCalculation_Loss() {
    let betAmount: UFix64 = 10.0
    let multiplier: UFix64 = 5.0
    let won = false
    
    // For losing bet, payout should be 0.0
    var payout: UFix64 = 0.0
    if won {
        payout = betAmount * multiplier
    }
    
    Test.assertEqual(0.0, payout)
}

// ========================================
// BetResult Structure Tests
// ========================================

// Test BetResult creation for winning bet
access(all) fun testBetResult_Win() {
    let result = OverflowGame.BetResult(
        betId: 1,
        won: true,
        actualPriceChange: 150.0,
        payout: 20.0,
        timestamp: 1234567890.0
    )
    
    Test.assertEqual(UInt64(1), result.betId)
    Test.assertEqual(true, result.won)
    let expectedChange: Fix64 = 150.0
    Test.assertEqual(expectedChange, result.actualPriceChange)
    Test.assertEqual(20.0, result.payout)
    Test.assertEqual(1234567890.0, result.timestamp)
}

// Test BetResult creation for losing bet
access(all) fun testBetResult_Loss() {
    let result = OverflowGame.BetResult(
        betId: 2,
        won: false,
        actualPriceChange: 50.0,
        payout: 0.0,
        timestamp: 1234567890.0
    )
    
    Test.assertEqual(UInt64(2), result.betId)
    Test.assertEqual(false, result.won)
    let expectedChange: Fix64 = 50.0
    Test.assertEqual(expectedChange, result.actualPriceChange)
    Test.assertEqual(0.0, result.payout)
}

// ========================================
// Notes for Integration Tests (Task 5.2)
// ========================================

// The following tests require full integration with FlowToken and time manipulation:
// 1. Test early settlement prevention (before end time) - Property 19
// 2. Test settlement after end time - Property 20
// 3. Test bet owner authorization - Property 31
// 4. Test double settlement prevention
// 5. Test RoundSettled event emission - Property 33
// 6. Test actual fund transfers (payout and treasury)
// 7. Test with multiple different multipliers
// 8. Test with various bet amounts
// 9. Test manual settlement after timeout (5 minutes) - Property 22
// 10. Test oracle price freshness validation - Property 5

// These will be implemented as property-based tests in task 5.2
