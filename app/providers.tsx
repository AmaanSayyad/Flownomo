'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useOverflowStore } from '@/lib/store';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { bsc } from 'viem/chains';
import { WagmiProvider, useAccount } from 'wagmi';
import { ConnectKitProvider } from 'connectkit';
import { config as wagmiConfig } from '@/lib/bnb/wagmi';

// Solana Imports
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

// Sui Imports
import { createNetworkConfig, SuiClientProvider, WalletProvider, useCurrentAccount } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import '@mysten/dapp-kit/dist/index.css';

// Custom Components
import { WalletConnectModal } from '@/components/wallet/WalletConnectModal';
import { ReferralSync } from './ReferralSync';

// Wallet Sync component to bridge all wallet states with our Zustand store
function WalletSync() {
  const { user, authenticated, ready: privyReady } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useWallet();
  const suiAccount = useCurrentAccount();
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();

  const {
    address,
    accountType,
    setAddress,
    setIsConnected,
    setNetwork,
    refreshWalletBalance,
    fetchProfile,
    preferredNetwork
  } = useOverflowStore();

  // Restoration Effect for Stellar
  const attemptedRestore = useRef(false);
  useEffect(() => {
    if (preferredNetwork === 'XLM' && !attemptedRestore.current) {
      attemptedRestore.current = true;
      const checkStellar = async () => {
        // Check if already connected in store to avoid redundant work
        if (useOverflowStore.getState().address && useOverflowStore.getState().network === 'XLM') return;

        try {
          const { restoreSession } = await import('@/lib/stellar/wallet-kit');
          const restoredAddress = await restoreSession();
          if (restoredAddress) {
            setAddress(restoredAddress);
            setIsConnected(true);
            setNetwork('XLM');
            refreshWalletBalance();
            fetchProfile(restoredAddress);
          }
        } catch (e) {
          console.error("Stellar restore failed", e);
        }
      };
      checkStellar();
    }
  }, [preferredNetwork, address, setAddress, setIsConnected, setNetwork, refreshWalletBalance, fetchProfile]);


  // Main Sync Effect
  useEffect(() => {
    // 0. Check Demo Mode (Priority)
    if (accountType === 'demo') {
      if (address !== '0xDEMO_1234567890') {
        setAddress('0xDEMO_1234567890');
        setIsConnected(true);
        setNetwork('BNB');
      }
      return;
    }

    // 1. Check Solana (Priority if preferred)
    if (solanaConnected && solanaPublicKey && preferredNetwork === 'SOL') {
      const addr = solanaPublicKey.toBase58();
      if (address !== addr) {
        setAddress(addr);
        setIsConnected(true);
        setNetwork('SOL');
        refreshWalletBalance();
        fetchProfile(addr);
      }
      return;
    }

    // 2. Check Sui
    if (suiAccount?.address && preferredNetwork === 'SUI') {
      if (address !== suiAccount.address) {
        setAddress(suiAccount.address);
        setIsConnected(true);
        setNetwork('SUI');
        refreshWalletBalance();
        fetchProfile(suiAccount.address);
      }
      return;
    }

    // 3. Check BNB (Wagmi or Privy)
    if (preferredNetwork === 'BNB') {
      if (wagmiConnected && wagmiAddress) {
        if (address !== wagmiAddress) {
          setAddress(wagmiAddress);
          setIsConnected(true);
          setNetwork('BNB');
          refreshWalletBalance();
          fetchProfile(wagmiAddress);
        }
        return;
      }
      if (privyReady && authenticated && privyWallets[0]) {
        const addr = privyWallets[0].address;
        if (address !== addr) {
          setAddress(addr);
          setIsConnected(true);
          setNetwork('BNB');
          refreshWalletBalance();
          fetchProfile(addr);
        }
        return;
      }
    }

    // 4. Check Stellar - Logic is now handled by restoration effect above or manual connection
    if (preferredNetwork === 'XLM') {
      if (useOverflowStore.getState().address && useOverflowStore.getState().network === 'XLM') {
        return;
      }
    }

    // 5. Check Tezos
    if (preferredNetwork === 'XTZ') {
      if (useOverflowStore.getState().address && useOverflowStore.getState().network === 'XTZ') {
        return;
      }
    }

    // 6. Check NEAR
    if (preferredNetwork === 'NEAR') {
      if (useOverflowStore.getState().address && useOverflowStore.getState().network === 'NEAR') {
        return;
      }
    }

    // 7. Cleanup/Sync Decision
    const state = useOverflowStore.getState();
    const isDemoMode = state.accountType === 'demo';
    const hasSolana = solanaConnected && solanaPublicKey;
    const hasSui = !!suiAccount?.address;
    const hasBNB = (wagmiConnected && !!wagmiAddress) || (privyReady && authenticated && !!privyWallets[0]);
    const hasStellar = state.network === 'XLM' && !!state.address;
    const hasTezos = state.network === 'XTZ' && !!state.address;
    const hasNEAR = state.network === 'NEAR' && !!state.address;

    // Determine if we should clear
    let shouldClear = false;

    // If we are in demo mode, NEVER clear the address (wait for manual exit)
    if (isDemoMode) {
      shouldClear = false;
    } else {
      if (preferredNetwork === 'SOL' && !hasSolana) shouldClear = true;
      else if (preferredNetwork === 'SUI' && !hasSui) shouldClear = true;
      else if (preferredNetwork === 'BNB' && !hasBNB) shouldClear = true;
      else if (preferredNetwork === 'XLM' && !hasStellar) shouldClear = true;
      else if (preferredNetwork === 'XTZ' && !hasTezos) shouldClear = true;
      else if (preferredNetwork === 'NEAR' && !hasNEAR) shouldClear = true;
      else if (!preferredNetwork && !hasBNB && !hasSolana && !hasSui && !hasStellar && !hasTezos && !hasNEAR) shouldClear = true;
    }

    if (shouldClear && address !== null) {
      setAddress(null);
      setIsConnected(false);
      setNetwork(null);
    }
  }, [
    user, authenticated, privyWallets, privyReady,
    solanaConnected, solanaPublicKey,
    suiAccount,
    wagmiAddress, wagmiConnected,
    preferredNetwork, address, accountType,
    setAddress, setIsConnected, setNetwork, refreshWalletBalance, fetchProfile
  ]);

  return null;
}

