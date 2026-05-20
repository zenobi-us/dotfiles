import type {
  LlamaCppSettings,
  OperationalStatus,
  PresetFileStatus,
  ProviderApiKeyResolution,
  RouterModel,
} from "./types.js";
import { diagnosticSecretValues, sanitizeDiagnosticMessage } from "./diagnostics-module.js";

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

export function formatOperationalStatus(status: OperationalStatus): string {
  const apiKeyStatus = formatProviderApiKeyStatus(status.settings.providerApiKey);
  const lines = [
    "llamacpp Operational Status",
    "",
    `Server Base URL: ${status.settings.serverBaseUrl}`,
    `Provider Base URL: ${status.settings.providerBaseUrl}`,
    `Server Binary Path: ${status.settings.serverBinaryPath}`,
    `Configured Preset File: ${status.settings.configuredPresetFilePath}`,
    `Preset File: ${formatPresetFileStatus(status.presetFile)}`,
    `Provider API Key: ${apiKeyStatus}`,
    `loadOnSelect: ${status.settings.loadOnSelect ? "yes" : "no"}`,
    `stopOnQuit: ${status.settings.stopOnQuit ? "yes" : "no"}`,
    `managedStart: ${status.settings.managedStart ? "yes" : "no"}`,
    `Router Reachable: ${status.routerReachable ? "yes" : "no"}`,
    `Router Ownership: ${status.routerOwnership}`,
    `Router Models: ${status.routerModelCount ?? 0}`,
    `Provider Registered: ${status.providerRegistered ? "yes" : "no"}`,
    `Provider Models: ${status.providerModelCount}`,
    "Model Status Counts:",
    ...formatModelStatusCounts(status.modelStatusCounts),
    "Timeouts:",
    `  startMs: ${status.settings.timeouts.startMs}`,
    `  loadMs: ${status.settings.timeouts.loadMs}`,
    `  pollMs: ${status.settings.timeouts.pollMs}`,
    `  requestGateMs: ${status.settings.timeouts.requestGateMs}`,
    `  statusMs: ${status.settings.timeouts.statusMs}`,
  ];
  if (status.managedProcess) {
    const secrets = diagnosticSecretValues(status.settings);
    const stdoutTail = status.managedLogTail?.stdout.length
      ? status.managedLogTail.stdout.map((line) => sanitizeDiagnosticMessage(line, ...secrets)).join(" | ")
      : "(empty)";
    const stderrTail = status.managedLogTail?.stderr.length
      ? status.managedLogTail.stderr.map((line) => sanitizeDiagnosticMessage(line, ...secrets)).join(" | ")
      : "(empty)";
    lines.push(
      `Managed Process State: ${status.managedProcess.state}`,
      `Managed Process PID: ${status.managedProcess.pid ?? "n/a"}`,
      `Managed stdout tail: ${stdoutTail}`,
      `Managed stderr tail: ${stderrTail}`,
    );
  }
  lines.push(`Last Error: ${status.lastError ? sanitizeDiagnosticMessage(status.lastError, ...diagnosticSecretValues(status.settings)) : "none"}`);
  return lines.join("\n");
}

export function formatRouterModelList(models: RouterModel[], settings?: LlamaCppSettings): string {
  const lines = [
    "llamacpp Router Model List",
    "",
    "| id | name | availability | runtime status | loaded |",
    "|---|---|---|---|---|",
  ];
  if (models.length === 0) lines.push("| (none) | - | - | - | no |");
  const secrets = diagnosticSecretValues(settings);
  for (const model of models) {
    const sanitize = (value: string) => sanitizeDiagnosticMessage(value, ...secrets);
    lines.push(`| ${sanitize(model.id)} | ${sanitize(model.name)} | ${sanitize(formatRouterModelAvailability(model))} | ${sanitize(model.status ?? "unknown")} | ${model.loaded ? "yes" : "no"} |`);
  }
  return lines.join("\n");
}

export function formatRouterModelListCommandResult(models: RouterModel[], settings?: LlamaCppSettings): string {
  return `llamacpp list complete\n\nRouter Models: ${models.length}\n\n${formatRouterModelList(models, settings)}`;
}

export function withModelStatusCounts(status: OperationalStatus): OperationalStatus {
  return {
    ...status,
    modelStatusCounts: countRouterModelStatuses(status.routerModels ?? []),
  };
}

export function readFirstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return undefined;
}

function formatPresetFileStatus(status?: PresetFileStatus): string {
  if (!status) return "unknown";
  const state = status.exists ? `present (${status.presetCount} presets)` : "missing";
  const warnings = status.warnings.length > 0 ? `; warnings=${status.warnings.length}` : "";
  const error = status.error ? `; ${status.error}` : "";
  return `${state}${warnings}${error}`;
}

function countRouterModelStatuses(models: RouterModel[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const model of models) {
    const key = model.status ?? (model.loaded ? "loaded" : "unknown");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function formatModelStatusCounts(counts?: Record<string, number>): string[] {
  const preferredOrder = ["loaded", "failed", "not-loaded", "sleeping", "loading", "unknown"];
  const entries = Object.entries(counts ?? {}).sort(([left], [right]) => {
    const leftIndex = preferredOrder.indexOf(left);
    const rightIndex = preferredOrder.indexOf(right);
    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
    }
    return left.localeCompare(right);
  });
  if (entries.length === 0) return ["  (none)"];
  return entries.map(([state, count]) => `  ${state}: ${count}`);
}

function formatRouterModelAvailability(model: RouterModel): string {
  const availability = readFirstString(model.raw, ["availability", "available", "state"]);
  if (availability !== undefined) return availability;
  if (typeof model.raw.available === "boolean") return model.raw.available ? "available" : "unavailable";
  return "unknown";
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

function isRouterModelLoaded(row: Record<string, unknown>, status?: string): boolean {
  const explicit = row.loaded;
  if (typeof explicit === "boolean") return explicit;
  const loadedInstances = row.loaded_instances;
  if (Array.isArray(loadedInstances)) return loadedInstances.length > 0;
  return status !== undefined && /^(loaded|running|ready|active|sleeping)$/i.test(status);
}

function formatProviderApiKeyStatus(resolution: ProviderApiKeyResolution): string {
  if (resolution.kind === "env") return `env:${resolution.envName}`;
  if (resolution.kind === "missing-env") return `missing env:${resolution.envName}`;
  if (resolution.kind === "unsupported") return "unsupported shell-command-style value";
  return "literal";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
