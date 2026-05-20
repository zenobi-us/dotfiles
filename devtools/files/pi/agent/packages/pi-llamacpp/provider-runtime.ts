import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type {
  LlamaCppPiApi,
  LlamaCppProviderOptions,
  LlamaCppSettings,
  LlamaCppStreamSimpleOptions,
  ManagedRouterStatus,
  OperationalStatus,
  PresetMetadata,
  ProviderApiKeyResolution,
  ProviderModel,
  RouterModel,
} from "./types.js";
import type { Api, AssistantMessageEventStream, Context, Model } from "@earendil-works/pi-ai";
import { streamSimpleOpenAICompletions } from "@earendil-works/pi-ai/openai-completions";
import { LoadGate } from "./load-gate.js";
import { ManagedRouterProcess } from "./managed-router-process.js";
import { PresetFileReader, toPresetFileStatus } from "./preset-file-reader.js";
import { RouterClient } from "./router-client.js";
import {
  createBaselineOperationalStatus,
  loadLlamaCppSettings,
  parseLlamaCppSettings,
} from "./settings-module.js";
import {
  formatOperationalStatus,
  formatRouterModelListCommandResult,
  withModelStatusCounts,
} from "./model-presentation.js";
import {
  diagnosticSecretValues,
  errorToMessage,
  sanitizeDiagnosticMessage,
} from "./diagnostics-module.js";

const DEFAULT_PROVIDER_API_KEY = "llamacpp";
const PROVIDER_ID = "llamacpp";

export default async function llamacppProvider(
  pi: LlamaCppPiApi,
  options: LlamaCppProviderOptions = {},
): Promise<void> {
  const loadSettings = options.loadSettings ?? loadLlamaCppSettings;
  const clientFor = (settings: LlamaCppSettings) => new RouterClient(settings, { fetch: options.fetch });
  // Runtime cache for dynamic list output freshness.
  let cachedRouterModels: RouterModel[] = [];
  const managedRouter = options.managedRouter ?? new ManagedRouterProcess();
  const withLifecycle = (status: OperationalStatus): OperationalStatus => addManagedRouterStatus(status, managedRouter.status());

  const refresh = async (ctx?: ExtensionCommandContext): Promise<OperationalStatus> => {
    const settings = await loadSettings(ctx);
    const client = clientFor(settings);
    const status = withLifecycle(await refreshProviderModels(pi, settings, client));
    
    cachedRouterModels = status.routerReachable ? (status.routerModels ?? cachedRouterModels) : [];
    return status;
  };

  await refresh().catch((error: unknown) => createBaselineOperationalStatus(
    parseLlamaCppSettings({}),
    error instanceof Error ? error.message : String(error),
  ));

  pi.on?.("session_shutdown", async (event) => {
    if (isRecord(event) && event.reason !== "quit") return;
    await managedRouter.stopOnQuit(await loadSettings());
  });

  pi.on?.("model_select", async (event) => {
    const model = readModelSelectEventModel(event);
    if (!isLlamaCppSelectedModel(model)) return;
    const settings = await loadSettings();
    if (!settings.loadOnSelect) return;
    await new LoadGate(settings, clientFor(settings)).ensureRequestReady(model.id);
  });

  const notifyOperationalError = (ctx: ExtensionCommandContext, error: unknown): void => {
    const baseline = createBaselineOperationalStatus(parseLlamaCppSettings({}), errorToMessage(error));
    const status = { ...withLifecycle(baseline), lastError: baseline.lastError };
    ctx.ui.notify(formatOperationalStatus(status), "warning");
  };

  pi.registerCommand("llamacpp", {
    description: "llama.cpp router status and operations",
    getArgumentCompletions: (prefix: string) => ["status", "list", "reload", "start", "stop"]
      .filter((value) => value.startsWith((prefix ?? "").trim().toLowerCase()))
      .map((value) => ({ value, label: value })),
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const action = (args || "status").trim().toLowerCase() || "status";
      if (action === "status") {
        try {
          const settings = await loadSettings(ctx);
          const status = await refresh(ctx).catch((error: unknown) => createBaselineOperationalStatus(settings, errorToMessage(error, settings)));
          ctx.ui.notify(formatOperationalStatus(status), status.lastError?.startsWith("Invalid Server Base URL") ? "warning" : "info");
        } catch (error) {
          const status = withLifecycle(createBaselineOperationalStatus(parseLlamaCppSettings({}), errorToMessage(error)));
          ctx.ui.notify(formatOperationalStatus(status), "warning");
        }
        return;
      }
      if (action === "list") {
        try {
          const settings = await loadSettings(ctx);
          const client = clientFor(settings);
          const result = await safeFetchRouterModels(client);
          if (result.error) {
            ctx.ui.notify(`llamacpp Router Model List\n\nRouter unreachable: ${result.error}`, "warning");
            return;
          }
          cachedRouterModels = result.models;
          ctx.ui.notify(formatRouterModelListCommandResult(result.models, settings), "info");
        } catch (error) {
          notifyOperationalError(ctx, error);
        }
        return;
      }
      if (action === "reload") {
        try {
          const status = await refresh(ctx);
          ctx.ui.notify([
            "llamacpp reload complete",
            "",
            `Router Reachable: ${status.routerReachable ? "yes" : "no"}`,
            `Router Models: ${status.routerModelCount ?? cachedRouterModels.length}`,
            `Provider Models: ${status.providerModelCount}`,
            `Last Error: ${status.lastError ? sanitizeDiagnosticMessage(status.lastError, ...diagnosticSecretValues(status.settings)) : "none"}`,
          ].join("\n"), status.routerReachable ? "info" : "warning");
        } catch (error) {
          notifyOperationalError(ctx, error);
        }
        return;
      }
      if (action === "start") {
        try {
          const settings = await loadSettings(ctx);
          const client = clientFor(settings);
          const result = await managedRouter.start(settings, () => client.fetchModelList());
          const refreshed = await refresh(ctx).catch((error: unknown) => createBaselineOperationalStatus(settings, errorToMessage(error, settings)));
          const status = refreshed.lastError ? { ...withLifecycle(refreshed), lastError: refreshed.lastError } : withLifecycle(refreshed);
          ctx.ui.notify(["llamacpp start", "", result.message, "", formatOperationalStatus(status)].join("\n"), result.lastError || status.lastError ? "warning" : "info");
        } catch (error) {
          notifyOperationalError(ctx, error);
        }
        return;
      }
      if (action === "stop") {
        const result = await managedRouter.stop();
        try {
          const settings = await loadSettings(ctx);
          const refreshed = await refresh(ctx).catch((error: unknown) => createBaselineOperationalStatus(settings, errorToMessage(error, settings)));
          const postStopLastError = result.lastError ? refreshed.lastError : undefined;
          const status = postStopLastError ? { ...withLifecycle(refreshed), lastError: postStopLastError } : { ...withLifecycle(refreshed), lastError: undefined };
          ctx.ui.notify(["llamacpp stop", "", result.message, "", formatOperationalStatus(status)].join("\n"), result.lastError ? "warning" : "info");
        } catch (error) {
          const baseline = createBaselineOperationalStatus(parseLlamaCppSettings({}), errorToMessage(error));
          const status = { ...withLifecycle(baseline), lastError: baseline.lastError };
          ctx.ui.notify(["llamacpp stop", "", result.message, "", formatOperationalStatus(status)].join("\n"), "warning");
        }
        return;
      }

      ctx.ui.notify("Usage: /llamacpp status | list | reload | start | stop", "warning");
    },
  });
}

