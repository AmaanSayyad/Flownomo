'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CurrencyStat {
    totalBalance: number;
    userCount: number;
}

interface Stats {
    totalVolume: number;
    totalBets: number;
    totalUsers: number;
    platformPnL: number;
    revenue: number;
    currencyStats: Record<string, CurrencyStat>;
}

interface User {
    user_address: string;
    username: string | null;
    currency: string;
    balance: number;
    updated_at: string;
    activity: {
        totalBets: number;
        totalVolume: number;
        wins: number;
    };
    referral?: {
        referral_code: string;
        referral_count: number;
        referred_by: string | null;
    };
}

interface Transaction {
    id: number;
    user_address: string;
    operation_type: 'deposit' | 'withdrawal';
    amount: number;
    currency: string;
    transaction_hash: string;
    created_at: string;
}

interface MarketToken {
    symbol: string;
    pythId: string;
    price: number;
    category: string;
}

interface BetHistory {
    id: string;
    wallet_address: string;
    asset: string;
    direction: 'UP' | 'DOWN';
    amount: number;
    payout: number;
    won: boolean;
    created_at: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [marketTokens, setMarketTokens] = useState<MarketToken[]>([]);
    const [gameHistory, setGameHistory] = useState<BetHistory[]>([]);
    const [suspiciousUsers, setSuspiciousUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'users' | 'financial' | 'markets' | 'gameplay' | 'danger' | 'referrals' | 'waitlist' | 'access_codes'>('users');
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [accessCodes, setAccessCodes] = useState<any[]>([]);

    const [isAuthorized, setIsAuthorized] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [gameplayFilter, setGameplayFilter] = useState<'all' | 'real' | 'demo'>('all');
    const [chainFilter, setChainFilter] = useState<string>('ALL');

    const getExplorerUrl = (currency: string, hash: string) => {
        if (!hash || hash === 'INTERNAL') return null;
        switch (currency.toUpperCase()) {
            case 'BNB': return `https://bscscan.com/tx/${hash}`;
            case 'NEAR': return `https://nearblocks.io/txns/${hash}`;
            case 'SOL': return `https://solscan.io/tx/${hash}`;
            case 'SUI': return `https://suiscan.xyz/tx/${hash}`;
            case 'XTZ': return `https://tzkt.io/${hash}`;
            case 'XLM': return `https://stellar.expert/explorer/public/tx/${hash}`;
            default: return null;
        }
    };

    const exportAccessCodes = () => {
        const headers = ["Access Code", "Status", "Wallet Link", "Authorized At"];
        const rows = accessCodes.map(c => [
            c.code,
            c.is_used ? "Consumed" : "Ready",
            c.wallet_address || "UNLINKED",
            c.used_at ? new Date(c.used_at).toLocaleString() : "---"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `bynomo_access_codes_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const auth = localStorage.getItem('admin_authorized');
        if (auth === 'true') {
            setIsAuthorized(true);
            fetchData();
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === '1704') {
            setIsAuthorized(true);
            localStorage.setItem('admin_authorized', 'true');
            fetchData();
        } else {
            alert('Yanlış şifre!');
        }
    };

    useEffect(() => {
        if (isAuthorized) {
            fetchData();
        }
    }, [isAuthorized]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, txRes, mktRes, gameRes, dangerRes, waitlistRes, accessCodesRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/users'),
                fetch('/api/admin/transactions'),
                fetch('/api/admin/currencies'),
                fetch('/api/admin/game-history'),
                fetch('/api/admin/danger-zone'),
                fetch('/api/admin/waitlist'),
                fetch('/api/admin/access-codes')
            ]);
            if (statsRes.ok) setStats(await statsRes.json());
            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users || []);
            }
            if (txRes.ok) {
                const data = await txRes.json();
                setTransactions(data.transactions || []);
            }
            if (mktRes.ok) {
                const data = await mktRes.json();
                setMarketTokens(data.tokens || []);
            }
            if (gameRes.ok) {
                const data = await gameRes.json();
                setGameHistory(data.bets || []);
            }
            if (dangerRes.ok) {
                const data = await dangerRes.json();
                setSuspiciousUsers(data.suspiciousUsers || []);
            }
            if (waitlistRes.ok) {
                const data = await waitlistRes.json();
                setWaitlist(data.waitlist || []);
            }
            if (accessCodesRes.ok) {
                const data = await accessCodesRes.json();
                setAccessCodes(data.codes || []);
            }
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateAccessCodes = async (count: number = 5) => {
        try {
            const res = await fetch('/api/admin/access-codes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Failed to generate codes:', error);
        }
    };

    const updateUserStatus = async (userAddress: string, status: string) => {
        try {
            const res = await fetch('/api/admin/users/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userAddress, status })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const marketSummary = useMemo(() => {
        const summary: Record<string, number> = {};
        marketTokens.forEach(t => {
            if (!summary[t.category]) summary[t.category] = 0;
            summary[t.category]++;
        });
        return summary;
    }, [marketTokens]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Neural Access</h2>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mt-2">Restricted Area</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="ACCESS KEY"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-white font-mono text-sm tracking-[0.5em] placeholder:tracking-normal placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-white text-black font-bold uppercase tracking-widest text-xs py-3 rounded-xl hover:bg-white/90 transition-colors"
                        >
                            Authorize
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const shortenAddress = (addr: string) => addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : 'N/A';

    return (
        <div className="min-h-screen bg-[#050505] text-[#a0a0a0] p-6 lg:p-12 font-sans selection:bg-white selection:text-black">
            <div className="max-w-[1400px] mx-auto space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <h1 className="text-sm font-bold tracking-[0.3em] text-white uppercase">System Terminal v3.1</h1>
                        </div>
                        <p className="text-4xl md:text-5xl font-black text-white tracking-tighter">Core Operations</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={fetchData}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest transition-all"
                        >
                            {loading ? 'Syncing...' : 'Sync Terminal'}
                        </button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <StatBox title="Platform Yield" value={`$${stats?.platformPnL.toLocaleString() || '0'}`} label="Cumulative PnL" />
                    <StatBox title="Market Volume" value={`$${stats?.totalVolume.toLocaleString() || '0'}`} label={`${stats?.totalBets || 0} Total Bets`} />
                    <StatBox title="Registered Nodes" value={stats?.totalUsers.toString() || '0'} label="Unique Wallet Addresses" />
                    <StatBox title="Total Referrals" value={users.reduce((acc, u) => acc + (u.referral?.referral_count || 0), 0).toString()} label="Network Growth" />
                    <StatBox title="Market Assets" value={marketTokens.length.toString()} label="Active Price Feeds" />
                </div>

                {/* Navigation & Search */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
                        <div className="flex flex-wrap gap-8">
                            <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Ledger" />
                            <TabBtn active={activeTab === 'gameplay'} onClick={() => setActiveTab('gameplay')} label="Gameplay" />
                            <TabBtn active={activeTab === 'financial'} onClick={() => setActiveTab('financial')} label="Financials" />
                            <TabBtn active={activeTab === 'markets'} onClick={() => setActiveTab('markets')} label="Inventory" />
                            <TabBtn active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')} label="Referrals" />
                            <TabBtn active={activeTab === 'waitlist'} onClick={() => setActiveTab('waitlist')} label="Waitlist" />
                            <TabBtn active={activeTab === 'access_codes'} onClick={() => setActiveTab('access_codes')} label="Access Codes" />
                            <TabBtn active={activeTab === 'danger'} onClick={() => setActiveTab('danger')} label="Danger Zone" />
                        </div>
                        <div className="w-full md:w-96 relative">
                            <input
                                type="text"
                                placeholder="Global Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:border-white/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Data Display */}
                    <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <div className="overflow-x-auto">
                            <AnimatePresence mode="wait">
                                {activeTab === 'users' && (
                                    <Table key="users">
                                        <THead labels={['Identity', 'Protocol', 'Liquidity', 'Referral', 'Engagement', 'Value', 'Tier']} />
                                        <tbody>
                                            {loading ? <LoadingRow /> : users
                                                .filter(u => !searchTerm || u.user_address.toLowerCase().includes(searchTerm.toLowerCase()) || (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())))
                                                .map(u => (
                                                    <tr key={u.user_address + u.currency} className="hover:bg-white/[0.02] transition-colors group border-b border-white/5">
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-white text-sm font-bold">{u.username || 'Anonymous'}</span>
                                                                <span className="font-mono text-white/20 text-[10px]">{shortenAddress(u.user_address)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6"><span className="text-[10px] font-black border border-white/10 rounded px-2 py-1 uppercase">{u.currency}</span></td>
                                                        <td className="px-8 py-6 text-white font-mono font-bold">{u.balance.toFixed(4)}</td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-white/60">{u.referral?.referral_code || '---'}</span>
                                                                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{u.referral?.referral_count || 0} REFS</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-white/40">{u.activity.totalBets} plays</td>
                                                        <td className="px-8 py-6 text-white font-mono font-black">${u.activity.totalVolume.toLocaleString()}</td>
                                                        <td className="px-8 py-6 text-right">
                                                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${u.activity.totalVolume > 500 ? 'bg-purple-500/10 text-purple-400' : u.activity.totalVolume > 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-white/20'}`}>
                                                                {u.activity.totalVolume > 500 ? 'VIP' : u.activity.totalVolume > 50 ? 'Standard' : 'Free'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </Table>
                                )}

                                {activeTab === 'gameplay' && (
                                    <div key="gameplay" className="space-y-6">
                                        <div className="p-6 border-b border-white/5 flex flex-wrap gap-6 items-center bg-white/[0.01]">
                                            <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                                                <button
                                                    onClick={() => setGameplayFilter('all')}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${gameplayFilter === 'all' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                                                >
                                                    All Modes
                                                </button>
                                                <button
                                                    onClick={() => setGameplayFilter('real')}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${gameplayFilter === 'real' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-white/40 hover:text-white'}`}
                                                >
                                                    Real Wallet
                                                </button>
                                                <button
                                                    onClick={() => setGameplayFilter('demo')}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${gameplayFilter === 'demo' ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-white/40 hover:text-white'}`}
                                                >
                                                    Demo Mode
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {['BNB', 'NEAR', 'SOL', 'SUI', 'XTZ', 'XLM'].map(chain => (
                                                    <button
                                                        key={chain}
                                                        onClick={() => setChainFilter(prev => prev === chain ? 'ALL' : chain)}
                                                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border transition-all ${chainFilter === chain ? 'bg-white/10 border-white/30 text-white' : 'bg-transparent border-white/5 text-white/30 hover:border-white/20'}`}
                                                    >
                                                        {chain}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <Table>
                                            <THead labels={['Time', 'Asset', 'Direction', 'Wager', 'Outcome', 'Node', 'Account']} />
                                            <tbody>
                                                {loading ? <LoadingRow /> : gameHistory
                                                    .filter(b => {
                                                        const isDemo = b.id.toString().startsWith('demo-');
                                                        if (gameplayFilter === 'real' && isDemo) return false;
                                                        if (gameplayFilter === 'demo' && !isDemo) return false;
                                                        return true;
                                                    })
                                                    .filter(b => chainFilter === 'ALL' || b.id.toString().toUpperCase().includes(chainFilter) || (b as any).network === chainFilter)
                                                    .map(b => {
                                                        const isDemo = b.id.toString().startsWith('demo-');
                                                        return (
                                                            <tr key={b.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                                                                <td className="px-8 py-6 text-[10px] font-mono">{new Date(b.created_at).toLocaleString()}</td>
                                                                <td className="px-8 py-6 font-black text-white">{b.asset}</td>
                                                                <td className="px-8 py-6">
                                                                    <span className={b.direction === 'UP' ? 'text-emerald-400' : 'text-rose-400'}>{b.direction}</span>
                                                                </td>
                                                                <td className="px-8 py-6 text-white font-mono">${b.amount.toFixed(2)}</td>
                                                                <td className="px-8 py-6">
                                                                    <span className={b.won ? 'text-emerald-400 font-bold' : 'text-white/20'}>
                                                                        {b.won ? `+$${b.payout.toFixed(2)}` : '-$' + b.amount.toFixed(2)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-6 font-mono text-[10px]">{shortenAddress(b.wallet_address)}</td>
                                                                <td className="px-8 py-6 text-right">
                                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isDemo ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                                                        {isDemo ? 'Demo' : 'Real'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}

                                {activeTab === 'financial' && (
                                    <Table key="financial">
                                        <THead labels={['Time', 'Identity', 'Operation', 'Amount', 'Ref']} />
                                        <tbody>
                                            {loading ? <LoadingRow /> : transactions.map(t => {
                                                const explorerUrl = getExplorerUrl(t.currency, t.transaction_hash);
                                                return (
                                                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0">
                                                        <td className="px-8 py-6 text-[10px] font-mono">{new Date(t.created_at).toLocaleString()}</td>
                                                        <td className="px-8 py-6 font-mono text-xs">{shortenAddress(t.user_address)}</td>
                                                        <td className="px-8 py-6">
                                                            <span className={t.operation_type === 'deposit' ? 'text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase text-[9px] font-black' : 'text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded uppercase text-[9px] font-black'}>
                                                                {t.operation_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-white font-mono font-bold">{t.operation_type === 'deposit' ? '+' : '-'}{t.amount.toFixed(4)} {t.currency}</td>
                                                        <td className="px-8 py-6 text-right">
                                                            {explorerUrl ? (
                                                                <a
                                                                    href={explorerUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="font-mono text-[10px] text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-400/30"
                                                                >
                                                                    {t.transaction_hash.slice(0, 10)}...
                                                                </a>
                                                            ) : (
                                                                <span className="font-mono text-[10px] text-white/20">{t.transaction_hash || 'INTERNAL'}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                )}

                                {activeTab === 'markets' && (
                                    <div key="markets" className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {Object.entries(marketSummary).map(([cat, count]) => (
                                            <div key={cat} className="p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] space-y-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">{cat}</p>
                                                <div className="flex items-end justify-between">
                                                    <h4 className="text-5xl font-black text-white tracking-tighter">{count}</h4>
                                                    <p className="text-[10px] font-bold text-white/20 uppercase pb-2">Active Feeds</p>
                                                </div>
                                                <div className="w-full h-1 bg-white/5 rounded-full">
                                                    <div className="h-full bg-white/40 rounded-full" style={{ width: `${(count / marketTokens.length) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                        <div className="p-8 bg-white/5 border border-white/20 rounded-[2rem] flex flex-col justify-center">
                                            <p className="text-xs font-bold text-white uppercase tracking-widest text-center mb-1">Total Inventory</p>
                                            <p className="text-4xl font-black text-white text-center tracking-tighter">{marketTokens.length}</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'referrals' && (
                                    <Table key="referrals">
                                        <THead labels={['Identity', 'Personal Code', 'Referred By', 'Network Size', 'Status']} />
                                        <tbody>
                                            {loading ? <LoadingRow /> : users
                                                .filter(u => u.referral?.referral_code && u.referral.referral_code !== 'NONE')
                                                .sort((a, b) => (b.referral?.referral_count || 0) - (a.referral?.referral_count || 0))
                                                .map(u => (
                                                    <tr key={u.user_address} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                                                        <td className="px-8 py-6 font-mono text-white text-sm">{shortenAddress(u.user_address)}</td>
                                                        <td className="px-8 py-6 font-black text-white uppercase tracking-widest">{u.referral?.referral_code}</td>
                                                        <td className="px-8 py-6 text-white/40 font-mono text-xs">{u.referral?.referred_by ? shortenAddress(u.referral.referred_by) : 'DIRECT'}</td>
                                                        <td className="px-8 py-6">
                                                            <span className="text-xl font-black text-white">{u.referral?.referral_count || 0}</span>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${(u.referral?.referral_count || 0) > 10 ? 'text-purple-400 bg-purple-400/10' : (u.referral?.referral_count || 0) > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/20 bg-white/5'}`}>
                                                                {(u.referral?.referral_count || 0) > 10 ? 'Ambassador' : (u.referral?.referral_count || 0) > 0 ? 'Pro' : 'Starter'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </Table>
                                )}

                                {activeTab === 'danger' && (
                                    <Table key="danger">
                                        <THead labels={['Node Identity', 'Max Streak', 'Pattern', 'Current Status', 'Operations']} />
                                        <tbody>
                                            {loading ? <LoadingRow /> : suspiciousUsers.map(u => (
                                                <tr key={u.user_address} className="hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0">
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-white text-sm">{shortenAddress(u.user_address)}</span>
                                                            <span className="text-[10px] text-white/20">Balance: {parseFloat(u.balance).toFixed(4)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-rose-500 font-black text-xl tracking-tighter">{u.maxStreak} wins</span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex gap-1">
                                                            {u.latestBets.map((won: boolean, i: number) => (
                                                                <div key={i} className={`w-1.5 h-4 rounded-full ${won ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500/20'}`} />
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${u.status === 'banned' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' :
                                                            u.status === 'frozen' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                                                                'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                            }`}>
                                                            {u.status || 'active'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {u.status !== 'frozen' && u.status !== 'banned' && (
                                                                <button
                                                                    onClick={() => updateUserStatus(u.user_address, 'frozen')}
                                                                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-[9px] font-bold text-amber-500 uppercase transition-all"
                                                                >
                                                                    Freeze
                                                                </button>
                                                            )}
                                                            {u.status !== 'banned' && (
                                                                <button
                                                                    onClick={() => updateUserStatus(u.user_address, 'banned')}
                                                                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded text-[9px] font-bold text-rose-500 uppercase transition-all"
                                                                >
                                                                    Ban
                                                                </button>
                                                            )}
                                                            {(u.status === 'frozen' || u.status === 'banned') && (
                                                                <button
                                                                    onClick={() => updateUserStatus(u.user_address, 'active')}
                                                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] font-bold text-white uppercase transition-all"
                                                                >
                                                                    Reactivate
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {suspiciousUsers.length === 0 && !loading && (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-32 text-center text-[10px] font-black uppercase tracking-widest text-white/10"> No suspicious activity detected in core neural layers.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                )}

                                {activeTab === 'waitlist' && (
                                    <Table key="waitlist">
                                        <THead labels={['Position', 'Email Instance', 'Timestamp', 'Status']} />
                                        <tbody>
                                            {loading ? <LoadingRow /> : waitlist.map((w, i) => (
                                                <tr key={w.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                                                    <td className="px-8 py-6 font-mono text-white/20 text-[10px]">#{waitlist.length - i}</td>
                                                    <td className="px-8 py-6 font-bold text-white tracking-tight">{w.email}</td>
                                                    <td className="px-8 py-6 text-white/40 text-[10px] uppercase font-mono">{new Date(w.created_at).toLocaleString()}</td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-black uppercase text-white/40">Registered</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}

                                {activeTab === 'access_codes' && (
                                    <div key="access_codes">
                                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Code Generator</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={exportAccessCodes}
                                                    className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black uppercase text-[9px] tracking-widest rounded-lg hover:bg-blue-500/20 transition-all"
                                                >
                                                    Export to Google Sheets (CSV)
                                                </button>
                                                <button
                                                    onClick={() => generateAccessCodes(5)}
                                                    className="px-4 py-2 bg-white text-black font-black uppercase text-[9px] tracking-widest rounded-lg hover:bg-gray-200 transition-all"
                                                >
                                                    Generate 5 Codes
                                                </button>
                                            </div>
                                        </div>
                                        <Table>
                                            <THead labels={['Access Code', 'Status', 'Wallet Link', 'Authorized At']} />
                                            <tbody>
                                                {loading ? <LoadingRow /> : accessCodes.map(c => (
                                                    <tr key={c.code} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                                                        <td className="px-8 py-6 font-mono font-black text-white text-lg tracking-widest uppercase">{c.code}</td>
                                                        <td className="px-8 py-6">
                                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${c.is_used ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                                                {c.is_used ? 'Consumed' : 'Ready'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 font-mono text-[10px] text-white/40">
                                                            {c.wallet_address ? shortenAddress(c.wallet_address) : 'UNLINKED'}
                                                        </td>
                                                        <td className="px-8 py-6 text-right text-white/20 text-[10px] font-mono">
                                                            {c.used_at ? new Date(c.used_at).toLocaleString() : '---'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}

                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Minimal Components
const StatBox = ({ title, value, label }: any) => (
    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">{title}</p>
        <div>
            <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{label}</p>
        </div>
    </div>
);

const TabBtn = ({ active, onClick, label }: any) => (
    <button onClick={onClick} className={`pb-4 text-[10px] font-black uppercase tracking-[0.4em] transition-all border-b-2 ${active ? 'text-white border-white' : 'text-white/20 border-transparent hover:text-white/40'}`}>
        {label}
    </button>
);

const Table = ({ children }: any) => <table className="w-full text-left border-collapse">{children}</table>;

const THead = ({ labels }: { labels: string[] }) => (
    <thead>
        <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
            {labels.map((l, i) => (
                <th key={l} className={`px-8 py-6 ${i === labels.length - 1 ? 'text-right' : ''}`}>{l}</th>
            ))}
        </tr>
    </thead>
);

const LoadingRow = () => (
    <tr><td colSpan={10} className="px-8 py-32 text-center text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Virtual Terminal...</td></tr>
);
