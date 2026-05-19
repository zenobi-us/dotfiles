import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, parse as parsePath } from "node:path";

export type LlamaCppTimeouts = {
  startMs: number;
  loadMs: number;
  pollMs: number;
  requestGateMs: number;
  statusMs: number;
};

export type ProviderApiKeyResolution =
  | { kind: "literal"; value: string }
  | { kind: "env"; envName: string; value: string }
  | { kind: "missing-env"; envName: string; value: string; error: string }
  | { kind: "unsupported"; value: string; error: string };

export type LlamaCppSettings = {
  serverBaseUrl: string;
  providerBaseUrl: string;
  serverBinaryPath: string;
  configuredPresetFilePath: string;
  providerApiKey: ProviderApiKeyResolution;
  loadOnSelect: boolean;
  stopOnQuit: boolean;
  timeouts: LlamaCppTimeouts;
};

export type RouterModel = {
  id: string;
  name: string;
  object?: string;
  status?: string;
  loaded: boolean;
  raw: Record<string, unknown>;
};

export type RouterModelList = {
  models: RouterModel[];
  raw: unknown;
};

export type OperationalStatus = {
  settings: LlamaCppSettings;
  routerReachable: boolean;
  providerRegistered: boolean;
  providerModelCount: number;
  routerModelCount?: number;
  lastError?: string;
};

type ProviderModel = {
  id: string;
  name: string;
  reasoning: boolean;
  input: Array<"text">;
  cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
  contextWindow: number;
  maxTokens: number;
};

type LlamaCppPiApi = Pick<ExtensionAPI, "registerCommand"> & {
  registerProvider?: (name: string, provider: unknown) => void | Promise<void>;
  unregisterProvider?: (name: string) => void | Promise<void>;
};

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

type LlamaCppProviderOptions = {
  loadSettings?: (ctx?: ExtensionCommandContext) => Promise<LlamaCppSettings> | LlamaCppSettings;
  fetch?: FetchLike;
};

const DEFAULT_SERVER_BASE_URL = "http://localhost:8080";
const DEFAULT_PROVIDER_API_KEY = "llamacpp";
const PROVIDER_ID = "llamacpp";

export const DEFAULT_LLAMACPP_TIMEOUTS: LlamaCppTimeouts = {
  startMs: 30_000,
  loadMs: 120_000,
  pollMs: 2_000,
  requestGateMs: 180_000,
  statusMs: 3_000,
};

export const DEFAULT_LLAMACPP_SETTINGS: LlamaCppSettings = {
  serverBaseUrl: DEFAULT_SERVER_BASE_URL,
  providerBaseUrl: `${DEFAULT_SERVER_BASE_URL}/v1`,
  serverBinaryPath: "llama-server",
  configuredPresetFilePath: "~/.config/llamacpp/model-presets.ini",
  providerApiKey: { kind: "literal", value: DEFAULT_PROVIDER_API_KEY },
  loadOnSelect: false,
  stopOnQuit: false,
  timeouts: DEFAULT_LLAMACPP_TIMEOUTS,
};