export async function refreshProviderModels(
  pi: Pick<LlamaCppPiApi, "registerProvider" | "unregisterProvider">,
  settings: LlamaCppSettings,
  routerClient = new RouterClient(settings),
): Promise<OperationalStatus> {
  if (settings.providerApiKey.kind === "unsupported" || settings.providerApiKey.kind === "missing-env") {
    await pi.unregisterProvider?.(PROVIDER_ID);
    return createBaselineOperationalStatus(settings, settings.providerApiKey.error);
  }

  if (typeof pi.unregisterProvider !== "function" || typeof pi.registerProvider !== "function") {
    return refreshUnsupportedProviderApiStatus(settings, routerClient, pi);
  }

  await pi.unregisterProvider(PROVIDER_ID);

  try {
    const routerModelList = await routerClient.fetchModelList();
    const presetFile = PresetFileReader.read(settings.configuredPresetFilePath);
    const presetMetadata = new Map(presetFile.presets.map((preset) => [preset.id, preset.metadata]));
    const providerModels = routerModelList.models.map((model) => toProviderModel(model, presetMetadata.get(model.id)));
    await pi.registerProvider(PROVIDER_ID, {
      baseUrl: settings.providerBaseUrl,
      apiKey: resolvedProviderApiKeyValue(settings.providerApiKey) ?? DEFAULT_PROVIDER_API_KEY,
      api: "llamacpp-openai-completions",
      streamSimple: createLlamaCppStreamSimple(settings, routerClient),
      models: providerModels,
    });
    return withModelStatusCounts({
      settings,
      routerReachable: true,
      providerRegistered: true,
      providerModelCount: providerModels.length,
      routerModelCount: routerModelList.models.length,
      routerModels: routerModelList.models,
      presetFile: toPresetFileStatus(presetFile),
      routerOwnership: "external",
    });
  } catch (error) {
    return createBaselineOperationalStatus(settings, errorToMessage(error, settings));
  }
}

