import { Footer } from "../footer.ts";
import type { FilterFunction } from "../types.ts";

const humaniseTimeFilter: FilterFunction = (value: unknown): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";

  const seconds = Math.max(0, Math.round(value));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

const humanisePercentFilter: FilterFunction = (value: unknown): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";

  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  return `${percent}%`;
};

const humaniseAmountFilter: FilterFunction = (value: unknown): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return Math.round(value).toString();
};

const humaniseNumberFilter: FilterFunction = (value: unknown): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return Math.round(value).toLocaleString();
};

const roundFilter: FilterFunction = (value: unknown, decimals: number = 0): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return value.toFixed(decimals);
};

const clampFilter: FilterFunction = (
  value: unknown,
  min: number = 0,
  max: number = 100,
): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return Math.max(min, Math.min(max, value)).toString();
};

Footer.registerContextFilter("humanise_time", humaniseTimeFilter);
Footer.registerContextFilter("humanise_percent", humanisePercentFilter);
Footer.registerContextFilter("humanise_amount", humaniseAmountFilter);
Footer.registerContextFilter("humanise_number", humaniseNumberFilter);
Footer.registerContextFilter("round", roundFilter);
Footer.registerContextFilter("clamp", clampFilter);