const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl('mainnet') },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [queryClient] = useState(() => new QueryClient());

  // Solana wallet adapter v2+ auto-discovers installed wallets via Wallet Standard
  // No need to explicitly add adapters - this avoids duplicate key errors (e.g. MetaMask)
  const solanaWallets = useMemo(() => [], []);

  // Fix: Move hook to top level
  const solanaEndpoint = useMemo(() => {
    try {
      const { getSolanaConfig } = require('@/lib/solana/config');
      return getSolanaConfig().rpcEndpoint;
    } catch (e) {
      return "https://solana-rpc.publicnode.com";
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeApp = async () => {
      try {
        const { updateAllPrices, loadTargetCells, startGlobalPriceFeed } = useOverflowStore.getState();

        // Initialize Stellar Wallet Kit
        const { initWalletKit } = await import('@/lib/stellar/wallet-kit');
        await initWalletKit().catch(console.error);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cm7377f0a00gup9u2w4m3v6be';

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider mode="dark">
          <PrivyProvider
            appId={PRIVY_APP_ID}
            config={{
              appearance: {
                theme: 'dark',
                accentColor: '#A855F7',
                showWalletLoginFirst: true,
              },
              supportedChains: [bsc],
              defaultChain: bsc,
              embeddedWallets: {
                createOnLogin: 'users-without-wallets',
              },
            }}
          >
            <ConnectionProvider endpoint={solanaEndpoint}>
              <SolanaWalletProvider wallets={solanaWallets} autoConnect>
                <WalletModalProvider>
                  <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
                    <WalletProvider autoConnect>
                      <WalletSync />
                      <ReferralSync />
                      {children}
                      <WalletConnectModal />
                      <ToastProvider />
                    </WalletProvider>
                  </SuiClientProvider>
                </WalletModalProvider>
              </SolanaWalletProvider>
            </ConnectionProvider>
          </PrivyProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
