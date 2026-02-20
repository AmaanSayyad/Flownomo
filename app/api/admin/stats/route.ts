import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
    try {
        // 1. Overall stats
        const { data: volumeData } = await supabase
            .from('bet_history')
            .select('amount, payout, won');

        const totalVolume = volumeData?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;
        const totalPayout = volumeData?.reduce((sum, b) => sum + Number(b.payout), 0) || 0;
        const totalBets = volumeData?.length || 0;
        const platformPnL = totalVolume - totalPayout;

        // 2. User count
        const { count: totalUsers } = await supabase
            .from('user_balances')
            .select('*', { count: 'exact', head: true });

        // 3. Balances per currency
        const { data: balanceData } = await supabase
            .from('user_balances')
            .select('currency, balance');

        const currencyStats: Record<string, { totalBalance: number, userCount: number }> = {};

        balanceData?.forEach(b => {
            if (!currencyStats[b.currency]) {
                currencyStats[b.currency] = { totalBalance: 0, userCount: 0 };
            }
            currencyStats[b.currency].totalBalance += Number(b.balance);
            currencyStats[b.currency].userCount += 1;
        });

        return NextResponse.json({
            totalVolume,
            totalBets,
            totalUsers: totalUsers || 0,
            platformPnL,
            currencyStats,
            revenue: platformPnL // simplified revenue
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
