'use client';

import React, { useState, useRef } from 'react';
import { GameBoard } from '@/components/game';
import { BetHistory, MiniHistory } from '@/components/history';
import { WalletConnect, WalletInfo } from '@/components/wallet';
import { QuickTour } from '@/components/tour/QuickTour';
import { useStore, useUserTier } from '@/lib/store';

export default function Home() {
  const isTourOpen = useStore((state) => state.isTourOpen);
  const setIsTourOpen = useStore((state) => state.setIsTourOpen);
  return (
    <div className="h-full w-full bg-[#02040A] overflow-hidden relative">
      <GameBoard />
      <MiniHistory />

      {/* Tour Component */}
      <QuickTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
    </div>
  );
}
