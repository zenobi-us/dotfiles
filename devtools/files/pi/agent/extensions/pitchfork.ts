import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Type, type Static } from "@sinclair/typebox";
import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const ACTIONS = [
  "activate",
  "boot",
  "boot-enable",
  "boot-disable",
  "boot-status",
  "clean",
  "config",
  "config-add",
  "config-remove",
  "completion",
  "disable",
  "enable",
  "list",
  "logs",
  "restart",
  "run",
  "start",
  "status",
  "stop",
  "supervisor",
  "supervisor-run",
  "supervisor-start",
  "supervisor-status",
  "supervisor-stop",
  "tui",
  "wait",
] as const;

const RETRIGGER_MODES = ["finish", "always", "success", "fail"] as const;
type RetriggerMode = (typeof RETRIGGER_MODES)[number];

type PitchforkAction = (typeof ACTIONS)[number];

const ACTION_TO_ARGS: Record<PitchforkAction, string[]> = {
  activate: ["activate"],
  boot: ["boot"],
  "boot-enable": ["boot", "enable"],
  "boot-disable": ["boot", "disable"],
  "boot-status": ["boot", "status"],
  clean: ["clean"],
  config: ["config"],
  "config-add": ["config", "add"],
  "config-remove": ["config", "remove"],
  completion: ["completion"],
  disable: ["disable"],
  enable: ["enable"],
  list: ["list"],
  logs: ["logs"],
  restart: ["restart"],
  run: ["run"],
  start: ["start"],
  status: ["status"],
  stop: ["stop"],
  supervisor: ["supervisor"],
  "supervisor-run": ["supervisor", "run"],
  "supervisor-start": ["supervisor", "start"],
  "supervisor-status": ["supervisor", "status"],
  "supervisor-stop": ["supervisor", "stop"],
  tui: ["tui"],
  wait: ["wait"],
};

const PitchforkToolParams = Type.Object({
  action: StringEnum(ACTIONS, {
    description:
      "Pitchfork CLI action from https://pitchfork.jdx.dev/cli/ (e.g. list, logs, start, stop, restart, run, config-add).",
  }),
  args: Type.Optional(
    Type.Array(Type.String(), {
      description: "Additional CLI args appended after the selected action.",
    }),
  ),
  cwd: Type.Optional(Type.String({ description: "Working directory for command execution." })),
  timeout: Type.Optional(Type.Number({ description: "Timeout in milliseconds (default 15000)." })),
});

type PitchforkToolParamsType = Static<typeof PitchforkToolParams>;

type DaemonSection = {
  id: string;
  start: number;
  end: number;
};

type CronConfig = {
  daemonId: string;
  schedule: string;
  retrigger: RetriggerMode;
};

function formatCommand(argv: string[]): string {
  return argv
    .map((part) => (/[^A-Za-z0-9_./:-]/.test(part) ? JSON.stringify(part) : part))
    .join(" ");
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let escaped = false;

  for (const ch of input) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (current) tokens.push(current);
  return tokens;
}

function findPitchforkToml(cwd: string): string | null {
  let current = path.resolve(cwd);
  while (true) {
    const candidate = path.join(current, "pitchfork.toml");
    if (existsSync(candidate)) return candidate;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function parseDaemonSections(lines: string[]): DaemonSection[] {
  const sections: DaemonSection[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^\s*\[daemons\.([^\]]+)\]\s*$/);
    if (!match) continue;

    let end = lines.length;
    for (let j = i + 1; j < lines.length; j += 1) {
      if (/^\s*\[[^\]]+\]\s*$/.test(lines[j])) {
        end = j;
        break;
      }
    }

    sections.push({ id: match[1], start: i, end });
  }
  return sections;
}

function parseCronLine(line: string): { schedule: string; retrigger: RetriggerMode } | null {
  if (!/^\s*cron\s*=/.test(line)) return null;
  const scheduleMatch = line.match(/schedule\s*=\s*"([^"]+)"/);
  if (!scheduleMatch) return null;

  const retriggerMatch = line.match(/retrigger\s*=\s*"([^"]+)"/);
  const retrigger = (retriggerMatch?.[1] ?? "finish") as RetriggerMode;
  if (!RETRIGGER_MODES.includes(retrigger)) return null;

  return { schedule: scheduleMatch[1], retrigger };
}

