import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

export interface ProjectOverrideInfo {
  key: string;
  root: string;
  source: "git-origin" | "cwd" | "context";
  baseKey: string;
  contextPath: string;
}

export type ProjectOverrideContext = Record<string, string[]>;

// Keep this deliberately dumb: Q asked for the raw `git config --get remote.origin.url`
// string slug, not canonical host/owner/repo normalization. SSH and HTTPS remotes will
// produce different base keys unless `context.json` links them together.
export function slugifyProjectKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "default";
}

function gitOrigin(cwd: string): string | undefined {
  try {
    return execFileSync("git", ["-C", cwd, "config", "--get", "remote.origin.url"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1000,
    }).trim() || undefined;
  } catch {
    return undefined;
  }
}

export function getOverridesBase(home = homedir()): string {
  return path.join(home, ".pi", "overrides");
}

export function getContextPath(home = homedir()): string {
  return path.join(getOverridesBase(home), "context.json");
}

export function readOverrideContext(home = homedir()): ProjectOverrideContext {
  const file = getContextPath(home);
  if (!existsSync(file)) return {};
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const context: ProjectOverrideContext = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) context[key] = value.filter((entry): entry is string => typeof entry === "string");
    }
    return context;
  } catch {
    return {};
  }
}

function writeOverrideContext(context: ProjectOverrideContext, home = homedir()): void {
  mkdirSync(getOverridesBase(home), { recursive: true });
  writeFileSync(getContextPath(home), `${JSON.stringify(context, null, 2)}\n`);
}

function normalizeDir(input: string): string {
  return path.resolve(input);
}

function isSameOrChild(cwd: string, linkedDir: string): boolean {
  const dir = normalizeDir(linkedDir);
  return cwd === dir || cwd.startsWith(`${dir}${path.sep}`);
}

export function findContextKey(cwd: string, context: ProjectOverrideContext): string | undefined {
  const normalizedCwd = normalizeDir(cwd);
  let best: { key: string; length: number } | undefined;
  for (const [key, dirs] of Object.entries(context)) {
    for (const dir of dirs) {
      if (!isSameOrChild(normalizedCwd, dir)) continue;
      const length = normalizeDir(dir).length;
      if (!best || length > best.length) best = { key, length };
    }
  }
  return best?.key;
}

export function getBaseOverrideKey(cwd: string): { key: string; source: "git-origin" | "cwd" } {
  // Fallback to cwd slug when no origin exists. This is intentionally machine-local;
  // same repo in another path gets another base key unless context.json links it.
  const origin = gitOrigin(cwd);
  return {
    key: slugifyProjectKey(origin ?? cwd),
    source: origin ? "git-origin" : "cwd",
  };
}

export function getProjectOverrideInfo(cwd: string, home = homedir(), context = readOverrideContext(home)): ProjectOverrideInfo {
  const base = getBaseOverrideKey(cwd);
  const linkedKey = findContextKey(cwd, context);
  const key = linkedKey ?? base.key;
  return {
    key,
    root: path.join(getOverridesBase(home), key),
    source: linkedKey ? "context" : base.source,
    baseKey: base.key,
    contextPath: getContextPath(home),
  };
}

function existingDir(dir: string): string[] {
  // `resources_discover` should not create directories during normal startup.
  // Missing override dirs mean no override resources for this project.
  return existsSync(dir) ? [dir] : [];
}

function statusLines(info: ProjectOverrideInfo): string[] {
  const has = (name: string) => existsSync(path.join(info.root, name)) ? "yes" : "no";
  return [
    `Project override: ${info.key}`,
    `Base key: ${info.baseKey}`,
    `Source: ${info.source}`,
    `Root: ${info.root}`,
    `Context: ${info.contextPath}`,
    `skills: ${has("skills")}`,
    `prompts: ${has("prompts")}`,
    `AGENTS.md: ${has("AGENTS.md")}`,
    `agents: ${has("agents")} (pi-subagents discovery patch required)`,
    "Note: same-name skill/prompt collisions keep Pi's existing first-wins behavior.",
  ];
}

function ensureTree(root: string): void {
  mkdirSync(path.join(root, "skills"), { recursive: true });
  mkdirSync(path.join(root, "prompts"), { recursive: true });
  mkdirSync(path.join(root, "agents"), { recursive: true });
}

function existingOverrideKeys(home = homedir()): string[] {
  const base = getOverridesBase(home);
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function linkCurrentCwd(ctx: ExtensionCommandContext): Promise<void> {
  const context = readOverrideContext();
  const baseKey = getBaseOverrideKey(ctx.cwd).key;
  const choices = [...new Set([baseKey, ...Object.keys(context), ...existingOverrideKeys()])].sort((a, b) => a.localeCompare(b));
  const key = await ctx.ui.select("Link current cwd to override", choices.length ? choices : [baseKey]);
  if (!key) return;

  const cwd = normalizeDir(ctx.cwd);
  const entries = context[key] ?? [];
  if (!entries.some((entry) => normalizeDir(entry) === cwd)) entries.push(cwd);
  context[key] = entries.sort((a, b) => a.localeCompare(b));
  writeOverrideContext(context);
  ensureTree(path.join(getOverridesBase(), key));
  ctx.ui.notify(`Linked ${cwd}\n→ ${key}`, "info");
}

export default function projectOverrides(pi: ExtensionAPI): void {
  pi.on("resources_discover", (event) => {
    const info = getProjectOverrideInfo(event.cwd);
    return {
      skillPaths: existingDir(path.join(info.root, "skills")),
      promptPaths: existingDir(path.join(info.root, "prompts")),
    };
  });

  pi.on("before_agent_start", (event, ctx) => {
    // Pi does not let extensions add native AGENTS.md files after context loading.
    // Append override instructions at turn start instead; startup header will not list it.
    const agentsPath = path.join(getProjectOverrideInfo(ctx.cwd).root, "AGENTS.md");
    if (!existsSync(agentsPath)) return;
    const content = readFileSync(agentsPath, "utf8");
    return {
      systemPrompt: `${event.systemPrompt}\n\n<project_override_agents path=${JSON.stringify(agentsPath)}>\n${content}\n</project_override_agents>`,
    };
  });

  pi.registerCommand("overrides", {
    description: "Show, create, or link project override resources",
    handler: async (args, ctx) => {
      const command = args.trim();
      if (command === "link") {
        await linkCurrentCwd(ctx);
        return;
      }

      const info = getProjectOverrideInfo(ctx.cwd);
      if (command === "init") ensureTree(info.root);
      ctx.ui.notify(statusLines(info).join("\n"), "info");
    },
    getArgumentCompletions: (prefix) => ["init", "link"]
      .filter((value) => value.startsWith(prefix))
      .map((value) => ({ value, label: value })),
  });
}
