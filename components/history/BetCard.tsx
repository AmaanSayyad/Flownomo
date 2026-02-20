'use client';

import React from 'react';
import { BetRecord } from '@/types/bet';

interface BetCardProps {
  bet: BetRecord;
  isExpanded: boolean;
  onToggle: () => void;
}

export const BetCard: React.FC<BetCardProps> = ({ bet, isExpanded, onToggle }) => {
  const isSettled = bet.endPrice > 0;
  const isActive = !isSettled;

  // Format timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`
        border rounded-lg transition-all cursor-pointer
        ${isSettled
          ? bet.won
            ? 'border-green-500/50 bg-green-900/10 hover:bg-green-900/20'
            : 'border-red-500/50 bg-red-900/10 hover:bg-red-900/20'
          : 'border-yellow-500/50 bg-yellow-900/10 hover:bg-yellow-900/20'
        }
      `}
      onClick={onToggle}
    >
      {/* Summary View */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
            ${isSettled
              ? bet.won
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
              : 'bg-yellow-500 text-black'
            }
          `}>
            {isSettled ? (bet.won ? '✓' : '✗') : '⏱'}
          </div>

          {/* Bet Info */}
          <div>
            <p className="text-white font-semibold">{bet.target.label}</p>
            <p className="text-gray-400 text-xs">{formatDate(bet.timestamp)}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-white font-bold">{parseFloat(bet.amount).toFixed(4)} BNB</p>
          {isSettled && (
            <p className={`text-sm font-semibold ${bet.won ? 'text-green-400' : 'text-red-400'}`}>
              {bet.won ? `+${parseFloat(bet.payout).toFixed(4)}` : `-${parseFloat(bet.amount).toFixed(4)}`} BNB
            </p>
          )}
          {isActive && (
            <p className="text-yellow-400 text-sm">Active</p>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Bet ID</p>
              <p className="text-white text-sm font-mono">#{bet.id}</p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Multiplier</p>
              <p className="text-white text-sm font-bold">x{bet.target.multiplier}</p>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Start Price</p>
              <p className="text-white text-sm">${bet.startPrice.toLocaleString()}</p>
            </div>

            {isSettled && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider">End Price</p>
                <p className="text-white text-sm">${bet.endPrice.toLocaleString()}</p>
              </div>
            )}

            {isSettled && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Actual Change</p>
                <p className={`text-sm font-bold ${bet.actualChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {bet.actualChange >= 0 ? '+' : ''}{bet.actualChange.toFixed(2)}
                </p>
              </div>
            )}

            {isSettled && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Target</p>
                <p className="text-white text-sm">
                  {bet.target.direction === 'UP' ? '+' : ''}{bet.target.priceChange}
                </p>
              </div>
            )}
          </div>

          {isSettled && (
            <div className={`
              mt-3 p-2 rounded text-center font-semibold
              ${bet.won ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}
            `}>
              {bet.won
                ? `Won ${parseFloat(bet.payout).toFixed(4)} BNB (${((parseFloat(bet.payout) / parseFloat(bet.amount) - 1) * 100).toFixed(0)}% profit)`
                : `Lost ${parseFloat(bet.amount).toFixed(4)} BNB`
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};