export default async function llamacppProvider(
  pi: LlamaCppPiApi,
  options: LlamaCppProviderOptions = {},
): Promise<void> {
  const loadSettings = options.loadSettings ?? loadLlamaCppSettings;
  const clientFor = (settings: LlamaCppSettings) => new RouterClient(settings, { fetch: options.fetch });
  let cachedStatus: OperationalStatus | undefined;
  let cachedRouterModels: RouterModel[] = [];

  const refresh = async (ctx?: ExtensionCommandContext): Promise<OperationalStatus> => {
    const settings = await loadSettings(ctx);
    const client = clientFor(settings);
    const status = await refreshProviderModels(pi, settings, client);
    cachedStatus = status;
    cachedRouterModels = status.routerReachable ? cachedRouterModels : [];
    return status;
  };

  cachedStatus = await refresh().catch((error: unknown) => createBaselineOperationalStatus(
    parseLlamaCppSettings({}),
    error instanceof Error ? error.message : String(error),
  ));

  pi.registerCommand("llamacpp", {
    description: "llama.cpp router status and operations",
    getArgumentCompletions: (prefix: string) => ["status", "list", "reload"]
      .filter((value) => value.startsWith((prefix ?? "").trim().toLowerCase()))
      .map((value) => ({ value, label: value })),
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const action = (args || "status").trim().toLowerCase() || "status";
      if (action === "status") {
        const settings = await loadSettings(ctx);
        const status = cachedStatus?.settings.serverBaseUrl === settings.serverBaseUrl
          ? cachedStatus
          : await refresh(ctx).catch((error: unknown) => createBaselineOperationalStatus(settings, errorToMessage(error)));
        ctx.ui.notify(formatOperationalStatus(status), "info");
        return;
      }
      if (action === "list") {
        const settings = await loadSettings(ctx);
        const client = clientFor(settings);
        const result = await safeFetchRouterModels(client);
        if (result.error) {
          ctx.ui.notify(`llamacpp Router Model List\n\nRouter unreachable: ${result.error}`, "warning");
          return;
        }
        cachedRouterModels = result.models;
        ctx.ui.notify(formatRouterModelList(result.models), "info");
        return;
      }
      if (action === "reload") {
        const status = await refresh(ctx);
        ctx.ui.notify([
          "llamacpp reload complete",
          "",
          `Router Reachable: ${status.routerReachable ? "yes" : "no"}`,
          `Router Models: ${status.routerModelCount ?? cachedRouterModels.length}`,
          `Provider Models: ${status.providerModelCount}`,
          `Last Error: ${status.lastError ?? "none"}`,
        ].join("\n"), status.routerReachable ? "info" : "warning");
        return;
      }

      ctx.ui.notify("Usage: /llamacpp status | list | reload", "warning");
    },
  });
}

export class RouterClient {
  readonly settings: LlamaCppSettings;
  private readonly fetchImpl: FetchLike;

  constructor(settings: LlamaCppSettings, options: { fetch?: FetchLike } = {}) {
    this.settings = settings;
    this.fetchImpl = options.fetch ?? fetch;
  }

  async fetchModelList(): Promise<RouterModelList> {
    const response = await this.fetchImpl(`${this.settings.serverBaseUrl}/models`, {
      method: "GET",
      headers: this.headers(),
      signal: AbortSignal.timeout(this.settings.timeouts.statusMs),
    });
    if (!response.ok) {
      throw new Error(`Router /models returned HTTP ${response.status}`);
    }
    const raw = await response.json();
    return { raw, models: normalizeRouterModelList(raw) };
  }

  headers(): Record<string, string> {
    const headers: Record<string, string> = { Accept: "application/json" };
    const value = resolvedProviderApiKeyValue(this.settings.providerApiKey);
    if (value) headers.Authorization = `Bearer ${value}`;
    return headers;
  }
}

export async function refreshProviderModels(
  pi: Pick<LlamaCppPiApi, "registerProvider" | "unregisterProvider">,
  settings: LlamaCppSettings,
  routerClient = new RouterClient(settings),
): Promise<OperationalStatus> {
  if (settings.providerApiKey.kind === "unsupported" || settings.providerApiKey.kind === "missing-env") {
    return createBaselineOperationalStatus(settings, settings.providerApiKey.error);
  }

  try {
    const routerModelList = await routerClient.fetchModelList();
    const providerModels = routerModelList.models.map(toProviderModel);
    await pi.unregisterProvider?.(PROVIDER_ID);
    await pi.registerProvider?.(PROVIDER_ID, {
      baseUrl: settings.providerBaseUrl,
      apiKey: resolvedProviderApiKeyValue(settings.providerApiKey) ?? DEFAULT_PROVIDER_API_KEY,
      api: "openai-completions",
      models: providerModels,
    });
    return {
      settings,
      routerReachable: true,
      providerRegistered: true,
      providerModelCount: providerModels.length,
      routerModelCount: routerModelList.models.length,
    };
  } catch (error) {
    return createBaselineOperationalStatus(settings, errorToMessage(error));
  }
}

