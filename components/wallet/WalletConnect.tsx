import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useOverflowStore } from '@/lib/store';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useDisconnectWallet as useSuiDisconnect } from '@mysten/dapp-kit';

export const WalletConnect: React.FC = () => {
  const { logout: logoutPrivy, authenticated, user, ready } = usePrivy();
  const { disconnect: disconnectSolana, connected: solanaConnected } = useSolanaWallet();
  const { mutate: disconnectSui } = useSuiDisconnect();

  const { network, address, setConnectModalOpen, disconnect: disconnectStore, setPreferredNetwork } = useOverflowStore();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleDisconnect = () => {
    if (network === 'BNB') logoutPrivy();
    else if (network === 'SOL') disconnectSolana();
    else if (network === 'SUI') disconnectSui();
    else if (network === 'XLM') {
      import('@/lib/stellar/wallet-kit').then(m => m.disconnectWallet());
    }
    // XTZ and NEAR don't need special SDK disconnect

    // Explicitly reset our store state and preference
    disconnectStore();
    setPreferredNetwork(null);
  };

  const getNetworkIcon = () => {
    switch (network) {
      case 'SOL': return '/logos/solana-sol-logo.png';
      case 'SUI': return '/logos/sui-logo.png';
      case 'BNB': return '/logos/bnb-bnb-logo.png';
      case 'XLM': return '/logos/stellar-xlm-logo.png';
      case 'XTZ': return '/logos/tezos-xtz-logo.png';
      case 'NEAR': return '/logos/near-logo.svg';
      default: return '/logos/bnb-bnb-logo.png';
    }
  };

  const getNetworkName = () => {
    switch (network) {
      case 'SOL': return 'SOL';
      case 'SUI': return 'SUI';
      case 'BNB': return 'BNB';
      case 'XLM': return 'XLM';
      case 'XTZ': return 'XTZ';
      case 'NEAR': return 'NEAR';
      default: return 'Connected';
    }
  };

  const isConnected = !!address;

  if (!ready) {
    return (
      <div className="w-20 h-8 bg-white/5 animate-pulse rounded-lg" />
    );
  }

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
                {address ? `${address.slice(0, 4)}...${address.slice(-3)}` : '...'}
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
