/**
 * Extension: Auto-discover models from llama.cpp router server.
 *
 * Replaces the placeholder provider model with models discovered from
 * /v1/models. The user only needs to specify baseUrl and api at the provider
 * level; this extension queries /props?model=<name> for router validation,
 * then /models for the model list, and registers them.
 */

import type {
  ExtensionAPI,
  ExtensionContext,
  ProviderConfig,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { Check } from "typebox/value";

import fs from "node:fs";

const LOG_FILE = "/tmp/llama-cpp-auto.log";
const DEBUG = process.env.LLAMA_CPP_EXTENSION_DEBUG === "1";
const PROVIDER = "llama-cpp";
const MODEL_ID = "llama-cpp-discover";

type ProviderModel = NonNullable<ProviderConfig["models"]>[number];

function log(...args: any[]) {
  if (!DEBUG) return;
  fs.appendFileSync(
    LOG_FILE,
    `[${new Date().toISOString()}] [llama-cpp-auto] ${args.join(" ")}\n`,
  );
}

function notify(message: string, ctx?: ExtensionContext) {
  if (!ctx) return;
  ctx.ui.notify(`[llama-cpp auto-discover] ${message}`, "warning");
}

interface modelStatus {
  value: string;
  args: string[];
  preset: string;
}

interface modelData {
  id: string;
  aliases: string[];
  tags: string[];
  object: string;
  owned_by: string;
  created: number; // Unix timestamp
  status: modelStatus;
}

interface llamaCppModels {
  data: modelData[];
  object: "list";
}

function parseArgsToMap(args: string[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const key = arg.replace(/^--/, "");
      const nextValue = args[i + 1];

      if (nextValue !== undefined && !nextValue.startsWith("--")) {
        map[key] = nextValue;
        i++;
      } else {
        map[key] = "true";
      }
    }
  }

  return map;
}

function formatModelName(id: string): string {
  return id
    .split(/[\-_/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function transformLlamaCppModels(input: llamaCppModels): ProviderModel[] {
  return input.data.map((model) => {
    const args = parseArgsToMap(model.status.args);
    const contextWindow = parseInt(args["ctx-size"] ?? "0", 10) || 0;
    const maxTokens =
      parseInt(args["n_predict"] ?? args["ctx-size"] ?? "0", 10) || 0;

    return {
      id: model.id,
      name: formatModelName(model.id),
      reasoning: false,
      input: ["text"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
      },
      contextWindow,
      maxTokens,
    };
  });
}

export default function (pi: ExtensionAPI) {
  let currentCtx: ExtensionContext | undefined;

  pi.on("session_start", async (_event, ctx) => {
    currentCtx = ctx;
    await discoverAndRegister();
  });

  async function discoverAndRegister(): Promise<void> {
    try {
      if (!currentCtx) return;

      const registeredModels = currentCtx.modelRegistry.getAvailable();
      log("registered models", JSON.stringify(registeredModels));

      const llamaProviders = registeredModels.filter(
        (m) => m.provider === PROVIDER && m.id === MODEL_ID,
      );

      if (llamaProviders.length !== 1) {
        notify(
          `Found ${llamaProviders.length} llama-cpp placeholder models. Only one should be specified in models.json.`,
          currentCtx,
        );
        return;
      }

      const llamaProvider = llamaProviders[0];
      if (!llamaProvider) return;

      const isRouter = await checkRouterMode(llamaProvider.baseUrl);
      if (!isRouter) {
        notify("server is not in router mode", currentCtx);
        return;
      }

      const url = `${llamaProvider.baseUrl}/models`;
      log(`Querying ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        notify(`HTTP ${response.status}: ${response.statusText}`, currentCtx);
        return;
      }

      const llamaCppModels = (await response.json()) as llamaCppModels;
      if (!llamaCppModels.data || !Array.isArray(llamaCppModels.data)) {
        notify("Invalid response format from llama.cpp server", currentCtx);
        return;
      }

      if (llamaCppModels.data.length === 0) {
        notify("Server returned no models", currentCtx);
        return;
      }

      log(`Got models from llama-cpp: ${JSON.stringify(llamaCppModels)}`);

      const autoDiscoveredModels = transformLlamaCppModels(llamaCppModels);
      if (autoDiscoveredModels.length === 0) {
        notify("No models discovered from llama.cpp server", currentCtx);
        return;
      }
      log(`autoDiscoveredModels ${JSON.stringify(autoDiscoveredModels)}`);

      const apiKeyAndHeaders =
        await currentCtx.modelRegistry.getApiKeyAndHeaders(llamaProvider);
      if (!apiKeyAndHeaders.ok) {
        notify(
          `Failed to resolve auth for ${PROVIDER}/${MODEL_ID}: ${apiKeyAndHeaders.error}`,
          currentCtx,
        );
        return;
      }

      const updatedProvider: ProviderConfig = {
        name: llamaProvider.name,
        baseUrl: llamaProvider.baseUrl,
        apiKey: apiKeyAndHeaders.apiKey,
        api: llamaProvider.api,
        headers: apiKeyAndHeaders.headers,
        models: autoDiscoveredModels,
      };

      const wasOnDiscoverModel =
        currentCtx.model?.provider === PROVIDER &&
        currentCtx.model?.id === MODEL_ID;

      pi.registerProvider(PROVIDER, updatedProvider);

      if (wasOnDiscoverModel) {
        const firstModel = currentCtx.modelRegistry.find(
          PROVIDER,
          autoDiscoveredModels[0].id,
        );
        if (firstModel) {
          pi.setModel(firstModel);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (currentCtx) notify(`Failed to discover models: ${msg}`, currentCtx);
      else log(`Failed to discover models: ${msg}`);
    }
  }

  async function checkRouterMode(baseUrl: string): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/props`);
      if (!res.ok) return false;
      const body = await res.json();
      if (!Check(LlamaCppRouterPropsResponseSchema, body)) {
        log(`Unexpected /props response: ${JSON.stringify(body)}`);
        return false;
      }
      return body.role === "router";
    } catch {
      log(`Failed to probe ${baseUrl}/props`);
      return false;
    }
  }
}

const LlamaCppRouterPropsResponseSchema = Type.Object({
  role: Type.Literal("router"),
  // other fields are ignored for now
});
