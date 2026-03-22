import { Type } from "@sinclair/typebox";
import { loadPatterns } from "./patterns";
import { loadInstructions, saveInstructions } from "./rules";

export function registerMonitorTools(pi, monitors, monitorState) {
  const { getMonitorsEnabled, setMonitorsEnabled, updateStatus } = monitorState;

  // ── Tool: monitors-status ──────────────────────────────────────────────
  pi.registerTool({
    name: "monitors-status",
    label: "Monitors Status",
    description: "List all behavior monitors with their current state.",
    promptSnippet: "List all behavior monitors with their current state",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
      const status = monitors.map((m) => ({
        name: m.name,
        description: m.description,
        event: m.event,
        when: m.when,
        enabled: getMonitorsEnabled(),
        dismissed: m.dismissed,
        whileCount: m.whileCount,
        ceiling: m.ceiling,
      }));
      return {
        details: undefined,
        content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
      };
    },
  });

  // ── Tool: monitors-inspect ─────────────────────────────────────────────
  pi.registerTool({
    name: "monitors-inspect",
    label: "Monitors Inspect",
    description:
      "Inspect a monitor — config, state, pattern count, rule count.",
    promptSnippet:
      "Inspect a monitor — config, state, pattern count, rule count",
    parameters: Type.Object({
      monitor: Type.String({ description: "Monitor name" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const monitor = monitors.find((m) => m.name === params.monitor);
      if (!monitor) throw new Error(`Unknown monitor: ${params.monitor}`);
      const patterns = loadPatterns(monitor);
      const instructions = loadInstructions(monitor);
      const state = monitor.dismissed
        ? "dismissed"
        : monitor.whileCount > 0
          ? `engaged (${monitor.whileCount}/${monitor.ceiling})`
          : "idle";
      const info = {
        name: monitor.name,
        description: monitor.description,
        event: monitor.event,
        when: monitor.when,
        scope: monitor.scope,
        classify: {
          model: monitor.classify.model,
          context: monitor.classify.context,
          excludes: monitor.classify.excludes,
        },
        patterns: {
          path: monitor.patterns.path,
          learn: monitor.patterns.learn,
          count: patterns.length,
        },
        instructions: {
          path: monitor.instructions.path,
          count: instructions.length,
        },
        actions: monitor.actions,
        ceiling: monitor.ceiling,
        escalate: monitor.escalate,
        state,
        enabled: getMonitorsEnabled(),
        dismissed: monitor.dismissed,
        whileCount: monitor.whileCount,
      };
      return {
        details: undefined,
        content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
      };
    },
  });

  // ── Tool: monitors-control ─────────────────────────────────────────────
  pi.registerTool({
    name: "monitors-control",
    label: "Monitors Control",
    description: "Control monitors — enable, disable, dismiss, or reset.",
    promptSnippet: "Control monitors — enable, disable, dismiss, or reset",
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal("on"),
        Type.Literal("off"),
        Type.Literal("dismiss"),
        Type.Literal("reset"),
      ]),
      monitor: Type.Optional(
        Type.String({
          description: "Monitor name (required for dismiss/reset)",
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      if (params.action === "on") {
        setMonitorsEnabled(true);
        updateStatus();
        return {
          details: undefined,
          content: [{ type: "text", text: "Monitors enabled" }],
        };
      }
      if (params.action === "off") {
        setMonitorsEnabled(false);
        updateStatus();
        return {
          details: undefined,
          content: [
            { type: "text", text: "All monitors paused for this session" },
          ],
        };
      }
      if (params.action === "dismiss") {
        if (!params.monitor)
          throw new Error("Monitor name required for dismiss");
        const monitor = monitors.find((m) => m.name === params.monitor);
        if (!monitor) throw new Error(`Unknown monitor: ${params.monitor}`);
        monitor.dismissed = true;
        updateStatus();
        return {
          details: undefined,
          content: [
            {
              type: "text",
              text: `[${monitor.name}] Dismissed for this session`,
            },
          ],
        };
      }
      // reset
      if (!params.monitor) throw new Error("Monitor name required for reset");
      const monitor = monitors.find((m) => m.name === params.monitor);
      if (!monitor) throw new Error(`Unknown monitor: ${params.monitor}`);
      monitor.dismissed = false;
      monitor.whileCount = 0;
      updateStatus();
      return {
        details: undefined,
        content: [
          {
            type: "text",
            text: `[${monitor.name}] Reset — dismissed=false, whileCount=0`,
          },
        ],
      };
    },
  });

  // ── Tool: monitors-rules ───────────────────────────────────────────────
  pi.registerTool({
    name: "monitors-rules",
    label: "Monitors Rules",
    description:
      "Manage monitor rules — list, add, remove, or replace calibration rules.",
    promptSnippet:
      "Manage monitor rules — list, add, remove, or replace calibration rules",
    parameters: Type.Object({
      monitor: Type.String({ description: "Monitor name" }),
      action: Type.Union([
        Type.Literal("list"),
        Type.Literal("add"),
        Type.Literal("remove"),
        Type.Literal("replace"),
      ]),
      text: Type.Optional(
        Type.String({ description: "Rule text (for add/replace)" }),
      ),
      index: Type.Optional(
        Type.Number({
          description: "Rule index, 1-based (for remove/replace)",
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const monitor = monitors.find((m) => m.name === params.monitor);
      if (!monitor) throw new Error(`Unknown monitor: ${params.monitor}`);
      if (params.action === "list") {
        const rules = loadInstructions(monitor);
        return {
          details: undefined,
          content: [{ type: "text", text: JSON.stringify(rules, null, 2) }],
        };
      }
      if (params.action === "add") {
        if (!params.text) throw new Error("text parameter required for add");
        const rules = loadInstructions(monitor);
        rules.push({ text: params.text, added_at: new Date().toISOString() });
        const err = saveInstructions(monitor, rules);
        if (err) throw new Error(`Failed to save rules: ${err}`);
        return {
          details: undefined,
          content: [
            {
              type: "text",
              text: `Rule added to [${monitor.name}]: ${params.text}`,
            },
          ],
        };
      }
      if (params.action === "remove") {
        if (params.index === undefined)
          throw new Error("index parameter required for remove");
        const rules = loadInstructions(monitor);
        if (params.index < 1 || params.index > rules.length) {
          throw new Error(
            `Invalid index ${params.index}. Have ${rules.length} rules.`,
          );
        }
        const removed = rules.splice(params.index - 1, 1)[0];
        const err = saveInstructions(monitor, rules);
        if (err) throw new Error(`Failed to save rules: ${err}`);
        return {
          details: undefined,
          content: [
            {
              type: "text",
              text: `Removed rule ${params.index} from [${monitor.name}]: ${removed.text}`,
            },
          ],
        };
      }
      // replace
      if (params.index === undefined)
        throw new Error("index parameter required for replace");
      if (!params.text) throw new Error("text parameter required for replace");
      const rules = loadInstructions(monitor);
      if (params.index < 1 || params.index > rules.length) {
        throw new Error(
          `Invalid index ${params.index}. Have ${rules.length} rules.`,
        );
      }
      const old = rules[params.index - 1].text;
      rules[params.index - 1] = {
        text: params.text,
        added_at: new Date().toISOString(),
      };
      const err = saveInstructions(monitor, rules);
      if (err) throw new Error(`Failed to save rules: ${err}`);
      return {
        details: undefined,
        content: [
          {
            type: "text",
            text: `Replaced rule ${params.index} in [${monitor.name}]:\n  was: ${old}\n  now: ${params.text}`,
          },
        ],
      };
    },
  });

  // ── Tool: monitors-patterns ────────────────────────────────────────────
  pi.registerTool({
    name: "monitors-patterns",
    label: "Monitors Patterns",
    description: "List patterns for a behavior monitor.",
    promptSnippet: "List patterns for a behavior monitor",
    parameters: Type.Object({
      monitor: Type.String({ description: "Monitor name" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const monitor = monitors.find((m) => m.name === params.monitor);
      if (!monitor) throw new Error(`Unknown monitor: ${params.monitor}`);
      const patterns = loadPatterns(monitor);
      return {
        details: undefined,
        content: [{ type: "text", text: JSON.stringify(patterns, null, 2) }],
      };
    },
  });
}
