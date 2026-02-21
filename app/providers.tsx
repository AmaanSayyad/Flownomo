'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useOverflowStore } from '@/lib/store';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Custom Components
import { WalletConnectModal } from '@/components/wallet/WalletConnectModal';
import { ReferralSync } from './ReferralSync';

/**
 * Wallet Sync component to bridge Flow wallet state with our Zustand store
 */
function WalletSync() {
  const {
    address,
    network,
    accountType,
    setAddress,
    setIsConnected,
    setNetwork,
    setPreferredNetwork,
    refreshWalletBalance,
    fetchProfile
  } = useOverflowStore();

  // Main Sync Effect
  useEffect(() => {
    // 0. Check Demo Mode
    if (accountType === 'demo') {
      if (address !== '0xDEMO_1234567890') {
        setAddress('0xDEMO_1234567890');
        setIsConnected(true);
        setNetwork('FLOW');
        setPreferredNetwork('FLOW');
      }
      return;
    }

    // 1. Sync Flow State
    const syncFlow = async () => {
      try {
        const fcl = await import("@onflow/fcl");
        fcl.currentUser().subscribe((currentUser: any) => {
          if (currentUser?.loggedIn && currentUser?.addr) {
            if (useOverflowStore.getState().address !== currentUser.addr) {
              setAddress(currentUser.addr);
              setIsConnected(true);
              setNetwork('FLOW');
              setPreferredNetwork('FLOW');
              refreshWalletBalance();
              fetchProfile(currentUser.addr);
            }
          } else {
            // Logged out
            if (useOverflowStore.getState().address !== null && useOverflowStore.getState().accountType !== 'demo') {
              setAddress(null);
              setIsConnected(false);
              setNetwork(null);
            }
          }
        });
      } catch (e) {
        console.error("Flow sync failed", e);
      }
    };

    syncFlow();
  }, [
    accountType, setAddress, setIsConnected, setNetwork, setPreferredNetwork, refreshWalletBalance, fetchProfile
  ]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeApp = async () => {
      try {
        const { updateAllPrices, loadTargetCells, startGlobalPriceFeed } = useOverflowStore.getState();

        // Initialize Flow
        try {
          const { configureFlow } = await import('@/lib/flow/config');
          configureFlow();
        } catch (e) {
          console.error("Flow configuration failed", e);
        }

        await loadTargetCells().catch(console.error);
        const stopPriceFeed = startGlobalPriceFeed(updateAllPrices);
        setIsReady(true);
        return () => { if (stopPriceFeed) stopPriceFeed(); };
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WalletSync />
      <ReferralSync />
      {children}
      <WalletConnectModal />
      <ToastProvider />
    </QueryClientProvider>
  );
}
