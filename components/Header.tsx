'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeaderMenu } from './game/HeaderMenu';
import { WalletConnect } from './wallet';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';

export function Header() {
    const [clickCount, setClickCount] = useState(0);
    const clickTimer = useRef<NodeJS.Timeout | null>(null);
    const [demoActivated, setDemoActivated] = useState(false);
    const pathname = usePathname();

    const {
        setAddress,
        setBalance,
        setIsConnected,
        toggleAccountType,
        accountType,
        accessCode
    } = useStore();

    const activateDemoMode = () => {
        if (accountType === 'demo') {
            // Exit demo mode
            toggleAccountType();
            setAddress(null);
            setIsConnected(false);
            return;
        }

        setAddress('0xDEMO_1234567890');
        setBalance(5000); // Increased demo balance for better testing
        setIsConnected(true);
        if (accountType === 'real') toggleAccountType();
        setDemoActivated(true);
        setTimeout(() => setDemoActivated(false), 2000);
    };

    const handleOverflowClick = () => {
        if (clickTimer.current) clearTimeout(clickTimer.current);
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 3) {
            activateDemoMode();
            setClickCount(0);
        } else {
            clickTimer.current = setTimeout(() => setClickCount(0), 1000);
        }
    };

    return (
        <header className="z-[100] px-4 sm:px-8 py-3 flex justify-between items-center bg-black/40 backdrop-blur-3xl border-b border-white/5">
            <div className="flex items-center gap-4">
                <Link href="/" className="group flex items-center gap-2">
                    <motion.span
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                            // Prevent navigation if clicking for demo mode
                            if (clickCount > 0) e.preventDefault();
                            handleOverflowClick();
                        }}
                        className="text-xl sm:text-2xl font-black tracking-tighter sm:tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-400 to-white cursor-pointer select-none"
                        style={{ fontFamily: 'var(--font-orbitron)' }}
                    >
                        BYNOMO
                    </motion.span>
                </Link>
                {demoActivated && (
                    <span className="text-[8px] font-mono text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded bg-emerald-400/5 animate-pulse uppercase tracking-widest">
                        Demo Activated
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {pathname !== '/' && accessCode !== null && (
                    <button
                        onClick={activateDemoMode}
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full transition-all group"
                    >
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/80 group-hover:text-emerald-400">
                            Demo Mode
                        </span>
                    </button>
                )}

                {pathname === '/' ? (
                    <Link
                        href="/trade"
                        className="px-6 py-2.5 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-full hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        Launch DApp
                    </Link>
                ) : (
                    <>
                        <HeaderMenu />
                        <WalletConnect />
                    </>
                )}
            </div>
        </header>
    );
}
