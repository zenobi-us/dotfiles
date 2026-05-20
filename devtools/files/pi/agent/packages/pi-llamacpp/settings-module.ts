import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type {
  ConfigModule,
  LlamaCppSettings,
  LlamaCppTimeouts,
  OperationalStatus,
  ProviderApiKeyResolution,
} from "./types.js";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, parse as parsePath } from "node:path";
import { PresetFileReader, toPresetFileStatus } from "./preset-file-reader.js";

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
  managedStart: false,
  timeouts: DEFAULT_LLAMACPP_TIMEOUTS,
};

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
    managedStart: readBoolean(record, "managedStart", false),
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
    presetFile: toPresetFileStatus(PresetFileReader.read(settings.configuredPresetFilePath)),
    routerOwnership: "none",
    lastError: apiKeyError ?? lastError ?? "Router model list retrieval has not succeeded.",
  };
}

export function normalizeConfiguredPresetFilePath(
  path: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const home = env.HOME || homedir();
  if (path === "~") return home;
  if (path.startsWith("~/")) return join(home, path.slice(2));
  return path;
}

export async function loadLlamaCppSettings(ctx?: ExtensionCommandContext): Promise<LlamaCppSettings> {
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
      // Fall through to defaults in lightweight package installs where unavailable.
    }
  }

  return parseLlamaCppSettings({});
}

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

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim() || DEFAULT_SERVER_BASE_URL;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(`unsupported protocol ${url.protocol}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid Server Base URL: ${trimmed} (${detail})`);
  }
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
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
