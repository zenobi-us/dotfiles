#!/usr/bin/env -S mise exec -- bun run --install=fallback
// Mirrors the Jira issues of configured JQL queries into Markdown files in the shared-context store.
// Jira stays the source of truth; the mirror is read-only. See tracker/initiatives/jira-tracker-mirror/index.md.
import { execFileSync, spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveContextRecord, resolveSharedContext } from "../../../../agent-core/skills/shared-context/scripts/shared-context/lib.ts";
import { validateRelativePath, validateStorePath } from "../../../../agent-core/skills/shared-context/scripts/shared-context/layout.ts";
import { compareIds, nonEmptyString, record } from "./dep-tree-shared.ts";
import { queryJiraIssues, runTwgCli, type JiraIssueRecord, type RunTwg } from "./twg-jira.ts";

export const MIRROR_SCHEMA = "tracker-mirror/v1";
const TRACKER_DEFINITION = "docs/agents/issue-tracker.md";

const help = `Usage:
  jira-mirror.ts sync --repository <absolute-path> [--shared-context-base <absolute-path>]

Reads the mirror block of ${TRACKER_DEFINITION} in the shared context of the repository:

  backend: jira
  site: https://example.atlassian.net
  mirror:
    root: tracker/jira
    queries:
      payroll-epics: 'project = RWR AND issuetype = Epic'

Runs each query through twg, writes <mirror.root>/<KEY>.md for each issue, and commits
the changed mirror files as one tracker commit. Other staged changes stay staged.
Run it from a directory where twg is available, for example: mise x -- jira-mirror.ts sync ...
The output is a JSON summary.
`;

export interface SyncOptions {
  /** Absolute path of the code repository whose shared context holds the tracker definition. */
  repository: string;
  sharedContextBase?: string;
  runTwg: RunTwg;
  now?: () => Date;
}

export interface SyncResult {
  /** Absolute path of the mirror root. */
  root: string;
  /** Shared-context reference of the mirror root, for example `shared://tracker/jira`. */
  ref: string;
  queries: string[];
  issues: number;
  /** Keys of the issues whose mirror file changed in this run. */
  written: string[];
  /** Number of issues whose mirror file did not change. */
  unchanged: number;
  /** The tracker commit. Absent when no mirror file changed. */
  commit?: string;
}

/** Syncs every configured query into the mirror root and commits the changes. */
export async function syncJiraMirror(options: SyncOptions): Promise<SyncResult> {
  const tracker = await readTrackerDefinition(options);
  const syncedAt = (options.now ?? (() => new Date()))().toISOString();

  const issues = new Map<string, { issue: JiraIssueRecord; queries: string[] }>();
  for (const [name, jql] of tracker.queries) {
    for (const issue of await queryJiraIssues(jql, options.runTwg)) {
      const entry = issues.get(issue.key) ?? { issue, queries: [] };
      if (!entry.queries.includes(name)) entry.queries.push(name);
      issues.set(issue.key, entry);
    }
  }

  await validateStorePath(tracker.storeRoot, tracker.mirrorRelative);
  await fs.mkdir(tracker.mirrorRoot, { recursive: true });
  const written: string[] = [];
  for (const key of [...issues.keys()].sort(compareIds)) {
    const { issue, queries } = issues.get(key)!;
    if (!/^[A-Z][A-Z0-9_]*-[0-9]+$/.test(key)) throw new Error(`Jira key ${key} is not a safe mirror file name`);
    await validateStorePath(tracker.storeRoot, `${tracker.mirrorRelative}/${key}.md`);
    const file = path.join(tracker.mirrorRoot, `${key}.md`);
    const existing = await readIfPresent(file);
    // Keep the earlier synced_at when nothing else changed, so a sync with no Jira changes writes nothing.
    const previousSyncedAt = existing === undefined ? undefined : mirrorSyncedAt(existing);
    if (previousSyncedAt !== undefined && renderMirrorFile(issue, queries, tracker.site, previousSyncedAt) === existing) continue;
    await fs.writeFile(file, renderMirrorFile(issue, queries, tracker.site, syncedAt));
    written.push(key);
  }

  const commit = commitMirror(tracker.mirrorRoot, tracker.mirrorRef);
  return {
    root: tracker.mirrorRoot,
    ref: tracker.mirrorRef,
    queries: tracker.queries.map(([name]) => name),
    issues: issues.size,
    written,
    unchanged: issues.size - written.length,
    ...(commit ? { commit } : {}),
  };
}

interface TrackerDefinition {
  site: string;
  /** Query names and JQL, sorted by name. */
  queries: Array<[string, string]>;
  storeRoot: string;
  mirrorRelative: string;
  mirrorRoot: string;
  mirrorRef: string;
}

