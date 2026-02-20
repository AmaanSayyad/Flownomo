/**
 * History state slice for Zustand store
 * Manages bet history and persistence
 * 
 * Note: After Sui migration, bet history is managed off-chain.
 * Blockchain events are only for deposit/withdrawal tracking.
 */

import { StateCreator } from "zustand";
import { BetRecord } from "@/types/bet";

export interface HistoryState {
  // State
  bets: BetRecord[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchHistory: (playerAddress: string) => Promise<void>;
  addBet: (bet: BetRecord) => void;
  clearHistory: () => void;
  clearError: () => void;
}

// Maximum bets to store in localStorage
const MAX_STORED_BETS = 50;

/**
 * Create history slice for Zustand store
 * Handles bet history storage and management
 */
export const createHistorySlice: StateCreator<HistoryState> = (set, get) => ({
  // Initial state
  bets: [],
  isLoading: false,
  error: null,

  /**
   * Fetch bet history from Supabase, with localStorage fallback
   * @param playerAddress - The player's wallet address
   */
  fetchHistory: async (playerAddress: string) => {
    try {
      set({ isLoading: true, error: null });

      // Try fetching from Supabase first
      try {
        const res = await fetch(`/api/bets/history?wallet=${encodeURIComponent(playerAddress)}&limit=50`);
        if (res.ok) {
          const { bets: serverBets } = await res.json();
          if (serverBets && serverBets.length > 0) {
            // Map Supabase rows to BetRecord format
            const mappedBets: BetRecord[] = serverBets.map((row: any) => ({
              id: row.id,
              timestamp: new Date(row.resolved_at).getTime(),
              amount: row.amount.toString(),
              won: row.won,
              payout: row.payout.toString(),
              startPrice: parseFloat(row.strike_price) || 0,
              endPrice: parseFloat(row.end_price) || 0,
              actualChange: (parseFloat(row.end_price) || 0) - (parseFloat(row.strike_price) || 0),
              target: {
                id: row.mode === 'binomo' ? 'classic' : 'box',
                label: `${row.direction} ${row.multiplier}x`,
                multiplier: parseFloat(row.multiplier) || 1.9,
                priceChange: 0,
                direction: row.direction as 'UP' | 'DOWN',
              }
            }));

            set({
              bets: mappedBets,
              isLoading: false,
              error: null
            });

            // Also cache in localStorage
            saveBetsToLocalStorage(mappedBets.slice(0, MAX_STORED_BETS));
            return;
          }
        }
      } catch (fetchError) {
        console.warn('Failed to fetch from Supabase, falling back to localStorage:', fetchError);
      }

      // Fallback to localStorage
      const cachedBets = loadBetsFromLocalStorage();

      set({
        bets: cachedBets,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error("Error fetching history:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch history"
      });
    }
  },

  /**
   * Add a new bet to history
   * Used when a bet is placed to immediately update UI
   * @param bet - The bet record to add
   */
  addBet: (bet: BetRecord) => {
    const { bets } = get();

    // Check if bet already exists
    const existingIndex = bets.findIndex(b => b.id === bet.id);

    let updatedBets: BetRecord[];
    if (existingIndex >= 0) {
      // Update existing bet
      updatedBets = [...bets];
      updatedBets[existingIndex] = bet;
    } else {
      // Add new bet at the beginning
      updatedBets = [bet, ...bets];
    }

    // Sort by timestamp (newest first)
    updatedBets.sort((a, b) => b.timestamp - a.timestamp);

    set({ bets: updatedBets });

    // Persist to localStorage
    saveBetsToLocalStorage(updatedBets.slice(0, MAX_STORED_BETS));
  },

  /**
   * Clear all bet history
   */
  clearHistory: () => {
    set({ bets: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('overflow_bet_history');
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  }
});

/**
 * Save bets to localStorage
 * @param bets - Array of bet records to save
 */
const saveBetsToLocalStorage = (bets: BetRecord[]): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('overflow_bet_history', JSON.stringify(bets));
    }
  } catch (error) {
    console.error("Error saving bets to localStorage:", error);
  }
};

/**
 * Load bets from localStorage
 * @returns Array of bet records from localStorage
 */
const loadBetsFromLocalStorage = (): BetRecord[] => {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('overflow_bet_history');
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (error) {
    console.error("Error loading bets from localStorage:", error);
  }
  return [];
};

/**
 * Restore bet history from localStorage
 * Should be called on app initialization
 * @param setBets - Function to set bets in store
 */
export const restoreBetHistory = (setBets: (bets: BetRecord[]) => void): void => {
  const cachedBets = loadBetsFromLocalStorage();
  if (cachedBets.length > 0) {
    setBets(cachedBets);
  }
};

/**
 * Calculate bet history statistics
 * @param bets - Array of bet records
 * @returns Statistics object with wins, losses, and net profit/loss
 */
export const calculateBetStats = (bets: BetRecord[]) => {
  const settledBets = bets.filter(bet => bet.endPrice > 0);

  const wins = settledBets.filter(bet => bet.won).length;
  const losses = settledBets.filter(bet => !bet.won).length;

  const totalWagered = settledBets.reduce(
    (sum, bet) => sum + parseFloat(bet.amount),
    0
  );

  const totalPayout = settledBets.reduce(
    (sum, bet) => sum + (bet.won ? parseFloat(bet.payout) : 0),
    0
  );

  const netProfit = totalPayout - totalWagered;

  return {
    totalBets: settledBets.length,
    wins,
    losses,
    winRate: settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0,
    totalWagered,
    totalPayout,
    netProfit
  };
};

/**
 * Filter bets by outcome
 * @param bets - Array of bet records
 * @param filter - Filter type: 'all', 'wins', 'losses', 'active'
 * @returns Filtered array of bet records
 */
export const filterBets = (
  bets: BetRecord[],
  filter: 'all' | 'wins' | 'losses' | 'active'
): BetRecord[] => {
  switch (filter) {
    case 'wins':
      return bets.filter(bet => bet.endPrice > 0 && bet.won);
    case 'losses':
      return bets.filter(bet => bet.endPrice > 0 && !bet.won);
    case 'active':
      return bets.filter(bet => bet.endPrice === 0);
    case 'all':
    default:
      return bets;
  }
};
