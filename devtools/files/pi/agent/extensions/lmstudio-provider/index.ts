import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";

type LmModel = {
  type: "llm" | "embedding";
  key: string;
  publisher?: string;
  display_name?: string;
  params_string?: string;
  quantization?: { name?: string | null; bits_per_weight?: number | null } | null;
  max_context_length?: number;
  loaded_instances?: Array<{ id: string }>;
};

type LmModelsResponse = { models?: LmModel[] };

type LoadOptions = {
  context_length?: number;
  eval_batch_size?: number;
  flash_attention?: boolean;
  num_experts?: number;
  offload_kv_cache_to_gpu?: boolean;
};

type SavedOptions = Record<string, LoadOptions>;

const BASE_URL = process.env.LMSTUDIO_BASE_URL || "http://localhost:1234";
const API_BASE = `${BASE_URL}/api/v1`;
const OPTIONS_FILE = join(homedir(), ".pi", "agent", "extensions", "lmstudio-provider", "options.json");

export default async function lmstudioProvider(pi: ExtensionAPI): Promise<void> {
  await registerDynamicProvider(pi);

  pi.registerCommand("lmstudio", {
    description: "LM Studio models: list and load",
    getArgumentCompletions: (prefix) => {
      const options = ["models", "load"];
      return options
        .filter((opt) => opt.startsWith((prefix || "").toLowerCase()))
        .map((opt) => ({ value: opt, label: opt }));
    },
    handler: async (args, ctx) => {
      const action = (args || "").trim().toLowerCase();
      if (action === "models") {
        await showModels(ctx);
        return;
      }
      await openLoaderModal(ctx);
    },
  });
}

async function registerDynamicProvider(pi: ExtensionAPI): Promise<void> {
  const models = await getModels();
  if (!models) return;

  pi.registerProvider("lmstudio", {
    baseUrl: `${BASE_URL}/v1`,
    apiKey: "lmstudio",
    api: "openai-completions",
    models: models
      .filter((m) => m.type === "llm")
      .map((m) => ({
        id: m.key,
        name: m.display_name ?? m.key,
        reasoning: false,
        input: ["text" as const],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: m.max_context_length ?? 128000,
        maxTokens: 16384,
      })),
  });
}

async function showModels(ctx: ExtensionCommandContext): Promise<void> {
  const models = await getModels();
  if (!models) {
    ctx.ui.notify("LM Studio API server is not reachable at http://localhost:1234", "warning");
    return;
  }

  const lines = [
    "LM Studio Models",
    "",
    "| model | quant | params | max_ctx |",
    "|---|---|---:|---:|",
  ];

  for (const m of models) {
    const modelName = `${m.publisher ?? "unknown"}/${m.display_name ?? m.key}`;
    const quant = m.quantization?.name
      ? m.quantization.bits_per_weight
        ? `${m.quantization.name} (${m.quantization.bits_per_weight}-bit)`
        : m.quantization.name
      : "-";
    const params = m.params_string ?? "-";
    const maxCtx = m.max_context_length ?? "-";
    const loaded = (m.loaded_instances?.length ?? 0) > 0 ? " (loaded)" : "";

    lines.push(`| ${modelName}${loaded} | ${quant} | ${params} | ${maxCtx} |`);
  }

  ctx.ui.notify(lines.join("\n"), "info");
}

async function openLoaderModal(ctx: ExtensionCommandContext): Promise<void> {
  const models = await getModels();
  if (!models) {
    ctx.ui.notify("LM Studio API server is not reachable at http://localhost:1234", "warning");
    return;
  }

  const llms = models.filter((m) => m.type === "llm");
  if (llms.length === 0) {
    ctx.ui.notify("No LLM models found in LM Studio.", "warning");
    return;
  }

  const labels = llms.map((m) => `${m.key}${(m.loaded_instances?.length ?? 0) > 0 ? " (loaded)" : ""}`);
  const selectedLabel = await ctx.ui.select("LM Studio Models", labels);
  if (!selectedLabel) return;

  const modelKey = selectedLabel.replace(/\s+\(loaded\)$/, "");
  const choice = await ctx.ui.select("Load options", ["Load", "Save options + Load", "Cancel"]);
  if (!choice || choice === "Cancel") return;

  let options = loadSavedOptions()[modelKey] || {};
  if (choice === "Save options + Load") {
    options = await promptLoadOptions(ctx, modelKey, options);
    const saved = loadSavedOptions();
    saved[modelKey] = options;
    saveOptions(saved);
  }

  const ok = await loadModel(modelKey, options);
  if (!ok) {
    ctx.ui.notify(`Failed to load model: ${modelKey}`, "error");
    return;
  }
  ctx.ui.notify(`Loaded: ${modelKey}`, "info");
}

async function promptLoadOptions(
  ctx: ExtensionCommandContext,
  modelKey: string,
  current: LoadOptions
): Promise<LoadOptions> {
  const contextLength = await ctx.ui.input(`context_length (${modelKey})`, String(current.context_length ?? ""));
  const evalBatchSize = await ctx.ui.input(`eval_batch_size (${modelKey})`, String(current.eval_batch_size ?? ""));
  const flash = await ctx.ui.confirm("flash_attention", "Enable flash attention?");
  const offload = await ctx.ui.confirm("offload_kv_cache_to_gpu", "Offload KV cache to GPU?");

  return {
    context_length: toNumber(contextLength),
    eval_batch_size: toNumber(evalBatchSize),
    flash_attention: flash,
    offload_kv_cache_to_gpu: offload,
    num_experts: current.num_experts,
  };
}

async function getModels(): Promise<LmModel[] | null> {
  try {
    const res = await fetch(`${API_BASE}/models`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as LmModelsResponse;
    return json.models ?? [];
  } catch {
    return null;
  }
}

async function loadModel(model: string, options: LoadOptions): Promise<boolean> {
  try {
    const body = { model, ...compactOptions(options), echo_load_config: true };
    const res = await fetch(`${API_BASE}/models/load`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function compactOptions(options: LoadOptions): LoadOptions {
  return Object.fromEntries(
    Object.entries(options).filter(([, v]) => v !== undefined && v !== null)
  ) as LoadOptions;
}

function toNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value.trim());
  return Number.isFinite(n) ? n : undefined;
}

function loadSavedOptions(): SavedOptions {
  try {
    return JSON.parse(readFileSync(OPTIONS_FILE, "utf8")) as SavedOptions;
  } catch {
    return {};
  }
}

function saveOptions(options: SavedOptions): void {
  mkdirSync(dirname(OPTIONS_FILE), { recursive: true });
  writeFileSync(OPTIONS_FILE, JSON.stringify(options, null, 2));
}
