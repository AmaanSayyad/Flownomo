import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
    try {
        const { data: bets, error } = await supabase
            .from('bet_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        return NextResponse.json({ bets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
