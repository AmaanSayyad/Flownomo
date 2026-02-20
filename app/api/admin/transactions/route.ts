import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
    try {
        // Fetch recent deposits and withdrawals from audit log
        const { data: transactions, error } = await supabase
            .from('balance_audit_log')
            .select('*')
            .in('operation_type', ['deposit', 'withdrawal'])
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ transactions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
