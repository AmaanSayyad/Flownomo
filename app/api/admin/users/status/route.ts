import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
    try {
        const { userAddress, status } = await request.json();

        if (!userAddress || !status) {
            return NextResponse.json({ error: 'Missing userAddress or status' }, { status: 400 });
        }

        if (!['active', 'frozen', 'banned'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('user_balances')
            .update({ status })
            .eq('user_address', userAddress);

        if (error) throw error;

        return NextResponse.json({ success: true, status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