function getCronConfigs(content: string): CronConfig[] {
  const lines = content.split(/\r?\n/);
  const sections = parseDaemonSections(lines);
  const out: CronConfig[] = [];

  for (const section of sections) {
    for (let i = section.start + 1; i < section.end; i += 1) {
      const parsed = parseCronLine(lines[i]);
      if (!parsed) continue;
      out.push({ daemonId: section.id, ...parsed });
      break;
    }
  }

  return out;
}

function setCronConfig(content: string, daemonId: string, schedule: string, retrigger: RetriggerMode): { updated: string; changed: boolean } {
  const lines = content.split(/\r?\n/);
  const sections = parseDaemonSections(lines);
  const section = sections.find((s) => s.id === daemonId);
  if (!section) {
    throw new Error(`Daemon '${daemonId}' not found in pitchfork.toml`);
  }

  const cronLine = `cron = { schedule = "${schedule}", retrigger = "${retrigger}" }`;

  for (let i = section.start + 1; i < section.end; i += 1) {
    if (/^\s*cron\s*=/.test(lines[i])) {
      const changed = lines[i] !== cronLine;
      lines[i] = cronLine;
      return { updated: lines.join("\n"), changed };
    }
  }

  lines.splice(section.end, 0, cronLine);
  return { updated: lines.join("\n"), changed: true };
}

function removeCronConfig(content: string, daemonId: string): { updated: string; removed: boolean } {
  const lines = content.split(/\r?\n/);
  const sections = parseDaemonSections(lines);
  const section = sections.find((s) => s.id === daemonId);
  if (!section) {
    throw new Error(`Daemon '${daemonId}' not found in pitchfork.toml`);
  }

  for (let i = section.start + 1; i < section.end; i += 1) {
    if (/^\s*cron\s*=/.test(lines[i])) {
      lines.splice(i, 1);
      return { updated: lines.join("\n"), removed: true };
    }
  }

  return { updated: content, removed: false };
}

function parsePositiveInt(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  return Number.parseInt(value, 10);
}

function buildFieldMatcher(field: string, min: number, max: number): { matcher: (v: number) => boolean; error?: string } {
  const values = new Set<number>();

  const addRange = (start: number, end: number, step = 1) => {
    for (let i = start; i <= end; i += step) values.add(i);
  };

  const inRange = (n: number) => n >= min && n <= max;

  for (const part of field.split(",")) {
    const token = part.trim();
    if (!token) return { matcher: () => false, error: `Empty list item in '${field}'` };

    if (token === "*") {
      addRange(min, max, 1);
      continue;
    }

    const starStep = token.match(/^\*\/(\d+)$/);
    if (starStep) {
      const step = parsePositiveInt(starStep[1]);
      if (!step || step <= 0) return { matcher: () => false, error: `Invalid step in '${token}'` };
      addRange(min, max, step);
      continue;
    }

    const rangeStep = token.match(/^(\d+)-(\d+)(?:\/(\d+))?$/);
    if (rangeStep) {
      const start = parsePositiveInt(rangeStep[1]);
      const end = parsePositiveInt(rangeStep[2]);
      const step = rangeStep[3] ? parsePositiveInt(rangeStep[3]) : 1;

      if (start === null || end === null || !step || step <= 0) {
        return { matcher: () => false, error: `Invalid range token '${token}'` };
      }
      if (!inRange(start) || !inRange(end) || start > end) {
        return { matcher: () => false, error: `Range '${token}' outside ${min}-${max}` };
      }

      addRange(start, end, step);
      continue;
    }

    const singleStep = token.match(/^(\d+)(?:\/(\d+))?$/);
    if (singleStep) {
      const start = parsePositiveInt(singleStep[1]);
      const step = singleStep[2] ? parsePositiveInt(singleStep[2]) : null;
      if (start === null || !inRange(start)) {
        return { matcher: () => false, error: `Value '${token}' outside ${min}-${max}` };
      }

      if (step !== null) {
        if (!step || step <= 0) {
          return { matcher: () => false, error: `Invalid step in '${token}'` };
        }
        addRange(start, max, step);
      } else {
        values.add(start);
      }
      continue;
    }

    return { matcher: () => false, error: `Unsupported token '${token}'` };
  }

  return { matcher: (v: number) => values.has(v) };
}

