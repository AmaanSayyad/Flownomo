/**
 * API Route: Save a bet result to Supabase
 * POST /api/bets/save
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            id,
            walletAddress,
            asset,
            direction,
            amount,
            multiplier,
            strikePrice,
            endPrice,
            payout,
            won,
            mode,
            network,
        } = body;

        if (!id || !walletAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { error } = await supabase
            .from('bet_history')
            .upsert({
                id,
                wallet_address: walletAddress.toLowerCase(),
                asset: asset || 'BNB',
                direction: direction || 'UP',
                amount: parseFloat(amount) || 0,
                multiplier: parseFloat(multiplier) || 1.9,
                strike_price: parseFloat(strikePrice) || 0,
                end_price: parseFloat(endPrice) || 0,
                payout: parseFloat(payout) || 0,
                won: !!won,
                mode: mode || 'bynomo',
                network: network || 'BNB',
                resolved_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (error) {
            console.error('Supabase bet save error:', error);
            return NextResponse.json({ error: 'Failed to save bet' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving bet:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
