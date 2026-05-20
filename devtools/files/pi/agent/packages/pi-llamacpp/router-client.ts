import type { FetchLike, LlamaCppSettings, RouterModelList } from "./types.js";
import { normalizeRouterModelList } from "./model-presentation.js";

function resolvedProviderApiKeyValue(resolution: LlamaCppSettings["providerApiKey"]): string | undefined {
  if (resolution.kind === "literal" || resolution.kind === "env") return resolution.value;
  return undefined;
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeFetchTransportError(label: string, error: unknown): Error {
  const message = errorToMessage(error);
  const name = error instanceof Error ? error.name : "";
  if (name === "TimeoutError") return new Error(`${label} timed out: ${message}`);
  if (name === "AbortError") return new Error(`${label} aborted: ${message}`);
  return new Error(message);
}

function composeFetchAbortSignal(callerSignal: AbortSignal | undefined, timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  const safeTimeoutMs = Math.max(1, timeoutMs);
  const timeoutSignal = AbortSignal.timeout(safeTimeoutMs);
  if (!callerSignal) return { signal: timeoutSignal, cleanup: () => {} };
  if (callerSignal.aborted) return { signal: callerSignal, cleanup: () => {} };
  if (typeof AbortSignal.any === "function") return { signal: AbortSignal.any([callerSignal, timeoutSignal]), cleanup: () => {} };

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(callerSignal.reason ?? new DOMException("The operation was aborted", "AbortError"));
  const timeoutId = setTimeout(() => controller.abort(new DOMException(`The operation timed out after ${safeTimeoutMs}ms`, "TimeoutError")), safeTimeoutMs);
  callerSignal.addEventListener("abort", abortFromCaller, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      callerSignal.removeEventListener("abort", abortFromCaller);
    },
  };
}

function sanitizeDiagnosticMessage(message: string, ...secretValues: Array<string | undefined>): string {
  let sanitized = message
    .replace(/\b(?:authorization|bearer|api[_-]?key|token|password|secret)=\S+/giu, "[redacted]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gu, "Bearer [redacted]")
    .replace(/\b(sk-[A-Za-z0-9._~+/=-]+)/gu, "[redacted]");
  for (const secret of secretValues) {
    if (secret && secret.length >= 4) sanitized = sanitized.split(secret).join("[redacted]");
  }
  return sanitized;
}

function diagnosticSecretValues(settings: LlamaCppSettings): string[] {
  if (settings.providerApiKey.kind !== "literal" && settings.providerApiKey.kind !== "env") return [];
  const value = settings.providerApiKey.value;
  return value ? [value] : [];
}

function normalizeHttpErrorBody(body: string): string {
  try {
    const parsed = JSON.parse(body) as unknown;
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      return readFirstString(record, ["error", "message", "detail"]) ?? body;
    }
  } catch {}
  return body;
}

function readFirstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return undefined;
}

export class RouterClient {
  readonly settings: LlamaCppSettings;
  private readonly fetchImpl: FetchLike;

  constructor(settings: LlamaCppSettings, options: { fetch?: FetchLike } = {}) {
    this.settings = settings;
    this.fetchImpl = options.fetch ?? fetch;
  }

  async fetchModelList(timeoutMs = this.settings.timeouts.statusMs, signal?: AbortSignal): Promise<RouterModelList> {
    let response: Response;
    const fetchSignal = composeFetchAbortSignal(signal, timeoutMs);
    try {
      response = await this.fetchImpl(`${this.settings.serverBaseUrl}/models`, {
        method: "GET",
        headers: this.headers(),
        signal: fetchSignal.signal,
      });
    } catch (error) {
      throw normalizeFetchTransportError("Router /models", error);
    } finally {
      fetchSignal.cleanup();
    }
    if (!response.ok) {
      const detail = sanitizeDiagnosticMessage(normalizeHttpErrorBody(await response.text().catch(() => "")), ...diagnosticSecretValues(this.settings));
      const suffix = detail ? `: ${detail}` : "";
      if (response.status === 401 || response.status === 403) {
        throw new Error(`llamacpp router auth failed during model list: HTTP ${response.status}${suffix}`);
      }
      throw new Error(`Router /models returned HTTP ${response.status}${suffix}`);
    }
    let raw: unknown;
    let responseText = "";
    try {
      responseText = await response.clone().text();
      if (responseText.trim() === "") throw new Error("empty response body");
      raw = JSON.parse(responseText);
    } catch (error) {
      const detail = error instanceof Error && error.message === "empty response body" ? error.message : responseText;
      throw new Error(`Router /models malformed response: ${sanitizeDiagnosticMessage(detail, ...diagnosticSecretValues(this.settings))}`);
    }
    try {
      return { raw, models: normalizeRouterModelList(raw) };
    } catch (error) {
      throw new Error(`Router /models malformed response: ${errorToMessage(error)}`);
    }
  }

  async loadModel(modelId: string, timeoutMs = this.settings.timeouts.loadMs, signal?: AbortSignal): Promise<void> {
    let response: Response;
    const fetchSignal = composeFetchAbortSignal(signal, timeoutMs);
    try {
      response = await this.fetchImpl(`${this.settings.serverBaseUrl}/models/load`, {
        method: "POST",
        headers: { ...this.headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelId }),
        signal: fetchSignal.signal,
      });
    } catch (error) {
      throw normalizeFetchTransportError(`Router /models/load for model ${modelId}`, error);
    } finally {
      fetchSignal.cleanup();
    }
    if (!response.ok) {
      const detail = sanitizeDiagnosticMessage(await response.text().catch(() => ""), ...diagnosticSecretValues(this.settings));
      const suffix = detail ? `: ${detail}` : "";
      if (response.status === 401 || response.status === 403) {
        throw new Error(`llamacpp router auth failed during model load: HTTP ${response.status}${suffix}`);
      }
      throw new Error(`llamacpp load request failed for model ${modelId}: HTTP ${response.status}${suffix}`);
    }
  }

  headers(): Record<string, string> {
    const headers: Record<string, string> = { Accept: "application/json" };
    const value = resolvedProviderApiKeyValue(this.settings.providerApiKey);
    if (value) headers.Authorization = `Bearer ${value}`;
    return headers;
  }
}
