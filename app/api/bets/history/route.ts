/**
 * API Route: Fetch bet history for a wallet
 * GET /api/bets/history?wallet=0x...&limit=50
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('bet_history')
            .select('*')
            .eq('wallet_address', wallet.toLowerCase())
            .order('resolved_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Supabase fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
        }

        return NextResponse.json({ bets: data || [] });
    } catch (error) {
        console.error('Error fetching bet history:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