export function createLlamaCppStreamSimple(
  settings: LlamaCppSettings,
  routerClient = new RouterClient(settings),
): (model: Model<Api>, context: Context, options?: LlamaCppStreamSimpleOptions) => Promise<AssistantMessageEventStream> {
  return async (model, context, options) => {
    await new LoadGate(settings, routerClient, { signal: options?.signal }).ensureRequestReady(model.id);
    const delegate = options?.delegate ?? streamSimpleOpenAICompletions;
    const { delegate: _delegate, ...delegateOptions } = options ?? {};
    try {
      return delegate(
        { ...model, api: "openai-completions" } as Model<"openai-completions">,
        context,
        delegateOptions,
      );
    } catch (error) {
      throw new Error(`llamacpp provider chat failed after load gate for model ${model.id}: ${errorToMessage(error, settings)}`);
    }
  };
}

async function refreshUnsupportedProviderApiStatus(
  settings: LlamaCppSettings,
  routerClient: RouterClient,
  pi: Pick<LlamaCppPiApi, "unregisterProvider">,
): Promise<OperationalStatus> {
  await pi.unregisterProvider?.(PROVIDER_ID);
  try {
    const routerModelList = await routerClient.fetchModelList();
    return withModelStatusCounts({
      settings,
      routerReachable: true,
      providerRegistered: false,
      providerModelCount: 0,
      routerModelCount: routerModelList.models.length,
      routerModels: routerModelList.models,
      presetFile: toPresetFileStatus(PresetFileReader.read(settings.configuredPresetFilePath)),
      routerOwnership: "external",
      lastError: "Provider API unsupported (registerProvider unavailable).",
    });
  } catch (error) {
    return createBaselineOperationalStatus(settings, errorToMessage(error, settings));
  }
}

function resolvedProviderApiKeyValue(providerApiKey: ProviderApiKeyResolution): string | undefined {
  if (providerApiKey.kind === "literal") return providerApiKey.value;
  if (providerApiKey.kind === "env") return providerApiKey.value;
  return undefined;
}

function toProviderModel(routerModel: RouterModel, presetMetadata?: PresetMetadata): ProviderModel {
  const model: ProviderModel = {
    id: routerModel.id,
    name: routerModel.name,
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128_000,
    maxTokens: 8_192,
  };
  if (presetMetadata?.contextWindow !== undefined) model.contextWindow = presetMetadata.contextWindow;
  if (presetMetadata?.maxTokens !== undefined) model.maxTokens = presetMetadata.maxTokens;
  if (presetMetadata?.reasoning !== undefined) model.reasoning = presetMetadata.reasoning;
  return model;
}

async function safeFetchRouterModels(routerClient: RouterClient): Promise<{ models: RouterModel[]; error?: string }> {
  try {
    const result = await routerClient.fetchModelList();
    return { models: result.models };
  } catch (error) {
    return { models: [], error: error instanceof Error ? error.message : String(error) };
  }
}

function addManagedRouterStatus(status: OperationalStatus, managedStatus: ManagedRouterStatus): OperationalStatus {
  const next: OperationalStatus = {
    ...status,
    routerOwnership: managedStatus.ownership,
    managedProcess: managedStatus.process,
    managedLogTail: managedStatus.process
      ? {
        stdout: [...managedStatus.process.stdoutTail],
        stderr: [...managedStatus.process.stderrTail],
      }
      : undefined,
  };
  if (managedStatus.lastError && !next.lastError) next.lastError = managedStatus.lastError;
  return next;
}

function isLlamaCppSelectedModel(model: unknown): model is { id: string } {
  if (!isRecord(model)) return false;
  const api = model.api;
  if (api === "llamacpp-openai-completions") return typeof model.id === "string";
  if (api === "openai-completions") {
    const id = typeof model.id === "string" ? model.id : "";
    const name = typeof model.name === "string" ? model.name : "";
    return id.toLowerCase().includes("llama") || name.toLowerCase().includes("llama");
  }
  return false;
}

function readModelSelectEventModel(event: unknown): unknown {
  if (!isRecord(event)) return undefined;
  if (isRecord(event.model)) return event.model;
  if (isRecord(event.payload) && isRecord(event.payload.model)) return event.payload.model;
  return undefined;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}
