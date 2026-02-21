/**
 * POST /api/balance/deposit endpoint
 * Flownomo — Flow network only
 *
 * Called after a deposit transaction is confirmed on Flow.
 * Accepts any non-empty address string (Flow addresses start with 0x and are 18 chars,
 * but we keep validation loose since FCL returns normalised addresses).
 * Updates Supabase balance via the update_balance_for_deposit stored procedure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

interface DepositRequest {
  userAddress: string;
  amount: number;
  txHash: string;
  currency?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DepositRequest = await request.json();
    const { userAddress, amount, txHash, currency = 'FLOW' } = body;

    // Validate required fields
    if (!userAddress || amount === undefined || amount === null || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, amount, txHash' },
        { status: 400 }
      );
    }

    // Flow address validation: 0x followed by exactly 16 hex chars (e.g. 0x1234567890abcdef)
    // We accept any non-empty string prefixed with 0x to be forward-compatible with FCL formats.
    const isFlowAddress = /^0x[0-9a-fA-F]+$/.test(userAddress) || userAddress.length > 0;
    if (!isFlowAddress) {
      return NextResponse.json(
        { error: 'Invalid Flow wallet address format' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Deposit amount must be greater than zero' },
        { status: 400 }
      );
    }

    // Call Supabase stored procedure
    const { data, error } = await supabase.rpc('update_balance_for_deposit', {
      p_user_address: userAddress,
      p_deposit_amount: amount,
      p_currency: currency,
      p_transaction_hash: txHash,
    });

    if (error) {
      console.error('Database error in deposit:', error);
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    const result = data as { success: boolean; error: string | null; new_balance: number };

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Deposit failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newBalance: parseFloat(result.new_balance.toString()),
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/balance/deposit:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
