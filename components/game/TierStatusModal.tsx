'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserTier } from '@/lib/store';

interface TierStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TIER_DATA = [
    {
        id: 'free',
        name: 'Free',
        color: 'from-gray-400 to-gray-600',
        icon: '△',
        assets: 'All',
        blitz: true,
        payout: '80%',
        withdrawal: 'Instant',
        fee: '2.0%',
        requirement: '$0',
    },
    {
        id: 'standard',
        name: 'Standard',
        color: 'from-amber-400 to-amber-600',
        icon: '♢',
        assets: 'All',
        blitz: true,
        payout: '85%',
        withdrawal: 'Instant',
        fee: '1.75%',
        requirement: '$50',
    },
    {
        id: 'vip',
        name: 'VIP',
        color: 'from-purple-400 to-purple-600',
        icon: '⬢',
        assets: 'All',
        blitz: true,
        payout: '90%',
        withdrawal: 'Instant',
        fee: '1.5%',
        requirement: '$500',
    }
];

export const TierStatusModal: React.FC<TierStatusModalProps> = ({ isOpen, onClose }) => {
    const currentTier = useUserTier();

    const currentTierIndex = TIER_DATA.findIndex(t => t.id === currentTier);
    const nextTier = TIER_DATA[currentTierIndex + 1];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl max-h-[90vh] bg-[#0d0d0d] border border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 sm:p-8 border-b border-white/5 shrink-0">
                            <button
                                onClick={onClose}
                                className="text-amber-400 text-sm sm:text-base font-bold hover:text-amber-300 transition-colors"
                            >
                                Close
                            </button>
                            <h2 className="text-white text-base sm:text-xl font-black uppercase tracking-widest">Your Status</h2>
                            <div className="w-12" /> {/* Spacer */}
                        </div>

                        <div className="p-4 sm:p-8 overflow-y-auto no-scrollbar">
                            {/* Progress Card */}
                            {nextTier && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-8 sm:mb-12 flex items-center gap-4 sm:gap-6">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl sm:text-3xl shadow-lg shadow-amber-500/20">
                                        {nextTier.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-white text-sm sm:text-lg font-bold">{nextTier.requirement} until</h3>
                                        <p className="text-gray-400 text-xs sm:text-sm">{nextTier.name} status</p>
                                    </div>
                                </div>
                            )}

                            {/* Tiers Progress Line */}
                            <div className="relative flex justify-between px-2 sm:px-4 mb-8 sm:mb-12">
                                <div className="absolute top-[1.25rem] left-4 right-4 h-0.5 bg-white/10 z-0" />
                                <div
                                    className="absolute top-[1.25rem] left-4 h-0.5 bg-amber-400 z-0 transition-all duration-1000"
                                    style={{ width: `calc(${(currentTierIndex / (TIER_DATA.length - 1)) * 100}% - 8px)` }}
                                />

                                {TIER_DATA.map((tier, idx) => (
                                    <div key={tier.id} className="relative z-10 flex flex-col items-center gap-2 sm:gap-4">
                                        <div className={`text-xl sm:text-2xl mb-1 ${idx <= currentTierIndex ? 'text-amber-400' : 'text-gray-600'}`}>
                                            {tier.icon}
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className={`text-[10px] sm:text-sm font-black uppercase tracking-tighter ${idx === currentTierIndex ? 'text-white' : 'text-gray-500'}`}>
                                                {tier.name}
                                            </span>
                                            {idx === currentTierIndex && (
                                                <span className="text-[8px] sm:text-[10px] text-amber-400 font-bold mt-0.5 sm:mt-1">Your Status</span>
                                            )}
                                        </div>
                                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 ${idx <= currentTierIndex ? 'bg-amber-400 border-amber-400' : 'bg-[#0d0d0d] border-white/20'}`}>
                                            {idx <= currentTierIndex && (
                                                <div className="w-full h-full flex items-center justify-center text-[6px] sm:text-[8px] text-black">✓</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Comparison Table */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 px-2 sm:px-4 text-[8px] sm:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 sm:mb-4">
                                    <div>Feature</div>
                                    {TIER_DATA.map(t => (
                                        <div key={t.id} className="text-center">{t.name}</div>
                                    ))}
                                </div>

                                {[
                                    { label: 'Assets', key: 'assets' },
                                    { label: 'Blitz Mode', key: 'blitz', type: 'bool' },
                                    { label: 'Max Payout', key: 'payout' },
                                    { label: 'Withdrawal', key: 'withdrawal' },
                                    { label: 'Fee', key: 'fee' },
                                ].map((row, i) => (
                                    <div key={i} className="grid grid-cols-4 px-2 sm:px-4 py-3 sm:py-4 bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl items-center">
                                        <div className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">{row.label}</div>
                                        {TIER_DATA.map(t => (
                                            <div key={t.id} className="text-center text-[10px] sm:text-xs font-bold text-white">
                                                {row.type === 'bool' ? (
                                                    t[row.key as keyof typeof t] ? '✓' : '—'
                                                ) : (
                                                    t[row.key as keyof typeof t]
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
