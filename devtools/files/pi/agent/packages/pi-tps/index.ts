/**
 * TPS Monitor Extension for pi-coding-agent
 *
 * Shows live tokens-per-second (TPS), elapsed seconds, and token count
 * right after the "Working..." message during assistant streaming.
 *
 * Format: "Working... (42 tps, 3.2s, 128 tok)"
 *
 * Usage:
 *   pi --extension ~/.pi/extensions/tps-monitor.ts
 *
 * Commands:
 *   /tps           Toggle TPS monitor on/off
 *   /tps status    Show current state
 */

import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";

interface MonitorState {
  enabled: boolean;
  startTime: number;
  totalChars: number;
  lastUpdate: number;
  finalShown: boolean;
}

const CHARS_PER_TOKEN_ESTIMATE = 4;
const UPDATE_THROTTLE_MS = 200;

function fmt(n: number): string {
  if (n < 10) return n.toFixed(1);
  return Math.round(n).toString();
}

function buildMessage(
  state: MonitorState,
  isFinal: boolean,
  usageOutput?: number,
): string {
  const elapsedSec = (performance.now() - state.startTime) / 1000;
  if (elapsedSec <= 0) return "Working...";

  const tokens =
    isFinal && usageOutput !== undefined
      ? usageOutput
      : Math.ceil(state.totalChars / CHARS_PER_TOKEN_ESTIMATE);
  const tps = tokens / elapsedSec;

  return `Working... (${fmt(tps)} tps, ${fmt(elapsedSec)}s, ${tokens} tok)`;
}

export default function (pi: ExtensionAPI) {
  const state: MonitorState = {
    enabled: true,
    startTime: 0,
    totalChars: 0,
    lastUpdate: 0,
    finalShown: false,
  };

  const updateMessage = (
    ctx: ExtensionContext,
    isFinal = false,
    usageOutput?: number,
  ) => {
    if (!state.enabled) return;
    const now = performance.now();
    if (!isFinal && now - state.lastUpdate < UPDATE_THROTTLE_MS) return;
    state.lastUpdate = now;

    const message = buildMessage(state, isFinal, usageOutput);
    ctx.ui.setWorkingMessage(message);
  };

  const clearMessage = (ctx: ExtensionContext) => {
    ctx.ui.setWorkingMessage(undefined);
  };

  pi.on("message_start", async (_event, ctx) => {
    if (!state.enabled) return;
    state.startTime = performance.now();
    state.totalChars = 0;
    state.finalShown = false;
    state.lastUpdate = 0;
    updateMessage(ctx);
  });

  pi.on("message_update", async (event, ctx) => {
    if (!state.enabled) return;
    const ev = event.assistantMessageEvent;
    if (
      ev.type === "text_delta" ||
      ev.type === "thinking_delta" ||
      ev.type === "toolcall_delta"
    ) {
      state.totalChars += ev.delta.length;
      updateMessage(ctx);
    }
  });

  pi.on("message_end", async (event, ctx) => {
    if (!state.enabled) return;
    const msg = event.message;
    if (msg.role === "assistant" && msg.usage) {
      updateMessage(ctx, true, msg.usage.output);
      state.finalShown = true;
    }
  });

  pi.on("turn_end", async (_event, ctx) => {
    if (!state.enabled || !state.finalShown) return;
    // Clear the custom message after a short delay so the final TPS lingers
    setTimeout(() => clearMessage(ctx), 5000);
  });

  pi.on("session_start", async (_event, ctx) => {
    if (state.enabled) {
      ctx.ui.setStatus("tps-monitor", ctx.ui.theme.fg("dim", "TPS monitor on"));
    }
  });

  pi.registerCommand("tps", {
    description: "Toggle TPS monitor, or show status",
    handler: async (args, ctx) => {
      const cmd = args.trim().toLowerCase();
      if (cmd === "status" || cmd === "") {
        ctx.ui.notify(
          state.enabled ? "TPS monitor is ON" : "TPS monitor is OFF",
          "info",
        );
        return;
      }
      if (cmd === "on") {
        state.enabled = true;
        ctx.ui.setStatus(
          "tps-monitor",
          ctx.ui.theme.fg("dim", "TPS monitor on"),
        );
        ctx.ui.notify("TPS monitor enabled", "info");
        return;
      }
      if (cmd === "off") {
        state.enabled = false;
        clearMessage(ctx);
        ctx.ui.setStatus("tps-monitor", undefined);
        ctx.ui.notify("TPS monitor disabled", "info");
        return;
      }
      ctx.ui.notify("Usage: /tps [on|off|status]", "error");
    },
  });
}
