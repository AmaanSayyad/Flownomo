'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { TargetCell } from '@/types/game';

interface TargetGridProps {
    selectedTarget: string | null;
    onSelectTarget: (targetId: string) => void;
    betAmount: string;
}

export const TargetGrid: React.FC<TargetGridProps> = ({
    selectedTarget,
    onSelectTarget,
    betAmount
}) => {
    const targetCells = useStore((state) => state.targetCells);
    const activeRound = useStore((state) => state.activeRound);

    const isDisabled = !!activeRound;

    // Calculate potential payout
    const calculatePayout = (multiplier: number) => {
        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount <= 0) return '0.00';
        return (amount * multiplier).toFixed(2);
    };

    // Group targets by direction
    const upTargets = targetCells.filter(cell => cell.direction === 'UP');
    const downTargets = targetCells.filter(cell => cell.direction === 'DOWN');

    const TargetCellButton: React.FC<{ cell: TargetCell }> = ({ cell }) => {
        const isSelected = selectedTarget === cell.id;
        const payout = calculatePayout(cell.multiplier);

        return (
            <button
                onClick={() => !isDisabled && onSelectTarget(cell.id)}
                disabled={isDisabled}
                className={`
          relative p-3 rounded-lg border transition-all duration-200 group w-full text-left flex flex-col items-center justify-between min-h-[100px]
          ${isSelected
                        ? 'border-neon-blue bg-neon-blue/10 shadow-[0_0_15px_rgba(0,240,255,0.3)] scale-[1.02]'
                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 hover:scale-[1.02]'
                    }
          ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                {/* Multiplier Badge */}
                <div className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${isSelected ? 'text-neon-blue bg-neon-blue/20' : 'text-gray-400 bg-black/50'}`}>
                    x{cell.multiplier}
                </div>

                {/* Target Label */}
                <div className="flex flex-col items-center justify-center flex-1">
                    <p className={`text-2xl font-black tracking-tighter ${cell.direction === 'UP' ? 'text-neon-green' : 'text-red-500'}`}>
                        {cell.priceChange > 0 ? '+' : ''}{cell.priceChange}
                    </p>
                    <p className="text-gray-500 text-[9px] uppercase font-mono tracking-widest mt-1">in 30s</p>
                </div>

                {/* Potential Payout */}
                {isSelected && betAmount && parseFloat(betAmount) > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-center w-full">
                        <p className="text-neon-blue text-[10px] font-bold font-mono truncate">
                            WIN: {payout}
                        </p>
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="space-y-6 h-full text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold tracking-widest font-mono">SELECT TARGET</h3>
                <div className="flex gap-2 text-[10px] font-mono text-gray-500">
                    <span>UP: {upTargets.length}</span>
                    <span>DOWN: {downTargets.length}</span>
                </div>
            </div>

            {/* UP Targets */}
            <div>
                <h4 className="text-neon-green font-semibold mb-2 flex items-center gap-2 text-[10px] tracking-wider uppercase font-mono">
                    <span className="text-sm">↑</span> Price UP
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {upTargets.map(cell => (
                        <TargetCellButton key={cell.id} cell={cell} />
                    ))}
                </div>
            </div>

            {/* DOWN Targets */}
            <div>
                <h4 className="text-red-500 font-semibold mb-2 flex items-center gap-2 text-[10px] tracking-wider uppercase font-mono">
                    <span className="text-sm">↓</span> Price DOWN
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {downTargets.map(cell => (
                        <TargetCellButton key={cell.id} cell={cell} />
                    ))}
                </div>
            </div>

            {isDisabled && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-center">
                    <p className="text-yellow-500 text-xs font-mono animate-pulse">
                        ROUND IN PROGRESS
                    </p>
                </div>
            )}
        </div>
    );
};
