/**
 * POST /api/balance/win endpoint
 * 
 * Credits winning amount to user's house balance.
 * Called when a bet is won in the instant-resolution system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { ethers } from 'ethers';

interface WinRequest {
    userAddress: string;
    winAmount: number;
    currency: string;
    betId: string;
}

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body: WinRequest = await request.json();
        const { userAddress, winAmount, currency = 'BNB', betId } = body;

        // Validate required fields
        if (!userAddress || winAmount === undefined || winAmount === null) {
            return NextResponse.json(
                { error: 'Missing required fields: userAddress, winAmount' },
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

        // Validate win amount is positive
        if (winAmount <= 0) {
            return NextResponse.json(
                { error: 'Win amount must be greater than zero' },
                { status: 400 }
            );
        }

        // Call credit_balance_for_payout stored procedure
        const { data, error } = await supabase.rpc('credit_balance_for_payout', {
            p_user_address: userAddress,
            p_payout_amount: winAmount,
            p_currency: currency,
            p_bet_id: betId,
        });

        // Handle database errors
        if (error) {
            console.error('Database error in win credit:', error);
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
                { error: result.error || 'Failed to credit winnings' },
                { status: 400 }
            );
        }

        // Return success with new balance
        return NextResponse.json({
            success: true,
            newBalance: parseFloat(result.new_balance.toString()),
            winAmount: winAmount
        });

    } catch (error) {
        console.error('Unexpected error in POST /api/balance/win:', error);
        return NextResponse.json(
            { error: 'An error occurred processing your request' },
            { status: 500 }
        );
    }
}
