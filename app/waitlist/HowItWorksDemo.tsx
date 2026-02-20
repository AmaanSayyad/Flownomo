'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Assets / Icons ---
// Reused from previous code
const CHAINS = [
    { name: 'Solana', id: 'SOL', color: '#9945FF', logo: '/logos/solana-sol-logo.png' },
    { name: 'Sui', id: 'SUI', color: '#4DA2FF', logo: '/logos/sui-logo.png' },
    { name: 'Near', id: 'NEAR', color: '#000000', logo: '/logos/near-logo.svg', bg: 'white' },
    { name: 'BNB', id: 'BNB', color: '#F3BA2F', logo: '/logos/bnb-bnb-logo.png' },
    { name: 'Stellar', id: 'XLM', color: '#7D00FF', logo: '/logos/stellar-xlm-logo.png' },
];

export default function HowItWorksDemo() {
    const [activeFeature, setActiveFeature] = useState(0);

    const features = [
        {
            title: "Multi-Chain Access",
            desc: "Connect instantly with Solana, Sui, Near, BNB, or Stellar. No bridging required.",
            component: <ChainSelectVisual />
        },
        {
            title: "Predict Direction",
            desc: "Choose UP or DOWN. Profit from every market movement in 30-second rounds.",
            component: <ClassicModeVisual />
        },
        {
            title: "Target Multipliers",
            desc: "Use Box Mode to select specific price targets for amplified returns up to 10x.",
            component: <BoxModeVisual />
        },
        {
            title: "Instant Settlement",
            desc: "Wins are settled directly to your house balance. Claim to wallet instantly.",
            component: <SettlementVisual />
        }
    ];

    // Auto-advance tabs
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveFeature(prev => (prev + 1) % features.length);
        }, 4000); // 4 seconds per slide for readability
        return () => clearInterval(timer);
    }, [features.length]);

    return (
        <div className="w-full max-w-[1000px] mx-auto">
            {/* Feature Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {features.map((feature, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveFeature(i)}
                        className={`
                            relative py-6 px-4 rounded-2xl border transition-all duration-300 text-left group overflow-hidden
                            ${activeFeature === i
                                ? 'bg-[#1A1A22] border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]'
                                : 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/10'
                            }
                        `}
                    >
                        <div className={`text-xs font-mono font-bold uppercase tracking-widest mb-3 transition-colors ${activeFeature === i ? 'text-purple-400' : 'text-gray-500'}`}>
                            Step 0{i + 1}
                        </div>
                        <h3 className={`text-lg font-bold mb-2 leading-tight transition-colors ${activeFeature === i ? 'text-white' : 'text-gray-400'}`}>
                            {feature.title}
                        </h3>
                        {/* Shorter desc for tab view */}
                        <div className={`h-1 w-8 rounded-full transition-colors ${activeFeature === i ? 'bg-purple-500' : 'bg-gray-800'}`} />

                        {/* Active Indicator Line */}
                        {activeFeature === i && (
                            <motion.div
                                layoutId="activeLine"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500"
                            />
                        )}

                        {/* Progress Bar for Auto-Advance */}
                        {activeFeature === i && (
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 4, ease: "linear" }}
                                className="absolute bottom-0 left-0 h-1 bg-purple-500 z-10"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Visual Display Container */}
            <div className="relative h-[500px] bg-[#02040A] rounded-3xl border border-white/10 overflow-hidden shadow-2xl group">
                {/* Background Grid - Consistent across all views */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeFeature}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 flex items-center justify-center p-8"
                    >
                        {features[activeFeature].component}
                    </motion.div>
                </AnimatePresence>

                {/* Common Header UI (Static decoration) */}
                <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/20 backdrop-blur-sm z-30 pointer-events-none">
                    <div className="text-xl font-black tracking-tighter text-white" style={{ fontFamily: 'var(--font-orbitron)' }}>BYNOMO</div>
                    <div className="flex gap-3">
                        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-bold text-amber-500 uppercase">Mainnet</div>
                        <div className={`px-3 py-1 border border-white/10 rounded-lg text-xs font-mono text-white flex items-center gap-2 transition-colors ${activeFeature === 0 ? 'bg-purple-500/20 border-purple-500/50' : 'bg-[#15151A]'}`}>
                            <div className={`w-2 h-2 rounded-full ${activeFeature === 0 ? 'bg-purple-400 animate-ping' : 'bg-green-500'}`} />
                            {activeFeature === 0 ? 'Connecting...' : 'Connected'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS (Reusing high-quality assets) ---

function ChainSelectVisual() {
    return (
        <div className="relative w-full h-full flex items-center justify-center pt-16"> {/* added top padding to fix overlap */}
            <div className="w-[320px] bg-[#0C0C10] border border-white/10 rounded-2xl p-6 shadow-2xl relative z-10">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select Network</div>
                <div className="space-y-2">
                    {CHAINS.map((chain, index) => (
                        <motion.div
                            key={chain.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer group ${index === 0 ? 'bg-white/10 border-white/20' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${chain.bg ? 'bg-white p-1' : ''} ${index === 0 ? 'scale-110' : ''}`}>
                                <img src={chain.logo} alt={chain.name} className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <div className={`font-bold text-sm ${index === 0 ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{chain.name}</div>
                                <div className="text-[10px] text-gray-600 font-mono">
                                    {index === 0 ? 'Connected' : 'Available'}
                                </div>
                            </div>
                            {index === 0 && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Decorative Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
    )
}

function ClassicModeVisual() {
    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Abstract Chart Line */}
            <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 800 400" preserveAspectRatio="none">
                <path d="M0,350 Q100,300 200,320 T400,250 T600,200 T800,100" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                <circle cx="800" cy="100" r="4" fill="white" className="animate-pulse" />
            </svg>

            {/* Main Interactive Elements */}
            <div className="relative z-10 flex gap-8 items-center">
                <div className="bg-[#0C0C10]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl w-[280px]">
                    <div className="text-xs font-mono text-gray-500 mb-4 uppercase tracking-wider">Position Entry</div>
                    <div className="flex gap-3 mb-4">
                        <div className="h-16 flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col items-center justify-center group cursor-pointer hover:bg-emerald-500/20 transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <span className="text-emerald-500 text-2xl group-hover:-translate-y-1 transition-transform">▲</span>
                            <span className="text-[10px] uppercase font-black text-emerald-400">Higher</span>
                        </div>
                        <div className="h-16 flex-1 bg-rose-500/10 border border-rose-500/30 rounded-xl flex flex-col items-center justify-center opacity-50">
                            <span className="text-rose-500 text-2xl">▼</span>
                            <span className="text-[10px] uppercase font-black text-rose-400">Lower</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                            <span>Payout</span>
                            <span className="text-emerald-400">1.90x</span>
                        </div>
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="w-[80%] h-full bg-emerald-500 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BoxModeVisual() {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Static Grid Layout */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-0 pointer-events-none opacity-60">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="border border-white/5 flex items-center justify-center">
                        <span className="text-[8px] font-mono text-white/20">x{(1.5 + Math.random()).toFixed(1)}</span>
                    </div>
                ))}
            </div>

            <div className="relative z-10 flex gap-6">
                {/* Visual Target Cell */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-32 h-32 bg-cyan-500/10 border-2 border-cyan-400 rounded-xl flex flex-col items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.2)] animate-pulse"
                >
                    <span className="text-cyan-400 text-3xl font-black mb-1">x2.5</span>
                    <span className="text-cyan-200/50 text-[10px] uppercase tracking-widest font-bold">Target Zone</span>
                </motion.div>

                {/* Explanation Card */}
                <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-5 w-64 self-center">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                        <span className="text-lg">🎯</span>
                        <span className="font-bold text-sm">Precision Targeting</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Drag and select specific price ranges. The harder the target, the higher the payout multiplier.
                    </p>
                </div>
            </div>
        </div>
    );
}

function SettlementVisual() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full gap-8">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl md:text-8xl font-black text-[#4ade80] tracking-widest uppercase drop-shadow-[0_0_40px_rgba(74,222,128,0.4)]"
                style={{ fontFamily: 'var(--font-orbitron)' }}
            >
                WIN
            </motion.div>

            <div className="flex items-center gap-4">
                <div className="bg-[#1A1A22] border border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[300px]">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">
                        💰
                    </div>
                    <div className="flex-1">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total Payout</div>
                        <div className="text-2xl font-mono text-white font-bold flex items-center gap-2">
                            +1.95 <span className="text-purple-400 text-sm">SOL</span>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded text-[10px] text-green-400 font-bold uppercase tracking-wider">
                        Settled
                    </div>
                </div>
            </div>
        </div>
    );
}
