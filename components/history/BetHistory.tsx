'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { BetCard } from './BetCard';
import { calculateBetStats, filterBets } from '@/lib/store/historySlice';

type FilterType = 'all' | 'wins' | 'losses' | 'active';

export const BetHistory: React.FC = () => {
  const bets = useStore((state) => state.bets);
  const isLoading = useStore((state) => state.isLoading);
  const fetchHistory = useStore((state) => state.fetchHistory);
  const address = useStore((state) => state.address);
  const isConnected = useStore((state) => state.isConnected);

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedBetId, setSelectedBetId] = useState<string | null>(null);

  // Fetch history when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchHistory(address);
    }
  }, [isConnected, address, fetchHistory]);

  // Calculate statistics
  const stats = calculateBetStats(bets);

  // Filter bets
  const filteredBets = filterBets(bets, filter);

  if (!isConnected) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-500">Connect your wallet to view bet history</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Bet History</h3>
          {isLoading && (
            <span className="text-gray-400 text-sm">Loading...</span>
          )}
        </div>

        {/* Statistics */}
        {stats.totalBets > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-900 rounded p-3">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Bets</p>
              <p className="text-white text-lg font-bold">{stats.totalBets}</p>
            </div>

            <div className="bg-gray-900 rounded p-3">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Win Rate</p>
              <p className="text-white text-lg font-bold">{stats.winRate.toFixed(1)}%</p>
            </div>

            <div className="bg-gray-900 rounded p-3">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Wins / Losses</p>
              <p className="text-white text-lg font-bold">
                <span className="text-green-400">{stats.wins}</span>
                {' / '}
                <span className="text-red-400">{stats.losses}</span>
              </p>
            </div>

            <div className="bg-gray-900 rounded p-3">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Net P/L</p>
              <p className={`text-lg font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toFixed(4)} BNB
              </p>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'wins', 'losses', 'active'] as FilterType[]).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`
                px-4 py-2 rounded text-sm font-semibold transition-colors
                ${filter === filterType
                  ? 'bg-[#FF006E] text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }
              `}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>

        {/* Bet List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredBets.length > 0 ? (
            filteredBets.map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                isExpanded={selectedBetId === bet.id}
                onToggle={() => setSelectedBetId(selectedBetId === bet.id ? null : bet.id)}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {filter === 'all'
                  ? 'No bets yet. Place your first bet to get started!'
                  : `No ${filter} bets found.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
