import {
  getMarkdownTheme,
  type ExtensionAPI,
} from "@mariozechner/pi-coding-agent";
import { Markdown, matchesKey, Box } from "@mariozechner/pi-tui";
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

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function renderUsageTrackerStoreTable(): string {
  const rows = Array.from(usageTracker.store.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([provider, entry]) => ({
      provider,
      active: entry.active ? "yes" : "no",
      fails: String(entry.fails ?? 0),
      updated: formatUpdatedAt(entry.updated),
      windows: formatWindows(entry.windows),
    }));

  if (rows.length === 0) {
    return "UsageTracker store is empty.";
  }

  const header =
    "| provider | active | fails | updated | windows (remaining %, used, total) |";
  const divider = "| --- | --- | --- | --- | --- |";
  const body = rows.map(
    (row) =>
      `| ${escapeMarkdownCell(row.provider)} | ${escapeMarkdownCell(row.active)} | ${escapeMarkdownCell(row.fails)} | ${escapeMarkdownCell(row.updated)} | ${escapeMarkdownCell(row.windows)} |`,
  );

  return [header, divider, ...body].join("\n");
}

export function registerUsageStoreCommand(pi: ExtensionAPI): void {
  pi.registerCommand("usage-store", {
    description: "Print a table of the UsageTracker store",
    handler: async (_args, ctx) => {
      const table = renderUsageTrackerStoreTable();

      if (ctx.hasUI) {
        const mdTheme = getMarkdownTheme();
        const markdown = new Markdown(
          `# UsageTracker store\n\n${table}\n\n_Press Esc or Enter to close_`,
          1,
          0,
          mdTheme,
        );

        await ctx.ui.custom(
          (_tui, theme, _kb, done) => {
            const box = new Box(1, 0, (s: string) => theme.bg("customMessageBg", s));
            box.addChild(markdown);
            return {
              render: (width: number) => box.render(width),
              invalidate: () => box.invalidate(),
              handleInput: (data: string) => {
                if (matchesKey(data, "escape") || matchesKey(data, "enter")) {
                  done(undefined);
                }
              },
            };
          },
          {
            overlay: true,
            overlayOptions: {
              width: "100%",
              maxHeight: "45%",
            },
          },
        );
        return;
      }

      console.log(table);
    },
  });
}
