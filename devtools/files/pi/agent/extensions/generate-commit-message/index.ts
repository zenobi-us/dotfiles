import type {
  ExtensionAPI,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";

interface GenerateCommitMessageConfig {
  mode?: string;
  prompt?: string;
}

const CMDS = ["commit"];
const CONFIG_PATH = path.join(
  homedir(),
  ".pi",
  "agent",
  "generate-commit-message.json",
);
const USER_AGENTS_DIR = path.join(homedir(), ".pi", "agent", "agents");

const DEFAULT_PROMPT =
  "Write and stage commits according to the writing-git-commits skill";
const DEFAULT_SKILL = "writing-git-commits";
const DEFAULT_AGENT_CANDIDATES = [
  "general",
  "worker",
  "default",
  "scout",
] as const;

const COPILOT_FALLBACKS = [
  "github-copilot/gpt-4.1-mini",
  "github-copilot/gpt-4o-mini",
  "github-copilot/gemini-2.0-flash",
  "github-copilot/claude-3.5-haiku",
] as const;

const FALLBACK_AGENT_NAME = "commit-writer";

const FALLBACK_AGENT_CONTENT = `---
name: ${FALLBACK_AGENT_NAME}
description: Focused subagent for writing and staging git commits
tools: read, bash
skills: writing-git-commits
---

Create and stage clean, atomic, conventional commits for the current repository.
Use the writing-git-commits skill and keep commits scoped, descriptive, and safe.
`;

function parseJsonConfig(configPath: string): GenerateCommitMessageConfig {
  if (!existsSync(configPath)) return {};

  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as GenerateCommitMessageConfig;
  } catch {
    return {};
  }
}

function normalizeMode(mode?: string): string | undefined {
  if (!mode) return undefined;
  const trimmed = mode.trim();
  if (!trimmed) return undefined;
  return /^[^/\s]+\/[^\s]+$/.test(trimmed) ? trimmed : undefined;
}

function pickCopilotDefaultMode(ctx: ExtensionContext): string {
  const available = ctx.modelRegistry
    .getAvailable()
    .map((m) => `${m.provider}/${m.id}`)
    .filter((id) => id.toLowerCase().includes("copilot"));

  if (available.length === 0) return COPILOT_FALLBACKS[0];

  const freeLike = available.find((id) =>
    /(mini|flash|nano|haiku|free)/i.test(id),
  );
  if (freeLike) return freeLike;

  return available[0];
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function getAgentNameFromFile(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) {
      return path.basename(filePath, ".md");
    }
    const nameMatch = frontmatter[1].match(/^name:\s*(.+)$/m);
    if (!nameMatch) {
      return path.basename(filePath, ".md");
    }
    return stripQuotes(nameMatch[1]);
  } catch {
    return null;
  }
}

function listAgentNamesInDir(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const names: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() && !entry.isSymbolicLink()) continue;
    if (!entry.name.endsWith(".md")) continue;
    if (entry.name.endsWith(".chain.md")) continue;

    const fullPath = path.join(dir, entry.name);
    const agentName = getAgentNameFromFile(fullPath);
    if (!agentName) continue;
    names.push(agentName);
  }

  return names;
}

function findNearestProjectAgentsDir(cwd: string): string | null {
  let current = cwd;

  while (true) {
    const candidate = path.join(current, ".pi", "agents");
    if (existsSync(candidate)) return candidate;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function ensureFallbackAgent(): string {
  if (!existsSync(USER_AGENTS_DIR)) {
    mkdirSync(USER_AGENTS_DIR, { recursive: true });
  }

  const fallbackPath = path.join(USER_AGENTS_DIR, `${FALLBACK_AGENT_NAME}.md`);
  if (!existsSync(fallbackPath)) {
    writeFileSync(fallbackPath, FALLBACK_AGENT_CONTENT, "utf-8");
  }

  return FALLBACK_AGENT_NAME;
}

function chooseAgent(cwd: string): string {
  const projectDir = findNearestProjectAgentsDir(cwd);
  const projectAgents = projectDir ? listAgentNamesInDir(projectDir) : [];
  const userAgents = listAgentNamesInDir(USER_AGENTS_DIR);
  const all = [...projectAgents, ...userAgents];

  for (const preferred of DEFAULT_AGENT_CANDIDATES) {
    if (all.includes(preferred)) return preferred;
  }

  if (all.length > 0) return all[0];
  return ensureFallbackAgent();
}

function buildPrompt(
  config: GenerateCommitMessageConfig,
  args: string,
): string {
  const argPrompt = args.trim();
  if (argPrompt) return argPrompt;

  const configPrompt = config.prompt?.trim();
  if (configPrompt) return configPrompt;

  return DEFAULT_PROMPT;
}

function runGenerateCommit(
  args: string,
  ctx: ExtensionContext,
  pi: ExtensionAPI,
): void {
  const config = parseJsonConfig(CONFIG_PATH);

  const configuredMode = normalizeMode(config.mode);
  const mode = configuredMode ?? pickCopilotDefaultMode(ctx);
  const prompt = buildPrompt(config, args);
  const agent = chooseAgent(ctx.cwd);

  const payload = {
    agent,
    task: prompt,
    model: mode,
    skill: DEFAULT_SKILL,
    clarify: false,
    agentScope: "both",
  };

  if (ctx.hasUI) {
    ctx.ui.notify(`Generating commits via ${agent} (${mode})`, "info");
  }

  pi.sendUserMessage(
    `Call the subagent tool with these exact parameters: ${JSON.stringify(payload)}`,
  );
}

export default function generateCommitMessageExtension(pi: ExtensionAPI) {
  const command = {
    description: "Generate and stage semantic commits using a subagent",
    handler: async (args: string, ctx: ExtensionContext) => {
      runGenerateCommit(args, ctx, pi);
    },
  };

  for (const cmd of CMDS) {
    pi.registerCommand(cmd, command);
  }
}