function compileCronMatcher(schedule: string): { matcher: (date: Date) => boolean; error?: string } {
  const fields = schedule.trim().split(/\s+/);
  if (fields.length !== 6) {
    return { matcher: () => false, error: "Expected 6 fields: second minute hour day month weekday" };
  }

  const specs: Array<[string, number, number, string]> = [
    [fields[0], 0, 59, "second"],
    [fields[1], 0, 59, "minute"],
    [fields[2], 0, 23, "hour"],
    [fields[3], 1, 31, "day-of-month"],
    [fields[4], 1, 12, "month"],
    [fields[5], 0, 6, "weekday"],
  ];

  const matchers = specs.map(([field, min, max, label]) => {
    const built = buildFieldMatcher(field, min, max);
    if (built.error) return { error: `${label}: ${built.error}` };
    return { match: built.matcher };
  });

  const err = matchers.find((m) => "error" in m);
  if (err && "error" in err) {
    return { matcher: () => false, error: err.error };
  }

  const [sec, min, hour, dom, month, dow] = matchers as Array<{ match: (v: number) => boolean }>;

  return {
    matcher: (date: Date) =>
      sec.match(date.getSeconds()) &&
      min.match(date.getMinutes()) &&
      hour.match(date.getHours()) &&
      dom.match(date.getDate()) &&
      month.match(date.getMonth() + 1) &&
      dow.match(date.getDay()),
  };
}

function validateCronSchedule(schedule: string): { ok: boolean; reason?: string } {
  const compiled = compileCronMatcher(schedule);
  if (compiled.error) {
    return { ok: false, reason: compiled.error };
  }
  return { ok: true };
}

function nextRuns(schedule: string, count: number): { runs: Date[]; error?: string } {
  const compiled = compileCronMatcher(schedule);
  if (compiled.error) {
    return { runs: [], error: compiled.error };
  }

  const results: Date[] = [];
  let ts = Date.now() + 1000;
  const maxChecks = 366 * 24 * 60 * 60;

  for (let i = 0; i < maxChecks && results.length < count; i += 1) {
    const date = new Date(ts);
    if (compiled.matcher(date)) {
      results.push(date);
    }
    ts += 1000;
  }

  return { runs: results };
}

async function checkPitchforkAvailable(pi: ExtensionAPI, cwd: string): Promise<boolean> {
  const result = await pi.exec("pitchfork", ["--version"], { cwd, timeout: 5000 });
  return result.code === 0;
}

async function runPitchfork(pi: ExtensionAPI, action: PitchforkAction, args: string[], cwd: string, timeout: number) {
  const argv = [...ACTION_TO_ARGS[action], ...args];
  const result = await pi.exec("pitchfork", argv, { cwd, timeout });
  const rendered = [
    `command: ${formatCommand(["pitchfork", ...argv])}`,
    `cwd: ${cwd}`,
    `exitCode: ${result.code}`,
  ];

  if (result.stdout?.trim()) {
    rendered.push("", "stdout:", result.stdout.trim());
  }

  if (result.stderr?.trim()) {
    rendered.push("", "stderr:", result.stderr.trim());
  }

  return {
    text: rendered.join("\n"),
    argv,
    result,
  };
}

function usageText(): string {
  return [
    "Usage: /pitchfork <subcommand...>",
    "Examples:",
    "  /pitchfork list",
    "  /pitchfork logs api --follow",
    "  /pitchfork start api",
    "  /pitchfork restart --all",
    "  /pitchfork config add api -- npm run dev",
  ].join("\n");
}

function cronUsageText(): string {
  return [
    "Usage: /pitchfork-cron <subcommand>",
    "Subcommands:",
    "  ls",
    "  set <daemon> --schedule \"0 */5 * * * *\" [--retrigger finish|always|success|fail]",
    "  rm <daemon>",
    "  lint \"0 */5 * * * *\"",
    "  next \"0 */5 * * * *\" [--count 5]",
  ].join("\n");
}

