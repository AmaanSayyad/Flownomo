// OverflowGame.cdc
// Main game contract for Overflow - BTC Price Prediction Game
// Manages deposits, escrow, win/loss determination, and payouts

import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import MockPriceOracle from "MockPriceOracle"

access(all) contract OverflowGame {
    
    // ========================================
    // Storage Paths
    // ========================================
    
    /// Storage path for the Treasury resource
    access(all) let TreasuryStoragePath: StoragePath
    
    /// Storage path for the Escrow Vault (holds bet funds)
    access(all) let EscrowVaultStoragePath: StoragePath
    
    /// Storage path for the Admin resource
    access(all) let AdminStoragePath: StoragePath
    
    // ========================================
    // State Variables
    // ========================================
    
    /// Counter for generating unique bet IDs
    access(all) var nextBetId: UInt64
    
    /// Dictionary storing all active and settled bets by bet ID
    access(self) let bets: @{UInt64: Bet}
    
    /// Dictionary tracking active bets by player address (one active bet per player)
    access(self) let activeBetsByPlayer: {Address: UInt64}
    
    /// Dictionary tracking pending payouts for failed transfers (betId -> payout amount)
    access(self) let pendingPayouts: {UInt64: UFix64}
    
    /// Flag indicating whether the game is paused (prevents new bets)
    access(all) var gamePaused: Bool
    
    // ========================================
    // Events
    // ========================================
    
    /// Event emitted when a bet is placed
    access(all) event BetPlaced(
        betId: UInt64,
        player: Address,
        amount: UFix64,
        targetCellId: UInt8,
        priceChange: Fix64,
        direction: UInt8,
        multiplier: UFix64,
        startPrice: UFix64,
        startTime: UFix64,
        endTime: UFix64
    )
    
    /// Event emitted when a round is settled
    access(all) event RoundSettled(
        betId: UInt64,
        player: Address,
        won: Bool,
        actualPriceChange: Fix64,
        payout: UFix64,
        startPrice: UFix64,
        endPrice: UFix64,
        timestamp: UFix64
    )
    
    /// Event emitted when a payout is transferred
    access(all) event PayoutTransferred(
        betId: UInt64,
        recipient: Address,
        amount: UFix64,
        timestamp: UFix64
    )
    
    /// Event emitted when the oracle address is updated
    access(all) event OracleAddressUpdated(
        newAddress: Address,
        timestamp: UFix64
    )
    
    /// Event emitted when funds are withdrawn from the treasury
    access(all) event TreasuryWithdrawn(
        amount: UFix64,
        recipient: Address,
        timestamp: UFix64
    )
    
    /// Event emitted when the game is paused
    access(all) event GamePaused(
        timestamp: UFix64
    )
    
    /// Event emitted when the game is resumed
    access(all) event GameResumed(
        timestamp: UFix64
    )
    
    /// Event emitted when a user deposits FLOW tokens to house balance
    access(all) event Deposit(
        userAddress: Address,
        amount: UFix64,
        timestamp: UFix64
    )
    
    /// Event emitted when a user withdraws FLOW tokens from house balance
    access(all) event Withdrawal(
        userAddress: Address,
        amount: UFix64,
        timestamp: UFix64
    )
    
    /// Event emitted when a bet is placed from house balance
    access(all) event HouseBetPlaced(
        betId: UInt64,
        userAddress: Address,
        betAmount: UFix64,
        targetCellId: UInt8,
        priceChange: Fix64,
        direction: UInt8,
        multiplier: UFix64,
        startPrice: UFix64,
        startTime: UFix64,
        endTime: UFix64
    )
    
    // ========================================
    // Enums
    // ========================================
    
    /// Direction enum representing price movement direction
    /// Used in TargetCell to specify if prediction is for price going UP or DOWN
    access(all) enum Direction: UInt8 {
        access(all) case UP
        access(all) case DOWN
    }
    
    /// BetStatus enum representing the current state of a bet
    access(all) enum BetStatus: UInt8 {
        access(all) case ACTIVE      // Bet placed, round in progress
        access(all) case SETTLING    // Round ended, settlement in progress
        access(all) case WON         // Bet settled, user won
        access(all) case LOST        // Bet settled, user lost
        access(all) case REFUNDED    // Bet refunded due to oracle failure or other issues
    }
    
    // ========================================
    // Structs
    // ========================================
    
    /// TargetCell struct defining a betting target
    /// Represents a specific price movement prediction with associated parameters
    access(all) struct TargetCell {
        /// Unique identifier for the target cell
        access(all) let id: UInt8
        
        /// Expected price change in USD (e.g., 10.0 for "$10 up", -10.0 for "$10 down")
        access(all) let priceChange: Fix64
        
        /// Direction of price movement (UP or DOWN)
        access(all) let direction: Direction
        
        /// Timeframe for the prediction in seconds (e.g., 30.0 for 30 seconds)
        access(all) let timeframe: UFix64
        
        init(id: UInt8, priceChange: Fix64, direction: Direction, timeframe: UFix64) {
            self.id = id
            self.priceChange = priceChange
            self.direction = direction
            self.timeframe = timeframe
        }
    }
    
    /// BetResult struct containing the outcome of a settled bet
    /// Returned when a round is settled to provide complete result information
    access(all) struct BetResult {
        /// Unique identifier of the bet
        access(all) let betId: UInt64
        
        /// Whether the bet was won (true) or lost (false)
        access(all) let won: Bool
        
        /// Actual price change that occurred during the round
        access(all) let actualPriceChange: Fix64
        
        /// Payout amount transferred to the user (0 if lost)
        access(all) let payout: UFix64
        
        /// Timestamp when the bet was settled
        access(all) let timestamp: UFix64
        
        init(
            betId: UInt64,
            won: Bool,
            actualPriceChange: Fix64,
            payout: UFix64,
            timestamp: UFix64
        ) {
            self.betId = betId
            self.won = won
            self.actualPriceChange = actualPriceChange
            self.payout = payout
            self.timestamp = timestamp
        }
    }
    
    // ========================================
    // Resources
    // ========================================
    
    /// Bet resource representing a single wager
    /// Each bet is a unique resource owned by the player
    /// Contains all information about the bet including amount, target, prices, and settlement status
    access(all) resource Bet {
        /// Unique identifier for this bet (auto-incremented)
        access(all) let id: UInt64
        
        /// Address of the player who placed this bet
        access(all) let player: Address
        
        /// Amount of FLOW tokens wagered
        access(all) let amount: UFix64
        
        /// Target cell selected by the player (defines the prediction)
        access(all) let targetCell: TargetCell
        
        /// Multiplier for payout calculation (e.g., 2.0 for x2, 10.0 for x10)
        access(all) let multiplier: UFix64
        
        /// BTC price at the start of the round (in USD)
        access(all) let startPrice: UFix64
        
        /// Timestamp when the bet was placed (Unix timestamp)
        access(all) let startTime: UFix64
        
        /// Timestamp when the round ends (startTime + timeframe)
        access(all) let endTime: UFix64
        
        /// Whether this bet has been settled (true after settlement, false while active)
        access(all) var settled: Bool
        
        /// Initialize a new Bet resource
        /// @param id: Unique bet ID
        /// @param player: Address of the player placing the bet
        /// @param amount: Amount of FLOW tokens being wagered
        /// @param targetCell: The target cell defining the prediction
        /// @param multiplier: Payout multiplier for this bet
        /// @param startPrice: Current BTC price when bet is placed
        init(
            id: UInt64,
            player: Address,
            amount: UFix64,
            targetCell: TargetCell,
            multiplier: UFix64,
            startPrice: UFix64
        ) {
            // Set the unique bet ID
            self.id = id
            
            self.player = player
            self.amount = amount
            self.targetCell = targetCell
            self.multiplier = multiplier
            self.startPrice = startPrice
            
            // Record the current timestamp as start time
            self.startTime = getCurrentBlock().timestamp
            
            // Calculate end time based on target cell's timeframe
            self.endTime = self.startTime + targetCell.timeframe
            
            // Bet starts as not settled
            self.settled = false
        }
        
        /// Get the bet ID
        /// @return The unique identifier for this bet
        access(all) fun getId(): UInt64 {
            return self.id
        }
        
        /// Get the player address
        /// @return The address of the player who placed this bet
        access(all) fun getPlayer(): Address {
            return self.player
        }
        
        /// Get the bet amount
        /// @return The amount of FLOW tokens wagered
        access(all) fun getAmount(): UFix64 {
            return self.amount
        }
        
        /// Get the target cell
        /// @return The target cell defining the prediction
        access(all) fun getTargetCell(): TargetCell {
            return self.targetCell
        }
        
        /// Get the multiplier
        /// @return The payout multiplier for this bet
        access(all) fun getMultiplier(): UFix64 {
            return self.multiplier
        }
        
        /// Get the start price
        /// @return The BTC price when the bet was placed
        access(all) fun getStartPrice(): UFix64 {
            return self.startPrice
        }
        
        /// Get the start time
        /// @return The timestamp when the bet was placed
        access(all) fun getStartTime(): UFix64 {
            return self.startTime
        }
        
        /// Get the end time
        /// @return The timestamp when the round ends
        access(all) fun getEndTime(): UFix64 {
            return self.endTime
        }
        
        /// Check if the bet has been settled
        /// @return True if settled, false if still active
        access(all) fun isSettled(): Bool {
            return self.settled
        }
        
        /// Mark the bet as settled (internal use only)
        /// This will be called by the settlement function in later tasks
        access(contract) fun markAsSettled() {
            self.settled = true
        }
    }
    
    /// Treasury resource managing house funds and payouts
    /// Holds lost bet funds and provides funds for payouts
    /// Only accessible by admin for withdrawals
    access(all) resource Treasury {
        /// Balance of FLOW tokens held in the treasury
        access(self) var balance: UFix64
        
        /// Initialize a new Treasury with zero balance
        init() {
            self.balance = 0.0
        }
        
        /// Deposit funds into the treasury
        /// Used to add lost bet funds to the treasury
        /// @param amount: Amount of FLOW tokens to deposit
        access(all) fun deposit(amount: UFix64) {
            pre {
                amount > 0.0: "Deposit amount must be greater than zero"
            }
            
            // Add the amount to the treasury balance
            self.balance = self.balance + amount
        }
        
        /// Withdraw funds from the treasury (admin only)
        /// Used to withdraw funds for payouts or administrative purposes
        /// @param amount: Amount of FLOW tokens to withdraw
        access(contract) fun withdraw(amount: UFix64) {
            pre {
                amount > 0.0: "Withdraw amount must be greater than zero"
                amount <= self.balance: "Insufficient treasury balance"
            }
            
            // Subtract the amount from the treasury balance
            self.balance = self.balance - amount
        }
        
        /// Get the current balance of the treasury
        /// @return The amount of FLOW tokens currently held in the treasury
        access(all) fun getBalance(): UFix64 {
            return self.balance
        }
    }
    
    /// Admin resource for contract management
    /// Provides administrative functions with capability-based access control
    /// Only the contract account can create and manage Admin resources
    /// Requirement 13.4, Property 32
    access(all) resource Admin {
        
        /// Update the oracle address used for price feeds
        /// Allows switching to a different oracle implementation
        /// @param newOracleAddress: Address of the new oracle contract
        /// Requirement 13.4
        access(all) fun updateOracleAddress(newOracleAddress: Address) {
            // Note: In the current implementation, we're using MockPriceOracle
            // which is imported at compile time. To support dynamic oracle switching,
            // we would need to store the oracle address in contract state and
            // use dynamic contract imports or capabilities.
            // For now, this function serves as a placeholder for future implementation.
            
            // Emit an event to log the oracle address update
            emit OracleAddressUpdated(newAddress: newOracleAddress, timestamp: getCurrentBlock().timestamp)
        }
        
        /// Withdraw funds from the treasury
        /// Allows admin to withdraw funds for operational purposes
        /// @param amount: Amount of FLOW tokens to withdraw
        /// @param recipient: Address to receive the withdrawn funds
        /// Requirement 13.4
        access(all) fun withdrawTreasury(amount: UFix64, recipient: Address) {
            pre {
                amount > 0.0: "Withdraw amount must be greater than zero"
            }
            
            // Get reference to treasury
            let treasuryRef = OverflowGame.account.storage.borrow<&Treasury>(from: OverflowGame.TreasuryStoragePath)
                ?? panic("Could not borrow reference to Treasury")
            
            // Check treasury has sufficient balance
            if treasuryRef.getBalance() < amount {
                panic("Insufficient treasury balance")
            }
            
            // Get recipient's FlowToken receiver capability first
            let receiverCap = getAccount(recipient).capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            
            // Check if receiver capability is valid before withdrawing
            if !receiverCap.check() {
                panic("Recipient FlowToken receiver capability is invalid")
            }
            
            // Withdraw from treasury (updates balance)
            treasuryRef.withdraw(amount: amount)
            
            // Get reference to escrow vault to withdraw actual tokens
            let escrowVaultRef = OverflowGame.account.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: OverflowGame.EscrowVaultStoragePath)
                ?? panic("Could not borrow reference to Escrow Vault")
            
            // Withdraw tokens from escrow
            let withdrawnVault <- escrowVaultRef.withdraw(amount: amount)
            
            let receiverRef = receiverCap.borrow()!
            
            // Transfer to recipient
            receiverRef.deposit(from: <-withdrawnVault)
            
            // Emit event
            emit TreasuryWithdrawn(amount: amount, recipient: recipient, timestamp: getCurrentBlock().timestamp)
        }
        
        /// Pause the game
        /// Prevents new bets from being placed
        /// Requirement 13.4
        access(all) fun pauseGame() {
            OverflowGame.gamePaused = true
            emit GamePaused(timestamp: getCurrentBlock().timestamp)
        }
        
        /// Resume the game
        /// Allows new bets to be placed again
        /// Requirement 13.4
        access(all) fun resumeGame() {
            OverflowGame.gamePaused = false
            emit GameResumed(timestamp: getCurrentBlock().timestamp)
        }
    }
    
    // ========================================
    // Public Functions
    // ========================================
    
    /// Place a new bet
    /// Accepts FLOW token payment, queries oracle for start price, creates bet, and stores in escrow
    /// @param payment: FlowToken.Vault containing the bet amount
    /// @param targetCell: The target cell defining the prediction
    /// @param multiplier: Payout multiplier for this bet
    /// @param player: Address of the player placing the bet
    /// @return The unique bet ID
    access(all) fun placeBet(
        payment: @{FungibleToken.Vault},
        targetCell: TargetCell,
        multiplier: UFix64,
        player: Address
    ): UInt64 {
        pre {
            !OverflowGame.gamePaused: "Game is currently paused. New bets cannot be placed."
            payment.balance > 0.0: "Bet amount must be greater than zero"
            multiplier >= 1.0: "Multiplier must be at least 1.0"
        }
        
        // Check if player already has an active bet
        if self.activeBetsByPlayer.containsKey(player) {
            let activeBetId = self.activeBetsByPlayer[player]!
            let activeBetRef = &self.bets[activeBetId] as &Bet?
            if activeBetRef != nil && !activeBetRef!.isSettled() {
                panic("Player already has an active bet. Please settle the current bet before placing a new one.")
            }
        }
        
        // Query oracle for current BTC price
        let priceData = MockPriceOracle.getFreshPrice()
        let startPrice = priceData.price
        
        // Get the bet amount from the payment vault
        let betAmount = payment.balance
        
        // Deposit payment into escrow vault
        let escrowVaultRef = self.account.storage.borrow<&FlowToken.Vault>(from: self.EscrowVaultStoragePath)
            ?? panic("Could not borrow reference to Escrow Vault")
        escrowVaultRef.deposit(from: <-payment)
        
        // Generate unique bet ID
        let betId = self.nextBetId
        self.nextBetId = self.nextBetId + 1
        
        // Create new Bet resource
        let bet <- create Bet(
            id: betId,
            player: player,
            amount: betAmount,
            targetCell: targetCell,
            multiplier: multiplier,
            startPrice: startPrice
        )
        
        // Store bet in contract storage
        let oldBet <- self.bets[betId] <- bet
        destroy oldBet
        
        // Track active bet for this player
        self.activeBetsByPlayer[player] = betId
        
        // Get bet reference to emit event with correct data
        let betRef = &self.bets[betId] as &Bet?
        if betRef != nil {
            // Emit BetPlaced event
            emit BetPlaced(
                betId: betId,
                player: player,
                amount: betAmount,
                targetCellId: targetCell.id,
                priceChange: targetCell.priceChange,
                direction: targetCell.direction.rawValue,
                multiplier: multiplier,
                startPrice: startPrice,
                startTime: betRef!.startTime,
                endTime: betRef!.endTime
            )
        }
        
        // Return bet ID
        return betId
    }
    
    /// Deposit FLOW tokens to house balance
    /// Accepts FLOW token payment and deposits it into the escrow vault
    /// @param vault: FlowToken.Vault containing the deposit amount
    /// @return The deposit amount
    /// Requirement 1.1, 1.3
    access(all) fun deposit(vault: @{FungibleToken.Vault}): UFix64 {
        pre {
            vault.balance > 0.0: "Deposit amount must be greater than zero"
        }
        
        let amount = vault.balance
        let userAddress = self.account.address
        
        // Get reference to escrow vault
        let escrowVaultRef = self.account.storage.borrow<&FlowToken.Vault>(from: self.EscrowVaultStoragePath)
            ?? panic("Could not borrow reference to Escrow Vault")
        
        // Deposit into escrow vault
        escrowVaultRef.deposit(from: <-vault)
        
        // Emit Deposit event for API to update Supabase
        emit Deposit(
            userAddress: userAddress,
            amount: amount,
            timestamp: getCurrentBlock().timestamp
        )
        
        return amount
    }
    
    /// Withdraw FLOW tokens from house balance
    /// Withdraws tokens from the escrow vault and returns them to the user
    /// @param amount: Amount of FLOW tokens to withdraw
    /// @return FungibleToken.Vault containing the withdrawn tokens
    /// Requirement 5.2, 5.4
    access(all) fun withdraw(amount: UFix64): @{FungibleToken.Vault} {
        pre {
            amount > 0.0: "Withdrawal amount must be greater than zero"
        }
        
        let userAddress = self.account.address
        
        // Get reference to escrow vault with withdraw authorization
        let escrowVaultRef = self.account.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: self.EscrowVaultStoragePath)
            ?? panic("Could not borrow reference to Escrow Vault")
        
        // Validate sufficient escrow balance
        if escrowVaultRef.balance < amount {
            panic("Insufficient escrow balance for withdrawal")
        }
        
        // Withdraw from escrow vault
        let withdrawnVault <- escrowVaultRef.withdraw(amount: amount)
        
        // Emit Withdrawal event for API to update Supabase
        emit Withdrawal(
            userAddress: userAddress,
            amount: amount,
            timestamp: getCurrentBlock().timestamp
        )
        
        return <-withdrawnVault
    }
    
    /// Place a bet using house balance
    /// Records bet without accepting payment vault (balance deduction happens in API)
    /// @param targetCell: The target cell defining the prediction
    /// @param betAmount: Amount of FLOW tokens being wagered
    /// @param multiplier: Payout multiplier for this bet
    /// @param player: Address of the player placing the bet
    /// @return The unique bet ID
    /// Requirement 3.4
    access(all) fun placeBetFromHouseBalance(
        targetCell: TargetCell,
        betAmount: UFix64,
        multiplier: UFix64,
        player: Address
    ): UInt64 {
        pre {
            !OverflowGame.gamePaused: "Game is currently paused. New bets cannot be placed."
            betAmount > 0.0: "Bet amount must be greater than zero"
            multiplier >= 1.0: "Multiplier must be at least 1.0"
        }
        
        // Check if player already has an active bet
        if self.activeBetsByPlayer.containsKey(player) {
            let activeBetId = self.activeBetsByPlayer[player]!
            let activeBetRef = &self.bets[activeBetId] as &Bet?
            if activeBetRef != nil && !activeBetRef!.isSettled() {
                panic("Player already has an active bet. Please settle the current bet before placing a new one.")
            }
        }
        
        // Query oracle for current BTC price
        let priceData = MockPriceOracle.getFreshPrice()
        let startPrice = priceData.price
        
        // Note: Balance deduction happens in API before this is called
        // Contract just records the bet
        
        // Generate unique bet ID
        let betId = self.nextBetId
        self.nextBetId = self.nextBetId + 1
        
        // Create new Bet resource
        let bet <- create Bet(
            id: betId,
            player: player,
            amount: betAmount,
            targetCell: targetCell,
            multiplier: multiplier,
            startPrice: startPrice
        )
        
        // Store bet in contract storage
        let oldBet <- self.bets[betId] <- bet
        destroy oldBet
        
        // Track active bet for this player
        self.activeBetsByPlayer[player] = betId
        
        // Get bet reference to emit event with correct data
        let betRef = &self.bets[betId] as &Bet?
        if betRef != nil {
            // Emit HouseBetPlaced event
            emit HouseBetPlaced(
                betId: betId,
                userAddress: player,
                betAmount: betAmount,
                targetCellId: targetCell.id,
                priceChange: targetCell.priceChange,
                direction: targetCell.direction.rawValue,
                multiplier: multiplier,
                startPrice: startPrice,
                startTime: betRef!.startTime,
                endTime: betRef!.endTime
            )
        }
        
        // Return bet ID
        return betId
    }
    
    /// Settle a completed round
    /// Determines win/loss based on actual price movement and processes payout
    /// @param betId: The unique identifier of the bet to settle
    /// @param caller: Address of the caller (must be the bet owner)
    /// @return BetResult containing the outcome and payout information
    access(all) fun settleRound(betId: UInt64, caller: Address): BetResult {
        // Get reference to the bet
        let betRef = &self.bets[betId] as &Bet?
        if betRef == nil {
            panic("Bet not found")
        }
        
        let bet = betRef!
        
        // Validate caller is bet owner (Requirement 13.1, Property 31)
        if bet.player != caller {
            panic("Only the bet owner can settle this round")
        }
        
        // Validate bet has not already been settled
        if bet.settled {
            panic("Bet has already been settled")
        }
        
        // Validate round end time has passed (Requirement 10.2, 10.3, Property 19, 20)
        let currentTime = getCurrentBlock().timestamp
        if currentTime < bet.endTime {
            panic("Round has not ended yet. Please wait until the end time.")
        }
        
        // Query oracle for end price (Requirement 5.2)
        let endPriceData = MockPriceOracle.getFreshPrice()
        let endPrice = endPriceData.price
        
        // Calculate price difference (Requirement 6.1, Property 7)
        // actualPriceChange = endPrice - startPrice
        let actualPriceChange = Fix64(endPrice) - Fix64(bet.startPrice)
        
        // Determine win/loss based on target (Requirement 6.2, 6.3, 6.4, Property 8)
        var won = false
        let targetChange = bet.targetCell.priceChange
        let targetDirection = bet.targetCell.direction
        
        if targetDirection == Direction.UP {
            // For UP direction: win if actualPriceChange >= targetChange
            won = actualPriceChange >= targetChange
        } else {
            // For DOWN direction: win if actualPriceChange <= targetChange (negative)
            won = actualPriceChange <= targetChange
        }
        
        // Calculate payout (Requirement 7.1, Property 9)
        var payout: UFix64 = 0.0
        if won {
            // Payout = bet amount * multiplier
            payout = bet.amount * bet.multiplier
        }
        
        // Mark bet as settled (Requirement 6.5)
        bet.markAsSettled()
        
        // Remove from active bets tracking
        self.activeBetsByPlayer.remove(key: bet.player)
        
        // Process payout or loss (Requirement 7.1, 7.2, 7.3, Property 9)
        if won {
            // Transfer payout from escrow to player
            self.transferPayout(betId: betId, recipient: bet.player, amount: payout)
        } else {
            // Transfer bet amount to treasury for losses
            let treasuryRef = self.account.storage.borrow<&Treasury>(from: self.TreasuryStoragePath)
                ?? panic("Could not borrow reference to Treasury")
            treasuryRef.deposit(amount: bet.amount)
        }
        
        // Create result
        let result = BetResult(
            betId: betId,
            won: won,
            actualPriceChange: actualPriceChange,
            payout: payout,
            timestamp: currentTime
        )
        
        // Emit RoundSettled event (Requirement 6.5, Property 33)
        emit RoundSettled(
            betId: betId,
            player: bet.player,
            won: won,
            actualPriceChange: actualPriceChange,
            payout: payout,
            startPrice: bet.startPrice,
            endPrice: endPrice,
            timestamp: currentTime
        )
        
        return result
    }
    
    /// Transfer payout from escrow to player
    /// Handles transfer failures by storing pending payout for retry
    /// @param betId: The bet ID for tracking
    /// @param recipient: Address to receive the payout
    /// @param amount: Amount to transfer
    access(contract) fun transferPayout(betId: UInt64, recipient: Address, amount: UFix64) {
        // Get reference to escrow vault with withdraw authorization
        let escrowVaultRef = self.account.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: self.EscrowVaultStoragePath)
            ?? panic("Could not borrow reference to Escrow Vault")
        
        // Withdraw payout from escrow
        let payoutVault <- escrowVaultRef.withdraw(amount: amount)
        
        // Get recipient's FlowToken receiver capability
        let receiverCap = getAccount(recipient).capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
        
        // Check if receiver capability is valid
        if receiverCap.check() {
            let receiverRef = receiverCap.borrow()!
            
            // Transfer payout to recipient
            receiverRef.deposit(from: <-payoutVault)
            
            // Emit PayoutTransferred event (Requirement 7.4, Property 33)
            emit PayoutTransferred(
                betId: betId,
                recipient: recipient,
                amount: amount,
                timestamp: getCurrentBlock().timestamp
            )
        } else {
            // Receiver capability is invalid - store pending payout for retry (Requirement 7.5, Property 10)
            // Deposit back to escrow
            escrowVaultRef.deposit(from: <-payoutVault)
            
            // Store pending payout
            self.pendingPayouts[betId] = amount
        }
    }
    
    /// Claim a pending payout (retry mechanism)
    /// Allows users to retry claiming their payout if the initial transfer failed
    /// @param betId: The unique identifier of the bet
    /// @param caller: Address of the caller (must be the bet owner)
    access(all) fun claimPayout(betId: UInt64, caller: Address) {
        // Check if there is a pending payout for this bet (Requirement 7.5, Property 10)
        if !self.pendingPayouts.containsKey(betId) {
            panic("No pending payout for this bet")
        }
        
        // Get reference to the bet
        let betRef = &self.bets[betId] as &Bet?
        if betRef == nil {
            panic("Bet not found")
        }
        
        let bet = betRef!
        
        // Validate caller is bet owner
        if bet.player != caller {
            panic("Only the bet owner can claim this payout")
        }
        
        // Validate bet is settled and won
        if !bet.settled {
            panic("Bet has not been settled yet")
        }
        
        // Get the pending payout amount
        let payoutAmount = self.pendingPayouts[betId]!
        
        // Get reference to escrow vault with withdraw authorization
        let escrowVaultRef = self.account.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: self.EscrowVaultStoragePath)
            ?? panic("Could not borrow reference to Escrow Vault")
        
        // Get recipient's FlowToken receiver capability
        let receiverCap = getAccount(caller).capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
        
        // Check if receiver capability is valid before withdrawing
        if !receiverCap.check() {
            panic("Recipient FlowToken receiver capability is still invalid. Please ensure your wallet is properly configured.")
        }
        
        // Withdraw payout from escrow
        let payoutVault <- escrowVaultRef.withdraw(amount: payoutAmount)
        
        let receiverRef = receiverCap.borrow()!
        
        // Transfer payout to recipient
        receiverRef.deposit(from: <-payoutVault)
        
        // Remove from pending payouts
        self.pendingPayouts.remove(key: betId)
        
        // Emit PayoutTransferred event (Requirement 7.4, Property 33)
        emit PayoutTransferred(
            betId: betId,
            recipient: caller,
            amount: payoutAmount,
            timestamp: getCurrentBlock().timestamp
        )
    }
    
    // ========================================
    // Public Functions (for testing)
    // ========================================
    
    /// Create a new Bet resource (for testing purposes)
    /// This function will be replaced with proper bet placement logic in later tasks
    /// @param player: Address of the player placing the bet
    /// @param amount: Amount of FLOW tokens being wagered
    /// @param targetCell: The target cell defining the prediction
    /// @param multiplier: Payout multiplier for this bet
    /// @param startPrice: Current BTC price when bet is placed
    /// @return A new Bet resource
    access(all) fun createBet(
        player: Address,
        amount: UFix64,
        targetCell: TargetCell,
        multiplier: UFix64,
        startPrice: UFix64
    ): @Bet {
        return <- create Bet(
            id: 0, // Test bets use ID 0
            player: player,
            amount: amount,
            targetCell: targetCell,
            multiplier: multiplier,
            startPrice: startPrice
        )
    }
    
    /// Get the current treasury balance
    /// @return The amount of FLOW tokens currently held in the treasury
    access(all) fun getTreasuryBalance(): UFix64 {
        let treasuryRef = self.account.storage.borrow<&Treasury>(from: self.TreasuryStoragePath)
            ?? panic("Could not borrow reference to Treasury")
        
        return treasuryRef.getBalance()
    }
    
    /// Get bet details by bet ID
    /// @param betId: The unique identifier of the bet
    /// @return A reference to the Bet resource, or nil if not found
    access(all) fun getBet(betId: UInt64): &Bet? {
        return &self.bets[betId] as &Bet?
    }
    
    /// Get the active bet ID for a player
    /// @param player: The player's address
    /// @return The bet ID if the player has an active bet, or nil
    access(all) fun getActiveBetId(player: Address): UInt64? {
        return self.activeBetsByPlayer[player]
    }
    
    // ========================================
    // Query Functions (Task 7.1)
    // ========================================
    
    /// Struct containing detailed bet status information
    /// Used to return comprehensive bet information to the frontend
    access(all) struct BetStatusInfo {
        access(all) let betId: UInt64
        access(all) let player: Address
        access(all) let amount: UFix64
        access(all) let targetCellId: UInt8
        access(all) let priceChange: Fix64
        access(all) let direction: UInt8
        access(all) let multiplier: UFix64
        access(all) let startPrice: UFix64
        access(all) let startTime: UFix64
        access(all) let endTime: UFix64
        access(all) let settled: Bool
        access(all) let status: BetStatus
        
        init(
            betId: UInt64,
            player: Address,
            amount: UFix64,
            targetCellId: UInt8,
            priceChange: Fix64,
            direction: UInt8,
            multiplier: UFix64,
            startPrice: UFix64,
            startTime: UFix64,
            endTime: UFix64,
            settled: Bool,
            status: BetStatus
        ) {
            self.betId = betId
            self.player = player
            self.amount = amount
            self.targetCellId = targetCellId
            self.priceChange = priceChange
            self.direction = direction
            self.multiplier = multiplier
            self.startPrice = startPrice
            self.startTime = startTime
            self.endTime = endTime
            self.settled = settled
            self.status = status
        }
    }
    
    /// Struct containing target cell information with multiplier
    /// Used to return available betting targets to the frontend
    access(all) struct TargetCellInfo {
        access(all) let id: UInt8
        access(all) let label: String
        access(all) let priceChange: Fix64
        access(all) let direction: UInt8
        access(all) let multiplier: UFix64
        access(all) let timeframe: UFix64
        
        init(
            id: UInt8,
            label: String,
            priceChange: Fix64,
            direction: UInt8,
            multiplier: UFix64,
            timeframe: UFix64
        ) {
            self.id = id
            self.label = label
            self.priceChange = priceChange
            self.direction = direction
            self.multiplier = multiplier
            self.timeframe = timeframe
        }
    }
    
    /// Get bet status information by bet ID
    /// Returns comprehensive bet details including current status
    /// @param betId: The unique identifier of the bet
    /// @return BetStatusInfo struct with all bet details, or nil if bet not found
    /// Requirement 3.1, 3.5
    access(all) fun getBetStatus(betId: UInt64): BetStatusInfo? {
        let betRef = &self.bets[betId] as &Bet?
        if betRef == nil {
            return nil
        }
        
        let bet = betRef!
        
        // Determine current status
        var status = BetStatus.ACTIVE
        if bet.settled {
            // Check if there's a pending payout (means it was won but transfer failed)
            if self.pendingPayouts.containsKey(betId) {
                status = BetStatus.WON
            } else {
                // Need to determine if it was won or lost
                // For now, we'll mark as WON if payout was successful, LOST otherwise
                // This is a simplification - in a real system we'd track this explicitly
                let currentTime = getCurrentBlock().timestamp
                if currentTime >= bet.endTime {
                    // Bet is settled and past end time
                    // We can't determine win/loss without additional tracking
                    // For now, assume LOST if no pending payout
                    status = BetStatus.LOST
                }
            }
        } else {
            // Bet is not settled yet
            let currentTime = getCurrentBlock().timestamp
            if currentTime >= bet.endTime {
                status = BetStatus.SETTLING
            } else {
                status = BetStatus.ACTIVE
            }
        }
        
        return BetStatusInfo(
            betId: bet.id,
            player: bet.player,
            amount: bet.amount,
            targetCellId: bet.targetCell.id,
            priceChange: bet.targetCell.priceChange,
            direction: bet.targetCell.direction.rawValue,
            multiplier: bet.multiplier,
            startPrice: bet.startPrice,
            startTime: bet.startTime,
            endTime: bet.endTime,
            settled: bet.settled,
            status: status
        )
    }
    
    /// Get available target cells with multipliers
    /// Returns a list of all available betting targets
    /// @return Array of TargetCellInfo structs
    /// Requirement 3.1
    access(all) fun getTargetCells(): [TargetCellInfo] {
        // Define available target cells with their multipliers
        // Based on design document configuration
        return [
            TargetCellInfo(
                id: 1,
                label: "+$5 in 30s",
                priceChange: 5.0,
                direction: Direction.UP.rawValue,
                multiplier: 1.5,
                timeframe: 30.0
            ),
            TargetCellInfo(
                id: 2,
                label: "+$10 in 30s",
                priceChange: 10.0,
                direction: Direction.UP.rawValue,
                multiplier: 2.0,
                timeframe: 30.0
            ),
            TargetCellInfo(
                id: 3,
                label: "+$20 in 30s",
                priceChange: 20.0,
                direction: Direction.UP.rawValue,
                multiplier: 3.0,
                timeframe: 30.0
            ),
            TargetCellInfo(
                id: 4,
                label: "+$50 in 30s",
                priceChange: 50.0,
                direction: Direction.UP.rawValue,
                multiplier: 5.0,
                timeframe: 30.0
            ),
            TargetCellInfo(
                id: 5,
                label: "+$100 in 30s",
                priceChange: 100.0,
                direction: Direction.UP.rawValue,
                multiplier: 10.0,
                timeframe: 30.0
            ),
            TargetCellInfo(
                id: 6,
                label: "-$5 in 30s",
                priceChange: -5.0,
                direction: Direction.DOWN.rawValue,
                multiplier: 1.5,
                timeframe: 30.0
            ),
            TargetCellInfo(
                id: 7,
                label: "-$10 in 30s",
                priceChange: -10.0,
                direction: Direction.DOWN.rawValue,
                multiplier: 2.0,
                timeframe: 30.0
            ),
            TargetCellInfo(
                id: 8,
                label: "-$20 in 30s",
                priceChange: -20.0,
                direction: Direction.DOWN.rawValue,
                multiplier: 3.0,
                timeframe: 30.0
            )
        ]
    }
    
    /// Get the active bet for a user
    /// Returns complete bet status information for the user's active bet
    /// @param player: The player's address
    /// @return BetStatusInfo struct with active bet details, or nil if no active bet
    /// Requirement 3.5
    access(all) fun getUserActiveBet(player: Address): BetStatusInfo? {
        let activeBetId = self.activeBetsByPlayer[player]
        if activeBetId == nil {
            return nil
        }
        
        return self.getBetStatus(betId: activeBetId!)
    }
    
    /// Check if the game is currently paused
    /// @return True if game is paused, false otherwise
    access(all) fun isGamePaused(): Bool {
        return self.gamePaused
    }
    
    /// Get the next bet ID (for testing purposes)
    /// @return The next bet ID that will be assigned
    access(all) fun getNextBetId(): UInt64 {
        return self.nextBetId
    }
    
    /// Check if there is a pending payout for a bet
    /// @param betId: The unique identifier of the bet
    /// @return The pending payout amount, or nil if no pending payout
    access(all) fun getPendingPayout(betId: UInt64): UFix64? {
        return self.pendingPayouts[betId]
    }
    
    /// Borrow a reference to the Treasury (for testing purposes)
    /// This will be restricted to admin access in later tasks
    /// @return A reference to the Treasury resource
    access(all) fun borrowTreasury(): &Treasury {
        return self.account.storage.borrow<&Treasury>(from: self.TreasuryStoragePath)
            ?? panic("Could not borrow reference to Treasury")
    }
    
    /// Test helper function to withdraw from treasury
    /// This will be removed in later tasks when admin access control is implemented
    /// @param amount: Amount to withdraw
    access(all) fun testWithdrawFromTreasury(amount: UFix64) {
        let treasuryRef = self.account.storage.borrow<&Treasury>(from: self.TreasuryStoragePath)
            ?? panic("Could not borrow reference to Treasury")
        
        treasuryRef.withdraw(amount: amount)
    }
    
    // ========================================
    // Contract Initialization
    // ========================================
    
    init() {
        // Set storage paths
        self.TreasuryStoragePath = /storage/OverflowGameTreasury
        self.EscrowVaultStoragePath = /storage/OverflowGameEscrowVault
        self.AdminStoragePath = /storage/OverflowGameAdmin
        
        // Initialize bet counter
        self.nextBetId = 1
        
        // Initialize bets dictionary
        self.bets <- {}
        
        // Initialize active bets tracking
        self.activeBetsByPlayer = {}
        
        // Initialize pending payouts tracking
        self.pendingPayouts = {}
        
        // Initialize game state (not paused)
        self.gamePaused = false
        
        // Create and store the Treasury resource
        let treasury <- create Treasury()
        self.account.storage.save(<-treasury, to: self.TreasuryStoragePath)
        
        // Create and store the Escrow Vault for holding bet funds
        let escrowVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
        self.account.storage.save(<-escrowVault, to: self.EscrowVaultStoragePath)
        
        // Create and store the Admin resource
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
    }
}
