'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { useOverflowStore } from '@/lib/store';

interface WalletDiscoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WalletDiscoveryModal: React.FC<WalletDiscoveryModalProps> = ({ isOpen, onClose }) => {
    const setPreferredNetwork = useOverflowStore(state => state.setPreferredNetwork);
    const setConnectModalOpen = useOverflowStore(state => state.setConnectModalOpen);

    const handleFlowConnect = () => {
        setPreferredNetwork('FLOW');
        onClose();
        setTimeout(() => {
            setConnectModalOpen(true);
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
                        {/* Flow Testnet */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                            <button
                                onClick={handleFlowConnect}
                                className="group relative w-full flex items-center gap-4 p-4 bg-gradient-to-r from-white/5 to-transparent border border-white/5 rounded-2xl hover:border-green-500/30 transition-all duration-300 text-left overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/5 flex items-center justify-center border border-green-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-green-500/10">
                                    <img src="/flow-flow-logo.png" alt="Flow" className="w-7 h-7 object-contain" />
                                </div>

                                <div className="relative flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold text-base tracking-tight">Flow Testnet</h3>
                                        <span className="text-[8px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase">Testnet</span>
                                    </div>
                                    <p className="text-gray-500 text-[11px] mt-0.5 font-medium">Lilico, Blocto, FCL</p>
                                </div>

                                <div className="relative opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                    <svg className="w-5 h-5 text-green-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
