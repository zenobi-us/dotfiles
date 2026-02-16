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
  /** Maximum output cost per million tokens (default: 1.0) */
  maxOutputCost?: number;
}

interface ModelInfo {
  id: string;
  provider: string;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
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

/** Maximum output cost per million tokens for "cheap" models */
const DEFAULT_MAX_OUTPUT_COST = 1.0;

/** Hard fallback if no models are available at all */
const HARD_FALLBACK_MODEL = "github-copilot/gpt-4o-mini";

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

/**
 * Calculate a combined cost score for a model.
 * Weights output cost more heavily since commit messages have short input but longer output.
 */
function calculateCostScore(model: ModelInfo): number {
  return model.cost.input + model.cost.output * 2;
}

/**
 * Check if a model name suggests it's a cheap/lite variant.
 */
function isCheapModelName(id: string): boolean {
  return /(mini|flash|nano|haiku|lite|micro|free)/i.test(id);
}

interface ModelSelection {
  model: string;
  source: "config" | "auto";
  cost: ModelInfo["cost"] | null;
}

/**
 * Pick the cheapest available model based on actual pricing data.
 * Falls back to name-based heuristics if cost data is unavailable.
 */
function pickCheapestModel(
  ctx: ExtensionContext,
  maxOutputCost: number = DEFAULT_MAX_OUTPUT_COST,
): ModelSelection {
  const available = ctx.modelRegistry.getAvailable() as ModelInfo[];

  if (available.length === 0) {
    return { model: HARD_FALLBACK_MODEL, source: "auto", cost: null };
  }

  // First, try to find models under the cost threshold
  const cheapModels = available
    .filter((m) => m.cost.output <= maxOutputCost)
    .sort((a, b) => calculateCostScore(a) - calculateCostScore(b));

  if (cheapModels.length > 0) {
    const best = cheapModels[0];
    return {
      model: `${best.provider}/${best.id}`,
      source: "auto",
      cost: best.cost,
    };
  }

  // If no models under threshold, look for "cheap-sounding" names
  const cheapNamed = available
    .filter((m) => isCheapModelName(m.id))
    .sort((a, b) => calculateCostScore(a) - calculateCostScore(b));

  if (cheapNamed.length > 0) {
    const best = cheapNamed[0];
    return {
      model: `${best.provider}/${best.id}`,
      source: "auto",
      cost: best.cost,
    };
  }

  // Last resort: pick the cheapest overall
  const sorted = [...available].sort(
    (a, b) => calculateCostScore(a) - calculateCostScore(b),
  );
  const best = sorted[0];
  return {
    model: `${best.provider}/${best.id}`,
    source: "auto",
    cost: best.cost,
  };
}

/**
 * Look up cost info for a configured model.
 */
function getModelCost(
  ctx: ExtensionContext,
  modelString: string,
): ModelInfo["cost"] | null {
  const [provider, ...idParts] = modelString.split("/");
  const modelId = idParts.join("/");
  const available = ctx.modelRegistry.getAvailable() as ModelInfo[];
  const found = available.find(
    (m) => m.provider === provider && m.id === modelId,
  );
  return found?.cost ?? null;
}

/**
 * Format cost for display.
 * Shows input/output cost per million tokens.
 */
function formatCost(cost: ModelInfo["cost"] | null): string {
  if (!cost) return "unknown pricing";
  return `$${cost.input.toFixed(2)}/$${cost.output.toFixed(2)} per 1M tokens (in/out)`;
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
  const maxCost = config.maxOutputCost ?? DEFAULT_MAX_OUTPUT_COST;

  // Determine model selection
  let selection: ModelSelection;
  const configuredMode = normalizeMode(config.mode);

  if (configuredMode) {
    const cost = getModelCost(ctx, configuredMode);
    selection = { model: configuredMode, source: "config", cost };
  } else {
    selection = pickCheapestModel(ctx, maxCost);
  }

  const prompt = buildPrompt(config, args);
  const agent = chooseAgent(ctx.cwd);

  const payload = {
    agent,
    task: prompt,
    model: selection.model,
    skill: DEFAULT_SKILL,
    clarify: false,
    agentScope: "both",
  };

  // Provide user feedback
  if (ctx.hasUI) {
    const sourceLabel = selection.source === "config" ? "configured" : "auto-selected (cheapest)";
    const costLabel = formatCost(selection.cost);

    ctx.ui.notify(
      `Commit: ${selection.model} [${sourceLabel}] — ${costLabel}`,
      "info",
    );
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
