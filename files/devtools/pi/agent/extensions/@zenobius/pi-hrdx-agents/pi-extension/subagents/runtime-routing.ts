import {
  clampThinkingLevel,
  getSupportedThinkingLevels,
  type Model,
  type ModelThinkingLevel,
} from "@earendil-works/pi-ai";

export const THINKING_LEVELS = [
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

export function isThinkingLevel(value: string): value is ThinkingLevel {
  return (THINKING_LEVELS as readonly string[]).includes(value);
}

export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
export type RuntimeSource = "request" | "agent" | "parent";

export interface RuntimeRequest {
  model?: string;
  thinking?: ThinkingLevel;
}

export interface ParentRuntime {
  provider: string;
  modelId: string;
  thinking: ThinkingLevel;
}

export interface RoutingModel {
  provider: string;
  id: string;
  reasoning: boolean;
  thinkingLevelMap?: Model<any>["thinkingLevelMap"];
  input?: string[];
  contextWindow?: number;
  maxTokens?: number;
  cost?: {
    input?: number;
    output?: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
}

export interface ModelRegistryAdapter {
  find(provider: string, modelId: string): RoutingModel | undefined;
  available(): RoutingModel[];
  hasConfiguredAuth(model: { provider: string; id: string }): boolean;
}

export interface ResolvedRuntimePlan {
  provider: string;
  modelId: string;
  model: string;
  thinking: ThinkingLevel;
  modelSource: RuntimeSource;
  thinkingSource: RuntimeSource;
  requestedModel?: string;
  requestedThinking?: ThinkingLevel;
  thinkingAdjustment?: {
    from: ThinkingLevel;
    to: ThinkingLevel;
    reason: "non-reasoning" | "inherited-clamp";
  };
  observed?: {
    model?: string;
    thinking?: ThinkingLevel;
  };
  runtimeMismatch?: string;
}

export class RuntimeResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeResolutionError";
  }
}

export function parseExactModelRef(
  reference: string,
): { provider: string; modelId: string } | undefined {
  const trimmed = reference.trim();
  const separator = trimmed.indexOf("/");
  if (separator <= 0 || separator === trimmed.length - 1) return undefined;
  const provider = trimmed.slice(0, separator).trim();
  const modelId = trimmed.slice(separator + 1).trim();
  return provider && modelId ? { provider, modelId } : undefined;
}

function toRoutingModel(value: any): RoutingModel | undefined {
  if (!value || typeof value.provider !== "string" || typeof value.id !== "string") {
    return undefined;
  }
  return {
    provider: value.provider,
    id: value.id,
    reasoning: value.reasoning ?? false,
    thinkingLevelMap: value.thinkingLevelMap,
    input: Array.isArray(value.input) ? value.input : undefined,
    contextWindow: typeof value.contextWindow === "number" ? value.contextWindow : undefined,
    maxTokens: typeof value.maxTokens === "number" ? value.maxTokens : undefined,
    cost: value.cost,
  };
}

export function wrapPiModelRegistry(registry: {
  find(provider: string, modelId: string): any;
  getAvailable?: () => any[];
  getAll?: () => any[];
  hasConfiguredAuth?: (model: any) => boolean;
}): ModelRegistryAdapter {
  return {
    find(provider, modelId) {
      return toRoutingModel(registry.find(provider, modelId));
    },
    available() {
      const direct = registry.getAvailable?.() ?? [];
      const source = direct.length > 0 ? direct : registry.getAll?.() ?? [];
      const models: RoutingModel[] = [];
      const seen = new Set<string>();
      for (const raw of source) {
        const candidate = toRoutingModel(raw);
        if (!candidate) continue;
        if (direct.length === 0 && registry.hasConfiguredAuth && !registry.hasConfiguredAuth(raw)) {
          continue;
        }
        const ref = `${candidate.provider}/${candidate.id}`;
        if (seen.has(ref)) continue;
        seen.add(ref);
        models.push(candidate);
      }
      return models;
    },
    hasConfiguredAuth(model) {
      if (!registry.hasConfiguredAuth) {
        return (registry.getAvailable?.() ?? []).some(
          (candidate) => candidate.provider === model.provider && candidate.id === model.id,
        );
      }
      const original = registry.find(model.provider, model.id);
      return !!original && registry.hasConfiguredAuth(original);
    },
  };
}

