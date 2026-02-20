/**
 * Utility functions for formatting numbers, dates, and other data
 */

/**
 * Format a number as USD currency
 */
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a USDC token amount
 */
export const formatUSDC = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${numAmount.toFixed(4)} USDC`;
};

/**
 * Shorten a Sui address for display
 */
export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format a price change with sign
 */
export const formatPriceChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${formatUSD(change)}`;
};

/**
 * Format a multiplier (e.g., 2.0 -> "x2")
 */
export const formatMultiplier = (multiplier: number): string => {
  return `x${multiplier.toFixed(1)}`;
};