export function normalizeRouterModelList(raw: unknown): RouterModel[] {
  const rows = readRouterModelRows(raw);
  return rows.map((row) => {
    const id = readFirstString(row, ["id", "name", "model", "key"]);
    if (!id) return null;
    const status = readFirstString(row, ["status", "state", "load_status"]);
    const loaded = isRouterModelLoaded(row, status);
    const model: RouterModel = {
      id,
      name: readFirstString(row, ["name", "display_name", "id", "model", "key"]) ?? id,
      loaded,
      raw: row,
    };
    if (status !== undefined) model.status = status;
    const object = readFirstString(row, ["object"]);
    if (object !== undefined) model.object = object;
    return model;
  }).filter((model): model is RouterModel => model !== null);
}

export function parseLlamaCppSettings(
  raw: unknown,
  env: Record<string, string | undefined> = process.env,
): LlamaCppSettings {
  const record = isRecord(raw) ? raw : {};
  const rawTimeouts = isRecord(record.timeouts) ? record.timeouts : {};

  const serverBaseUrl = normalizeBaseUrl(readString(record, ["serverBaseUrl", "baseUrl"], DEFAULT_SERVER_BASE_URL));
  const providerApiKeyRaw = readString(record, ["providerApiKey", "apiKey"], DEFAULT_PROVIDER_API_KEY);

  return {
    serverBaseUrl,
    providerBaseUrl: deriveProviderBaseUrl(serverBaseUrl),
    serverBinaryPath: readString(record, ["serverBinaryPath", "binaryPath"], "llama-server"),
    configuredPresetFilePath: readString(
      record,
      ["configuredPresetFilePath", "modelPresetsFile", "modelPresetsFilePath", "presetFilePath"],
      "~/.config/llamacpp/model-presets.ini",
    ),
    providerApiKey: resolveProviderApiKey(providerApiKeyRaw, env),
    loadOnSelect: readBoolean(record, "loadOnSelect", false),
    stopOnQuit: readBoolean(record, "stopOnQuit", false),
    timeouts: {
      startMs: readPositiveInteger(rawTimeouts, "startMs", readPositiveInteger(record, "startTimeoutMs", DEFAULT_LLAMACPP_TIMEOUTS.startMs)),
      loadMs: readPositiveInteger(rawTimeouts, "loadMs", readPositiveInteger(record, "loadTimeoutMs", DEFAULT_LLAMACPP_TIMEOUTS.loadMs)),
      pollMs: readPositiveInteger(rawTimeouts, "pollMs", readPositiveInteger(record, "pollTimeoutMs", DEFAULT_LLAMACPP_TIMEOUTS.pollMs)),
      requestGateMs: readPositiveInteger(
        rawTimeouts,
        "requestGateMs",
        readPositiveInteger(record, "requestGateTimeoutMs", DEFAULT_LLAMACPP_TIMEOUTS.requestGateMs),
      ),
      statusMs: readPositiveInteger(rawTimeouts, "statusMs", readPositiveInteger(record, "statusTimeoutMs", DEFAULT_LLAMACPP_TIMEOUTS.statusMs)),
    },
  };
}

export function deriveProviderBaseUrl(serverBaseUrl: string): string {
  const normalized = normalizeBaseUrl(serverBaseUrl);
  return normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
}

export function resolveProviderApiKey(
  configuredValue: string,
  env: Record<string, string | undefined> = process.env,
): ProviderApiKeyResolution {
  const value = configuredValue.trim();
  if (looksLikeShellCommand(value)) {
    return {
      kind: "unsupported",
      value,
      error: "Provider API Key shell commands are unsupported; use a literal value or environment variable name.",
    };
  }

  if (value.startsWith("env:")) {
    const envName = value.slice("env:".length).trim();
    return resolveEnvProviderApiKey(envName, value, env);
  }

  if (isEnvVarName(value) && (env[value] !== undefined || isLegacyBareEnvVarName(value))) {
    return resolveEnvProviderApiKey(value, value, env);
  }

  return { kind: "literal", value };
}

