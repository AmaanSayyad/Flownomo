/**
 * Bet-related type definitions for Overflow
 */

import { TargetCell } from './game';

export interface BetRecord {
  id: string;
  timestamp: number;
  amount: string;
  target: TargetCell;
  startPrice: number;
  endPrice: number;
  actualChange: number;
  won: boolean;
  payout: string;
}

export interface BetStatus {
  id: string;
  player: string;
  amount: string;
  settled: boolean;
  won?: boolean;
  payout?: string;
}
