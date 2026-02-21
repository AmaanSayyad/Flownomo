import React, { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useOverflowStore } from '@/lib/store';

export const WalletInfo: React.FC = () => {
  const { network, address, isConnected, walletBalance, refreshWalletBalance } = useOverflowStore();

  // Polling for balance updates
  useEffect(() => {
    if (isConnected && address) {
      refreshWalletBalance();
      const interval = setInterval(() => {
        refreshWalletBalance();
      }, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [isConnected, address, network, refreshWalletBalance]);

  if (!isConnected || !address) {
    return null;
  }

  // Format address
  const formatAddress = (addr: string) => {
    if (addr.length <= 15) return addr;
    return `${addr.slice(0, 7)}...${addr.slice(-5)}`;
  };

  const currencySymbol = 'FLOW';
  const networkName = network === 'FLOW' ? 'Flow Testnet' : 'Demo Network';

  const balance = typeof walletBalance === 'number' ? walletBalance.toFixed(4) : '0.0000';
  const isLoading = false;

  return (
    <Card className="min-w-[200px] border border-white/10 !bg-black/40 backdrop-blur-md">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center p-1 border border-white/10 shrink-0">
            <img
              src="/flow-flow-logo.png"
              alt={networkName}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-mono">{networkName} Address</p>
            <p className="text-white font-mono text-[11px] leading-tight">{formatAddress(address)}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider font-mono">{currencySymbol} Balance</p>
          <div className="flex items-center gap-2">
            <p className="text-[#00f5ff] font-bold text-lg font-mono drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]">
              {isLoading ? 'Loading...' : `${balance}`}
            </p>
            <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">{currencySymbol}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

