import { loadInstructions, saveInstructions } from "./rules";
import { loadPatterns } from "./patterns";
import type { MonitorsCommand } from "./types";

export function parseMonitorsArgs(args: string, knownNames: Set<string>): MonitorsCommand {
  const trimmed = args.trim();
  if (!trimmed) return { type: "list" };
  const tokens = trimmed.split(/\s+/);
  const first = tokens[0];
  // global commands (only if not a monitor name)
  if (!knownNames.has(first)) {
    if (first === "on") return { type: "on" };
    if (first === "off") return { type: "off" };
    return {
      type: "error",
      message: `Unknown monitor: ${first}\nAvailable: ${[...knownNames].join(", ")}`,
    };
  }
  const name = first;
  if (tokens.length === 1) return { type: "inspect", name };
  const verb = tokens[1];
  if (verb === "rules") {
    if (tokens.length === 2) return { type: "rules-list", name };
    const action = tokens[2];
    if (action === "add") {
      const text = tokens.slice(3).join(" ");
      if (!text)
        return {
          type: "error",
          message: "Usage: /monitors <name> rules add <text>",
        };
      return { type: "rules-add", name, text };
    }
    if (action === "remove") {
      const n = parseInt(tokens[3]);
      if (isNaN(n) || n < 1)
        return {
          type: "error",
          message: "Usage: /monitors <name> rules remove <number>",
        };
      return { type: "rules-remove", name, index: n };
    }
    if (action === "replace") {
      const n = parseInt(tokens[3]);
      const text = tokens.slice(4).join(" ");
      if (isNaN(n) || n < 1 || !text)
        return {
          type: "error",
          message: "Usage: /monitors <name> rules replace <number> <text>",
        };
      return { type: "rules-replace", name, index: n, text };
    }
    return {
      type: "error",
      message: `Unknown rules action: ${action}\nAvailable: add, remove, replace`,
    };
  }
  if (verb === "patterns") return { type: "patterns-list", name };
  if (verb === "dismiss") return { type: "dismiss", name };
  if (verb === "reset") return { type: "reset", name };
  return {
    type: "error",
    message: `Unknown subcommand: ${verb}\nAvailable: rules, patterns, dismiss, reset`,
  };
}

function handleList(monitors, ctx, enabled) {
  const header = enabled
    ? "monitors: ON"
    : "monitors: OFF (all monitoring paused)";
  const lines = monitors.map((m) => {
    const state = m.dismissed
      ? "dismissed"
      : m.whileCount > 0
        ? `engaged (${m.whileCount}/${m.ceiling})`
        : "idle";
    const scope = m.scope.target !== "main" ? ` [scope:${m.scope.target}]` : "";
    return `  ${m.name} [${m.event}${m.when !== "always" ? `, when: ${m.when}` : ""}]${scope} — ${state}`;
  });
  ctx.ui.notify(`${header}\n${lines.join("\n")}`, "info");
}

function handleInspect(monitor, ctx) {
  const rules = loadInstructions(monitor);
  const patterns = loadPatterns(monitor);
  const state = monitor.dismissed
    ? "dismissed"
    : monitor.whileCount > 0
      ? `engaged (${monitor.whileCount}/${monitor.ceiling})`
      : "idle";
  const lines = [
    `[${monitor.name}] ${monitor.description}`,
    `event: ${monitor.event}, when: ${monitor.when}, scope: ${monitor.scope.target}`,
    `state: ${state}, ceiling: ${monitor.ceiling}, escalate: ${monitor.escalate}`,
    `rules: ${rules.length}, patterns: ${patterns.length}`,
  ];
  ctx.ui.notify(lines.join("\n"), "info");
}

function handleRulesList(monitor, ctx) {
  const rules = loadInstructions(monitor);
  if (rules.length === 0) {
    ctx.ui.notify(`[${monitor.name}] (no rules)`, "info");
    return;
  }
  const lines = rules.map((r, i) => `${i + 1}. ${r.text}`);
  ctx.ui.notify(`[${monitor.name}] rules:\n${lines.join("\n")}`, "info");
}

