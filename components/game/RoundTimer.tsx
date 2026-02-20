'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';

export const RoundTimer: React.FC = () => {
  const activeRound = useStore((state) => state.activeRound);
  const settleRound = useStore((state) => state.settleRound);
  const isSettling = useStore((state) => state.isSettling);

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canSettle, setCanSettle] = useState<boolean>(false);
  const [manualSettleAvailable, setManualSettleAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (!activeRound || activeRound.status !== 'active') {
      setTimeRemaining(0);
      setCanSettle(false);
      setManualSettleAvailable(false);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, activeRound.endTime - now);
      const remainingSeconds = Math.ceil(remaining / 1000);

      setTimeRemaining(remainingSeconds);

      // Can settle when time is up
      if (remaining <= 0) {
        setCanSettle(true);

        // Manual settle available after 5 minutes
        const timeSinceEnd = now - activeRound.endTime;
        if (timeSinceEnd > 5 * 60 * 1000) {
          setManualSettleAvailable(true);
        }
      }
    };

    // Update immediately
    updateTimer();

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [activeRound]);

  const handleSettle = async () => {
    if (activeRound && canSettle) {
      try {
        await settleRound(activeRound.betId);
      } catch (error) {
        console.error('Error settling round:', error);
      }
    }
  };

  if (!activeRound || activeRound.status !== 'active') {
    return null;
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-full w-48 h-48 flex items-center justify-center p-4 relative shadow-[0_0_30px_rgba(0,255,157,0.2)]">
      <div className="text-center space-y-1 relative z-10">
        {/* Timer Display */}
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-mono">REMAINING</p>
          <p className={`
            text-5xl font-bold font-mono tracking-tighter
            ${timeRemaining > 10 ? 'text-neon-green' : 'text-yellow-400 animate-pulse'}
          `}>
            {formatTime(timeRemaining)}
          </p>
        </div>

        {/* Circular Progress (Using absolute border for simplicity or svg) */}
        {/* Simplified linear bar for now inside the circle or just the text is enough for "Round Timer" in a circle */}
        {!canSettle && (
          <p className="text-xs text-white/50 font-mono">SECONDS</p>
        )}

        {/* Settle Button Overlay */}
        {canSettle && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-full">
            <Button
              onClick={handleSettle}
              disabled={isSettling}
              className="rounded-full w-32 h-32 text-xs font-bold uppercase tracking-widest border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-black hover:shadow-[0_0_20px_rgba(0,255,157,0.5)] transition-all"
            >
              {isSettling ? 'Settling...' : 'SETTLE'}
            </Button>
          </div>
        )}
      </div>

      {/* Ring Animation */}
      {!canSettle && (
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
          <circle
            cx="96" cy="96" r="90"
            fill="none"
            stroke="#ffffff10"
            strokeWidth="4"
          />
          <circle
            cx="96" cy="96" r="90"
            fill="none"
            stroke="var(--neon-green)"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - timeRemaining / 30)}`}
            className="transition-all duration-100 ease-linear"
          />
        </svg>
      )}
    </div>
  );
};
