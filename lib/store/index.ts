/**
 * Main Zustand store for BYNOMO dApp
 * Combines wallet, game, and history slices
 * 
 * Note: After BNB migration, blockchain events are handled
 * by the BNB backend client for deposit/withdrawal confirmation.
 * Game logic remains off-chain.
 */

import { create } from "zustand";
import { WalletState, createWalletSlice } from "./walletSlice";
import { GameState, createGameSlice, startPriceFeed, startGlobalPriceFeed } from "./gameSlice";
import { HistoryState, createHistorySlice, restoreBetHistory } from "./historySlice";
import { BalanceState, createBalanceSlice } from "./balanceSlice";
import { ReferralState, createReferralSlice } from "./referralSlice";
import { ProfileState, createProfileSlice } from "./profileSlice";

/**
 * Combined store type
 */
export type OverflowStore = WalletState & GameState & HistoryState & BalanceState & ReferralState & ProfileState;

/**
 * Create the main Zustand store
 * Combines all slices into a single store
 */
export const useOverflowStore = create<OverflowStore>()((...args) => ({
  ...createWalletSlice(...args),
  ...createGameSlice(...args),
  ...createHistorySlice(...args),
  ...createBalanceSlice(...args),
  ...createReferralSlice(...args),
  ...createProfileSlice(...args)
}));

/**
 * Initialize the store
 * Restores sessions, loads data
 * Should be called once on app initialization
 */
export const initializeStore = async (): Promise<void> => {
  const store = useOverflowStore.getState();

  try {
    // Restore bet history from localStorage
    restoreBetHistory((bets) => {
      useOverflowStore.setState({ bets });
    });

    // Load target cells
    await store.loadTargetCells();

    // Fetch house balance if wallet is connected
    if (store.address) {
      await store.fetchBalance(store.address);
    }

    // Start price feed polling
    const stopPriceFeed = store.startGlobalPriceFeed(store.updateAllPrices);

    // Store cleanup function for later use
    (window as any).__overflowCleanup = () => {
      stopPriceFeed();
    };


    console.log("BYNOMO store initialized successfully");
  } catch (error) {
    console.error("Error initializing store:", error);
  }
};

/**
 * Cleanup function
 * Stops price feed
 * Should be called when app is unmounted
 */
export const cleanupStore = (): void => {
  if ((window as any).__overflowCleanup) {
    (window as any).__overflowCleanup();
    delete (window as any).__overflowCleanup;
  }
};

/**
 * Export individual selectors for optimized re-renders
 */
export const useWalletAddress = () => useOverflowStore(state => state.address);
export const useWalletBalance = () => useOverflowStore(state => state.walletBalance);
export const useIsConnected = () => useOverflowStore(state => state.isConnected);
export const useCurrentPrice = () => useOverflowStore(state => state.currentPrice);
export const usePriceHistory = () => useOverflowStore(state => state.priceHistory);
export const useActiveRound = () => useOverflowStore(state => state.activeRound);
export const useTargetCells = () => useOverflowStore(state => state.targetCells);
export const useBetHistory = () => useOverflowStore(state => state.bets);
export const useIsPlacingBet = () => useOverflowStore(state => state.isPlacingBet);
export const useIsSettling = () => useOverflowStore(state => state.isSettling);
export const useHouseBalance = () => useOverflowStore(state => state.houseBalance);
export const useIsLoadingBalance = () => useOverflowStore(state => state.isLoading);
export const useUserTier = () => useOverflowStore(state => state.userTier);

/**
 * Export main store hook (alias for convenience)
 */
export const useStore = useOverflowStore;

/**
 * Export actions
 * Note: These selectors return new objects on each call, which can cause infinite loops.
 * Use direct store access (useOverflowStore(state => state.actionName)) instead.
 */
export const useWalletActions = () => {
  const connect = useOverflowStore(state => state.connect);
  const disconnect = useOverflowStore(state => state.disconnect);
  const refreshWalletBalance = useOverflowStore(state => state.refreshWalletBalance);
  return { connect, disconnect, refreshWalletBalance };
};

export const useGameActions = () => {
  const placeBet = useOverflowStore(state => state.placeBet);
  const placeBetFromHouseBalance = useOverflowStore(state => state.placeBetFromHouseBalance);
  const settleRound = useOverflowStore(state => state.settleRound);
  const updatePrice = useOverflowStore(state => state.updatePrice);
  return { placeBet, placeBetFromHouseBalance, settleRound, updatePrice };
};

export const useHistoryActions = () => {
  const fetchHistory = useOverflowStore(state => state.fetchHistory);
  const addBet = useOverflowStore(state => state.addBet);
  const clearHistory = useOverflowStore(state => state.clearHistory);
  return { fetchHistory, addBet, clearHistory };
};

export const useBalanceActions = () => {
  const fetchBalance = useOverflowStore(state => state.fetchBalance);
  const setBalance = useOverflowStore(state => state.setBalance);
  const updateBalance = useOverflowStore(state => state.updateBalance);
  const depositFunds = useOverflowStore(state => state.depositFunds);
  const withdrawFunds = useOverflowStore(state => state.withdrawFunds);
  const clearError = useOverflowStore(state => state.clearError);
  return { fetchBalance, setBalance, updateBalance, depositFunds, withdrawFunds, clearError };
};