function handleRulesAdd(monitor, ctx, text) {
  const rules = loadInstructions(monitor);
  rules.push({ text, added_at: new Date().toISOString() });
  const err = saveInstructions(monitor, rules);
  if (err) {
    ctx.ui.notify(`[${monitor.name}] Failed to save: ${err}`, "error");
  } else {
    ctx.ui.notify(`[${monitor.name}] Rule added: ${text}`, "info");
  }
}

function handleRulesRemove(monitor, ctx, index) {
  const rules = loadInstructions(monitor);
  if (index < 1 || index > rules.length) {
    ctx.ui.notify(
      `[${monitor.name}] Invalid index ${index}. Have ${rules.length} rules.`,
      "error",
    );
    return;
  }
  const removed = rules.splice(index - 1, 1)[0];
  const err = saveInstructions(monitor, rules);
  if (err) {
    ctx.ui.notify(`[${monitor.name}] Failed to save: ${err}`, "error");
  } else {
    ctx.ui.notify(
      `[${monitor.name}] Removed rule ${index}: ${removed.text}`,
      "info",
    );
  }
}

function handleRulesReplace(monitor, ctx, index, text) {
  const rules = loadInstructions(monitor);
  if (index < 1 || index > rules.length) {
    ctx.ui.notify(
      `[${monitor.name}] Invalid index ${index}. Have ${rules.length} rules.`,
      "error",
    );
    return;
  }
  const old = rules[index - 1].text;
  rules[index - 1] = { text, added_at: new Date().toISOString() };
  const err = saveInstructions(monitor, rules);
  if (err) {
    ctx.ui.notify(`[${monitor.name}] Failed to save: ${err}`, "error");
  } else {
    ctx.ui.notify(
      `[${monitor.name}] Replaced rule ${index}:\n  was: ${old}\n  now: ${text}`,
      "info",
    );
  }
}

function handlePatternsList(monitor, ctx) {
  const patterns = loadPatterns(monitor);
  if (patterns.length === 0) {
    ctx.ui.notify(
      `[${monitor.name}] (no patterns — monitor will not classify)`,
      "info",
    );
    return;
  }
  const lines = patterns.map((p, i) => {
    const source = p.source ? ` (${p.source})` : "";
    return `${i + 1}. [${p.severity ?? "warning"}] ${p.description}${source}`;
  });
  ctx.ui.notify(`[${monitor.name}] patterns:\n${lines.join("\n")}`, "info");
}

