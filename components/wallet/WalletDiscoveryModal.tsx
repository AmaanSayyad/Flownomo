'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useModal } from 'connectkit';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useOverflowStore } from '@/lib/store';

interface WalletDiscoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WalletDiscoveryModal: React.FC<WalletDiscoveryModalProps> = ({ isOpen, onClose }) => {
    const { setVisible: setSolanaVisible } = useWalletModal();
    const { setOpen: setBNBVisible } = useModal();

    const setPreferredNetwork = useOverflowStore(state => state.setPreferredNetwork);

    const handleBNBConnect = () => {
        setPreferredNetwork('BNB');
        onClose();
        // Use a small timeout to ensure modal closing animation doesn't conflict
        setTimeout(() => {
            setBNBVisible(true);
        }, 100);
    };

    const handleSolanaConnect = () => {
        setPreferredNetwork('SOL');
        onClose();
        setTimeout(() => {
            setSolanaVisible(true);
        }, 100);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Connect Wallet"
        >
            <div className="relative">

                <div className="relative space-y-4">
                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.25em] mb-2 px-1 animate-in fade-in slide-in-from-left-2 duration-500">
                        Available Networks
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                        {/* BNB Smart Chain Selection */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                            <button
                                onClick={handleBNBConnect}
                                className="group relative w-full flex items-center gap-4 p-4 bg-gradient-to-r from-white/5 to-transparent border border-white/5 rounded-2xl hover:border-yellow-500/30 transition-all duration-300 text-left overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 flex items-center justify-center border border-yellow-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-yellow-500/10">
                                    <img src="/logos/bnb-bnb-logo.png" alt="BNB" className="w-7 h-7 object-contain" onError={(e) => (e.currentTarget.src = "https://cryptologos.cc/logos/binance-coin-bnb-logo.png")} />
                                </div>

                                <div className="relative flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold text-base tracking-tight">BNB Chain</h3>
                                        <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold uppercase">Mainnet</span>
                                    </div>
                                    <p className="text-gray-500 text-[11px] mt-0.5 font-medium">MetaMask, Trust, Binance Wallet</p>
                                </div>

                                <div className="relative opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                    <svg className="w-5 h-5 text-yellow-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        </div>

                        {/* Solana Selection */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 delay-100 duration-500 fill-mode-both">
                            <button
                                onClick={handleSolanaConnect}
                                className="group relative w-full flex items-center gap-4 p-4 bg-gradient-to-r from-white/5 to-transparent border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all duration-300 text-left overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/5 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-lg shadow-blue-500/10">
                                    <img src="/logos/solana-sol-logo.png" alt="Solana" className="w-7 h-7 object-contain" onError={(e) => (e.currentTarget.src = "https://cryptologos.cc/logos/solana-sol-logo.png")} />
                                </div>

                                <div className="relative flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold text-base tracking-tight">Solana</h3>
                                        <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase">Mainnet</span>
                                    </div>
                                    <p className="text-gray-500 text-[11px] mt-0.5 font-medium">Phantom, Solflare, Backpack</p>
                                </div>

                                <div className="relative opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                    <svg className="w-5 h-5 text-blue-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
