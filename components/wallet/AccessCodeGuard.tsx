'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOverflowStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';
import { Key, ShieldCheck, Lock, ArrowRight, Loader2, Mail, LogOut, Home } from 'lucide-react';

export const AccessCodeGuard: React.FC = () => {
    const { isConnected, address, accessCode, fetchProfile, disconnect } = useOverflowStore();
    const pathname = usePathname();
    const router = useRouter();
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Only trigger on "play" related routes
        const isPlayRoute = pathname === '/trade' || pathname?.startsWith('/play');

        // Only show modal if on play route, connected but no access code validated
        if (isPlayRoute && isConnected && address && accessCode === null) {
            // Check again from DB just to be sure
            fetchProfile(address).then(() => {
                // If still null after fetch, show modal
                const currentAccessCode = useOverflowStore.getState().accessCode;
                if (currentAccessCode === null) {
                    setShowModal(true);
                } else {
                    setShowModal(false);
                }
            });
        } else {
            setShowModal(false);
        }
    }, [isConnected, address, accessCode, fetchProfile, pathname]);

    const handleValidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue || status === 'loading') return;

        setStatus('loading');
        setErrorMessage('');

        const currentAddress = useOverflowStore.getState().address;

        if (!currentAddress) {
            setStatus('error');
            setErrorMessage('Wallet disconnected. Please reconnect.');
            return;
        }

        try {
            const res = await fetch('/api/validate-access-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: inputValue.trim(),
                    walletAddress: currentAddress
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatus('success');
                // Refresh profile to update global state
                await fetchProfile(currentAddress);
                setTimeout(() => setShowModal(false), 2000);
            } else {
                setStatus('error');
                setErrorMessage(data.error || 'Invalid access code');
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage('Neural connection failed. Try again.');
        }
    };

    if (!showModal) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/95 backdrop-blur-md"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 40 }}
                    className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-t-white/20"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[150px] bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-[80px]" />

                    <div className="relative p-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
                            {status === 'loading' ? (
                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                            ) : status === 'success' ? (
                                <ShieldCheck className="w-10 h-10 text-emerald-400" />
                            ) : (
                                <Lock className="w-10 h-10 text-white/40" />
                            )}
                        </div>

                        <div className="space-y-3 mb-10">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Access Resticted</h2>
                            <p className="text-xs text-white/30 uppercase tracking-[0.3em] font-bold">Protocol Beta Stage v2.0</p>
                        </div>

                        <p className="text-white/40 text-sm font-medium leading-relaxed max-w-sm mb-10">
                            BYNOMO is currently in limited access mode. To initialize your neural trading node, please enter your unique access code.
                        </p>

                        <form onSubmit={handleValidate} className="w-full space-y-6">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                                    placeholder="ENTER ACCESS CODE"
                                    disabled={status === 'loading' || status === 'success'}
                                    className={`relative w-full bg-white/5 border rounded-2xl px-6 py-5 text-center text-white font-mono text-xl tracking-[0.5em] placeholder:tracking-normal placeholder:text-white/10 focus:outline-none transition-all ${status === 'error' ? 'border-rose-500/50 text-rose-500' :
                                        status === 'success' ? 'border-emerald-500/50 text-emerald-500' :
                                            'border-white/10 focus:border-white/20'
                                        }`}
                                />
                            </div>

                            {status === 'error' && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-rose-500 text-[10px] font-black uppercase tracking-widest"
                                >
                                    {errorMessage}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                disabled={!inputValue || status === 'loading' || status === 'success'}
                                className="w-full group relative overflow-hidden bg-white text-black font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {status === 'loading' ? 'Encrypting...' : status === 'success' ? 'Authorized' : 'Initialize Node'}
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </span>
                            </button>
                        </form>

                        <div className="mt-12 pt-8 border-t border-white/5 w-full flex flex-col items-center gap-6">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.push('/')}
                                    className="flex items-center gap-2 text-[10px] text-white/40 hover:text-white font-black uppercase tracking-widest transition-colors"
                                >
                                    <Home className="w-3 h-3" /> Dashboard
                                </button>
                                <div className="w-px h-3 bg-white/10" />
                                <button
                                    onClick={() => disconnect()}
                                    className="flex items-center gap-2 text-[10px] text-rose-500/60 hover:text-rose-500 font-black uppercase tracking-widest transition-colors"
                                >
                                    <LogOut className="w-3 h-3" /> Disconnect
                                </button>
                            </div>

                            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3 h-3" /> No code?
                                <a href="/waitlist" className="text-white hover:text-purple-400 transition-colors border-b border-white/10">Join the Waitlist</a>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
