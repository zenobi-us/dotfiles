/**
 * Context Mode Extension for pi
 *
 * Adapted from: https://github.com/mksglu/claude-context-mode
 *
 * Provides context window management utilities and MCP server integration
 * for reducing context consumption from tool outputs.
 */

import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@mariozechner/pi-coding-agent";
import { theme } from "@mariozechner/pi-coding-agent";
import type { Component } from "@mariozechner/pi-tui";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { AsciiBox } from "../pi-ds/AsciiBox";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DATA_DIR = join(
  process.env.XDG_DATA_HOME ?? join(homedir(), ".local/share"),
  "pi-context-mode",
);

const STATS_FILE = join(DATA_DIR, "session-stats.json");
const CONFIG_FILE = join(DATA_DIR, "config.json");

const MCP_CONFIG_PATHS = [
  join(homedir(), ".config/pi/mcp.json"),
  join(process.cwd(), ".pi/mcp.json"),
];

interface SessionStats {
  sessionStart: number;
  toolCalls: Record<
    string,
    { count: number; bytesIn: number; bytesOut: number }
  >;
  totalBytesIn: number;
  totalBytesOut: number;
  totalSavings: number;
}

interface Config {
  mcpServerPath: string;
  autoStart: boolean;
  maxOutputSize: number;
}

const DEFAULT_CONFIG: Config = {
  mcpServerPath: "npx -y context-mode",
  autoStart: true,
  maxOutputSize: 5120, // 5KB threshold for intent-driven filtering
};

// ─────────────────────────────────────────────────────────────────────────────
// Simple Text Component for AsciiBox
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple text component that renders pre-built lines
 */
class TextLines implements Component {
  constructor(private lines: string[]) {}

  render(_width: number): string[] {
    return this.lines;
  }

