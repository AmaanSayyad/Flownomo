'use client';

import React, { useState } from 'react';
import { useOverflowStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import { useToast } from '@/lib/hooks/useToast';

/**
 * BalanceDisplay Component
 * 
 * Displays the user's house balance with controls for deposit and withdrawal
 * 
 * Task: 8.1 Create BalanceDisplay component
 * Requirements: 8.1
 * 
 * Features:
 * - Display current house balance with USDC symbol
 * - Refresh button to fetch latest balance
 * - Deposit and Withdraw buttons with modals
 * - Show loading state while fetching
 * - Format balance to 4 decimal places
 */
export const BalanceDisplay: React.FC = () => {
  const houseBalance = useOverflowStore(state => state.houseBalance);
  const demoBalance = useOverflowStore(state => state.demoBalance);
  const accountType = useOverflowStore(state => state.accountType);
  const network = useOverflowStore(state => state.network);
  const selectedCurrency = useOverflowStore(state => state.selectedCurrency);
  const setSelectedCurrency = useOverflowStore(state => state.setSelectedCurrency);
  const toggleAccountType = useOverflowStore(state => state.toggleAccountType);
  const isLoading = useOverflowStore(state => state.isLoading);
  const address = useOverflowStore(state => state.address);
  const fetchBalance = useOverflowStore(state => state.fetchBalance);
  const updateBalance = useOverflowStore(state => state.updateBalance);
  const toast = useToast();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Actions from other slices (using the unified store)
  const setAddress = useOverflowStore(state => state.setAddress);
  const setIsConnected = useOverflowStore(state => state.setIsConnected);

  /**
   * Exit demo mode and reset demo credentials
   */
  const handleExitDemo = () => {
    toggleAccountType(); // Switch back to 'real'
    setAddress(null);    // Clear 0xDEMO address
    setIsConnected(false); // Logout from demo session
    toast.info('Returned to real account');
  };

  /**
   * Handle refresh button click
   * Fetches the latest balance from the API
   */
  const handleRefresh = async () => {
    if (!address || isLoading) return;

    setIsRefreshing(true);
    try {
      await fetchBalance(address);
      toast.success('Balance refreshed');
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Failed to refresh balance');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Handle deposit button click
   * Opens the deposit modal
   */
  const handleDeposit = () => {
    setIsDepositModalOpen(true);
  };

  /**
   * Handle withdraw button click
   * Opens the withdraw modal
   */
  const handleWithdraw = () => {
    setIsWithdrawModalOpen(true);
  };

  /**
   * Handle successful deposit
   * Refreshes balance and shows success message
   */
  const handleDepositSuccess = async (amount: number, txHash: string) => {
    // Balance is now updated automatically by the store action
  };

  /**
   * Handle successful withdrawal
   * Refreshes balance and shows success message
   */
  const handleWithdrawSuccess = async (amount: number, txHash: string) => {
    // Balance is now updated automatically by the store action
  };

  // Choose balance based on account type
  const activeBalance = accountType === 'real' ? houseBalance : demoBalance;
  const formattedBalance = activeBalance.toFixed(4);

  // Current symbol for display
  const currentSymbol = network === 'SUI' ? 'USDC'
    : (network === 'SOL' ? (selectedCurrency || 'SOL') : network === 'XLM'
      ? 'XLM' : network === 'XTZ' ? 'XTZ' : network === 'NEAR' ? 'NEAR' : 'BNB');

  return (
    <>
      <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
        {/* Secret Demo Header - Only visible when activated via BYNOMO logo click */}
        {accountType === 'demo' && (
          <div className="flex bg-yellow-500/10 p-1 border-b border-yellow-500/20 items-center justify-between px-3">
            <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">
              Demo Mode Active
            </span>
            <button
              onClick={handleExitDemo}
              className="text-[9px] bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/30 transition-colors font-bold uppercase"
            >
              Exit Demo
            </button>
          </div>
        )}

        <div className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${accountType === 'demo' ? 'text-yellow-400' : 'text-purple-400'
              }`}>
              {accountType === 'demo' ? 'Practice Balance' : 'House Balance'}
            </h3>

            <div className="flex items-center gap-2">
              {/* Solana Currency Toggle */}
              {network === 'SOL' && accountType === 'real' && (
                <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                  <button
                    onClick={() => {
                      setSelectedCurrency('SOL');
                      setTimeout(() => fetchBalance(address!), 100);
                    }}
                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${(!selectedCurrency || selectedCurrency === 'SOL')
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-white/40 hover:text-white/60'
                      }`}
                  >
                    SOL
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCurrency('BYNOMO');
                      setTimeout(() => fetchBalance(address!), 100);
                    }}
                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${selectedCurrency === 'BYNOMO'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-white/40 hover:text-white/60'
                      }`}
                  >
                    BYNOMO
                  </button>
                </div>
              )}

              {/* Refresh Button */}
              {accountType === 'real' && (
                <button
                  onClick={handleRefresh}
                  disabled={!address || isLoading || isRefreshing}
                  className="text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Refresh balance"
                >
                  <svg
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Balance Display */}
          <div className={`bg-gradient-to-br rounded-lg p-2.5 border ${accountType === 'demo'
            ? 'from-yellow-500/10 to-transparent border-yellow-500/30'
            : 'from-purple-600/10 to-transparent border-purple-600/30'
            }`}>
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5 font-mono">
              Available Credits
            </p>

            {isLoading && accountType === 'real' ? (
              <div className="flex items-center gap-1.5">
                <div className="animate-pulse bg-white/20 h-6 w-24 rounded" />
                <span className="text-gray-500 text-xs font-mono">Loading...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <img
                    src={
                      currentSymbol === 'BYNOMO' ? '/overflowlogo.png' :
                        network === 'SUI' ? '/logos/sui-logo.png' :
                          network === 'SOL' ? '/logos/solana-sol-logo.png' :
                            network === 'XLM' ? '/logos/stellar-xlm-logo.png' :
                              network === 'XTZ' ? '/logos/tezos-xtz-logo.png' :
                                network === 'NEAR' ? '/logos/near-logo.svg' :
                                  '/logos/bnb-bnb-logo.png'
                    }
                    alt={currentSymbol}
                    className="w-4 h-4 object-contain"
                  />
                  <p className={`text-xl font-bold font-mono ${accountType === 'demo' ? 'text-yellow-400' : 'text-purple-400'}`}>
                    {formattedBalance}
                  </p>
                </div>
                <span className={`text-sm font-mono ${accountType === 'demo' ? 'text-yellow-400/70' : 'text-purple-400/70'}`}>
                  {currentSymbol}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {accountType === 'demo' ? (
              <button
                onClick={() => updateBalance(10000 - demoBalance, 'add')}
                className="col-span-2 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl text-xs font-semibold hover:bg-yellow-500/20 transition-all duration-200"
              >
                Reset Practice Balance
              </button>
            ) : (
              <>
                <Button
                  onClick={handleDeposit}
                  disabled={!address || isLoading}
                  variant="primary"
                  size="sm"
                  className="w-full !px-2 !py-1.5 !text-xs"
                >
                  Deposit
                </Button>

                <Button
                  onClick={handleWithdraw}
                  disabled={!address || isLoading || houseBalance <= 0}
                  variant="secondary"
                  size="sm"
                  className="w-full !px-2 !py-1.5 !text-xs"
                >
                  Withdraw
                </Button>
              </>
            )}
          </div>

          {/* Info Message */}
          {!address && (
            <p className="text-gray-500 text-[10px] text-center font-mono">
              Connect wallet to view balance
            </p>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSuccess={handleDepositSuccess}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSuccess={handleWithdrawSuccess}
      />
    </>
  );
};
