import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { usageTracker } from "../services/PlatformTracker/store.ts";
import type { ResolvedUsageWindow } from "../services/PlatformTracker/types.ts";

function formatUpdatedAt(timestamp?: number): string {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString();
}

function formatSeconds(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3_600);
  const minutes = Math.floor((s % 3_600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${s}s`;
}

function formatPercent(ratio: number): string {
  return `${Math.max(0, Math.min(100, Math.round(ratio * 100)))}%`;
}

function formatWindows(windows: ResolvedUsageWindow[]): string {
  if (windows.length === 0) return "-";

  return windows
    .map((window) => {
      const remaining = Math.max(0, Math.round(window.remaining));
      const used = Math.max(0, Math.round(window.used));

      if (window.duration !== undefined) {
        const total = Math.max(0, Math.round(window.duration));
        return `${window.id}: remaining ${formatSeconds(remaining)} (${formatPercent(window.remainingRatio)}), used ${formatSeconds(used)} of ${formatSeconds(total)}`;
      }

      if (window.amount !== undefined) {
        const total = Math.max(0, Math.round(window.amount));
        return `${window.id}: remaining ${remaining}/${total} (${formatPercent(window.remainingRatio)}), used ${used}`;
      }

      return `${window.id}: remaining ${remaining} (${formatPercent(window.remainingRatio)}), used ${used}`;
    })
    .join("; ");
}

export function registerUsageStoreCommand(pi: ExtensionAPI): void {
  pi.registerCommand("usage-store", {
    description: "Print a table of the UsageTracker store",
    handler: async (_args, ctx) => {
      const entries = Array.from(usageTracker.store.entries()).sort(([a], [b]) =>
        a.localeCompare(b),
      );

      if (entries.length === 0) {
        if (ctx.hasUI) {
          await ctx.ui.input("UsageTracker store is empty (press Enter to close)");
        } else {
          console.log("UsageTracker store is empty.");
        }
        return;
      }

      if (!ctx.hasUI) {
        // Console output with table format
        const header =
          "| provider | active | fails | updated | windows (remaining %, used, total) |";
        const divider = "| --- | --- | --- | --- | --- |";
        const rows = entries.map(([provider, entry]) => {
          const active = entry.active ? "yes" : "no";
          const fails = String(entry.fails ?? 0);
          const updated = formatUpdatedAt(entry.updated);
          const windows = formatWindows(entry.windows);
          return `| ${provider} | ${active} | ${fails} | ${updated} | ${windows} |`;
        });
        console.log([header, divider, ...rows].join("\n"));
        return;
      }

      // UI output with select (scrollable)
      const options = entries.map(([provider, entry]) => {
        const active = entry.active ? "✓" : "✗";
        const fails = entry.fails ?? 0;
        const windows = formatWindows(entry.windows);
        
        return `${provider} [${active}] fails:${fails} | ${windows}`;
      });

      await ctx.ui.select(
        `UsageTracker store (${entries.length} entries)`,
        options,
      );
    },
  });
}