function asPiModel(model: RoutingModel): Model<any> {
  return {
    provider: model.provider,
    id: model.id,
    name: model.id,
    api: "openai-completions",
    baseUrl: "",
    reasoning: model.reasoning,
    thinkingLevelMap: model.thinkingLevelMap,
    input: (model.input?.filter((entry): entry is "text" | "image" =>
      entry === "text" || entry === "image") ?? ["text"]),
    contextWindow: model.contextWindow ?? 0,
    maxTokens: model.maxTokens ?? 0,
    cost: {
      input: model.cost?.input ?? 0,
      output: model.cost?.output ?? 0,
      cacheRead: model.cost?.cacheRead ?? 0,
      cacheWrite: model.cost?.cacheWrite ?? 0,
    },
  };
}

function formatSupported(model: RoutingModel): string {
  const levels = getSupportedThinkingLevels(asPiModel(model));
  return levels.length > 0 ? levels.join(", ") : "(none)";
}

function selectField(
  requestValue: string | undefined,
  agentValue: string | undefined,
): { value?: string; source: RuntimeSource } {
  if (requestValue != null && requestValue !== "") {
    return { value: requestValue, source: "request" };
  }
  if (agentValue != null && agentValue !== "") {
    return { value: agentValue, source: "agent" };
  }
  return { source: "parent" };
}

export function parseModelFallbacks(reference: string): string[] {
  const candidates = reference.split(",").map((candidate) => candidate.trim());
  if (candidates.some((candidate) => candidate === "")) {
    throw new RuntimeResolutionError(
      `model fallback list ${JSON.stringify(reference)} cannot contain an empty candidate`,
    );
  }
  return candidates;
}

export function resolveRuntimePlan(
  request: RuntimeRequest,
  agentDefaults: RuntimeRequest,
  parent: ParentRuntime,
  registry: ModelRegistryAdapter,
): ResolvedRuntimePlan {
  const modelSelection = selectField(request.model, agentDefaults.model);
  let provider = parent.provider;
  let modelId = parent.modelId;
  let selectedModel = registry.find(provider, modelId);

  if (modelSelection.value) {
    const parsed = parseExactModelRef(modelSelection.value);
    if (!parsed) {
      throw new RuntimeResolutionError(
        `model ${JSON.stringify(modelSelection.value)} must be an exact authenticated provider/model-id`,
      );
    }
    const found = registry.find(parsed.provider, parsed.modelId);
    if (!found) {
      const alternatives = registry.available().map((model) => `${model.provider}/${model.id}`);
      throw new RuntimeResolutionError(
        `unknown model ${JSON.stringify(modelSelection.value)}; exact registry match required. Available: ${alternatives.join(", ") || "(none)"}`,
      );
    }
    if (!registry.hasConfiguredAuth(found)) {
      throw new RuntimeResolutionError(
        `model ${JSON.stringify(modelSelection.value)} has no configured authentication`,
      );
    }
    provider = found.provider;
    modelId = found.id;
    selectedModel = found;
  }

  const thinkingSelection = selectField(request.thinking, agentDefaults.thinking);
  const preferredThinking = thinkingSelection.value ?? parent.thinking;
  if (!isThinkingLevel(preferredThinking)) {
    throw new RuntimeResolutionError(
      `thinking ${JSON.stringify(preferredThinking)} must be one of: ${THINKING_LEVELS.join(", ")}`,
    );
  }

  let thinking = preferredThinking;
  let thinkingAdjustment: ResolvedRuntimePlan["thinkingAdjustment"];
  if (thinkingSelection.source !== "parent") {
    if (!selectedModel) {
      throw new RuntimeResolutionError(
        `model capability information is unavailable; cannot validate explicit thinking ${JSON.stringify(preferredThinking)}`,
      );
    }
    const supported = getSupportedThinkingLevels(asPiModel(selectedModel));
    if (!supported.includes(preferredThinking as ModelThinkingLevel)) {
      throw new RuntimeResolutionError(
        `thinking ${JSON.stringify(preferredThinking)} is not supported by ${JSON.stringify(`${provider}/${modelId}`)}; supported: ${formatSupported(selectedModel)}`,
      );
    }
  } else if (selectedModel) {
    const clamped = clampThinkingLevel(asPiModel(selectedModel), preferredThinking);
    thinking = clamped as ThinkingLevel;
    if (thinking !== preferredThinking) {
      thinkingAdjustment = {
        from: preferredThinking,
        to: thinking,
        reason: selectedModel.reasoning ? "inherited-clamp" : "non-reasoning",
      };
    }
  }

  return {
    provider,
    modelId,
    model: `${provider}/${modelId}`,
    thinking,
    modelSource: modelSelection.source,
    thinkingSource: thinkingSelection.source,
    ...(modelSelection.value ? { requestedModel: modelSelection.value } : {}),
    ...(thinkingSelection.value ? { requestedThinking: preferredThinking } : {}),
    ...(thinkingAdjustment ? { thinkingAdjustment } : {}),
  };
}

