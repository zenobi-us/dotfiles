/**
 * Template value filters for formatting raw provider values
 */

export type FilterFunction = (value: unknown) => string;

export const filters: Record<string, FilterFunction> = {
  /**
   * Format seconds into human-readable time
   * 9240 → "2h 34m"
   * 432000 → "5d 0h"
   */
  humanise_time: (value: unknown): string => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "--";
    
    const seconds = Math.max(0, Math.round(value));
    const days = Math.floor(seconds / 86_400);
    const hours = Math.floor((seconds % 86_400) / 3_600);
    const minutes = Math.floor((seconds % 3_600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  },

  /**
   * Format ratio (0-1) into percentage
   * 0.643 → "64%"
   */
  humanise_percent: (value: unknown): string => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "--";
    
    const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
    return `${percent}%`;
  },

  /**
   * Format amount as used/total
   * With context of total: 12, remaining: 288 → "12/300"
   * Note: This requires special handling in template rendering
   */
  humanise_amount: (value: unknown): string => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "--";
    return Math.round(value).toString();
  },

  /**
   * Format number with thousands separator
   * 1234567 → "1,234,567"
   */
  humanise_number: (value: unknown): string => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "--";
    return Math.round(value).toLocaleString();
  },

  /**
   * Round to N decimal places
   * 3.14159 | round(2) → "3.14"
   */
  round: (value: unknown, decimals = 0): string => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "--";
    return value.toFixed(decimals);
  },

  /**
   * Clamp value between min and max
   * 150 | clamp(0,100) → "100"
   */
  clamp: (value: unknown, min = 0, max = 100): string => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "--";
    return Math.max(min, Math.min(max, value)).toString();
  },
};

/**
 * Apply a filter to a value
 * @param value Raw value from provider
 * @param filterName Name of filter (e.g., "humanise_time")
 * @param args Optional arguments for filter
 */
export function applyFilter(
  value: unknown,
  filterName: string,
  args: unknown[] = [],
): string {
  const filter = filters[filterName];
  if (!filter) {
    console.warn(`Unknown filter: ${filterName}`);
    return String(value ?? "--");
  }
  
  try {
    // Call filter with value and args
    return filter.apply(null, [value, ...args] as Parameters<FilterFunction>);
  } catch (error) {
    console.error(`Filter ${filterName} failed:`, error);
    return String(value ?? "--");
  }
}

/**
 * Parse filter expression from template variable
 * Examples:
 *   "quota_remaining | humanise_time" → { name: "humanise_time", args: [] }
 *   "value | round(2)" → { name: "round", args: [2] }
 */
export function parseFilter(
  filterExpr: string,
): { name: string; args: unknown[] } | null {
  const match = filterExpr.match(/^(\w+)(?:\(([^)]*)\))?$/);
  if (!match) return null;
  
  const name = match[1];
  const argsStr = match[2];
  
  const args: unknown[] = [];
  if (argsStr) {
    // Simple arg parsing: split by comma, parse numbers
    const parts = argsStr.split(",").map((s) => s.trim());
    for (const part of parts) {
      const num = Number(part);
      args.push(Number.isNaN(num) ? part : num);
    }
  }
  
  return { name, args };
}