  invalidate(): void {
    // No-op for static content
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function ensureDirs(): void {
  mkdirSync(DATA_DIR, { recursive: true });
}

function loadConfig(): Config {
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config: Config): void {
  ensureDirs();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

function loadStats(): SessionStats {
  try {
    const raw = readFileSync(STATS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      sessionStart: Date.now(),
      toolCalls: {},
      totalBytesIn: 0,
      totalBytesOut: 0,
      totalSavings: 0,
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Create a themed AsciiBox and render it to a string
 */
function renderBox(title: string, contentLines: string[], width = 50): string {
  const box = new AsciiBox(
    theme,
    {
      title: new TextLines([title]),
      content: new TextLines(contentLines),
    },
    { padding: 1 }
  );
  return box.render(width).join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Commands
// ─────────────────────────────────────────────────────────────────────────────

async function showStats(ctx: ExtensionCommandContext): Promise<void> {
  const stats = loadStats();
  const sessionDuration = Date.now() - stats.sessionStart;

  const contentLines: string[] = [
    `Session Duration: ${formatDuration(sessionDuration)}`,
    `Total Input:      ${formatBytes(stats.totalBytesIn)}`,
    `Total Output:     ${formatBytes(stats.totalBytesOut)}`,
    `Context Saved:    ${formatBytes(stats.totalSavings)}`,
  ];

  if (Object.keys(stats.toolCalls).length > 0) {
    contentLines.push("");
    contentLines.push("Tool Breakdown:");

    for (const [tool, data] of Object.entries(stats.toolCalls)) {
      const savings = data.bytesIn - data.bytesOut;
      const pct =
        data.bytesIn > 0 ? Math.round((savings / data.bytesIn) * 100) : 0;
      contentLines.push(
        `  ${tool.slice(0, 15).padEnd(15)} ${data.count.toString().padStart(3)}x  ${pct.toString().padStart(2)}% saved`
      );
    }
  }

  const output = renderBox("CONTEXT MODE STATISTICS", contentLines, 45);
  ctx.ui.notify(" \n" + output, "info");
}

async function runDoctor(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<void> {
  const checks: {
    name: string;
    status: "ok" | "warn" | "error";
    detail: string;
  }[] = [];

  // Check Node.js
  try {
    const nodeVersion = execSync("node --version", {
      encoding: "utf-8",
    }).trim();
    checks.push({ name: "Node.js", status: "ok", detail: nodeVersion });
  } catch {
    checks.push({ name: "Node.js", status: "error", detail: "Not found" });
  }

  // Check Bun (optional, faster execution)
  try {
    const bunVersion = execSync("bun --version", { encoding: "utf-8" }).trim();
    checks.push({ name: "Bun", status: "ok", detail: bunVersion });
  } catch {
    checks.push({
      name: "Bun",
      status: "warn",
      detail: "Not found (optional)",
    });
  }

  // Check context-mode npm package
  try {
    const result = execSync(
      "npm list -g context-mode 2>/dev/null || npm list context-mode 2>/dev/null",
      {
        encoding: "utf-8",
      },
    );
    if (result.includes("context-mode")) {
      const versionMatch = result.match(/context-mode@([\d.]+)/);
      checks.push({
        name: "context-mode",
        status: "ok",
        detail: versionMatch ? `v${versionMatch[1]}` : "installed",
      });
    } else {
      throw new Error("Not installed");
    }
  } catch {
    checks.push({
      name: "context-mode",
      status: "warn",
      detail: "Not installed. Run: npm i -g context-mode",
    });
  }

  // Check MCP configuration
  let mcpConfigFound = false;
  for (const mcpPath of MCP_CONFIG_PATHS) {
    if (existsSync(mcpPath)) {
      try {
        const mcpConfig = JSON.parse(readFileSync(mcpPath, "utf-8"));
        const hasContextMode =
          mcpConfig.mcpServers?.["context-mode"] !== undefined;
        checks.push({
          name: "MCP Config",
          status: hasContextMode ? "ok" : "warn",
          detail: hasContextMode
            ? mcpPath
            : `Found ${mcpPath} but context-mode not configured`,
        });
        mcpConfigFound = true;
        break;
      } catch {
        checks.push({
          name: "MCP Config",
          status: "error",
          detail: `Invalid JSON: ${mcpPath}`,
        });
        mcpConfigFound = true;
        break;
      }
    }
  }

  if (!mcpConfigFound) {
    checks.push({
      name: "MCP Config",
      status: "warn",
      detail: "No MCP config found. Run /context-mode:setup",
    });
  }

  // Check data directory
  if (existsSync(DATA_DIR)) {
    checks.push({ name: "Data Dir", status: "ok", detail: DATA_DIR });
  } else {
    checks.push({
      name: "Data Dir",
      status: "warn",
      detail: "Will be created on first use",
    });
  }

  // Format check lines
  const contentLines: string[] = [];
  for (const check of checks) {
    const icon =
      check.status === "ok" ? "✓" : check.status === "warn" ? "⚠" : "✗";
    const name = check.name.padEnd(14);
    const detail = check.detail.slice(0, 28);
    contentLines.push(`${icon} ${name} ${detail}`);
  }

  const output = renderBox("CONTEXT MODE DIAGNOSTICS", contentLines, 52);
  const allOk = checks.every((c) => c.status === "ok");
  ctx.ui.notify(" \n" + output, allOk ? "info" : "warning");
}

async function setupMcp(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<void> {
  const mcpConfigPath = join(homedir(), ".config/pi/mcp.json");
  ensureDirs();

  let mcpConfig: { mcpServers?: Record<string, unknown> } = { mcpServers: {} };

  if (existsSync(mcpConfigPath)) {
    try {
      mcpConfig = JSON.parse(readFileSync(mcpConfigPath, "utf-8"));
      mcpConfig.mcpServers = mcpConfig.mcpServers ?? {};
    } catch {
      ctx.ui.notify(`Invalid existing MCP config at ${mcpConfigPath}`, "error");
      return;
    }
  }

  // Add context-mode server
  mcpConfig.mcpServers!["context-mode"] = {
    command: "npx",
    args: ["-y", "context-mode"],
    env: {},
  };

  mkdirSync(join(homedir(), ".config/pi"), { recursive: true });
  writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), "utf-8");

  const contentLines = [
    `Config: ${mcpConfigPath}`,
    "",
    "Restart pi to activate the MCP server.",
    "",
    "Available MCP tools:",
    "  • execute - Run code in sandboxed environment",
    "  • batch_execute - Multiple commands in one call",
    "  • index - Chunk content into FTS5 knowledge base",
    "  • search - Query indexed content with BM25 ranking",
    "  • fetch_and_index - Fetch URL and index content",
  ];

  const output = renderBox("✓ Context Mode MCP Server Configured", contentLines, 55);
  ctx.ui.notify(" \n" + output, "info");
}

async function showHelp(ctx: ExtensionCommandContext): Promise<void> {
  const contentLines = [
    "Commands:",
    "  /context-mode:stats   Show session statistics",
    "  /context-mode:doctor  Run diagnostics",
    "  /context-mode:setup   Configure MCP server",
    "  /context-mode:help    Show this help",
    "",
    "About:",
    "  Context Mode is an MCP server that routes tool",
    "  outputs through sandboxed execution, reducing",
    "  context usage by ~98%.",
    "",
    "  Based on: github.com/mksglu/claude-context-mode",
  ];

  const output = renderBox("Context Mode Help", contentLines, 55);
  ctx.ui.notify(" \n" + output, "info");
}

// ─────────────────────────────────────────────────────────────────────────────
// Extension Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export default function contextModeExtension(pi: ExtensionAPI): void {
  pi.registerCommand("context-mode:stats", {
    description:
      "Show context window savings statistics for the current session",
    handler: async (_args, ctx) => {
      await showStats(ctx);
    },
  });

  pi.registerCommand("context-mode:doctor", {
    description: "Run diagnostics to check Context Mode setup",
    handler: async (_args, ctx) => {
      await runDoctor(pi, ctx);
    },
  });

  pi.registerCommand("context-mode:setup", {
    description: "Configure the Context Mode MCP server",
    handler: async (_args, ctx) => {
      await setupMcp(pi, ctx);
    },
  });

  pi.registerCommand("context-mode:help", {
    description: "Show Context Mode help and available commands",
    handler: async (_args, ctx) => {
      await showHelp(ctx);
    },
  });

  // Register shortcut for quick stats access
  pi.registerShortcut("ctrl+shift+c", {
    description: "Show Context Mode statistics",
    handler: async (ctx) => {
      await showStats(ctx);
    },
  });
}
