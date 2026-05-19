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

export type OperationalStatus = {
  settings: LlamaCppSettings;
  routerReachable: boolean;
  providerRegistered: boolean;
  providerModelCount: number;
  lastError?: string;
};


type LlamaCppProviderOptions = {
  loadSettings?: (ctx?: ExtensionCommandContext) => Promise<LlamaCppSettings> | LlamaCppSettings;
};

const DEFAULT_SERVER_BASE_URL = "http://localhost:8080";
const DEFAULT_PROVIDER_API_KEY = "llamacpp";

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
  pi: Pick<ExtensionAPI, "registerCommand">,
  options: LlamaCppProviderOptions = {},
): Promise<void> {
  const loadSettings = options.loadSettings ?? loadLlamaCppSettings;

  pi.registerCommand("llamacpp", {
    description: "llama.cpp router status and operations",
    getArgumentCompletions: (prefix: string) => ["status"]
      .filter((value) => value.startsWith((prefix ?? "").trim().toLowerCase()))
      .map((value) => ({ value, label: value })),
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const action = (args || "status").trim().toLowerCase() || "status";
      if (action !== "status") {
        ctx.ui.notify("Usage: /llamacpp status", "warning");
        return;
      }

      const settings = await loadSettings(ctx);
      ctx.ui.notify(formatOperationalStatus(createBaselineOperationalStatus(settings)), "info");
    },
  });
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

export function createBaselineOperationalStatus(settings = parseLlamaCppSettings({})): OperationalStatus {
  const apiKeyError = settings.providerApiKey.kind === "unsupported" || settings.providerApiKey.kind === "missing-env"
    ? settings.providerApiKey.error
    : undefined;
  return {
    settings,
    routerReachable: false,
    providerRegistered: false,
    providerModelCount: 0,
    lastError: apiKeyError ?? "Router discovery not implemented in this baseline slice.",
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
  return Number.isInteger(value) && value > 0 ? value : fallback;
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
  try {
    return await import("pi-extension-config") as ConfigModule;
  } catch {
    try {
      return await import("@zenobius/pi-extension-config") as ConfigModule;
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
