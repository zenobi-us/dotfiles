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

const BASE_URL = process.env.LMSTUDIO_BASE_URL || "http://localhost:1234";
const API_BASE = `${BASE_URL}/api/v1`;

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

  pi.on('resources_discover', async (ctx) => {
  })
}

async function registerDynamicProvider(pi: ExtensionAPI): Promise<void> {
  const models = await getModels();
  if (!models) return;

  pi.registerProvider("lmstudio", {
    baseUrl: `${BASE_URL}/v1`,
    apiKey: "lmstudio",
    api: "openai-completions",
    models: models
      .filter((m) => m.type === "llm" && (m.loaded_instances?.length ?? 0) > 0)
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

  const options = llms.map((m) => {
    const isActive = (m.loaded_instances?.length ?? 0) > 0;
    const themeColor = isActive ? "success" : "muted";
    const activeTag = isActive ? " [active]" : "";
    return {
      key: m.key,
      label: `[${themeColor}] ${m.key}${activeTag}`,
    };
  });

  const selectedLabel = await ctx.ui.select("LM Studio Models", options.map((o) => o.label));
  if (!selectedLabel) return;

  const modelKey = options.find((o) => o.label === selectedLabel)?.key;
  if (!modelKey) return;

  const choice = await ctx.ui.select("Load options", ["Load", "Save options + Load", "Cancel"]);
  if (!choice || choice === "Cancel") return;

  const ok = await loadModel(modelKey);
  if (!ok) {
    ctx.ui.notify(`Failed to load model: ${modelKey}`, "error");
    return;
  }
  ctx.ui.notify(`Loaded: ${modelKey}`, "info");
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

async function loadModel(model: string): Promise<boolean> {
  try {
    const body = { model, echo_load_config: true };
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

