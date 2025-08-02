/**
 * Utility functions for formatting various game values
 */

/**
 * Format money values with dollar sign and commas
 * @param amount - The amount to format
 * @returns Formatted money string (e.g. "$1,234")
 */
export function formatMoney(amount: number): string {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return amount < 0 ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Format percentage values
 * @param value - The value to format (0-100)
 * @returns Formatted percentage string (e.g. "75%")
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format large numbers with abbreviations
 * @param num - The number to format
 * @returns Abbreviated number string (e.g. "1.2k", "3.4M")
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}k`;
  } else if (num < 1000000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
}

/**
 * Format duration in turns to human-readable string
 * @param turns - Number of turns
 * @returns Formatted duration string
 */
export function formatDuration(turns: number): string {
  if (turns === 1) {
    return '1 turn';
  } else if (turns < 10) {
    return `${turns} turns`;
  } else if (turns < 30) {
    return 'a few weeks';
  } else if (turns < 90) {
    return 'a few months';
  } else {
    return 'a long time';
  }
}

/**
 * Format reputation tier
 * @param reputation - Reputation value
 * @returns Reputation tier string
 */
export function formatReputationTier(reputation: number): string {
  if (reputation < 10) return 'Unknown';
  if (reputation < 25) return 'Local';
  if (reputation < 50) return 'Known';
  if (reputation < 75) return 'Respected';
  if (reputation < 100) return 'Famous';
  if (reputation < 150) return 'Legendary';
  return 'Iconic';
}