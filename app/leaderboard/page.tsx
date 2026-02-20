'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Activity, Search } from 'lucide-react';
import GridScan from '@/components/ui/GridScan';
import { useStore } from '@/lib/store';

interface LeaderboardEntry {
    wallet_address: string;
    username: string | null;
    total_bets: number;
    wins: number;
    losses: number;
    total_wagered: number;
    total_payout: number;
    net_profit: number;
    win_rate: number;
    primary_network: string;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLeaderboard = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/bets/leaderboard?limit=50');
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.leaderboard || []);
            }
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 60000);
        return () => clearInterval(interval);
    }, [fetchLeaderboard]);

    const getNetworkIcon = (network: string) => {
        switch (network) {
            case 'SOL': return '/logos/solana-sol-logo.png';
            case 'SUI': return '/logos/sui-logo.png';
            case 'BNB': return '/logos/bnb-bnb-logo.png';
            case 'XLM': return '/logos/stellar-xlm-logo.png';
            case 'XTZ': return '/logos/tezos-xtz-logo.png';
            case 'NEAR': return '/logos/near-logo.svg';
            default: return '/logos/bnb-bnb-logo.png';
        }
    };

    const getCurrencySymbol = (network: string) => {
        switch (network) {
            case 'SOL': return 'SOL';
            case 'SUI': return 'USDC';
            case 'BNB': return 'BNB';
            case 'XLM': return 'XLM';
            case 'XTZ': return 'XTZ';
            case 'NEAR': return 'NEAR';
            default: return 'BNB';
        }
    };

    const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const filteredLeaderboard = leaderboard.filter(entry =>
        !searchTerm ||
        (entry.username && entry.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        entry.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-[#02040a] text-white selection:bg-purple-500/30">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none opacity-50">
                <GridScan
                    sensitivity={0.01}
                    lineThickness={1}
                    linesColor="#14141a"
                    gridScale={0.1}
                    scanColor="#A855F7"
                    scanOpacity={0.05}
                    scanDuration={16.0}
                    enablePost
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full w-fit">
                            <Trophy className="w-4 h-4 text-purple-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">Global Hall of Fame</span>
                        </div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-5xl md:text-7xl font-black tracking-tighter uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
                            Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 text-glow-purple">Predicters</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-white/30 text-sm font-bold uppercase tracking-widest leading-relaxed max-w-xl">
                            The elite traders of the BYNOMO protocol. Ranked by net profit across all supported networks.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="relative group w-full md:w-80"
                    >
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="SEARCH TRADER..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-4 font-mono text-[10px] tracking-widest focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.08] transition-all"
                        />
                    </motion.div>
                </div>

                {/* Leaderboard Table */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="bg-[#050505]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] uppercase font-black tracking-widest text-white/20">
                                    <th className="px-10 py-8">Rank</th>
                                    <th className="px-10 py-8">Identity</th>
                                    <th className="px-10 py-8">Volume</th>
                                    <th className="px-10 py-8">Win Rate</th>
                                    <th className="px-10 py-8 text-right">Net Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading && leaderboard.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-40 text-center">
                                            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                                            <p className="text-white/20 font-black uppercase text-[10px] tracking-[0.4em]">Synchronizing Registry...</p>
                                        </td>
                                    </tr>
                                ) : filteredLeaderboard.length > 0 ? (
                                    filteredLeaderboard.map((entry, index) => (
                                        <motion.tr
                                            key={entry.wallet_address}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group hover:bg-white/[0.01] transition-all"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <span className={`text-xl font-black ${index < 3 ? 'text-white' : 'text-white/20'}`}>
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                                        <img
                                                            src={getNetworkIcon(entry.primary_network)}
                                                            alt={entry.primary_network}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                                                            {entry.username || shortenAddress(entry.wallet_address)}
                                                        </p>
                                                        <p className="text-[10px] font-mono text-white/20">{shortenAddress(entry.wallet_address)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-white/60">{entry.total_bets} rounds</p>
                                                    <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-white/20" style={{ width: `${Math.min(100, (entry.total_bets / 100) * 100)}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={`text-sm font-black px-3 py-1 rounded-lg border ${entry.win_rate >= 50 ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : 'text-rose-400 border-rose-400/20 bg-rose-400/5'}`}>
                                                    {entry.win_rate.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="space-y-1">
                                                    <p className={`text-xl font-black font-mono tracking-tighter ${entry.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {entry.net_profit >= 0 ? '+' : ''}{entry.net_profit.toFixed(2)}
                                                    </p>
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                                        {getCurrencySymbol(entry.primary_network)}
                                                    </p>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-40 text-center">
                                            <Activity className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                            <p className="text-white/20 font-black uppercase text-[10px] tracking-[0.4em]">No activity detected in the specified range.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Footer Meta */}
                <div className="mt-12 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-white/10 px-4">
                    <span>Registry Version 4.0.2</span>
                    <span className="animate-pulse">Live Update Active</span>
                </div>
            </div>
        </main>
    );
}
