/**
 * API Route: Leaderboard
 * GET /api/bets/leaderboard?limit=10
 * 
 * Returns top winners ranked by total profit
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // Use a raw SQL query via a Supabase RPC or manual aggregation
        // We'll do it with a simple select + client-side aggregation for flexibility
        const { data, error } = await supabase
            .from('bet_history')
            .select('wallet_address, amount, payout, won, network');

        if (error) {
            console.error('Supabase leaderboard error:', error);
            return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
        }

        // Aggregate per wallet
        const walletStats: Record<string, {
            wallet_address: string;
            total_bets: number;
            wins: number;
            losses: number;
            total_wagered: number;
            total_payout: number;
            net_profit: number;
            networks: Record<string, number>;
        }> = {};

        (data || []).forEach((row: any) => {
            const addr = row.wallet_address;
            const net = row.network || 'BNB';
            if (!walletStats[addr]) {
                walletStats[addr] = {
                    wallet_address: addr,
                    total_bets: 0,
                    wins: 0,
                    losses: 0,
                    total_wagered: 0,
                    total_payout: 0,
                    net_profit: 0,
                    networks: {},
                };
            }
            walletStats[addr].total_bets += 1;
            walletStats[addr].total_wagered += parseFloat(row.amount) || 0;
            walletStats[addr].networks[net] = (walletStats[addr].networks[net] || 0) + 1;

            if (row.won) {
                walletStats[addr].wins += 1;
                walletStats[addr].total_payout += parseFloat(row.payout) || 0;
            } else {
                walletStats[addr].losses += 1;
            }
        });

        // Calculate net profit and sort
        const leaderboard = Object.values(walletStats)
            .map(s => {
                const primary_network = Object.entries(s.networks).sort((a, b) => b[1] - a[1])[0][0];
                return {
                    wallet_address: s.wallet_address,
                    total_bets: s.total_bets,
                    wins: s.wins,
                    losses: s.losses,
                    total_wagered: s.total_wagered,
                    total_payout: s.total_payout,
                    net_profit: s.total_payout - s.total_wagered,
                    win_rate: s.total_bets > 0 ? ((s.wins / s.total_bets) * 100) : 0,
                    primary_network
                };
            })
            .sort((a, b) => b.net_profit - a.net_profit)
            .slice(0, limit);

        // Fetch usernames for the leaderboard entries
        const walletAddresses = leaderboard.map(l => l.wallet_address);
        const { data: profileData } = await supabase
            .from('user_profiles')
            .select('user_address, username')
            .in('user_address', walletAddresses);

        const usernameMap: Record<string, string> = {};
        profileData?.forEach(p => {
            usernameMap[p.user_address] = p.username;
        });

        const leaderboardWithUsernames = leaderboard.map(l => ({
            ...l,
            username: usernameMap[l.wallet_address] || null
        }));

        return NextResponse.json({ leaderboard: leaderboardWithUsernames });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
