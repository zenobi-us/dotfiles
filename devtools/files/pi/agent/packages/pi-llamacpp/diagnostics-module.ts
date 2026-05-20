import type { LlamaCppSettings } from "./types.js";

const DEFAULT_PROVIDER_API_KEY = "llamacpp";

export function sanitizeDiagnosticMessage(message: string, ...secretValues: Array<string | undefined>): string {
  let sanitized = message
    .replace(/\b(?:authorization|bearer|api[_-]?key|token|password|secret)=\S+/giu, "[redacted]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gu, "Bearer [redacted]")
    .replace(/\b(sk-[A-Za-z0-9._~+/=-]+)/gu, "[redacted]");
  for (const secret of secretValues) {
    if (secret && secret.length >= 4) sanitized = sanitized.split(secret).join("[redacted]");
  }
  return sanitized;
}

export function diagnosticSecretValues(settings?: LlamaCppSettings): string[] {
  if (!settings || (settings.providerApiKey.kind !== "literal" && settings.providerApiKey.kind !== "env")) return [];
  const value = settings.providerApiKey.value;
  if (!value || value === DEFAULT_PROVIDER_API_KEY) return [];
  return [value];
}

export function errorToMessage(error: unknown, settings?: LlamaCppSettings): string {
  return sanitizeDiagnosticMessage(error instanceof Error ? error.message : String(error), ...diagnosticSecretValues(settings));
}

export function normalizeLoadGateListError(error: unknown): Error {
  const message = sanitizeDiagnosticMessage(errorToMessage(error));
  if (/HTTP (401|403)/.test(message)) return new Error(`llamacpp router auth failed during model list: ${message.replace(/^Router \/models returned /, "")}`);
  if (/timed out/i.test(message)) return new Error(`llamacpp router model list timed out: ${message}`);
  if (/aborted/i.test(message)) return new Error(`llamacpp router model list aborted: ${message}`);
  return new Error(`llamacpp router unreachable: ${message}`);
}

export function normalizeLoadGateLoadError(modelId: string, error: unknown): Error {
  const message = sanitizeDiagnosticMessage(errorToMessage(error));
  if (/auth failed/.test(message)) return new Error(message);
  if (/load request failed/.test(message)) return new Error(message);
  if (/timed out/i.test(message)) return new Error(`llamacpp load request timed out for model ${modelId}: ${message}`);
  if (/aborted/i.test(message)) return new Error(`llamacpp load request aborted for model ${modelId}: ${message}`);
  return new Error(`llamacpp router unreachable during model load for model ${modelId}: ${message}`);
}

export function normalizeFetchTransportError(label: string, error: unknown, settings?: LlamaCppSettings): Error {
  const message = errorToMessage(error, settings);
  const name = error instanceof Error ? error.name : "";
  if (name === "TimeoutError") return new Error(`${label} timed out: ${message}`);
  if (name === "AbortError") return new Error(`${label} aborted: ${message}`);
  return new Error(message);
}
