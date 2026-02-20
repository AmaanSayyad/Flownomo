'use client';

import React, { useEffect, useState } from 'react';
import { useOverflowStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SettlementNotification Component
 * Displays a BYNOMO-style popup when a bet is settled (win or loss)
 */
export const SettlementNotification: React.FC = () => {
    const lastResult = useOverflowStore(state => state.lastResult);
    const clearLastResult = useOverflowStore(state => state.clearLastResult);
    const accountType = useOverflowStore(state => state.accountType);
    const network = useOverflowStore(state => state.network);

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (lastResult) {
            setVisible(true);

            // Auto-hide after 3 seconds for a very practical, quick-glance feel
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(clearLastResult, 300);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [lastResult, clearLastResult]);

    return (
        <AnimatePresence>
            {visible && lastResult && (
                <div className="fixed bottom-24 right-6 z-[100] pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 1.1 }}
                        className="relative pointer-events-auto"
                    >
                        <div className={`
                            relative flex items-center gap-3 px-4 py-2 rounded-full border shadow-2xl
                            backdrop-blur-2xl transition-colors duration-500
                            ${lastResult.won
                                ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                : 'border-red-500/50 bg-red-500/10 text-red-400'
                            }
                        `}>
                            {/* Result Indicator Dot */}
                            <div className={`w-2 h-2 rounded-full animate-pulse ${lastResult.won ? 'bg-green-400' : 'bg-red-400'}`} />

                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-tighter leading-none opacity-60">
                                    {(lastResult.currency || (network === 'SOL' ? 'SOL' : network === 'SUI' ? 'USDC' : network === 'XLM' ? 'XLM' : network === 'XTZ' ? 'XTZ' : network === 'NEAR' ? 'NEAR' : 'BNB'))} {lastResult.won ? 'PROFIT' : 'LOSS'}
                                </span>
                                <span className="text-sm font-mono font-black tracking-tight leading-tight">
                                    {lastResult.won ? '+' : '-'}{Math.abs(lastResult.won ? lastResult.payout : lastResult.amount).toFixed(4)} <span className="text-[10px] opacity-70">{(lastResult.currency || (network === 'SOL' ? 'SOL' : network === 'SUI' ? 'USDC' : network === 'XLM' ? 'XLM' : network === 'XTZ' ? 'XTZ' : network === 'NEAR' ? 'NEAR' : 'BNB'))}</span>
                                </span>
                            </div>

                            {/* Minimal Progress Bar (at bottom of the pill) */}
                            <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-white/10 overflow-hidden">
                                <motion.div
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "0%" }}
                                    transition={{ duration: 3, ease: "linear" }}
                                    className={`w-full h-full ${lastResult.won ? 'bg-green-400' : 'bg-red-400'}`}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


