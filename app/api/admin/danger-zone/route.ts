import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
    try {
        // Fetch all bet history to calculate streaks
        // In a real app with many bets, this should be an aggregation or more optimized
        const { data: allBets, error: betError } = await supabase
            .from('bet_history')
            .select('wallet_address, won, created_at')
            .order('created_at', { ascending: false });

        if (betError) throw betError;

        // Group bets by user
        const userBets: Record<string, boolean[]> = {};
        allBets?.forEach(b => {
            if (!userBets[b.wallet_address]) {
                userBets[b.wallet_address] = [];
            }
            userBets[b.wallet_address].push(b.won);
        });

        const suspiciousUsers: any[] = [];

        // Identify users with 10+ win streaks
        for (const [address, results] of Object.entries(userBets)) {
            let currentStreak = 0;
            let maxStreak = 0;

            // Results are ordered by created_at DESC, so results[0] is the latest bet
            // We want to check for ANY streak of 10 or current streak of 10?
            // User requested "if a wallet wins 10 times in a row"

            for (const won of results) {
                if (won) {
                    currentStreak++;
                } else {
                    maxStreak = Math.max(maxStreak, currentStreak);
                    currentStreak = 0;
                }
            }
            maxStreak = Math.max(maxStreak, currentStreak);

            if (maxStreak >= 10) {
                // Fetch user details for the suspicious list
                const { data: userData } = await supabase
                    .from('user_balances')
                    .select('*')
                    .eq('user_address', address);

                if (userData && userData.length > 0) {
                    suspiciousUsers.push({
                        ...userData[0],
                        maxStreak,
                        latestBets: results.slice(0, 10) // show last 10 results
                    });
                }
            }
        }

        return NextResponse.json({ suspiciousUsers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
