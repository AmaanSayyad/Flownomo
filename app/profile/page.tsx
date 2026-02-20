'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useStore, useHouseBalance, useWalletAddress, useIsConnected, useUserTier } from '@/lib/store';
import { Wallet, Trophy, User as UserIcon, History, Link as LinkIcon, Share2, Check, Edit2, Zap, Shield, Crown, LayoutGrid, Activity, ExternalLink, Key, ShieldCheck, ChevronRight } from 'lucide-react';

const TIER_DATA = [
    {
        id: 'free',
        name: 'Free',
        color: 'text-gray-400',
        borderColor: 'border-gray-800',
        bgColor: 'bg-gray-400/5',
        iconComp: Shield,
        assets: 'All',
        blitz: 'Enabled',
        payout: '100.0%',
        withdrawal: 'Instant',
        fee: '2.0%',
        requirement: '$0',
    },
    {
        id: 'standard',
        name: 'Standard',
        color: 'text-amber-400',
        borderColor: 'border-amber-800/30',
        bgColor: 'bg-amber-400/5',
        iconComp: Zap,
        assets: 'All',
        blitz: 'Enabled',
        payout: '100.0%',
        withdrawal: 'Instant',
        fee: '1.75%',
        requirement: '$50',
    },
    {
        id: 'vip',
        name: 'VIP',
        color: 'text-purple-400',
        borderColor: 'border-purple-800/30',
        bgColor: 'bg-purple-400/5',
        iconComp: Crown,
        assets: 'All',
        blitz: 'Enabled',
        payout: '100.0%',
        withdrawal: 'Instant',
        fee: '1.5%',
        requirement: '$500',
    }
];

