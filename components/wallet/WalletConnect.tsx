import React from 'react';
import { useOverflowStore } from '@/lib/store';
import * as fcl from "@onflow/fcl";

export const WalletConnect: React.FC = () => {
  const { network, address, setConnectModalOpen, disconnect: disconnectStore, setPreferredNetwork } = useOverflowStore();

  const handleDisconnect = () => {
    fcl.unauthenticate();
    // Explicitly reset our store state and preference
    disconnectStore();
    setPreferredNetwork(null);
  };

  const getNetworkIcon = () => {
    return '/flow-flow-logo.png';
  };

  const getNetworkName = () => {
    return network === 'FLOW' ? 'FLOW' : 'DEMO';
  };

  const isConnected = !!address;

  return (
    <div className="flex items-center gap-3">
      {!isConnected ? (
        <button
          onClick={() => setConnectModalOpen(true)}
          data-tour="connect-button"
          className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all active:scale-95"
        >
          Connect
        </button>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="bg-white/5 border border-white/10 rounded-xl px-2 sm:px-3 py-1.5 flex items-center gap-2 sm:gap-2.5">
            <div className="w-4 h-4 shrink-0">
              <img
                src={getNetworkIcon()}
                alt="Network"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">
                {getNetworkName()}
              </span>
              <span className="text-white text-[10px] sm:text-[11px] font-mono leading-none">
                {address ? `${address.slice(0, 7)}...${address.slice(-5)}` : '...'}
              </span>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all"
            title="Disconnect"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

