#!/usr/bin/env -S mise exec -- bun run --install=fallback
// Finds and removes branches and worktrees whose work is already in the default branch.
// Worktrunk decides what is integrated (`wt step prune --dry-run`); this script only
// keeps worktrees that a running process still uses, and asks once per 24 hours at session start.
//
// Usage:
//   cleanup-merged.ts list [--json] [--min-age <age>]
//   cleanup-merged.ts remove <branch>... [--min-age <age>]
//   cleanup-merged.ts session-start          (hook: reads hook JSON on stdin)
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readlinkSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const THROTTLE_MS = 24 * 60 * 60 * 1000;
// Set to true after the session-start hook is checked by hand in OMP. Until then, OMP agents get a reminder.
const OMP_VERIFIED = false;

export interface Candidate {
  branch: string;
  kind: "worktree" | "branch_only";
  path: string | null;
  reason: string;
  target: string;
}

export interface Kept {
  branch: string;
  path: string | null;
  reason: string;
}

export interface Candidates {
  repo: string;
  target: string | null;
  removable: Candidate[];
  kept: Kept[];
}

export interface Options {
  minAge?: string;
}

async function run(command: string[], cwd?: string): Promise<{ stdout: string; stderr: string; code: number }> {
  const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { stdout, stderr, code };
}

// Returns the working directory of every process this user can read, or undefined when the platform gives no way to read them.
async function processDirectories(): Promise<string[] | undefined> {
  if (existsSync("/proc/self/cwd")) {
    const directories: string[] = [];
    for (const pid of readdirSync("/proc")) {
      if (!/^\d+$/.test(pid)) continue;
      try { directories.push(readlinkSync(`/proc/${pid}/cwd`)); } catch { /* process exited or belongs to another user */ }
    }
    return directories;
  }
  const lsof = await run(["lsof", "-a", "-d", "cwd", "-F", "n"]).catch(() => undefined);
  if (!lsof || lsof.code > 1) return undefined;
  return lsof.stdout.split("\n").filter(line => line.startsWith("n")).map(line => line.slice(1));
}

export async function findCandidates(repo: string, options: Options = {}): Promise<Candidates> {
  const args = ["wt", "-C", repo, "step", "prune", "--dry-run", "--format=json"];
  if (options.minAge) args.push(`--min-age=${options.minAge}`);
  const prune = await run(args);
  if (prune.code) throw new Error(`wt step prune --dry-run failed: ${prune.stderr.trim() || prune.stdout.trim()}`);
  const integrated = JSON.parse(prune.stdout || "[]") as Candidate[];

  const directories = integrated.some(item => item.path) ? await processDirectories() : [];
  const removable: Candidate[] = [];
  const kept: Kept[] = [];
  for (const item of integrated) {
    if (!item.path) { removable.push(item); continue; }
    if (!directories) { kept.push({ branch: item.branch, path: item.path, reason: "cannot check for a running process in the worktree" }); continue; }
    const busy = directories.some(dir => dir === item.path || dir.startsWith(`${item.path}/`));
    if (busy) kept.push({ branch: item.branch, path: item.path, reason: "a process (for example an agent or shell) runs in the worktree" });
    else removable.push(item);
  }
  return { repo, target: integrated[0]?.target ?? null, removable, kept };
}

export async function removeBranches(repo: string, branches: string[], options: Options = {}): Promise<{ removed: string[]; refused: Kept[] }> {
  // Check again right before removal: state can change between the question and the answer.
  const current = await findCandidates(repo, options);
  const removed: string[] = [];
  const refused: Kept[] = [];
  for (const branch of branches) {
    const item = current.removable.find(candidate => candidate.branch === branch);
    if (!item) {
      const kept = current.kept.find(candidate => candidate.branch === branch);
      refused.push(kept ?? { branch, path: null, reason: "not integrated into the default branch, or younger than the age guard" });
      continue;
    }
    const result = await run(["wt", "-C", repo, "remove", branch, "--foreground"]);
    if (result.code) refused.push({ branch, path: item.path, reason: `wt remove failed: ${(result.stderr || result.stdout).trim()}` });
    else removed.push(branch);
  }
  return { removed, refused };
}

export interface HookOutput {
  continue: true;
  systemMessage: string;
  hookSpecificOutput: { hookEventName: "SessionStart"; additionalContext: string };
}

export interface SessionStartInput {
  cwd: string;
  stateDir?: string;
  env?: Record<string, string | undefined>;
  // The muxer-subagents router. mise links it onto PATH as `muxer-subagents`.
  agentCommand?: string;
}