async function readTrackerDefinition(options: SyncOptions): Promise<TrackerDefinition> {
  if (!path.isAbsolute(options.repository)) throw new Error("Pass an explicit absolute --repository path");
  const context = await resolveSharedContext(async (command, args) => {
    const result = spawnSync(command, args, { encoding: "utf8" });
    if (result.error) throw result.error;
    return { stdout: result.stdout ?? "", code: result.status ?? 1 };
  }, options.repository, options.sharedContextBase);
  if (!context || context.error) throw new Error(context?.error ?? "The repository needs Git, an origin remote, and a resolvable shared context");
  const alignment = await resolveContextRecord(context, { kind: "alignment" });
  if (!alignment.root) throw new Error("The alignment store has no file root for the tracker definition");
  await validateStorePath(alignment.root, TRACKER_DEFINITION);
  const definitionFile = path.join(alignment.root, TRACKER_DEFINITION);
  const text = await readIfPresent(definitionFile);
  if (text === undefined) throw new Error(`Missing tracker definition: ${definitionFile}`);
  const fields = parseFrontmatter(text, TRACKER_DEFINITION);

  const backend = fields.backend;
  if (backend !== "jira") throw new Error(`Jira mirror sync needs backend: jira in ${TRACKER_DEFINITION}; found ${typeof backend === "string" ? backend : "no backend"}`);
  if (context.routes.tickets.adapter !== "jira") throw new Error(`The resolved tickets route uses ${context.routes.tickets.adapter}, but ${TRACKER_DEFINITION} says jira; fix the route configuration`);
  if (fields.mirror === undefined || fields.mirror === null) throw new Error(`${TRACKER_DEFINITION} has no mirror block; add mirror.root and mirror.queries`);
  const mirror = record(fields.mirror, `${TRACKER_DEFINITION} mirror`);
  const mirrorRelative = validateRelativePath(mirror.root, "mirror.root");
  const queries = mirror.queries === undefined || mirror.queries === null ? {} : record(mirror.queries, "mirror.queries");
  const entries = Object.entries(queries).sort(([left], [right]) => left.localeCompare(right));
  if (entries.length === 0) throw new Error("mirror.queries must map at least one query name to a JQL string");
  for (const [name, jql] of entries) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new Error(`mirror.queries name "${name}" must use lowercase letters, digits, and dashes`);
    nonEmptyString(jql, `mirror.queries.${name}`);
  }

  return {
    site: nonEmptyString(fields.site, `${TRACKER_DEFINITION} site`).replace(/\/+$/, ""),
    queries: entries.map(([name, jql]) => [name, (jql as string).trim()]),
    storeRoot: alignment.root,
    mirrorRelative,
    mirrorRoot: path.join(alignment.root, mirrorRelative),
    mirrorRef: alignment.store === "shared" ? `shared://${mirrorRelative}` : mirrorRelative,
  };
}

/**
 * Renders one mirror file. Each frontmatter value is written as JSON, which is valid YAML,
 * so quotes, colons, and `#` in Jira text cannot break the frontmatter.
 */
export function renderMirrorFile(issue: JiraIssueRecord, queries: string[], site: string, syncedAt: string): string {
  const fields: Array<[string, unknown]> = [
    ["schema", MIRROR_SCHEMA],
    ["id", issue.key],
    ["title", issue.title],
    ["type", issue.type],
    ["status", issue.statusName],
    ["status_category", issue.statusCategory],
    ["parent", issue.parentKey ?? null],
    ["blocked_by", [...new Set(issue.blockerKeys)].sort(compareIds)],
    ["queries", [...queries].sort()],
    ["jira_updated", nonEmptyString(issue.updated, `${issue.key} updated; pass the updated field to twg`)],
    ["synced_at", syncedAt],
    ["ref", `${site}/browse/${issue.key}`],
  ];
  const frontmatter = fields.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n");
  const body = issue.descriptionMarkdown ? `\n${issue.descriptionMarkdown}\n` : "";
  return `---\n${frontmatter}\n---\n${body}`;
}

function mirrorSyncedAt(text: string): string | undefined {
  try {
    const value = parseFrontmatter(text, "mirror file").synced_at;
    return typeof value === "string" ? value : undefined;
  } catch {
    // A damaged mirror file is rewritten.
    return undefined;
  }
}

function parseFrontmatter(text: string, label: string): Record<string, unknown> {
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!block) throw new Error(`${label} has no YAML frontmatter`);
  const value = Bun.YAML.parse(block[1]!);
  return value === null || value === undefined ? {} : record(value, `${label} frontmatter`);
}

/**
 * Commits the mirror root only. `--only` with a pathspec keeps changes that someone else staged.
 * Returns the commit hash, or undefined when no mirror file changed.
 */
function commitMirror(mirrorRoot: string, mirrorRef: string): string | undefined {
  const git = (...args: string[]) => execFileSync("git", ["-C", mirrorRoot, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("add", "--all", "--", ".");
  const changed = git("diff", "--cached", "--name-only", "--", ".").split("\n").filter(Boolean);
  if (changed.length === 0) return undefined;
  const count = `${changed.length} ${changed.length === 1 ? "file" : "files"}`;
  git("commit", "--quiet", "--only", "-m", `chore(tracker): sync Jira mirror ${mirrorRef} (${count})`, "--", ".");
  return git("rev-parse", "HEAD");
}

async function readIfPresent(file: string): Promise<string | undefined> {
  try {
    return await fs.readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) { console.log(help); return; }
  const [command, ...rest] = argv;
  if (command !== "sync") throw new Error(`Unknown command "${command}"; use --help`);
  const values: Record<string, string> = {};
  while (rest.length) {
    const flag = rest.shift()!;
    const key = flag.slice(2);
    if (!flag.startsWith("--") || !["repository", "shared-context-base"].includes(key) || values[key] !== undefined) throw new Error(`Unknown or repeated argument ${flag}; use --help`);
    const value = rest.shift();
    if (!value || value.startsWith("--")) throw new Error(`${flag} needs a value`);
    values[key] = value;
  }
  if (!values.repository) throw new Error("Pass an explicit absolute --repository path");
  if (values["shared-context-base"] && !path.isAbsolute(values["shared-context-base"])) throw new Error("--shared-context-base must be an absolute path");
  const result = await syncJiraMirror({ repository: values.repository, sharedContextBase: values["shared-context-base"], runTwg: runTwgCli });
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(`jira-mirror: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
