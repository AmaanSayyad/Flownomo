/**
 * GET /api/balance/[address] endpoint
 * Flownomo — Flow network only
 *
 * Returns the current house balance for a Flow wallet address.
 * Handles user not found by returning 0 balance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency') || 'FLOW';

    // Basic presence check — Flow addresses start with 0x
    if (!address || address.length < 3) {
      return NextResponse.json(
        { error: 'Missing wallet address' },
        { status: 400 }
      );
    }

    // Query user_balances table
    const { data, error } = await supabase
      .from('user_balances')
      .select('balance, updated_at')
      .eq('user_address', address)
      .eq('currency', currency)
      .single();

    if (error) {
      // PGRST116 = no rows found → return 0 balance (new user)
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          balance: 0,
          updatedAt: null,
          tier: 'free'
        });
      }

      console.error('Database error fetching balance:', error);
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    // Try to fetch user_tier separately
    let userTier = 'free';
    try {
      const { data: tierData } = await supabase
        .from('user_balances')
        .select('user_tier')
        .eq('user_address', address)
        .eq('currency', currency)
        .single();

      if (tierData && tierData.user_tier) {
        userTier = tierData.user_tier;
      }
    } catch (e) {
      console.warn('Could not fetch user_tier, defaulting to free:', e);
    }

    return NextResponse.json({
      balance: parseFloat(data.balance),
      updatedAt: data.updated_at,
      tier: userTier
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/balance/[address]:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
