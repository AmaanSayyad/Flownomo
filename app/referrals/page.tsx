'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import GridScan from '@/components/ui/GridScan';
import { useToast } from '@/lib/hooks/useToast';
import { Wallet, Share2, Trophy, Zap, Shield, ChevronRight } from 'lucide-react';

export default function ReferralPage() {
    const {
        address,
        isConnected,
        referralCode,
        referralCount,
        referralLeaderboard,
        isLoadingReferrals,
        fetchReferralLeaderboard,
        fetchReferralInfo
    } = useStore();

    const toast = useToast();
    const [referralLink, setReferralLink] = useState('');

    useEffect(() => {
        fetchReferralLeaderboard();
    }, [fetchReferralLeaderboard]);

    useEffect(() => {
        if (isConnected && address) {
            fetchReferralInfo(address);
        }
    }, [isConnected, address, fetchReferralInfo]);

    useEffect(() => {
        if (referralCode && typeof window !== 'undefined') {
            setReferralLink(`https://bynomo.fun/?ref=${referralCode}`);
        }
    }, [referralCode]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`);
    };

    const formatAddress = (addr: string) => {
        if (!addr) return '---';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const shareOnX = () => {
        const text = encodeURIComponent(`Trade with millisecond precision on @BYNOMOProtocol! 🚀\n\nJoin using my referral link and earn rewards:`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, '_blank');
    };

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

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 pb-32">
                {/* Header Section */}
                <header className="mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-8"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full w-fit">
                                <Share2 className="w-4 h-4 text-purple-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">Growth Protocol v2.0</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase" style={{ fontFamily: 'var(--font-orbitron)' }}>
                                Network <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 text-glow-purple">Referrals</span>
                            </h1>
                            <p className="text-white/30 text-sm font-bold uppercase tracking-widest leading-relaxed max-w-xl">
                                Expand the BYNOMO neural network. Earn 10% from every trade made by your referred nodes.
                            </p>
                        </div>
                    </motion.div>
                </header>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px]">

                    {/* Your Identity Card (Large) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="md:col-span-8 md:row-span-2 relative overflow-hidden bg-[#050505] border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between group"
                    >
                        <div className="relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-10 block">Personal Uplink</span>

                            {isConnected ? (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400/60">Unique Code</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-4xl md:text-6xl font-black tracking-tighter font-mono">{referralCode || '----'}</span>
                                                <button
                                                    onClick={() => copyToClipboard(referralCode || '', 'Code')}
                                                    className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                                                >
                                                    <Share2 className="w-5 h-5 text-white/40" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Referral Link</p>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 truncate text-xs font-mono text-white/40 bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4">
                                                    {referralLink || 'BYNOMO.FUN/?REF=---'}
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(referralLink, 'Link')}
                                                    className="w-12 h-12 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                                                >
                                                    <ChevronRight className="w-5 h-5 text-purple-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={shareOnX}
                                        className="w-full bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] py-6 rounded-3xl hover:bg-white/90 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                    >
                                        Execute Global Broadcast
                                    </button>
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-6">
                                    <p className="text-white/20 font-bold uppercase tracking-widest text-sm">Initialization Required</p>
                                    <button className="px-10 py-4 bg-white/5 border border-white/10 rounded-full font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Link Wallet to Begin</button>
                                </div>
                            )}
                        </div>

                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 blur-[100px] rounded-full group-hover:bg-purple-600/10 transition-colors duration-1000 -mr-32 -mt-32" />
                    </motion.div>

                    {/* Stats Card (Medium) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="md:col-span-4 md:row-span-1 bg-[#050505] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Total Impact</span>
                        <div className="space-y-1">
                            <span className="text-7xl font-black tracking-tighter">{referralCount}</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">Referrals Joined</p>
                        </div>
                    </motion.div>

                    {/* Revenue Card (Medium) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="md:col-span-4 md:row-span-1 bg-purple-600/5 border border-purple-500/20 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">Yield Stream</span>
                        <div className="space-y-1">
                            <span className="text-5xl font-black tracking-tighter text-white">10.0%</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 leading-tight">Protocol Fee Commission</p>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
                    </motion.div>

                    {/* Ranking Card (Vertical Full Height - First 5) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="md:col-span-5 md:row-span-2 bg-[#050505] border border-white/5 rounded-[2.5rem] p-8 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Elite Nodes</span>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                        </div>

                        <div className="space-y-4 flex-1">
                            {referralLeaderboard.slice(0, 5).map((entry, index) => (
                                <div key={entry.user_address} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all">
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xs font-black ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-white/60' : index === 2 ? 'text-orange-400' : 'text-white/20'}`}>
                                            0{index + 1}
                                        </span>
                                        <span className="text-[11px] font-black font-mono tracking-tight uppercase">
                                            {formatAddress(entry.user_address)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-white">{entry.referral_count}</span>
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1.5">Refs</span>
                                    </div>
                                </div>
                            ))}
                            {referralLeaderboard.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-20">
                                    <Trophy className="w-12 h-12 mb-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Registry</span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Rewards/Perks Card (Wide) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="md:col-span-7 md:row-span-1 bg-[#050505] border border-white/5 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-12"
                    >
                        <div className="space-y-4 flex-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Protocol Benefits</span>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center gap-2">
                                    <Zap className="w-6 h-6 text-yellow-400" />
                                    <span className="text-[7px] font-black uppercase tracking-widest text-white/40">Blitz Access</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <Shield className="w-6 h-6 text-blue-400" />
                                    <span className="text-[7px] font-black uppercase tracking-widest text-white/40">Priority Fill</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <Trophy className="w-6 h-6 text-purple-400" />
                                    <span className="text-[7px] font-black uppercase tracking-widest text-white/40">Hall of Fame</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-white/30 leading-relaxed font-bold uppercase tracking-wider">
                                Tiered rewards unlock based on your network growth. Higher volume nodes receive priority execution and reduced withdrawal latencies.
                            </p>
                        </div>
                    </motion.div>

                    {/* Navigation Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="md:col-span-7 md:row-span-1 bg-[#050505] border border-white/[0.02] rounded-[2.5rem] p-10 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02] transition-all"
                        onClick={() => window.location.href = '/'}
                    >
                        <div className="space-y-2">
                            <h4 className="text-2xl font-black tracking-tighter uppercase">Back to Trading Floor</h4>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Execution Terminal v4.0</p>
                        </div>
                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
                            <ChevronRight className="w-6 h-6" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
