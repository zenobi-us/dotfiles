import type { FilterFunction } from "../types.ts";

export const numericFilters: Record<string, FilterFunction> = {
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