/** Resolve every configured fallback before launching the first child. */
export function resolveRuntimePlans(
  request: RuntimeRequest,
  agentDefaults: RuntimeRequest,
  parent: ParentRuntime,
  registry: ModelRegistryAdapter,
): ResolvedRuntimePlan[] {
  const selection = selectField(request.model, agentDefaults.model);
  if (!selection.value) {
    return [resolveRuntimePlan(request, agentDefaults, parent, registry)];
  }

  return parseModelFallbacks(selection.value).map((model) =>
    resolveRuntimePlan(
      selection.source === "request" ? { ...request, model } : { ...request, model: undefined },
      selection.source === "agent"
        ? { ...agentDefaults, model }
        : agentDefaults,
      parent,
      registry,
    ),
  );
}

function formatTokenCount(value: number | undefined): string | undefined {
  if (!value || value <= 0) return undefined;
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}m`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

export function buildAuthenticatedModelCatalog(
  registry: ModelRegistryAdapter,
  limit = 24,
): string {
  const models = registry.available().sort((a, b) =>
    `${a.provider}/${a.id}`.localeCompare(`${b.provider}/${b.id}`),
  );
  const visibleModels = models.slice(0, limit);
  const lines = [
    "Authenticated subagent models (use exact provider/model-id only):",
  ];
  for (const model of visibleModels) {
    const supportedThinking = getSupportedThinkingLevels(asPiModel(model));
    const facts = [
      model.reasoning
        ? `reasoning (${supportedThinking.join("/") || "no thinking levels"})`
        : "non-reasoning",
      model.input?.includes("image") ? "text+image" : "text",
      formatTokenCount(model.contextWindow) ? `${formatTokenCount(model.contextWindow)} context` : undefined,
      formatTokenCount(model.maxTokens) ? `${formatTokenCount(model.maxTokens)} max output` : undefined,
    ].filter(Boolean);
    lines.push(`- ${model.provider}/${model.id} — ${facts.join(", ")}`);
  }
  if (models.length === 0) lines.push("- none discovered; omitting model still inherits the parent runtime");
  if (models.length > visibleModels.length) {
    lines.push(`- … ${models.length - visibleModels.length} more authenticated models omitted`);
  }
  lines.push(
    "For orchestrated children, explicitly select an exact provider/model-id by task tier first (fast for bounded mechanical work and recon, mid for ordinary implementation or review, frontier for architecture, security, hard diagnosis, or adversarial review), then set supported thinking. Reviews must use a different provider/family than the producing model. Omitting model and thinking inherits the parent runtime as a discouraged fallback.",
  );
  return lines.join("\n");
}
