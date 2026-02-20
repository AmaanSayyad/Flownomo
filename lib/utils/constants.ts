/**
 * Application constants for Suinomo
 */

import { TargetCell } from '@/types/game';

// Round configuration
export const ROUND_DURATION = parseInt(process.env.NEXT_PUBLIC_ROUND_DURATION || '30', 10); // seconds
export const PRICE_UPDATE_INTERVAL = parseInt(process.env.NEXT_PUBLIC_PRICE_UPDATE_INTERVAL || '1000', 10); // milliseconds
export const CHART_TIME_WINDOW = parseInt(process.env.NEXT_PUBLIC_CHART_TIME_WINDOW || '300000', 10); // milliseconds (5 minutes)

// Target cells configuration
export const TARGET_CELLS: TargetCell[] = [
  { id: '1', label: '+$5 in 30s', multiplier: 1.5, priceChange: 5, direction: 'UP' },
  { id: '2', label: '+$10 in 30s', multiplier: 2.0, priceChange: 10, direction: 'UP' },
  { id: '3', label: '+$20 in 30s', multiplier: 3.0, priceChange: 20, direction: 'UP' },
  { id: '4', label: '+$50 in 30s', multiplier: 5.0, priceChange: 50, direction: 'UP' },
  { id: '5', label: '+$100 in 30s', multiplier: 10.0, priceChange: 100, direction: 'UP' },
  { id: '6', label: '-$5 in 30s', multiplier: 1.5, priceChange: -5, direction: 'DOWN' },
  { id: '7', label: '-$10 in 30s', multiplier: 2.0, priceChange: -10, direction: 'DOWN' },
  { id: '8', label: '-$20 in 30s', multiplier: 3.0, priceChange: -20, direction: 'DOWN' },
];

// Color scheme (cyberpunk theme)
export const COLORS = {
  primary: '#FF006E',      // Neon pink
  background: '#0a0a0a',   // Deep black
  secondary: '#00f5ff',    // Neon cyan
  success: '#00ff41',      // Neon green
  error: '#ff0055',        // Neon red
  warning: '#ffaa00',      // Neon orange
};

// Oracle configuration
export const ORACLE_PRICE_FRESHNESS_THRESHOLD = 60; // seconds
export const MANUAL_SETTLEMENT_TIMEOUT = 300; // seconds (5 minutes)
