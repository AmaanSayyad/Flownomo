'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { ActiveBet } from '@/lib/store/gameSlice';
import { Card } from '@/components/ui/Card';

export const ActiveRound: React.FC = () => {
  const activeBets = useStore((state) => state.activeBets);
  const currentPrice = useStore((state) => state.currentPrice);
  const [now, setNow] = useState(Date.now());

  // Update timer every 100ms
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  // Only show BYNOMO-style (classic) bets that have strikePrice and endTime
  const binomoBets = activeBets.filter(
    (bet): bet is ActiveBet & { strikePrice: number; endTime: number } =>
      bet.strikePrice != null && bet.endTime != null
  );

  if (binomoBets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">Active Trades</h3>

      {binomoBets.map((bet) => {
        const timeLeft = Math.max(0, Math.floor((bet.endTime - now) / 1000));
        const isUp = bet.direction === 'UP';
        const isWinning = isUp ? currentPrice > bet.strikePrice : currentPrice < bet.strikePrice;
        const potentialPayout = (bet.amount * bet.multiplier).toFixed(4);

        return (
          <Card key={bet.id} className={`border ${isWinning ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-rose-500/50 bg-rose-500/5'} transition-colors duration-300`}>
            <div className="space-y-3">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isUp ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {isUp ? 'UP' : 'DOWN'}
                  </span>
                  <span className="text-white font-mono text-sm font-bold">{bet.amount} BNB</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-[10px] font-mono">EXPIRING IN</span>
                  <span className={`text-white font-mono font-bold ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : ''}`}>
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Price Info */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-black/20 p-2 rounded">
                  <p className="text-gray-500 mb-0.5">STRIKE</p>
                  <p className="text-white">${bet.strikePrice.toFixed(2)}</p>
                </div>
                <div className="bg-black/20 p-2 rounded">
                  <p className="text-gray-500 mb-0.5">CURRENT</p>
                  <p className={`font-bold ${isWinning ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${currentPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Payout Info */}
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-tighter">Potential Payout</span>
                <span className={`text-sm font-bold font-mono ${isWinning ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {potentialPayout} BNB
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