export default function pitchforkExtension(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "pitchfork_cli",
    label: "Pitchfork CLI",
    description:
      "Run Pitchfork CLI commands. Supports all actions from https://pitchfork.jdx.dev/cli/ including start/stop/restart/list/logs/config/supervisor.",
    parameters: PitchforkToolParams,
    async execute(_toolCallId, params, _onUpdate, ctx, _signal) {
      const { action, args = [], timeout = 15000 } = params as PitchforkToolParamsType;
      const cwd = (params as PitchforkToolParamsType).cwd ?? ctx.cwd;

      const available = await checkPitchforkAvailable(pi, cwd);
      if (!available) {
        return {
          content: [
            {
              type: "text",
              text:
                "pitchfork is not available in PATH. Install it first: https://pitchfork.jdx.dev/quickstart/",
            },
          ],
          details: { available: false, cwd },
          isError: true,
        };
      }

      const run = await runPitchfork(pi, action, args, cwd, timeout);
      return {
        content: [{ type: "text", text: run.text }],
        details: {
          available: true,
          action,
          args: run.argv,
          cwd,
          code: run.result.code,
          stdout: run.result.stdout,
          stderr: run.result.stderr,
        },
        isError: run.result.code !== 0,
      };
    },
  });

  const runCommand = async (
    rawArgs: string | undefined,
    notify: (message: string, level: "info" | "warning" | "error") => void,
    cwd: string,
  ) => {
    const trimmed = (rawArgs ?? "").trim();
    if (!trimmed) {
      notify(usageText(), "info");
      return;
    }

    const available = await checkPitchforkAvailable(pi, cwd);
    if (!available) {
      notify("pitchfork is not available in PATH", "error");
      return;
    }

    const result = await pi.exec("bash", ["-lc", `pitchfork ${trimmed}`], { cwd, timeout: 15000 });
    const out = [
      `command: pitchfork ${trimmed}`,
      `exitCode: ${result.code}`,
      result.stdout?.trim() ? `\n${result.stdout.trim()}` : "",
      result.stderr?.trim() ? `\n${result.stderr.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    notify(out, result.code === 0 ? "info" : "error");
  };

  const runCronCommand = async (
    rawArgs: string | undefined,
    notify: (message: string, level: "info" | "warning" | "error") => void,
    cwd: string,
  ) => {
    const args = tokenize((rawArgs ?? "").trim());
    const sub = args[0];

    if (!sub) {
      notify(cronUsageText(), "info");
      return;
    }

    const configPath = findPitchforkToml(cwd);
    if (!configPath) {
      notify("No pitchfork.toml found in current directory or parents", "error");
      return;
    }

    const content = readFileSync(configPath, "utf8");

    if (sub === "ls" || sub === "list") {
      const configs = getCronConfigs(content);
      if (configs.length === 0) {
        notify(`No cron daemons configured in ${configPath}`, "info");
        return;
      }

      const lines = [`Cron daemons (${configs.length}) in ${configPath}:`];
      for (const cfg of configs) {
        lines.push(`- ${cfg.daemonId}: schedule=\"${cfg.schedule}\" retrigger=${cfg.retrigger}`);
      }
      notify(lines.join("\n"), "info");
      return;
    }

    if (sub === "set") {
      const daemonId = args[1];
      if (!daemonId) {
        notify("Missing daemon id. Usage: /pitchfork-cron set <daemon> --schedule \"...\" [--retrigger ...]", "warning");
        return;
      }

      let schedule: string | undefined;
      let retrigger: RetriggerMode = "finish";

      for (let i = 2; i < args.length; i += 1) {
        if (args[i] === "--schedule") {
          schedule = args[i + 1];
          i += 1;
          continue;
        }
        if (args[i] === "--retrigger") {
          const mode = args[i + 1] as RetriggerMode | undefined;
          if (!mode || !RETRIGGER_MODES.includes(mode)) {
            notify(`Invalid retrigger mode. Use one of: ${RETRIGGER_MODES.join(", ")}`, "warning");
            return;
          }
          retrigger = mode;
          i += 1;
          continue;
        }
      }

      if (!schedule) {
        notify("Missing --schedule. Example: --schedule \"0 */5 * * * *\"", "warning");
        return;
      }

      const valid = validateCronSchedule(schedule);
      if (!valid.ok) {
        notify(`Invalid cron schedule: ${valid.reason}`, "error");
        return;
      }

      try {
        const { updated, changed } = setCronConfig(content, daemonId, schedule, retrigger);
        if (!changed) {
          notify(`Cron config already set for daemon '${daemonId}'`, "info");
          return;
        }
        writeFileSync(configPath, updated, "utf8");
        notify(
          `Updated ${configPath}\n- daemon: ${daemonId}\n- schedule: ${schedule}\n- retrigger: ${retrigger}`,
          "info",
        );
      } catch (error) {
        notify(error instanceof Error ? error.message : String(error), "error");
      }
      return;
    }

    if (sub === "rm" || sub === "remove") {
      const daemonId = args[1];
      if (!daemonId) {
        notify("Missing daemon id. Usage: /pitchfork-cron rm <daemon>", "warning");
        return;
      }

      try {
        const { updated, removed } = removeCronConfig(content, daemonId);
        if (!removed) {
          notify(`No cron config found for daemon '${daemonId}'`, "info");
          return;
        }
        writeFileSync(configPath, updated, "utf8");
        notify(`Removed cron config for '${daemonId}' in ${configPath}`, "info");
      } catch (error) {
        notify(error instanceof Error ? error.message : String(error), "error");
      }
      return;
    }

    if (sub === "lint") {
      const schedule = args[1];
      if (!schedule) {
        notify("Missing schedule. Usage: /pitchfork-cron lint \"0 */5 * * * *\"", "warning");
        return;
      }
      const valid = validateCronSchedule(schedule);
      if (valid.ok) {
        notify(`Cron schedule is valid: ${schedule}`, "info");
      } else {
        notify(`Invalid cron schedule: ${valid.reason}`, "error");
      }
      return;
    }

    if (sub === "next") {
      const schedule = args[1];
      if (!schedule) {
        notify("Missing schedule. Usage: /pitchfork-cron next \"0 */5 * * * *\" [--count 5]", "warning");
        return;
      }

      let count = 5;
      for (let i = 2; i < args.length; i += 1) {
        if (args[i] === "--count") {
          const parsed = Number.parseInt(args[i + 1] ?? "", 10);
          if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 50) {
            notify("--count must be between 1 and 50", "warning");
            return;
          }
          count = parsed;
          i += 1;
        }
      }

      const result = nextRuns(schedule, count);
      if (result.error) {
        notify(`Invalid cron schedule: ${result.error}`, "error");
        return;
      }

      if (result.runs.length === 0) {
        notify("No future runs found within 1 year for this schedule", "warning");
        return;
      }

      const lines = [`Next ${result.runs.length} run(s) for '${schedule}':`];
      for (const run of result.runs) {
        lines.push(`- ${run.toString()} (${run.toISOString()})`);
      }
      notify(lines.join("\n"), "info");
      return;
    }

    notify(`Unknown subcommand '${sub}'.\n\n${cronUsageText()}`, "warning");
  };

  pi.registerCommand("pitchfork", {
    description: "Run pitchfork CLI commands (https://pitchfork.jdx.dev/cli/)",
    handler: async (args, ctx) => {
      await runCommand(args, (message, level) => ctx.ui.notify(message, level), ctx.cwd);
    },
  });

  pi.registerCommand("pf", {
    description: "Alias for /pitchfork",
    handler: async (args, ctx) => {
      await runCommand(args, (message, level) => ctx.ui.notify(message, level), ctx.cwd);
    },
  });

  pi.registerCommand("pitchfork-cron", {
    description: "Manage cron schedules in pitchfork.toml (ls/set/rm/lint/next)",
    handler: async (args, ctx) => {
      await runCronCommand(args, (message, level) => ctx.ui.notify(message, level), ctx.cwd);
    },
  });

  pi.registerCommand("pf-cron", {
    description: "Alias for /pitchfork-cron",
    handler: async (args, ctx) => {
      await runCronCommand(args, (message, level) => ctx.ui.notify(message, level), ctx.cwd);
    },
  });
}