// Asks the muxer-subagents router which agent runs this hook, so the detection order lives in one place.
// A missing or failing router gives "unknown-agent", which turns off agent-specific text.
async function detectAgent(command: string, env: Record<string, string | undefined>): Promise<string> {
  try {
    const child = Bun.spawn([command, "detect-agent"], { stdout: "pipe", stderr: "pipe", env: { ...process.env, ...env } });
    const [stdout, code] = await Promise.all([new Response(child.stdout).text(), child.exited]);
    return code ? "unknown-agent" : stdout.trim();
  } catch {
    return "unknown-agent";
  }
}

function defaultStateDir(env: Record<string, string | undefined>): string {
  return join(env.XDG_STATE_HOME || join(homedir(), ".local", "state"), "cleanup-merged");
}

// Returns undefined when the session should not ask: child agent, not a repository, throttled, or nothing to remove.
export async function sessionStart(input: SessionStartInput): Promise<HookOutput | undefined> {
  const env = input.env ?? process.env;
  if (Number(env.MUXER_SUBAGENT_DEPTH ?? 0) > 0) return undefined;

  const common = await run(["git", "-C", input.cwd, "rev-parse", "--path-format=absolute", "--git-common-dir"]);
  if (common.code) return undefined;
  const stateDir = input.stateDir ?? defaultStateDir(env);
  const stateFile = join(stateDir, `${createHash("sha256").update(common.stdout.trim()).digest("hex").slice(0, 16)}.json`);
  const last = await readFile(stateFile, "utf8").then(text => Number(JSON.parse(text).checkedAt), () => 0);
  if (Date.now() - last < THROTTLE_MS) return undefined;

  const found = await findCandidates(input.cwd);
  await mkdir(stateDir, { recursive: true });
  await writeFile(stateFile, JSON.stringify({ checkedAt: Date.now(), repo: common.stdout.trim() }));
  if (!found.removable.length) return undefined;

  const count = found.removable.length;
  const list = found.removable.map(item => `- ${item.branch}${item.path ? ` (worktree ${item.path})` : ""}: ${item.reason} ${item.target}`).join("\n");
  const agent = await detectAgent(input.agentCommand ?? "muxer-subagents", env);
  const ompReminder = !OMP_VERIFIED && agent === "omp"
    ? ["UNVERIFIED IN OMP: this hook has only been tested in Claude Code. Tell the user whether this <cleanup-merged> block arrived and whether your question tool showed the prompt, so they can mark the OMP hook as verified."]
    : [];
  return {
    continue: true,
    systemMessage: `cleanup-merged: ${count} branch${count === 1 ? "" : "es"} or worktree${count === 1 ? "" : "s"} already merged into ${found.target}.`,
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: [
        "<cleanup-merged>",
        `The work on these branches is already in ${found.target}:`,
        list,
        "In your first reply, before other work, ask the user one question with your question tool (AskUserQuestion in Claude Code): remove them now, or skip?",
        "If the user accepts, load the cleanup-merged skill and follow it. The acceptance approves these branches, so do not ask again for the same list. If the user skips, do not ask again in this session.",
        ...ompReminder,
        "</cleanup-merged>",
      ].join("\n"),
    },
  };
}

function option(args: string[], name: string): string | undefined {
  const inline = args.find(arg => arg.startsWith(`${name}=`));
  if (inline !== undefined) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

if (import.meta.main) {
  const [command, ...args] = process.argv.slice(2);
  const minAge = option(args, "--min-age");
  const positional = args.filter((arg, index) => !arg.startsWith("--") && args[index - 1] !== "--min-age");

  if (command === "list") {
    const found = await findCandidates(process.cwd(), { minAge });
    if (args.includes("--json")) console.log(JSON.stringify(found, null, 2));
    else {
      for (const item of found.removable) console.log(`remove  ${item.branch}${item.path ? `  ${item.path}` : ""}  (${item.reason} ${item.target})`);
      for (const item of found.kept) console.log(`keep    ${item.branch}  (${item.reason})`);
      if (!found.removable.length && !found.kept.length) console.log("Nothing to clean up.");
    }
  } else if (command === "remove") {
    if (!positional.length) throw new Error("Give at least one branch name to remove.");
    const outcome = await removeBranches(process.cwd(), positional, { minAge });
    console.log(JSON.stringify(outcome, null, 2));
    if (outcome.refused.length) process.exitCode = 1;
  } else if (command === "session-start") {
    // A hook must never block or break session start, so every failure ends silently with exit 0.
    try {
      const stdin = await Bun.stdin.text();
      const cwd = (stdin.trim() ? JSON.parse(stdin).cwd : undefined) ?? process.cwd();
      const output = await sessionStart({ cwd });
      if (output) console.log(JSON.stringify(output));
    } catch (error) {
      console.error(`cleanup-merged: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.error("Usage: cleanup-merged.ts list [--json] [--min-age <age>] | remove <branch>... [--min-age <age>] | session-start");
    process.exitCode = 2;
  }
}
