import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export * from "./types";
export {
  COLLECTOR_DESCRIPTORS,
  WHEN_CONDITIONS,
  VERDICT_TYPES,
  SCOPE_TARGETS,
  VALID_EVENTS,
} from "./constants";
export { COLLECTOR_NAMES } from "./context";
export { parseMonitorsArgs } from "./commands";
export { parseVerdict, parseModelSpec } from "./classification";
export { generateFindingId } from "./actions";

import { discoverMonitors, seedExamples, resolveProjectMonitorsDir } from "./discovery";
import { createMonitorTemplateEnv } from "./classification";
import { activate } from "./activation";
import { registerMonitorRenderer } from "./renderer";
import { registerMonitorTools } from "./tooling";
import { registerMonitorsCommand } from "./commands";

let monitorsEnabled = true;

export default function (pi: ExtensionAPI): void {
  const seeded = seedExamples();
  const monitors = discoverMonitors();
  if (monitors.length === 0) return;

  const monitorTemplateEnv = createMonitorTemplateEnv();

  let statusCtx;
  let pendingAgentEndSteers = [];
  let steeredThisTurn = new Set();

  function updateStatus() {
    if (!statusCtx?.hasUI) return;
    const theme = statusCtx.ui.theme;
    if (!monitorsEnabled) {
      statusCtx.ui.setStatus(
        "monitors",
        `${theme.fg("dim", "monitors:")}${theme.fg("warning", "OFF")}`,
      );
      return;
    }
    const engaged = monitors.filter((m) => m.whileCount > 0 && !m.dismissed);
    const dismissed = monitors.filter((m) => m.dismissed);
    if (engaged.length === 0 && dismissed.length === 0) {
      const count = theme.fg("dim", `${monitors.length}`);
      statusCtx.ui.setStatus(
        "monitors",
        `${theme.fg("dim", "monitors:")}${count}`,
      );
      return;
    }
    const parts = [];
    for (const m of engaged) {
      parts.push(
        theme.fg("warning", `${m.name}(${m.whileCount}/${m.ceiling})`),
      );
    }
    if (dismissed.length > 0) {
      parts.push(theme.fg("dim", `${dismissed.length} dismissed`));
    }
    statusCtx.ui.setStatus(
      "monitors",
      `${theme.fg("dim", "monitors:")}${parts.join(" ")}`,
    );
  }

  const monitorState = {
    getMonitorsEnabled: () => monitorsEnabled,
    setMonitorsEnabled: (enabled) => {
      monitorsEnabled = enabled;
    },
    updateStatus,
  };

  pi.on("session_start", async (_event, ctx) => {
    try {
      statusCtx = ctx;
      if (seeded > 0 && ctx.hasUI) {
        const dir = resolveProjectMonitorsDir();
        ctx.ui.notify(
          `Seeded ${seeded} example monitor files into ${dir}\nEdit or delete them to customize.`,
          "info",
        );
      }
      updateStatus();
    } catch {
      /* startup errors should not block session */
    }
  });

  pi.on("session_switch", async (_event, ctx) => {
    statusCtx = ctx;
    for (const m of monitors) {
      m.whileCount = 0;
      m.dismissed = false;
      m.lastUserText = "";
      m.activationCount = 0;
    }
    monitorsEnabled = true;
    pendingAgentEndSteers = [];
    updateStatus();
  });

  registerMonitorTools(pi, monitors, monitorState);
  registerMonitorRenderer(pi);

  // --- abort support + buffered steer drain ---
  pi.on("agent_end", async () => {
    pi.events.emit("monitors:abort", undefined);
    // Drain buffered steers from message_end/turn_end monitors.
    // The _agentEventQueue guarantees this runs AFTER all turn_end/message_end
    // handlers complete (sequential promise chain), so the buffer is populated.
    // Deliver only the first — the corrected response will re-trigger monitors
    // if additional issues remain.
    if (pendingAgentEndSteers.length > 0) {
      const first = pendingAgentEndSteers[0];
      pendingAgentEndSteers = [];
      pi.sendMessage(
        {
          customType: "monitor-steer",
          content: first.content,
          display: true,
          details: first.details,
        },
        { deliverAs: "steer", triggerTurn: true },
      );
    }
  });

  // --- per-turn exclusion tracking ---
  pi.on("turn_start", () => {
    steeredThisTurn = new Set();
  });

  // group monitors by validated event
  const byEvent = new Map();
  for (const m of monitors) {
    const list = byEvent.get(m.event) ?? [];
    list.push(m);
    byEvent.set(m.event, list);
  }

  // wire event handlers
  for (const [event, group] of byEvent) {
    if (event === "command") {
      for (const m of group) {
        pi.registerCommand(m.name, {
          description: m.description || `Run ${m.name} monitor`,
          handler: async (_args, ctx) => {
            const branch = ctx.sessionManager.getBranch();
            await activate(
              m,
              pi,
              ctx,
              branch,
              steeredThisTurn,
              updateStatus,
              pendingAgentEndSteers,
              monitorTemplateEnv,
              () => monitorsEnabled,
            );
          },
        });
      }
    } else if (event === "message_end") {
      pi.on("message_end", async (ev, ctx) => {
        if (ev.message.role !== "assistant") return;
        const branch = ctx.sessionManager.getBranch();
        for (const m of group) {
          await activate(
            m,
            pi,
            ctx,
            branch,
            steeredThisTurn,
            updateStatus,
            pendingAgentEndSteers,
            monitorTemplateEnv,
            () => monitorsEnabled,
          );
        }
      });
    } else if (event === "turn_end") {
      pi.on("turn_end", async (_ev, ctx) => {
        const branch = ctx.sessionManager.getBranch();
        for (const m of group) {
          await activate(
            m,
            pi,
            ctx,
            branch,
            steeredThisTurn,
            updateStatus,
            pendingAgentEndSteers,
            monitorTemplateEnv,
            () => monitorsEnabled,
          );
        }
      });
    } else if (event === "agent_end") {
      pi.on("agent_end", async (_ev, ctx) => {
        const branch = ctx.sessionManager.getBranch();
        for (const m of group) {
          await activate(
            m,
            pi,
            ctx,
            branch,
            steeredThisTurn,
            updateStatus,
            pendingAgentEndSteers,
            monitorTemplateEnv,
            () => monitorsEnabled,
          );
        }
      });
    }
  }

  registerMonitorsCommand(pi, monitors, monitorState);
}
