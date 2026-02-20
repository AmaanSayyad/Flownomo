'use client';

import React from 'react';
import { useOverflowStore } from '@/lib/store';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWalletConnection as useSuiConnection } from '@/lib/sui/wallet';
import { useModal } from 'connectkit';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Globe, ShieldCheck, Mail } from 'lucide-react';

export const WalletConnectModal: React.FC = () => {
    const isOpen = useOverflowStore(state => state.isConnectModalOpen);
    const setOpen = useOverflowStore(state => state.setConnectModalOpen);
    const setPreferredNetwork = useOverflowStore(state => state.setPreferredNetwork);

    const { login: loginPrivy } = usePrivy();
    const { select: selectSolanaWallet } = useWallet();
    const { setVisible: setSolanaModalVisible } = useWalletModal();
    const { connect: connectSui } = useSuiConnection();
    const { setOpen: openConnectKit } = useModal();

    const handlePrivyConnect = () => {
        setPreferredNetwork('BNB');
        loginPrivy();
        setOpen(false);
    };

    const handleWagmiConnect = () => {
        setPreferredNetwork('BNB');
        openConnectKit(true);
        setOpen(false);
    };

    const handleSolanaConnect = () => {
        setPreferredNetwork('SOL');
        setOpen(false);
        // Use the official Solana wallet adapter modal
        setTimeout(() => setSolanaModalVisible(true), 100);
    };

    const handleSuiConnect = () => {
        setPreferredNetwork('SUI');
        connectSui();
        setOpen(false);
    };

    const handleStellarConnect = async () => {
        const { openWalletModal } = await import('@/lib/stellar/wallet-kit');
        const address = await openWalletModal();
        if (address) {
            setPreferredNetwork('XLM');
            useOverflowStore.getState().setNetwork('XLM');
            useOverflowStore.getState().setAddress(address);
            useOverflowStore.getState().setIsConnected(true);
            // Fetch Stellar mainnet XLM balance
            useOverflowStore.getState().refreshWalletBalance();
        }
        setOpen(false);
    };

    const handleTezosConnect = async () => {
        try {
            const { BeaconWallet } = await import('@taquito/beacon-wallet');
            const { NetworkType } = await import('@airgap/beacon-sdk');

            const wallet = new BeaconWallet({
                name: "BYNOMO Protocol",
                preferredNetwork: NetworkType.MAINNET
            });

            await wallet.requestPermissions();
            const address = await wallet.getPKH();

            if (address) {
                setPreferredNetwork('XTZ');
                useOverflowStore.getState().setNetwork('XTZ');
                useOverflowStore.getState().setAddress(address);
                useOverflowStore.getState().setIsConnected(true);
                // Fetch Tezos mainnet XTZ balance
                useOverflowStore.getState().refreshWalletBalance();
                // Fetch Bynomo house balance for Tezos
                useOverflowStore.getState().fetchBalance(address);
            }
        } catch (error) {
            console.error("Tezos connection error:", error);
        }
        setOpen(false);
    };

    const handleNearConnect = async () => {
        setOpen(false);
        try {
            const { connectNearWallet } = await import('@/lib/near/wallet');
            const address = await connectNearWallet() as string;

            if (address) {
                setPreferredNetwork('NEAR');
                useOverflowStore.getState().setNetwork('NEAR');
                useOverflowStore.getState().setAddress(address);
                useOverflowStore.getState().setIsConnected(true);
                // Fetch NEAR house balance
                useOverflowStore.getState().fetchBalance(address);
                // Global balance of the wallet
                useOverflowStore.getState().refreshWalletBalance();
            }
        } catch (error) {
            console.error("NEAR connection error:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md max-h-[90vh] bg-[#0f0f0f] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-transparent shrink-0">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Connect Wallet</h2>
                            <p className="text-[11px] sm:text-sm text-gray-400 mt-1">Select your preferred network</p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                        >
                            <X className="w-5 h-5 text-gray-500 group-hover:text-white" />
                        </button>
                    </div>

                    {/* Options */}
                    <div className="p-4 sm:p-6 space-y-2 sm:space-y-3 overflow-y-auto no-scrollbar">
                        {/* BNB Wagmi Option */}
                        <button
                            onClick={handleWagmiConnect}
                            className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover:scale-110 transition-transform shrink-0">
                                <img src="/logos/bnb-bnb-logo.png" alt="BNB" className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm sm:text-base">Binance Chain</span>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] bg-yellow-500/20 text-yellow-500 font-bold uppercase tracking-wider">BNB</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">MetaMask, Trust, etc.</p>
                            </div>
                            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-yellow-500 transition-colors" />
                        </button>

                        {/* Solana Option */}
                        <button
                            onClick={handleSolanaConnect}
                            className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 group-hover:scale-110 transition-transform shrink-0">
                                <img src="/logos/solana-sol-logo.png" alt="Solana" className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm sm:text-base">Solana</span>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] bg-teal-500/20 text-teal-500 font-bold uppercase tracking-wider">Fast</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Phantom, Backpack, etc.</p>
                            </div>
                            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-teal-500 transition-colors" />
                        </button>

                        {/* Sui Option */}
                        <button
                            onClick={handleSuiConnect}
                            className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform shrink-0">
                                <img src="/logos/sui-logo.png" alt="Sui" className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm sm:text-base">Sui Network</span>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] bg-blue-500/20 text-blue-500 font-bold uppercase tracking-wider">New</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Sui Wallet, BlueMove, etc.</p>
                            </div>
                            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                        </button>

                        {/* Stellar Option */}
                        <button
                            onClick={handleStellarConnect}
                            className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-400/10 flex items-center justify-center border border-blue-400/20 group-hover:scale-110 transition-transform shrink-0">
                                <img src="/logos/stellar-xlm-logo.png" alt="Stellar" className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm sm:text-base">Stellar</span>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] bg-blue-400/20 text-blue-400 font-bold uppercase tracking-wider">XLM</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Freighter, Lobster, etc.</p>
                            </div>
                            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                        </button>

                        {/* Tezos Option */}
                        <button
                            onClick={handleTezosConnect}
                            className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform shrink-0">
                                <img src="/logos/tezos-xtz-logo.png" alt="Tezos" className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm sm:text-base">Tezos</span>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] bg-indigo-500/20 text-indigo-500 font-bold uppercase tracking-wider">XTZ</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Temple, Kukai, etc.</p>
                            </div>
                            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-indigo-500 transition-colors" />
                        </button>

                        {/* NEAR Option */}
                        <button
                            onClick={handleNearConnect}
                            className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-white/5 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform shrink-0">
                                <img src="/logos/near-logo.svg" alt="NEAR" className="w-6 h-6 sm:w-7 sm:h-7 invert brightness-200" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm sm:text-base">NEAR</span>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] bg-white/20 text-white font-bold uppercase tracking-wider">Near</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">MyNearWallet, Meteor, Here, etc.</p>
                            </div>
                            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-white transition-colors" />
                        </button>

                        {/* Privy Social Option */}
                        <button
                            onClick={handlePrivyConnect}
                            className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform shrink-0">
                                <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm sm:text-base">Social Login</span>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] bg-purple-500/20 text-purple-400 font-bold uppercase tracking-wider">Email</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Google, Twitter, Email, etc.</p>
                            </div>
                            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white/5 text-center shrink-0">
                        <p className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            BYNOMO Protocol · Pyth Hermes
                        </p>
                        <p className="text-[9px] text-gray-600 mt-1">Powered by Pyth Hermes · BYNOMO Protocol</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
