'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

export const Leaderboard: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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

    const fetchLeaderboard = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/bets/leaderboard?limit=10');
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
        if (isOpen) {
            fetchLeaderboard();
        }
    }, [isOpen, fetchLeaderboard]);

    // Auto-refresh every 30s when open
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(fetchLeaderboard, 30000);
        return () => clearInterval(interval);
    }, [isOpen, fetchLeaderboard]);

    const shortenAddress = (addr: string) => {
        if (!addr) return '???';
        if (addr.length <= 10) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const getRankEmoji = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    const getRankBg = (index: number) => {
        if (index === 0) return 'from-yellow-500/20 to-amber-600/10 border-yellow-500/40';
        if (index === 1) return 'from-gray-400/15 to-gray-500/10 border-gray-400/30';
        if (index === 2) return 'from-orange-700/15 to-orange-800/10 border-orange-600/30';
        return 'from-white/5 to-transparent border-white/5';
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 sm:px-4 py-2 rounded-full border transition-all duration-300 flex items-center gap-1.5 sm:gap-2 group shadow-lg shrink-0 ${isOpen
                    ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/30'
                    : 'bg-black/60 text-white border-white/10 hover:border-white/30 hover:bg-black/80'
                    }`}
                title="Leaderboard"
            >
                <span className="text-sm">🏆</span>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Leaderboard</span>
            </button>

            {/* Leaderboard Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="fixed bottom-24 sm:bottom-20 right-4 sm:right-20 z-[9999] w-[calc(100vw-32px)] sm:w-80 max-w-sm bg-[#0d0d0d]/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm sm:text-lg">🏆</span>
                                    <h3 className="text-[10px] sm:text-[11px] text-white font-black uppercase tracking-[0.2em]">
                                        Leaderboard
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={fetchLeaderboard}
                                        disabled={isLoading}
                                        className="text-gray-500 hover:text-purple-400 transition-colors p-1"
                                        title="Refresh"
                                    >
                                        <svg className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-gray-500 hover:text-white transition-colors p-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Leaderboard List */}
                            <div className="space-y-1 sm:space-y-1.5 max-h-[300px] sm:max-h-[400px] overflow-y-auto scrollbar-none no-scrollbar">
                                {isLoading && leaderboard.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
                                        <p className="text-gray-500 text-[10px] sm:text-xs">Loading...</p>
                                    </div>
                                ) : leaderboard.length > 0 ? (
                                    leaderboard.map((entry, index) => (
                                        <div
                                            key={entry.wallet_address}
                                            className={`
                                                bg-gradient-to-r ${getRankBg(index)}
                                                border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 transition-all duration-200 hover:brightness-125
                                            `}
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                {/* Rank */}
                                                <div className="w-6 sm:w-8 text-center flex-shrink-0">
                                                    <span className={`text-xs sm:text-sm font-black ${index < 3 ? '' : 'text-gray-500'}`}>
                                                        {getRankEmoji(index)}
                                                    </span>
                                                </div>

                                                {/* Address & Stats */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                                        <img
                                                            src={getNetworkIcon(entry.primary_network)}
                                                            alt={entry.primary_network}
                                                            className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-80"
                                                        />
                                                        <p className="text-white text-[10px] sm:text-xs font-bold font-mono truncate">
                                                            {entry.username || shortenAddress(entry.wallet_address)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 ml-4 sm:ml-5">
                                                        <span className="text-[8px] sm:text-[9px] text-gray-500 font-medium">
                                                            {entry.total_bets} bets
                                                        </span>
                                                        <span className="text-[8px] sm:text-[9px] text-green-400 font-bold">
                                                            {entry.win_rate.toFixed(0)}% WR
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Profit */}
                                                <div className="text-right flex-shrink-0">
                                                    <p className={`text-[10px] sm:text-xs font-black font-mono ${entry.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {entry.net_profit >= 0 ? '+' : ''}{entry.net_profit.toFixed(4)}
                                                    </p>
                                                    <p className="text-[7px] sm:text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                                                        {getCurrencySymbol(entry.primary_network)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center">
                                        <span className="text-2xl sm:text-3xl mb-2 block">🎯</span>
                                        <p className="text-gray-500 text-[10px] sm:text-xs font-bold">No bets yet</p>
                                        <p className="text-gray-600 text-[9px] sm:text-[10px] mt-1">Be the first to make the leaderboard!</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/5">
                                <p className="text-[8px] sm:text-[9px] text-gray-600 text-center font-medium">
                                    Ranked by net profit • Updates every 30s
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
