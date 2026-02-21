'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface BetControlsProps {
  selectedTarget: string | null;
  betAmount: string;
  onBetAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
}

export const BetControls: React.FC<BetControlsProps> = ({
  selectedTarget,
  betAmount,
  onBetAmountChange,
  onPlaceBet
}) => {
  const {
    houseBalance,
    network,
    activeRound,
    targetCells,
    isPlacingBet,
    address
  } = useStore();

  const isWalletConnected = !!address;

  const currencySymbol = useMemo(() => {
    return network === 'FLOW' ? 'FLOW' : 'DEMO';
  }, [network]);

  const currencyLogo = useMemo(() => {
    return '/flow-flow-logo.png';
  }, []);

  const [error, setError] = useState<string | null>(null);

  // Get selected target details
  const selectedTargetCell = targetCells.find(cell => cell.id === selectedTarget);

  // Calculate potential payout
  const potentialPayout = selectedTargetCell && betAmount
    ? (parseFloat(betAmount) * selectedTargetCell.multiplier).toFixed(4)
    : '0.0000';

  // Validate bet
  const validateBet = (): boolean => {
    setError(null);

    if (!isWalletConnected) {
      setError('Please connect your wallet');
      return false;
    }

    if (activeRound) {
      setError('Round in progress. Wait for settlement.');
      return false;
    }

    if (!selectedTarget) {
      setError('Please select a target');
      return false;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bet amount');
      return false;
    }

    if (amount > houseBalance) {
      setError(`Insufficient balance. You have ${houseBalance.toFixed(4)} FLOW. Please deposit more.`);
      return false;
    }

    return true;
  };

  const handlePlaceBet = () => {
    if (validateBet()) {
      onPlaceBet();
    }
  };

  // Quick bet amount buttons
  const quickAmounts = ['0.1', '0.5', '1', '5'];

  return (
    <Card>
      <div className="relative overflow-hidden group/panel min-h-[400px] flex flex-col p-4">
        <div className="space-y-4 flex-1">
          <h3 className="text-xl font-bold text-white mb-6">Place Bet</h3>

          {/* House Balance */}
          {isWalletConnected && (
            <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">House Balance</p>
                <p className="text-white text-xl font-black mt-1">{houseBalance.toFixed(4)} FLOW</p>
              </div>
              <img src={currencyLogo} alt="FLOW" className="w-8 h-8 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
            </div>
          )}

          {/* Bet Amount Input */}
          <div className="space-y-3">
            <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Bet Amount (FLOW)</label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => onBetAmountChange(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={!isWalletConnected || !!activeRound}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-mono text-lg focus:outline-none focus:border-neon-blue focus:bg-white/[0.08] transition-all"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => onBetAmountChange(amount)}
                disabled={!isWalletConnected || !!activeRound}
                className="bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-white py-3 rounded-xl text-xs transition-all font-black"
              >
                {amount}
              </button>
            ))}
          </div>

          {/* Selected Target Info */}
          {selectedTargetCell && (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Target Strategy</p>
              <p className="text-white font-black flex items-center gap-2 text-sm">
                {selectedTargetCell.label}
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-black">x{selectedTargetCell.multiplier}</span>
              </p>
            </div>
          )}

          {/* Potential Payout */}
          {selectedTarget && betAmount && parseFloat(betAmount) > 0 && (
            <div className="bg-neon-blue/5 border border-neon-blue/20 rounded-2xl p-4">
              <p className="text-neon-blue/60 text-[10px] font-black uppercase tracking-widest mb-1">Potential Win</p>
              <p className="text-neon-blue text-2xl font-black tracking-tighter">{potentialPayout} FLOW</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
          )}

          {/* Place Bet Button */}
          <Button
            onClick={handlePlaceBet}
            disabled={!isWalletConnected || !!activeRound || isPlacingBet}
            className="w-full py-7 rounded-2xl font-black text-sm uppercase tracking-widest mt-4"
            size="lg"
          >
            {isPlacingBet ? 'Transmitting...' : 'Initiate Trade'}
          </Button>

          {!isWalletConnected && (
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest text-center mt-4">
              Network Connection Required
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
