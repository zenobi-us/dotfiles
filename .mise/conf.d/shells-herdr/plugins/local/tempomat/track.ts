#!/usr/bin/env bun
/**
 * Auto-track Tempo.io time from the focused Herdr pane.
 *
 * Event flow (see herdr-plugin.toml):
 *   pane.focused / pane.exited / tab.closed / workspace.closed -> this script, no flags
 *   plugin startup                                             -> --startup (flush only)
 *   action "status"                                            -> --status
 *   action "stop"                                               -> --force-stop
 *
 * State lives in $HERDR_PLUGIN_STATE_DIR/state.json:
 *   {"issue": "PROJ-123"|null, "status": "running"|"paused"|null, "paused_at": <unix seconds>|null}
 *
 * Config lives in $HERDR_PLUGIN_CONFIG_DIR/rules.toml (see rules.example.toml).
 */

import { appendFile, mkdir } from "node:fs/promises";
import { Crust } from "@crustjs/core";
import { helpPlugin } from "@crustjs/plugins";

const HERDR_BIN = process.env.HERDR_BIN_PATH ?? "herdr";
const STATE_DIR = process.env.HERDR_PLUGIN_STATE_DIR ?? "/tmp/tempomat-plugin";
const CONFIG_DIR = process.env.HERDR_PLUGIN_CONFIG_DIR ?? STATE_DIR;
const STATE_PATH = `${STATE_DIR}/state.json`;
const CONFIG_PATH = `${CONFIG_DIR}/rules.toml`;
const DRY_RUN_LOG = `${STATE_DIR}/dry-run.log`;

type TicketPatternRule = { type: "ticket_pattern"; pattern: string; description?: string };
type PathGlobRule = { type: "path_glob"; glob: string; issue: string; description?: string };
type Rule = TicketPatternRule | PathGlobRule;
type Config = { live: boolean; grace_period_seconds: number; rules: Rule[] };
type TrackerStatus = "running" | "paused" | null;
type State = { issue: string | null; status: TrackerStatus; paused_at: number | null };

const DEFAULT_CONFIG: Config = { live: false, grace_period_seconds: 300, rules: [] };
const EMPTY_STATE: State = { issue: null, status: null, paused_at: null };

async function loadConfig(): Promise<Config> {
  const file = Bun.file(CONFIG_PATH);
  if (!(await file.exists())) return DEFAULT_CONFIG;
  const data = Bun.TOML.parse(await file.text()) as Partial<Config>;
  return { ...DEFAULT_CONFIG, ...data };
}

async function loadState(): Promise<State> {
  const file = Bun.file(STATE_PATH);
  if (!(await file.exists())) return { ...EMPTY_STATE };
  return (await file.json()) as State;
}

async function saveState(state: State): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await Bun.write(STATE_PATH, JSON.stringify(state));
}

function runHerdr(...args: string[]): any {
  const result = Bun.spawnSync([HERDR_BIN, ...args]);
  if (result.exitCode !== 0) {
    throw new Error(`herdr ${args.join(" ")} failed: ${result.stderr.toString().trim()}`);
  }
  return JSON.parse(result.stdout.toString());
}

async function runTempo(config: Config, ...args: string[]): Promise<void> {
  if (!config.live) {
    await mkdir(STATE_DIR, { recursive: true });
    await appendFile(DRY_RUN_LOG, `${Math.floor(Date.now() / 1000)} DRY-RUN tempo ${args.join(" ")}\n`);
    return;
  }
  Bun.spawnSync(["tempo", ...args]);
}

function extractIssue(pattern: string, text: string): string | null {
  if (!text) return null;
  const match = new RegExp(pattern).exec(text);
  if (!match) return null;
  return (match.groups?.issue ?? match[0]).toUpperCase();
}

interface Sources {
  pane_title: string;
  tab_label: string;
  cwd: string;
  foreground_cwd: string;
}

