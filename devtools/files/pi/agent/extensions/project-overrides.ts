import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export interface ProjectOverrideInfo {
  key: string;
  root: string;
  source: "git-origin" | "cwd";
}

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

export function getProjectOverrideInfo(cwd: string, home = homedir()): ProjectOverrideInfo {
  const origin = gitOrigin(cwd);
  const key = slugifyProjectKey(origin ?? cwd);
  return {
    key,
    root: path.join(home, ".pi", "overrides", key),
    source: origin ? "git-origin" : "cwd",
  };
}

function existingDir(dir: string): string[] {
  return existsSync(dir) ? [dir] : [];
}

function statusLines(info: ProjectOverrideInfo): string[] {
  const has = (name: string) => existsSync(path.join(info.root, name)) ? "yes" : "no";
  return [
    `Project override: ${info.key}`,
    `Source: ${info.source}`,
    `Root: ${info.root}`,
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

export default function projectOverrides(pi: ExtensionAPI): void {
  pi.on("resources_discover", (event) => {
    const info = getProjectOverrideInfo(event.cwd);
    return {
      skillPaths: existingDir(path.join(info.root, "skills")),
      promptPaths: existingDir(path.join(info.root, "prompts")),
    };
  });

  pi.on("before_agent_start", (event, ctx) => {
    const agentsPath = path.join(getProjectOverrideInfo(ctx.cwd).root, "AGENTS.md");
    if (!existsSync(agentsPath)) return;
    const content = readFileSync(agentsPath, "utf8");
    return {
      systemPrompt: `${event.systemPrompt}\n\n<project_override_agents path=${JSON.stringify(agentsPath)}>\n${content}\n</project_override_agents>`,
    };
  });

  pi.registerCommand("overrides", {
    description: "Show or create remote/cwd-keyed project override resources",
    handler: async (args, ctx) => {
      const info = getProjectOverrideInfo(ctx.cwd);
      if (args.trim() === "init") ensureTree(info.root);
      ctx.ui.notify(statusLines(info).join("\n"), "info");
    },
    getArgumentCompletions: (prefix) => "init".startsWith(prefix) ? [{ value: "init", label: "init" }] : [],
  });
}
