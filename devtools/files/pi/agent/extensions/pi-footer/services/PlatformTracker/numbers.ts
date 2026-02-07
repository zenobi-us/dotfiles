import type { Window } from "./types.ts";

export function clampPositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

export const API_TIMEOUT_MS = 5_000;

export function createUsageWindow(percentUsed: number, duration = 100): Window {
  const clampedUsed = Math.max(0, Math.min(100, percentUsed));
  const remaining = Math.max(0, duration * (1 - clampedUsed / 100));
  return { duration, remaining };
}
