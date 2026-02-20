/**
 * Game-related type definitions for Overflow
 */

export type Direction = 'UP' | 'DOWN';
export type GameMode = 'binomo' | 'box';

export enum TimeframeSeconds {
  Seconds5 = 5,
  Seconds15 = 15,
  Seconds30 = 30,
  Minute1 = 60,
  Minute3 = 180,
  Minute5 = 300,
}

export type TIMEFRAME_OPTIONS = TimeframeSeconds[];

export interface TargetCell {
  id: string;
  label: string;          // e.g., "+$10 in 30s"
  multiplier: number;     // e.g., 2.0 for x2
  priceChange: number;    // e.g., 10.0
  direction: Direction;
  timeframe?: number;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface ActiveRound {
  betId: string;
  amount: string;
  target: TargetCell;
  startPrice: number;
  startTime: number;
  endTime: number;
  status: 'active' | 'settling' | 'settled';
}

export interface GameState {
  currentPrice: number;
  priceHistory: PricePoint[];
  activeRound: ActiveRound | null;
  targetCells: TargetCell[];
}