export default function ProfilePage() {
    const isConnected = useIsConnected();
    const address = useWalletAddress();
    const houseBalance = useHouseBalance();
    const userTier = useUserTier();
    const {
        username,
        updateUsername,
        recentTrades,
        isLoadingTrades,
        referralCode,
        referralCount,
        accessCode,
        network,
        fetchRecentTrades
    } = useStore();

    // Fetch recent trades on mount
    useEffect(() => {
        if (isConnected && address) {
            fetchRecentTrades(address);
        }
    }, [isConnected, address, fetchRecentTrades]);

    const currentTierIndex = TIER_DATA.findIndex(t => t.id === userTier);
    const safeTierIndex = currentTierIndex === -1 ? 0 : currentTierIndex;
    const currentTierData = TIER_DATA[safeTierIndex];
    const nextTier = TIER_DATA[safeTierIndex + 1];

    const [isTierModalOpen, setIsTierModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    useEffect(() => {
        if (username) {
            setNewUsername(username.replace('.bynomo', ''));
        }
    }, [username]);

    const handleUpdateUsername = async () => {
        if (!address || !newUsername) return;
        const formattedUsername = `${newUsername.toLowerCase()}.bynomo`;
        const success = await updateUsername(address, formattedUsername);
        if (success) {
            setIsEditing(false);
        } else {
            alert('Username already taken or invalid.');
        }
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(type);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    if (!isConnected) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-[#02040a] flex flex-col items-center justify-center p-6 text-center text-white"
            >
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8">
                    <Wallet className="w-8 h-8 text-white/40" />
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-4">BYNOMO Registry</h1>
                <p className="text-gray-500 max-w-xs mx-auto text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed mb-8">
                    Synchronization required. Please authorize your wallet to access neural trading identity.
                </p>
                <div className="w-80 h-[1px] bg-white/10" />
            </motion.div>
        );
    }

    const shortenAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#02040a] text-white selection:bg-white selection:text-black pb-20"
        >
            {/* Header / Identity Bar */}
            <motion.div
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="border-b border-white/5 bg-[#050505] sticky top-0 z-40 px-6 py-5"
            >
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center font-black text-2xl text-white/60"
                        >
                            {username ? username[0].toUpperCase() : '?'}
                        </motion.div>
                        <div className="space-y-1">
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 font-bold text-lg text-white focus:outline-none focus:border-white/20"
                                        autoFocus
                                    />
                                    <button onClick={handleUpdateUsername} className="p-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="text-[10px] uppercase font-black text-white/40 hover:text-white ml-2">Cancel</button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 group">
                                    <h1 className="text-2xl font-black tracking-tighter sm:text-3xl">
                                        {username || 'Anonymous Node'}
                                    </h1>
                                    <button onClick={() => setIsEditing(true)} className="p-1.5 opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-white/30 hover:text-white">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-white/40">{shortenAddr(address || '')}</span>
                                <div className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${currentTierData.color}`}>{userTier} STATUS</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Treasury Balance</p>
                            <p className="text-xl font-bold font-mono">{houseBalance.toFixed(2)} <span className="text-xs text-white/40">{network}</span></p>
                        </div>
                        <div className="w-[1px] h-10 bg-white/5 mx-2 hidden md:block" />
                        <Link href="/referrals" className="px-5 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-xl">
                            Referral System
                        </Link>
                    </div>
                </div>
            </motion.div>

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
                {/* Highlights Grid - Enhanced with Tier Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard label="Total Refs" value={referralCount} icon={UserIcon} />
                    <StatCard label="Protocol Status" value="Online" status="emerald" icon={Activity} />
                    <StatCard label="Region" value="Global" icon={LayoutGrid} />
                    <StatCard label="Uptime" value="100%" icon={Zap} />
                    <StatCard
                        label="Governance"
                        value={userTier.toUpperCase()}
                        icon={Shield}
                        status="emerald"
                        clickable
                        purple
                        onClick={() => setIsTierModalOpen(true)}
                    />
                </div>

                {/* Bottom Bento Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Trading Ledger */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-7 bg-[#050505] border border-white/5 rounded-[2rem] overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 flex items-center gap-3">
                                <History className="w-3 h-3" /> Trading Ledger
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.01] text-[9px] uppercase font-black tracking-widest text-white/20">
                                        <th className="px-6 py-4">Asset</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4 text-right">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {isLoadingTrades ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-[9px] uppercase font-black text-white/10 animate-pulse">Neural Link Active...</td></tr>
                                    ) : recentTrades.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-[10px] uppercase font-black text-white/10">No recent activity</td></tr>
                                    ) : (
                                        recentTrades.map((trade, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.01] transition-all group">
                                                <td className="px-6 py-4 text-xs font-bold uppercase">{trade.asset}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border ${trade.direction === 'UP' ? 'text-emerald-400 border-emerald-400/20' : 'text-rose-400 border-rose-400/20'}`}>
                                                        {trade.direction}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-[10px] text-white/30">{trade.amount.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right font-black text-xs">
                                                    <span className={trade.won ? 'text-emerald-400' : 'text-white/10'}>
                                                        {trade.won ? `+${trade.payout.toFixed(2)}` : `-${trade.amount.toFixed(2)}`}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                            <motion.section
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                className="bg-[#050505] border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between"
                            >
                                <div className="space-y-5">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Node Protocol</h2>
                                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between">
                                        <span className="font-mono font-black text-lg tracking-widest text-white/80">{referralCode || '---'}</span>
                                        <button onClick={() => copyToClipboard(referralCode || '', 'Code')} className="text-white/20 hover:text-white transition-all">
                                            {copySuccess === 'Code' ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=Join BYNOMO: ${referralCode}`, '_blank')} className="w-full py-4 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-all">
                                        Share Access
                                    </button>
                                </div>
                            </motion.section>

                            <motion.section
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-emerald-500/[0.02] border border-emerald-500/10 rounded-[2rem] p-6 space-y-4"
                            >
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/40">Security Key</h2>
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                                    <span className="font-mono font-black text-sm text-emerald-400 tracking-[0.2em] truncate mr-4">{accessCode || 'INITIALIZING'}</span>
                                    <ShieldCheck className="w-5 h-5 text-emerald-400/20" />
                                </div>
                                <p className="text-[9px] text-white/20 font-bold leading-relaxed uppercase">Neural verify active. Keep this node key private to prevent breach.</p>
                            </motion.section>
                        </div>
                    </div>
                </div>
            </div>

            {/* Governance Tiers Modal */}
            <AnimatePresence>
                {isTierModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsTierModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl bg-[#0a0a0b] border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_32px_120px_rgba(0,0,0,1)] overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">Governance Protocol</h2>
                                    <h2 className="text-3xl font-black tracking-tighter">Tier Access Rights</h2>
                                </div>
                                <button onClick={() => setIsTierModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                    <Check className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {TIER_DATA.map((t, index) => (
                                    <div
                                        key={t.id}
                                        className={`p-8 rounded-[2rem] border transition-all ${t.id === userTier
                                            ? 'bg-white/[0.04] border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.03)]'
                                            : 'bg-white/[0.01] border-white/5'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-8">
                                            <t.iconComp className={`w-8 h-8 ${t.id === userTier ? t.color : 'text-white/20'}`} />
                                            {t.id === userTier && (
                                                <span className="text-[8px] font-black text-[#00ff88] bg-[#00ff88]/10 px-3 py-1 rounded-full border border-[#00ff88]/20 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black mb-1">{t.name}</h3>
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-10">Neural Access LVL 0{index + 1}</p>

                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Payout</span>
                                                <span className="text-xs font-black text-[#00ff88]">{t.payout}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Blitz</span>
                                                <span className="text-xs font-black text-[#00ff88]">{t.blitz}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Protocol Fee</span>
                                                <span className="text-xs font-black text-[#00ff88]">{t.fee}</span>
                                            </div>
                                            <div className="pt-6 border-t border-white/5">
                                                <p className="text-[8px] font-black text-white/10 uppercase mb-1">Requirement</p>
                                                <p className="font-mono text-lg font-black text-white/40">{t.requirement}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.main>
    );
}

const StatCard = ({ label, value, icon: Icon, status, clickable, onClick, purple }: any) => (
    <motion.div
        whileHover={clickable ? { scale: 1.02, y: -4 } : {}}
        whileTap={clickable ? { scale: 0.98 } : {}}
        onClick={onClick}
        className={`relative overflow-hidden bg-[#050505] border rounded-[2rem] p-8 space-y-4 transition-all group ${purple
            ? 'border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)] bg-gradient-to-br from-[#0a0510] to-[#050505]'
            : 'border-white/5 shadow-xl hover:bg-white/[0.02]'
            } ${clickable ? 'cursor-pointer hover:border-white/20' : ''}`}
    >
        {purple && (
            <motion.div
                animate={{
                    opacity: [0.1, 0.2, 0.1],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-purple-500/10 blur-3xl -z-10"
            />
        )}

        <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${purple ? 'bg-purple-500/20' : 'bg-white/5'
                }`}>
                <Icon className={`w-5 h-5 ${purple ? 'text-purple-400' : 'text-white/30'}`} />
            </div>
            {status && (
                <div className={`w-2 h-2 rounded-full ${status === 'emerald' ? 'bg-[#00ff88] shadow-[0_0_10px_#00ff88]' : 'bg-white/20'
                    }`} />
            )}
        </div>
        <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1.5 ${purple ? 'text-purple-400/40' : 'text-white/20'
                }`}>{label}</p>
            <p className="text-2xl font-black tracking-tight">{value}</p>
        </div>
    </motion.div>
);

const BenefitItem = ({ label, value, colored }: { label: string; value: string; colored?: boolean }) => (
    <div className="flex flex-col">
        <span className="text-[9px] font-black text-white/10 uppercase tracking-widest leading-none mb-2">{label}</span>
        <span className={`text-[11px] font-black uppercase tracking-widest truncate ${colored ? 'text-[#00ff88]' : 'text-white/60'}`}>{value}</span>
    </div>
);
