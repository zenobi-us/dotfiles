/**
 * Template value filters for formatting raw provider values
 */

import { numericFilters } from "../context/numbers.ts";
import type { FilterFunction } from "../types.ts";

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
  const filter = numericFilters[filterName];
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
