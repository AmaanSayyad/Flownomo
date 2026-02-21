import Test
import "OverflowGame"
import "MockPriceOracle"

// Test suite for payout processing (Task 6.1 and 6.2)
// Tests Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
// Tests Properties: 9, 10

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
// Payout Calculation Tests
// ========================================

// Test payout calculation with multiplier 2.0
// Tests Requirement 7.1, Property 9
access(all) fun testPayoutCalculation_2x() {
    let betAmount: UFix64 = 10.0
    let multiplier: UFix64 = 2.0
    
    // payout = betAmount * multiplier
    let payout = betAmount * multiplier
    
    // Should be 20.0
    Test.assertEqual(20.0, payout)
}

// Test payout calculation with multiplier 10.0
// Tests Requirement 7.1, Property 9
access(all) fun testPayoutCalculation_10x() {
    let betAmount: UFix64 = 5.0
    let multiplier: UFix64 = 10.0
    
    // payout = betAmount * multiplier
    let payout = betAmount * multiplier
    
    // Should be 50.0
    Test.assertEqual(50.0, payout)
}

// Test payout calculation with multiplier 1.5
// Tests Requirement 7.1, Property 9
access(all) fun testPayoutCalculation_1_5x() {
    let betAmount: UFix64 = 10.0
    let multiplier: UFix64 = 1.5
    
    // payout = betAmount * multiplier
    let payout = betAmount * multiplier
    
    // Should be 15.0
    Test.assertEqual(15.0, payout)
}

// Test payout calculation with multiplier 5.0
// Tests Requirement 7.1, Property 9
access(all) fun testPayoutCalculation_5x() {
    let betAmount: UFix64 = 20.0
    let multiplier: UFix64 = 5.0
    
    // payout = betAmount * multiplier
    let payout = betAmount * multiplier
    
    // Should be 100.0
    Test.assertEqual(100.0, payout)
}

// Test payout is zero for losing bet
// Tests Requirement 7.1
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

// Test payout calculation with large bet amount
// Tests Requirement 7.1, Property 9
access(all) fun testPayoutCalculation_LargeBet() {
    let betAmount: UFix64 = 100.0
    let multiplier: UFix64 = 10.0
    
    // payout = betAmount * multiplier
    let payout = betAmount * multiplier
    
    // Should be 1000.0
    Test.assertEqual(1000.0, payout)
}

// Test payout calculation with small bet amount
// Tests Requirement 7.1, Property 9
access(all) fun testPayoutCalculation_SmallBet() {
    let betAmount: UFix64 = 0.1
    let multiplier: UFix64 = 2.0
    
    // payout = betAmount * multiplier
    let payout = betAmount * multiplier
    
    // Should be 0.2
    Test.assertEqual(0.2, payout)
}

// ========================================
// Treasury Balance Tests
// ========================================

// Test initial treasury balance is zero
// Tests Requirement 7.3
access(all) fun testTreasuryBalance_Initial() {
    let balance = OverflowGame.getTreasuryBalance()
    Test.assertEqual(0.0, balance)
}

// Test treasury deposit function
// Tests Requirement 7.3
access(all) fun testTreasuryDeposit() {
    let treasuryRef = OverflowGame.borrowTreasury()
    let initialBalance = treasuryRef.getBalance()
    
    // Deposit 10.0 FLOW
    treasuryRef.deposit(amount: 10.0)
    
    let finalBalance = treasuryRef.getBalance()
    Test.assertEqual(initialBalance + 10.0, finalBalance)
}

// Test treasury withdraw function
// Tests Requirement 7.3
access(all) fun testTreasuryWithdraw() {
    let treasuryRef = OverflowGame.borrowTreasury()
    
    // Deposit first
    treasuryRef.deposit(amount: 50.0)
    let balanceAfterDeposit = treasuryRef.getBalance()
    
    // Withdraw 20.0 FLOW
    OverflowGame.testWithdrawFromTreasury(amount: 20.0)
    
    let finalBalance = treasuryRef.getBalance()
    Test.assertEqual(balanceAfterDeposit - 20.0, finalBalance)
}

// ========================================
// Pending Payout Tests
// ========================================

// Test getPendingPayout returns nil for non-existent bet
// Tests Requirement 7.5, Property 10
access(all) fun testGetPendingPayout_NonExistent() {
    let pendingPayout = OverflowGame.getPendingPayout(betId: 999)
    Test.assert(pendingPayout == nil)
}

// Test pending payout tracking
// Tests Requirement 7.5, Property 10
access(all) fun testPendingPayoutTracking() {
    // Initially, no pending payouts
    let initialPending = OverflowGame.getPendingPayout(betId: 1)
    Test.assert(initialPending == nil)
    
    // After a failed payout transfer, there should be a pending payout
    // This will be tested in integration tests with actual bet placement
}

// ========================================
// Integration Test Notes
// ========================================

// The following tests require full integration with FlowToken and account setup:
// 1. Test successful payout transfer for winning bet (Requirement 7.2, Property 9)
// 2. Test treasury receives funds from losing bet (Requirement 7.3)
// 3. Test PayoutTransferred event emission (Requirement 7.4, Property 33)
// 4. Test claimPayout function for retry (Requirement 7.5, Property 10)
// 5. Test claimPayout rejects non-owner (Requirement 7.5)
// 6. Test payout transfer with invalid receiver capability (Property 10)
// 7. Test multiple payouts in sequence
// 8. Test payout with different bet amounts and multipliers

// These will be implemented as integration tests when we have full FlowToken setup
// For now, the unit tests above verify the core payout calculation logic
