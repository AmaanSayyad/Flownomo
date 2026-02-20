'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const STEPS = [
    {
        id: '01',
        phase: 'LIQUIDITY INJECTION',
        title: 'Neural Link & Deposit',
        description: 'Connect your wallet and move assets into the BYNOMO hybrid vault. Your liquidity is secured on-chain while enabling millisecond execution speed.',
        color: 'from-blue-500/20 to-cyan-400/20',
        accent: '#3b82f6'
    },
    {
        id: '02',
        phase: 'PREDICTIVE ANALYSIS',
        title: 'Select Execution Mode',
        description: 'Choose between Classic (2x) or Box Mode (up to 10x). Our high-frequency engine tracks Pyth price feeds with zero latency.',
        color: 'from-purple-500/20 to-pink-400/20',
        accent: '#a855f7'
    },
    {
        id: '03',
        phase: 'MATCHING ENGINE',
        title: 'Neural Round Sync',
        description: 'Once your predict is locked, our neural matching engine pairs your trade against the global treasury liquidity in real-time.',
        color: 'from-amber-500/20 to-orange-400/20',
        accent: '#f59e0b'
    },
    {
        id: '04',
        phase: 'INSTANT SETTLEMENT',
        title: 'Atomic Payouts',
        description: 'At round completion, wins are settled instantly to your account. No waiting for block confirmations to see your updated balance.',
        color: 'from-emerald-500/20 to-teal-400/20',
        accent: '#10b981'
    }
];

export default function HowItWorksSteps() {
    return (
        <section className="w-full max-w-6xl mx-auto px-6 py-32 relative">
            <div className="relative">
                {/* Snake Path Container (Desktop) - Behind cards for glow-through effect */}
                <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none overflow-visible">
                    <svg
                        viewBox="0 0 1000 1000"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full preserve-3d"
                        style={{ overflow: 'visible' }}
                    >
                        {/* Background Static Path - Closed Loop */}
                        <path
                            d="M 200 250 L 800 250 C 950 250 950 750 800 750 L 200 750 C 50 750 50 250 200 250"
                            stroke="white"
                            strokeWidth="2"
                            strokeOpacity="0.05"
                            strokeLinecap="round"
                        />

                        {/* Flowing Light 1 - Slow & Long (Deep Purple) */}
                        <motion.path
                            d="M 200 250 L 800 250 C 950 250 950 750 800 750 L 200 750 C 50 750 50 250 200 250"
                            stroke="#a855f7"
                            strokeWidth="8"
                            strokeLinecap="round"
                            initial={{ pathLength: 0.4, pathOffset: 0 }}
                            animate={{ pathOffset: 1 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="blur-[10px] opacity-20"
                        />

                        {/* Flowing Light 2 - Medium Speed (Electric Purple with White Core) */}
                        <motion.path
                            d="M 200 250 L 800 250 C 950 250 950 750 800 750 L 200 750 C 50 750 50 250 200 250"
                            stroke="url(#snakeGradient)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0.15, pathOffset: 0.3 }}
                            animate={{ pathOffset: 1.3 }}
                            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                            className="drop-shadow-[0_0_15px_#a855f7]"
                        />
                        <motion.path
                            d="M 200 250 L 800 250 C 950 250 950 750 800 750 L 200 750 C 50 750 50 250 200 250"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0.1, pathOffset: 0.3 }}
                            animate={{ pathOffset: 1.3 }}
                            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                            className="drop-shadow-[0_0_8px_#fff] opacity-60"
                        />

                        {/* Flowing Light 3 - Fast Pulse (Subtle) */}
                        <motion.path
                            d="M 200 250 L 800 250 C 950 250 950 750 800 750 L 200 750 C 50 750 50 250 200 250"
                            stroke="#d8b4fe"
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0.05, pathOffset: 0.7 }}
                            animate={{ pathOffset: 1.7 }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            className="blur-[2px] opacity-40"
                        />

                        <defs>
                            <linearGradient id="snakeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#d8b4fe" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-20 gap-y-40 relative z-10">
                    {STEPS.map((step, index) => {
                        const isRight = index === 1 || index === 2; // Step 2 and 3 on the right

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{
                                    duration: 0.8,
                                    delay: index * 0.15,
                                    ease: [0.16, 1, 0.3, 1]
                                }}
                                className={`lg:col-span-6 flex ${isRight ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className="w-full max-w-xl group relative">
                                    {/* Glassmorphism Card with High Blur for Glow-Through */}
                                    <div className="h-full bg-transparent backdrop-blur-[40px] border border-white/10 rounded-[3.5rem] p-12 flex flex-col hover:bg-white/[0.02] hover:border-purple-500/40 transition-all duration-700 relative overflow-hidden group-hover:-translate-y-4 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)]">
                                        {/* Grid Background Pattern */}
                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                                        </div>

                                        <div className="mb-14 relative z-10">
                                            <div className={`inline-flex px-4 py-1.5 rounded-full bg-gradient-to-br ${step.color} border border-white/5 mb-8 shadow-inner`}>
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">
                                                    {step.phase}
                                                </span>
                                            </div>

                                            <h3 className="text-4xl font-black text-white leading-none tracking-tighter mb-6 group-hover:text-purple-100 transition-colors">
                                                {step.title}
                                            </h3>
                                        </div>

                                        <p className="text-white/30 text-base leading-relaxed font-medium pr-10 relative z-10 group-hover:text-white/60 transition-colors">
                                            {step.description}
                                        </p>

                                        {/* Decorative Step ID */}
                                        <span className="absolute -right-8 -bottom-10 text-[200px] font-black text-white/[0.01] select-none group-hover:text-purple-500/[0.03] transition-all duration-1000 italic pointer-events-none">
                                            {step.id}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
