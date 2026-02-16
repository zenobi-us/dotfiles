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

const CMDS = ["commit", "commit-model"];
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
/**
 * Calculate cost score for model comparison.
 * Higher score = more expensive.
 * Models with $0/$0 pricing (GitHub Copilot, request-based) get penalized
 * to deprioritize them in favor of token-based models where costs are clear.
 */
function calculateCostScore(model: ModelInfo): number {
  const { input, output } = model.cost;
  
  // Deprioritize request-based pricing models (GitHub Copilot shows $0/$0)
  // These don't fit the token-cost model and should only be selected if
  // no token-based options exist
  if (input === 0 && output === 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  
  return input + output * 2;
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
 * 
 * Note: Request-based pricing models (GitHub Copilot: $0/$0) are deprioritized
 * in favor of token-based models where costs are transparent and comparable.
 */
async function pickCheapestModel(
  ctx: ExtensionContext,
  maxOutputCost: number = DEFAULT_MAX_OUTPUT_COST,
): Promise<ModelSelection> {
  const available = (await ctx.modelRegistry.getAvailable()) as ModelInfo[];

  if (available.length === 0) {
    return { model: HARD_FALLBACK_MODEL, source: "auto", cost: null };
  }

  // First, try to find token-based models (not $0/$0) under the cost threshold
  const tokenBased = available.filter(
    (m) => !(m.cost.input === 0 && m.cost.output === 0),
  );
  
  const cheapModels = tokenBased
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

  // If no token-based models under threshold, look for "cheap-sounding" names
  const cheapNamed = tokenBased
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

  // If no token-based models at all, use the cheapest token-based overall
  if (tokenBased.length > 0) {
    const sorted = [...tokenBased].sort(
      (a, b) => calculateCostScore(a) - calculateCostScore(b),
    );
    const best = sorted[0];
    return {
      model: `${best.provider}/${best.id}`,
      source: "auto",
      cost: best.cost,
    };
  }

  // Last resort: use request-based models (GitHub Copilot, etc.)
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
async function getModelCost(
  ctx: ExtensionContext,
  modelString: string,
): Promise<ModelInfo["cost"] | null> {
  const [provider, ...idParts] = modelString.split("/");
  const modelId = idParts.join("/");
  const available = (await ctx.modelRegistry.getAvailable()) as ModelInfo[];
  const found = available.find(
    (m) => m.provider === provider && m.id === modelId,
  );
  return found?.cost ?? null;
}

/**
 * Format cost for display.
 * Shows input/output cost per million tokens with appropriate precision.
 * Avoids rounding up small values (e.g., $0.0375 → $0.0375, not $0.04).
 */
function formatCost(cost: ModelInfo["cost"] | null): string {
  if (!cost) return "unknown pricing";
  
  const formatPrice = (price: number): string => {
    if (price === 0) return "0";
    
    // Convert to string and count significant decimals
    const str = price.toString();
    
    // For very small prices, preserve more decimals
    if (price < 0.001) {
      return price.toFixed(5).replace(/0+$/, "");
    } else if (price < 0.01) {
      // Show up to 4 decimals, remove trailing zeros
      return price.toFixed(4).replace(/0+$/, "");
    } else if (price < 1) {
      // Show up to 3 decimals
      return price.toFixed(3).replace(/0+$/, "");
    } else {
      // For >= $1, use 2 decimals
      return price.toFixed(2).replace(/\.?0+$/, "").replace(/^(\d+)$/, "$1.00");
    }
  };
  
  return `$${formatPrice(cost.input)}/$${formatPrice(cost.output)} per 1M tokens (in/out)`;
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

/**
 * Display a formatted model selection widget with colors, alignment, and sorting.
 * Returns the selected model ID or null if cancelled.
 */
async function selectModelInteractive(
  ctx: ExtensionContext,
): Promise<string | null> {
  if (!ctx.hasUI) {
    return null; // Cannot show UI
  }

  const available = (await ctx.modelRegistry.getAvailable()) as ModelInfo[];
  
  if (available.length === 0) {
    ctx.ui.notify("No models available", "error");
    return null;
  }

  // We'll use custom UI to render a nicely formatted model picker
  const result = await ctx.ui.custom<string | null>(
    (tui, theme, _keybindings, done) => {
      let selectedIndex = 0;
      let sortBy: "name" | "provider" | "cost" = "name";
      let sortAsc = true;

      // Format model options
      const getFormattedOptions = () => {
        const opts = available.map((model) => {
          const modelId = `${model.provider}/${model.id}`;
          const costLabel = formatCost(model.cost);
          const inputCost = model.cost.input;
          return { modelId, costLabel, model, inputCost };
        });

        // Sort based on current sort mode
        const sorted = [...opts].sort((a, b) => {
          let cmp = 0;
          if (sortBy === "name") {
            cmp = a.modelId.localeCompare(b.modelId);
          } else if (sortBy === "provider") {
            const providerCmp = a.model.provider.localeCompare(
              b.model.provider,
            );
            if (providerCmp !== 0) cmp = providerCmp;
            else cmp = a.modelId.localeCompare(b.modelId);
          } else if (sortBy === "cost") {
            cmp = a.inputCost - b.inputCost;
          }
          return sortAsc ? cmp : -cmp;
        });

        return sorted;
      };

      class ModelSelector {
        render(width: number): string[] {
          const lines: string[] = [];
          const options = getFormattedOptions();

          // Top border
          lines.push(theme.fg("border", "┌" + "─".repeat(width - 2) + "┐"));

          // Header with sort status
          const sortLabel = `${sortBy}${sortAsc ? " ↑" : " ↓"}`;
          const sortInfo = theme.fg("muted", `[sorted by ${sortLabel}]`);
          const headerText = "Select a model for commit generation";
          const contentWidth = width - 4; // Account for borders and padding

          // Truncate if needed
          const header = headerText.length > contentWidth 
            ? headerText.substring(0, contentWidth - 3) + "..."
            : headerText;

          lines.push(
            theme.fg("border", "│") +
              " " +
              theme.fg("accent", header.padEnd(contentWidth - 1)) +
              theme.fg("border", "│"),
          );
          lines.push(
            theme.fg("border", "│") +
              " " +
              sortInfo.padEnd(contentWidth - 1) +
              theme.fg("border", "│"),
          );
          lines.push(
            theme.fg("border", "│") + " ".repeat(contentWidth + 1) + theme.fg("border", "│"),
          );

          if (options.length === 0) {
            lines.push(
              theme.fg("border", "│") +
                " " +
                theme.fg("muted", "No models available".padEnd(contentWidth - 1)) +
                theme.fg("border", "│"),
            );
          } else {
            // Find max lengths for alignment
            const maxModelIdLen = Math.max(
              ...options.map((o) => o.modelId.length),
            );
            const maxCostLen = Math.max(
              ...options.map((o) => o.costLabel.length),
            );

            // Check if we have room for full display
            const itemContentWidth = contentWidth - 1;
            const fullItemWidth = maxModelIdLen + 2 + maxCostLen;

            // Options with formatting
            for (let i = 0; i < options.length; i++) {
              const opt = options[i];
              const isSelected = i === selectedIndex;

              const modelPart = opt.modelId.padEnd(maxModelIdLen);
              const costPart = opt.costLabel.padStart(maxCostLen);
              let itemLine = modelPart + "  " + costPart;

              // Truncate if needed to fit width
              if (itemLine.length > itemContentWidth) {
                itemLine = itemLine.substring(0, itemContentWidth - 3) + "...";
              } else {
                itemLine = itemLine.padEnd(itemContentWidth);
              }

              if (isSelected) {
                lines.push(
                  theme.fg("border", "│") +
                    theme.bg(
                      "selectedBg",
                      theme.fg("accent", "▶ " + itemLine),
                    ) +
                    theme.fg("border", "│"),
                );
              } else {
                lines.push(
                  theme.fg("border", "│") +
                    " " +
                    theme.fg("text", modelPart) +
                    "  " +
                    theme.fg("muted", costPart).padEnd(itemContentWidth - maxModelIdLen - 3) +
                    " " +
                    theme.fg("border", "│"),
                );
              }
            }
          }

          // Blank line before instructions
          lines.push(
            theme.fg("border", "│") + " ".repeat(contentWidth + 1) + theme.fg("border", "│"),
          );

          // Instructions line
          const instructions =
            "↑/↓ Navigate  Enter/Space Select  n/p/c Sort  q/Esc Cancel";
          const instDisplay = instructions.length > contentWidth
            ? instructions.substring(0, contentWidth - 3) + "..."
            : instructions.padEnd(contentWidth);

          lines.push(
            theme.fg("border", "│") +
              " " +
              theme.fg("dim", instDisplay) +
              theme.fg("border", "│"),
          );

          // Bottom border
          lines.push(theme.fg("border", "└" + "─".repeat(width - 2) + "┘"));

          return lines;
        }

        handleInput(data: string): void {
          const options = getFormattedOptions();
          if (data === "\x1b[A" || data === "k") {
            // Up arrow or 'k'
            selectedIndex = (selectedIndex - 1 + options.length) % options.length;
          } else if (data === "\x1b[B" || data === "j") {
            // Down arrow or 'j'
            selectedIndex = (selectedIndex + 1) % options.length;
          } else if (data === "\r" || data === " ") {
            // Enter or Space
            done(options[selectedIndex].modelId);
          } else if (
            data === "\x1b" ||
            data === "\x1b[" ||
            data === "q" ||
            data === "Q"
          ) {
            // Escape, Escape[, q, or Q
            done(null);
          } else if (data.toLowerCase() === "n") {
            // Sort by name
            if (sortBy === "name") {
              sortAsc = !sortAsc;
            } else {
              sortBy = "name";
              sortAsc = true;
            }
            selectedIndex = 0;
          } else if (data.toLowerCase() === "p") {
            // Sort by provider
            if (sortBy === "provider") {
              sortAsc = !sortAsc;
            } else {
              sortBy = "provider";
              sortAsc = true;
            }
            selectedIndex = 0;
          } else if (data.toLowerCase() === "c") {
            // Sort by cost
            if (sortBy === "cost") {
              sortAsc = !sortAsc;
            } else {
              sortBy = "cost";
              sortAsc = true;
            }
            selectedIndex = 0;
          }
        }

        invalidate(): void {
          // No cached state
        }
      }

      return new ModelSelector();
    },
    { overlay: true, overlayOptions: { anchor: "top-center", margin: 1 } },
  );

  return result || null;
}

async function runGenerateCommit(
  args: string,
  ctx: ExtensionContext,
  pi: ExtensionAPI,
  explicitModel?: string,
): Promise<void> {
  const config = parseJsonConfig(CONFIG_PATH);
  const maxCost = config.maxOutputCost ?? DEFAULT_MAX_OUTPUT_COST;

  // Determine model selection
  let selection: ModelSelection;
  
  // Priority: explicit model > configured model > auto-select
  if (explicitModel) {
    const cost = await getModelCost(ctx, explicitModel);
    selection = { model: explicitModel, source: "config", cost };
  } else {
    const configuredMode = normalizeMode(config.mode);
    if (configuredMode) {
      const cost = await getModelCost(ctx, configuredMode);
      selection = { model: configuredMode, source: "config", cost };
    } else {
      selection = await pickCheapestModel(ctx, maxCost);
    }
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
  const baseCommand = {
    description: "Generate and stage semantic commits using a subagent",
    handler: async (args: string, ctx: ExtensionContext) => {
      runGenerateCommit(args, ctx, pi);
    },
  };

  const commitModelCommand = {
    description:
      "Configure model for commit generation. Usage: /commit-model [provider/model-name]",
    handler: async (args: string, ctx: ExtensionContext) => {
      const trimmedArgs = args.trim();
      let selectedModel: string | null = null;

      // If model provided as argument, validate and use it
      if (trimmedArgs && !trimmedArgs.includes(" ")) {
        // Single token = model name
        selectedModel = trimmedArgs;
      } else if (trimmedArgs) {
        // Multiple tokens = show model picker
        selectedModel = await selectModelInteractive(ctx);
        if (!selectedModel) {
          ctx.ui.notify("Model selection cancelled", "warning");
          return;
        }
      } else {
        // No arguments = show model picker
        selectedModel = await selectModelInteractive(ctx);
        if (!selectedModel) {
          ctx.ui.notify("Model selection cancelled", "warning");
          return;
        }
      }

      // Write configuration to file
      const config: GenerateCommitMessageConfig = {
        mode: selectedModel,
      };

      try {
        writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
        if (ctx.hasUI) {
          const cost = await getModelCost(ctx, selectedModel);
          const costLabel = formatCost(cost);
          ctx.ui.notify(
            `✓ Model configured: ${selectedModel} — ${costLabel}`,
            "info",
          );
        }
      } catch (error) {
        ctx.ui.notify(
          `Failed to save configuration: ${error instanceof Error ? error.message : "unknown error"}`,
          "error",
        );
      }
    },
  };

  pi.registerCommand("commit", baseCommand);
  pi.registerCommand("commit-model", commitModelCommand);
}
