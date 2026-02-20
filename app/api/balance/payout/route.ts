/**
 * POST /api/balance/payout endpoint
 * 
 * Task: 4.5 Create POST /api/balance/payout endpoint
 * Requirements: 4.1, 4.2
 * 
 * Called when a round settles and user wins.
 * Credits payout amount to user's house balance.
 * Inserts audit log entry with operation_type='bet_won'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { ethers } from 'ethers';

interface PayoutRequest {
  userAddress: string;
  payoutAmount: number;
  currency: string;
  betId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: PayoutRequest = await request.json();
    const { userAddress, payoutAmount, currency = 'BNB', betId } = body;

    // Validate required fields
    if (!userAddress || payoutAmount === undefined || payoutAmount === null || !betId) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, payoutAmount, betId' },
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

    // Validate payout amount is positive
    if (payoutAmount <= 0) {
      return NextResponse.json(
        { error: 'Payout amount must be greater than zero' },
        { status: 400 }
      );
    }

    // Call credit_balance_for_payout stored procedure
    // This procedure handles:
    // - Atomic balance update with row-level locking
    // - Creating user record if it doesn't exist
    // - Inserting audit log entry with operation_type='bet_won'
    const { data, error } = await supabase.rpc('credit_balance_for_payout', {
      p_user_address: userAddress,
      p_payout_amount: payoutAmount,
      p_currency: currency,
      p_bet_id: betId,
    });

    // Handle database errors
    if (error) {
      console.error('Database error in payout:', error);
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    // Parse the JSON result from the stored procedure
    const result = data as { success: boolean; error: string | null; new_balance: number };

    // Check if the procedure reported an error
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Payout failed' },
        { status: 400 }
      );
    }

    // Return success with new balance
    return NextResponse.json({
      success: true,
      newBalance: parseFloat(result.new_balance.toString()),
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in POST /api/balance/payout:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
