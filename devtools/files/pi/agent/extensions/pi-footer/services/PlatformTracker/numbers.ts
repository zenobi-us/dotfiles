import type { UsageSnapshot } from "./types.ts";

export function clampPositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

export const API_TIMEOUT_MS = 5_000;

export const TimeFrame = {
  OneHour: 3_600,
  FiveHour: 5 * 3_600,
  OneDay: 24 * 3_600,
  FiveDay: 5 * 24 * 3_600,
  SevenDay: 7 * 24 * 3_600,
  ThirtyDay: 30 * 24 * 3_600,
} as const;

export function percentToSnapshot(id: string, percentUsed: number): UsageSnapshot {
  const clampedUsed = Math.max(0, Math.min(100, percentUsed));
  const usedRatio = clampedUsed / 100;
  return {
    id,
    usedRatio,
    remainingRatio: 1 - usedRatio,
  };
}