function matchRules(config: Config, sources: Sources): string | null {
  for (const rule of config.rules) {
    if (rule.type === "ticket_pattern") {
      for (const key of ["pane_title", "tab_label", "cwd", "foreground_cwd"] as const) {
        const issue = extractIssue(rule.pattern, sources[key]);
        if (issue) return issue;
      }
    } else {
      const glob = new Bun.Glob(rule.glob.replace(/^~/, process.env.HOME ?? "~"));
      for (const key of ["cwd", "foreground_cwd"] as const) {
        if (sources[key] && glob.match(sources[key])) return rule.issue;
      }
    }
  }
  return null;
}

function focusedPaneSources(paneId: string): Sources {
  const pane = runHerdr("pane", "get", paneId).result.pane;
  const tab = runHerdr("tab", "get", pane.tab_id).result.tab;
  return {
    pane_title: pane.terminal_title_stripped ?? "",
    tab_label: tab.label ?? "",
    cwd: pane.cwd ?? "",
    foreground_cwd: pane.foreground_cwd ?? "",
  };
}

async function flushExpiredPause(config: Config, state: State): Promise<State> {
  if (state.status !== "paused" || !state.issue) return state;
  if (Date.now() / 1000 - (state.paused_at ?? 0) >= config.grace_period_seconds) {
    await runTempo(config, "tracker:stop", state.issue);
    return { ...EMPTY_STATE };
  }
  return state;
}

async function apply(config: Config, state: State, matchedIssue: string | null): Promise<State> {
  const now = Date.now() / 1000;
  state = await flushExpiredPause(config, state);

  if (matchedIssue === null) {
    if (state.status === "running" && state.issue) {
      await runTempo(config, "tracker:pause", state.issue);
      return { issue: state.issue, status: "paused", paused_at: now };
    }
    return state;
  }

  if (matchedIssue === state.issue) {
    if (state.status === "paused") {
      await runTempo(config, "tracker:resume", matchedIssue);
      return { issue: matchedIssue, status: "running", paused_at: null };
    }
    return state;
  }

  if (state.issue && state.status) {
    await runTempo(config, "tracker:stop", state.issue);
  }
  await runTempo(config, "tracker:start", matchedIssue, "--stop-previous");
  return { issue: matchedIssue, status: "running", paused_at: null };
}

async function handleEvent(): Promise<void> {
  const config = await loadConfig();
  let state = await loadState();

  const event = process.env.HERDR_PLUGIN_EVENT ?? "";
  if (event === "pane.focused") {
    const payload = JSON.parse(process.env.HERDR_PLUGIN_EVENT_JSON ?? "{}");
    const sources = focusedPaneSources(payload.pane_id);
    state = await apply(config, state, matchRules(config, sources));
  } else {
    // pane.exited / tab.closed / workspace.closed: no focused pane to read.
    // Treat as focus-loss so a stale tracker still gets its grace period applied.
    state = await apply(config, state, null);
  }

  await saveState(state);
}

async function handleStartup(): Promise<void> {
  const config = await loadConfig();
  await saveState(await flushExpiredPause(config, await loadState()));
}

async function handleStatus(): Promise<void> {
  const config = await loadConfig();
  const state = await loadState();
  console.log(JSON.stringify({ live: config.live, ...state }, null, 2));
}

async function handleForceStop(): Promise<void> {
  const config = await loadConfig();
  const state = await loadState();
  if (state.issue) {
    await runTempo(config, "tracker:stop", state.issue);
  }
  await saveState({ ...EMPTY_STATE });
}

const cli = new Crust("tempomat")
  .use(helpPlugin())
  .flags({
    startup: { type: "boolean", default: false, description: "Flush a stale paused tracker on plugin startup" },
    status: { type: "boolean", default: false, description: "Print the current tracker state" },
    "force-stop": {
      type: "boolean",
      default: false,
      description: "Finalize the active tracker now, ignoring the grace period",
    },
  })
  .run(async ({ flags }) => {
    if (flags.startup) return handleStartup();
    if (flags.status) return handleStatus();
    if (flags["force-stop"]) return handleForceStop();
    return handleEvent();
  });

await cli.execute();