export function createBaselineOperationalStatus(
  settings = parseLlamaCppSettings({}),
  lastError?: string,
): OperationalStatus {
  const apiKeyError = settings.providerApiKey.kind === "unsupported" || settings.providerApiKey.kind === "missing-env"
    ? settings.providerApiKey.error
    : undefined;
  return {
    settings,
    routerReachable: false,
    providerRegistered: false,
    providerModelCount: 0,
    routerModelCount: 0,
    lastError: apiKeyError ?? lastError ?? "Router model list retrieval has not succeeded.",
  };
}

export function formatOperationalStatus(status: OperationalStatus): string {
  const apiKeyStatus = formatProviderApiKeyStatus(status.settings.providerApiKey);
  return [
    "llamacpp Operational Status",
    "",
    `Server Base URL: ${status.settings.serverBaseUrl}`,
    `Provider Base URL: ${status.settings.providerBaseUrl}`,
    `Server Binary Path: ${status.settings.serverBinaryPath}`,
    `Configured Preset File: ${status.settings.configuredPresetFilePath}`,
    `Provider API Key: ${apiKeyStatus}`,
    `loadOnSelect: ${status.settings.loadOnSelect ? "yes" : "no"}`,
    `stopOnQuit: ${status.settings.stopOnQuit ? "yes" : "no"}`,
    `Router Reachable: ${status.routerReachable ? "yes" : "no"}`,
    `Router Models: ${status.routerModelCount ?? 0}`,
    `Provider Registered: ${status.providerRegistered ? "yes" : "no"}`,
    `Provider Models: ${status.providerModelCount}`,
    "Timeouts:",
    `  startMs: ${status.settings.timeouts.startMs}`,
    `  loadMs: ${status.settings.timeouts.loadMs}`,
    `  pollMs: ${status.settings.timeouts.pollMs}`,
    `  requestGateMs: ${status.settings.timeouts.requestGateMs}`,
    `  statusMs: ${status.settings.timeouts.statusMs}`,
    `Last Error: ${status.lastError ?? "none"}`,
  ].join("\n");
}

export function formatRouterModelList(models: RouterModel[]): string {
  const lines = [
    "llamacpp Router Model List",
    "",
    "| id | name | status | loaded |",
    "|---|---|---|---|",
  ];
  if (models.length === 0) lines.push("| (none) | - | - | no |");
  for (const model of models) {
    lines.push(`| ${model.id} | ${model.name} | ${model.status ?? "unknown"} | ${model.loaded ? "yes" : "no"} |`);
  }
  return lines.join("\n");
}

function toProviderModel(model: RouterModel): ProviderModel {
  return {
    id: model.id,
    name: model.name,
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128_000,
    maxTokens: 16_384,
  };
}

function readRouterModelRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (!isRecord(raw)) throw new Error("Router /models response is not a JSON object or array.");
  const data = raw.data;
  if (Array.isArray(data)) return data.filter(isRecord);
  const models = raw.models;
  if (Array.isArray(models)) return models.filter(isRecord);
  throw new Error("Router /models response is missing a data/models array.");
}

async function safeFetchRouterModels(client: RouterClient): Promise<{ models: RouterModel[]; error?: string }> {
  try {
    const result = await client.fetchModelList();
    return { models: result.models };
  } catch (error) {
    return { models: [], error: errorToMessage(error) };
  }
}

function resolvedProviderApiKeyValue(resolution: ProviderApiKeyResolution): string | undefined {
  if (resolution.kind === "literal" || resolution.kind === "env") return resolution.value;
  return undefined;
}

function isRouterModelLoaded(row: Record<string, unknown>, status?: string): boolean {
  const explicit = row.loaded;
  if (typeof explicit === "boolean") return explicit;
  const loadedInstances = row.loaded_instances;
  if (Array.isArray(loadedInstances)) return loadedInstances.length > 0;
  return status !== undefined && /^(loaded|running|ready|active|sleeping)$/i.test(status);
}

function readFirstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return undefined;
}

function formatProviderApiKeyStatus(resolution: ProviderApiKeyResolution): string {
  if (resolution.kind === "env") return `env:${resolution.envName}`;
  if (resolution.kind === "missing-env") return `missing env:${resolution.envName}`;
  if (resolution.kind === "unsupported") return "unsupported shell-command-style value";
  return "literal";
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim() || DEFAULT_SERVER_BASE_URL;
  return trimmed.replace(/\/+$/, "");
}

function looksLikeShellCommand(value: string): boolean {
  return /^\$\(.+\)$/.test(value) || /^`.+`$/.test(value) || /^\s*(pass|op|secret-tool|gpg|cat|echo)\s+/.test(value);
}

function isEnvVarName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function isLegacyBareEnvVarName(value: string): boolean {
  return /^[A-Z_][A-Z0-9_]*$/.test(value);
}

function resolveEnvProviderApiKey(
  envName: string,
  originalValue: string,
  env: Record<string, string | undefined>,
): ProviderApiKeyResolution {
  if (!isEnvVarName(envName)) {
    return {
      kind: "unsupported",
      value: originalValue,
      error: "Provider API Key environment variable names must match /^[A-Za-z_][A-Za-z0-9_]*$/.",
    };
  }

  const envValue = env[envName];
  if (envValue !== undefined) {
    return { kind: "env", envName, value: envValue };
  }

  return {
    kind: "missing-env",
    envName,
    value: originalValue,
    error: `Provider API Key environment variable ${envName} is not set.`,
  };
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readString(record: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return fallback;
}

function readBoolean(record: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = record[key];
  return typeof value === "boolean" ? value : fallback;
}

function readPositiveInteger(record: Record<string, unknown>, key: string, fallback: number): number {
  const value = record[key];
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function loadLlamaCppSettings(ctx?: ExtensionCommandContext): Promise<LlamaCppSettings> {
  const fileConfig = readLayeredConfig(ctx?.cwd ?? process.cwd());
  if (Object.keys(fileConfig).length > 0) return parseLlamaCppSettings(fileConfig);

  const configModule = await importConfigModule();
  if (configModule) {
    try {
      const service = await configModule.createConfigService<LlamaCppSettings>("llamacpp", {
        defaults: DEFAULT_LLAMACPP_SETTINGS,
        parse: (raw: unknown) => parseLlamaCppSettings(raw),
      });
      return service.config;
    } catch {
      // Fall through to defaults in lightweight package installs where
      // pi-extension-config is absent or unavailable.
    }
  }

  return parseLlamaCppSettings({});
}

type ConfigModule = {
  createConfigService<T>(name: string, options: { defaults: T; parse: (raw: unknown) => T | Promise<T> }): Promise<{ config: T }>;
};

async function importConfigModule(): Promise<ConfigModule | null> {
  const importDynamic = (specifier: string) => import(specifier) as Promise<ConfigModule>;
  try {
    return await importDynamic("pi-extension-config");
  } catch {
    try {
      return await importDynamic("@zenobius/pi-extension-config");
    } catch {
      return null;
    }
  }
}

function readLayeredConfig(cwd: string): Record<string, unknown> {
  return mergeRecords(
    readJsonObject(join(homedir(), ".pi", "agent", "llamacpp.config.json")),
    readJsonObject(join(findGitRoot(cwd), ".pi", "llamacpp.config.json")),
  );
}

function findGitRoot(cwd: string): string {
  let current = cwd;
  const root = parsePath(current).root;
  while (current !== root) {
    if (existsSync(join(current, ".git"))) return current;
    current = dirname(current);
  }
  return cwd;
}

function readJsonObject(path: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function mergeRecords(...records: Record<string, unknown>[]): Record<string, unknown> {
  return Object.assign({}, ...records);
}
