/**
 * POST /api/balance/bet endpoint
 * 
 * Task: 4.4 Create POST /api/balance/bet endpoint
 * Requirements: 3.1, 3.2, 7.2
 * 
 * Called when user places a bet from house balance.
 * Validates sufficient balance and deducts bet amount atomically.
 * Note: After Sui migration, game logic is off-chain. No blockchain call needed.
 * Inserts audit log entry with operation_type='bet_placed'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { ethers } from 'ethers';

interface BetRequest {
  userAddress: string;
  betAmount: number;
  currency: string;
  roundId: number;
  targetPrice: number;
  isOver: boolean;
  multiplier: number;
  targetCell: {
    id: number;
    priceChange: number;
    direction: 'UP' | 'DOWN';
    timeframe: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: BetRequest = await request.json();
    const { userAddress, betAmount, currency = 'BNB', roundId, targetPrice, isOver, multiplier, targetCell } = body;

    // Validate required fields
    if (!userAddress || betAmount === undefined || betAmount === null) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, betAmount' },
        { status: 400 }
      );
    }

    // Validate address using utility
    const { isValidAddress } = await import('@/lib/utils/address');
    if (!(await isValidAddress(userAddress))) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate bet amount is positive
    if (betAmount <= 0) {
      return NextResponse.json(
        { error: 'Bet amount must be greater than zero' },
        { status: 400 }
      );
    }

    // Validate multiplier
    if (!multiplier || multiplier < 1.0) {
      return NextResponse.json(
        { error: 'Multiplier must be at least 1.0' },
        { status: 400 }
      );
    }

    // Validate target cell
    if (!targetCell || targetCell.id === undefined || targetCell.id === null || targetCell.priceChange === undefined) {
      return NextResponse.json(
        { error: 'Invalid target cell data' },
        { status: 400 }
      );
    }

    // Call deduct_balance_for_bet stored procedure
    // This procedure handles:
    // - Atomic balance update with row-level locking
    // - Validating user exists
    // - Validating sufficient balance
    // - Inserting audit log entry with operation_type='bet_placed'
    const { data, error } = await supabase.rpc('deduct_balance_for_bet', {
      p_user_address: userAddress,
      p_bet_amount: betAmount,
      p_currency: currency,
    });

    // Handle database errors
    if (error) {
      console.error('Database error in bet placement:', error);
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    // Parse the JSON result from the stored procedure
    const result = data as { success: boolean; error: string | null; new_balance: number };

    // Check if the procedure reported an error
    if (!result.success) {
      // Return specific error message for insufficient balance
      if (result.error === 'Insufficient balance') {
        return NextResponse.json(
          { error: `Insufficient house balance. Please deposit more ${currency}.` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: result.error || 'Bet placement failed' },
        { status: 400 }
      );
    }

    // Balance deducted successfully
    // Note: After Sui migration, game logic is off-chain. No blockchain call needed.
    // The bet is tracked in the database and resolved by the game engine.
    try {
      // Generate a bet ID
      const betId = `bet_${Date.now()}_${userAddress.slice(-6)}`;

      // Log bet placement for debugging
      console.log('Bet placed:', {
        betId,
        userAddress,
        betAmount,
        multiplier,
        targetCell,
      });

      // Return success with remaining balance and bet ID
      return NextResponse.json({
        success: true,
        remainingBalance: parseFloat(result.new_balance.toString()),
        betId,
      });
    } catch (error) {
      // Handle unexpected errors
      console.error('Error generating bet ID:', error);

      return NextResponse.json(
        {
          error: 'Bet placement failed. Your balance will be reconciled.',
          details: 'Please contact support if your balance is not restored.'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in POST /api/balance/bet:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
