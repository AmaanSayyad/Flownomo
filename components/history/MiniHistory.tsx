'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export const MiniHistory: React.FC = () => {
    const bets = useStore((state) => state.bets);
    const isIndicatorsOpen = useStore((state) => state.isIndicatorsOpen);
    const setIsIndicatorsOpen = useStore((state) => state.setIsIndicatorsOpen);
    const activeIndicators = useStore((state) => state.activeIndicators);
    const [isOpen, setIsOpen] = useState(false);

    // Show only last 10 bets
    const recentBets = bets.slice(0, 10);

    return (
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-[60] flex flex-col items-end gap-2 max-w-[calc(100vw-24px)]">
            {/* Mini History List */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="w-[280px] sm:w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden mb-2"
                    >
                        <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trade History</h4>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {recentBets.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {recentBets.map((bet) => (
                                        <div key={bet.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-white leading-tight">
                                                    {bet.target.label}
                                                </span>
                                                <span className="text-[8px] text-gray-500 font-mono">
                                                    {new Date(bet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <span className={`text-[10px] font-black font-mono ${bet.won ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {bet.won
                                                        ? `+${parseFloat(bet.payout).toFixed(4)}`
                                                        : `-${parseFloat(bet.amount).toFixed(4)}`}
                                                </span>
                                                <span className="text-[8px] text-gray-600 uppercase font-black">
                                                    BNB
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-gray-600 text-[10px] uppercase font-bold tracking-tighter">No History Yet</p>
                                </div>
                            )}
                        </div>

                        {recentBets.length > 0 && (
                            <div className="p-2 bg-black/40 text-center border-t border-white/5">
                                <span className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Showing last 10 trades</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Buttons Row */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar max-w-full pb-1">
                {/* Indicators Toggle */}
                <button
                    onClick={() => setIsIndicatorsOpen(!isIndicatorsOpen)}
                    data-tour="indicators-trigger"
                    className={`px-3 sm:px-4 py-2 rounded-full border transition-all duration-300 flex items-center gap-1.5 sm:gap-2 group shadow-lg shrink-0 ${isIndicatorsOpen || Object.values(activeIndicators).some(v => v)
                        ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/30'
                        : 'bg-black/60 text-white border-white/10 hover:border-white/30 hover:bg-black/80'
                        }`}
                >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Indicators</span>
                    {Object.values(activeIndicators).some(v => v) && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    )}
                </button>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    data-tour="active-bets"
                    className={`px-3 sm:px-4 py-2 rounded-full border transition-all duration-300 flex items-center gap-1.5 sm:gap-2 group shadow-lg shrink-0 ${isOpen
                        ? 'bg-white text-black border-white'
                        : 'bg-black/60 text-white border-white/10 hover:border-white/30 hover:bg-black/80'
                        }`}
                >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">History</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${bets.length > 0 && bets[0].won ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                </button>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
        </div>
    );
};
