import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { defaultFooterProviders } from "./context/index.ts";
import { createFooterSingleton } from "./footer.ts";
import { usageTracker } from "./services/PlatformTracker/store.ts";
import { Config } from "./services/config";

export const Footer = createFooterSingleton();

for (const { name, provider } of defaultFooterProviders) {
  Footer.registerContextProvider(name, provider);
}

function formatUpdatedAt(timestamp?: number): string {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString();
}

function formatWindows(
  windows: Array<{ duration: number; remaining: number }>,
): string {
  if (windows.length === 0) return "-";

  return windows
    .map((window, idx) => {
      const remaining = Math.max(0, Math.round(window.remaining));
      const duration = Math.max(0, Math.round(window.duration));
      return `w${idx + 1}:${remaining}/${duration}`;
    })
    .join(", ");
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

  const headers = {
    provider: "provider",
    active: "active",
    fails: "fails",
    updated: "updated",
    windows: "windows (remaining/total)",
  };

  const widths = {
    provider: Math.max(
      headers.provider.length,
      ...rows.map((row) => row.provider.length),
    ),
    active: Math.max(headers.active.length, ...rows.map((row) => row.active.length)),
    fails: Math.max(headers.fails.length, ...rows.map((row) => row.fails.length)),
    updated: Math.max(
      headers.updated.length,
      ...rows.map((row) => row.updated.length),
    ),
    windows: Math.max(
      headers.windows.length,
      ...rows.map((row) => row.windows.length),
    ),
  };

  const line = [
    "-".repeat(widths.provider),
    "-".repeat(widths.active),
    "-".repeat(widths.fails),
    "-".repeat(widths.updated),
    "-".repeat(widths.windows),
  ].join("-+-");

  const header = [
    headers.provider.padEnd(widths.provider),
    headers.active.padEnd(widths.active),
    headers.fails.padEnd(widths.fails),
    headers.updated.padEnd(widths.updated),
    headers.windows.padEnd(widths.windows),
  ].join(" | ");

  const body = rows.map((row) =>
    [
      row.provider.padEnd(widths.provider),
      row.active.padEnd(widths.active),
      row.fails.padEnd(widths.fails),
      row.updated.padEnd(widths.updated),
      row.windows.padEnd(widths.windows),
    ].join(" | "),
  );

  return [header, line, ...body].join("\n");
}

function printUsageTrackerStore(ctx: ExtensionCommandContext): void {
  const table = renderUsageTrackerStoreTable();

  if (ctx.hasUI) {
    ctx.ui.notify(`UsageTracker store\n\n${table}`, "info");
    return;
  }

  console.log(table);
}

export default function piFooterExtension(pi: ExtensionAPI) {
  const attach = (ctx: ExtensionContext) => {
    usageTracker.start(ctx);

    ctx.ui.setFooter((tui, theme, footerData) => {
      const unsubscribeBranch = footerData.onBranchChange(() =>
        tui.requestRender(),
      );
      const unsubscribeTracker = usageTracker.subscribe(() =>
        tui.requestRender(),
      );

      return {
        dispose() {
          unsubscribeBranch();
          unsubscribeTracker();
        },
        invalidate() {
          tui.requestRender();
        },
        render(width: number) {
          return Footer.render(ctx, theme, width, {
            template: Config.template,
          });
        },
      };
    });
  };

  pi.registerCommand("usage-store", {
    description: "Print a table of the UsageTracker store",
    handler: async (_args, ctx) => {
      printUsageTrackerStore(ctx);
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    attach(ctx);
  });

  pi.on("session_switch", async (_event, ctx) => {
    attach(ctx);
  });

  pi.on("session_shutdown", async () => {
    usageTracker.stop();
  });
}