export function registerMonitorsCommand(pi, monitors, monitorState) {
  const { getMonitorsEnabled, setMonitorsEnabled, updateStatus } = monitorState;

  // /monitors command — unified management interface
  const monitorNames = new Set(monitors.map((m) => m.name));
  const monitorsByName = new Map(monitors.map((m) => [m.name, m]));
  const monitorVerbs = ["rules", "patterns", "dismiss", "reset"];
  const rulesActions = ["add", "remove", "replace"];

  pi.registerCommand("monitors", {
    description: "Manage behavior monitors",
    getArgumentCompletions(argumentPrefix) {
      const tokens = argumentPrefix.split(/\s+/);
      const last = tokens[tokens.length - 1];
      // Level 0: no complete token yet — show global commands + monitor names
      if (tokens.length <= 1) {
        const items = [
          { value: "on", label: "on", description: "Enable all monitoring" },
          { value: "off", label: "off", description: "Pause all monitoring" },
          ...Array.from(monitorNames).map((n) => ({
            value: n,
            label: n,
            description: `${monitorsByName.get(n)?.description ?? ""} → rules|patterns|dismiss|reset`,
          })),
        ];
        return items.filter((i) => i.value.startsWith(last));
      }
      const name = tokens[0];
      // Level 1: monitor name entered — show verbs
      if (monitorNames.has(name) && tokens.length === 2) {
        return monitorVerbs
          .map((v) => ({ value: `${name} ${v}`, label: v, description: "" }))
          .filter((i) => i.label.startsWith(last));
      }
      // Level 2: monitor name + "rules" — show actions
      if (
        monitorNames.has(name) &&
        tokens[1] === "rules" &&
        tokens.length === 3
      ) {
        return rulesActions
          .map((a) => ({
            value: `${name} rules ${a}`,
            label: a,
            description: "",
          }))
          .filter((i) => i.label.startsWith(last));
      }
      return null;
    },
    handler: async (args, ctx) => {
      const cmd = parseMonitorsArgs(args, monitorNames);
      if (cmd.type === "error") {
        ctx.ui.notify(cmd.message, "warning");
        return;
      }
      if (cmd.type === "list") {
        if (!ctx.hasUI) {
          handleList(monitors, ctx, getMonitorsEnabled());
          return;
        }
        const options = [
          `on — Enable all monitoring`,
          `off — Pause all monitoring`,
          ...monitors.map((m) => {
            const state = m.dismissed
              ? "dismissed"
              : m.whileCount > 0
                ? `engaged (${m.whileCount}/${m.ceiling})`
                : "idle";
            return `${m.name} — ${m.description} [${state}]`;
          }),
        ];
        const selected = await ctx.ui.select("Monitors", options);
        if (!selected) return;
        const selectedName = selected.split(" ")[0];
        if (selectedName === "on") {
          setMonitorsEnabled(true);
          updateStatus();
          ctx.ui.notify("Monitors enabled", "info");
        } else if (selectedName === "off") {
          setMonitorsEnabled(false);
          updateStatus();
          ctx.ui.notify("All monitors paused for this session", "info");
        } else {
          const monitor = monitorsByName.get(selectedName);
          if (!monitor) return;
          const verbOptions = [
            `inspect — Show monitor state and config`,
            `rules — List and manage rules`,
            `patterns — List known patterns`,
            `dismiss — Silence for this session`,
            `reset — Reset state and un-dismiss`,
          ];
          const verb = await ctx.ui.select(`[${monitor.name}]`, verbOptions);
          if (!verb) return;
          const verbName = verb.split(" ")[0];
          if (verbName === "inspect") handleInspect(monitor, ctx);
          else if (verbName === "rules") handleRulesList(monitor, ctx);
          else if (verbName === "patterns") handlePatternsList(monitor, ctx);
          else if (verbName === "dismiss") {
            monitor.dismissed = true;
            monitor.whileCount = 0;
            updateStatus();
            ctx.ui.notify(
              `[${monitor.name}] Dismissed for this session`,
              "info",
            );
          } else if (verbName === "reset") {
            monitor.dismissed = false;
            monitor.whileCount = 0;
            updateStatus();
            ctx.ui.notify(`[${monitor.name}] Reset`, "info");
          }
        }
        return;
      }
      if (cmd.type === "on") {
        setMonitorsEnabled(true);
        updateStatus();
        ctx.ui.notify("Monitors enabled", "info");
        return;
      }
      if (cmd.type === "off") {
        setMonitorsEnabled(false);
        updateStatus();
        ctx.ui.notify("All monitors paused for this session", "info");
        return;
      }
      const monitor = monitorsByName.get(cmd.name);
      if (!monitor) {
        ctx.ui.notify(`Unknown monitor: ${cmd.name}`, "warning");
        return;
      }
      switch (cmd.type) {
        case "inspect":
          handleInspect(monitor, ctx);
          break;
        case "rules-list":
          handleRulesList(monitor, ctx);
          break;
        case "rules-add":
          handleRulesAdd(monitor, ctx, cmd.text);
          break;
        case "rules-remove":
          handleRulesRemove(monitor, ctx, cmd.index);
          break;
        case "rules-replace":
          handleRulesReplace(monitor, ctx, cmd.index, cmd.text);
          break;
        case "patterns-list":
          handlePatternsList(monitor, ctx);
          break;
        case "dismiss":
          monitor.dismissed = true;
          monitor.whileCount = 0;
          updateStatus();
          ctx.ui.notify(`[${monitor.name}] Dismissed for this session`, "info");
          break;
        case "reset":
          monitor.dismissed = false;
          monitor.whileCount = 0;
          updateStatus();
          ctx.ui.notify(`[${monitor.name}] Reset`, "info");
          break;
      }
    },
  });
}
