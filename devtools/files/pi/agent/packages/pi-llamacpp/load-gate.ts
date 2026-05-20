import type { LlamaCppSettings, RouterModel, RouterModelList } from "./types.js";
import { RouterClient } from "./router-client.js";

function isRequestReadyRouterModel(model: RouterModel): boolean {
  if (isFailedRouterModel(model)) return false;
  return model.loaded || /^(loaded|running|ready|active|sleeping)$/i.test(model.status ?? "");
}

function isFailedRouterModel(model: RouterModel): boolean {
  return /^(failed|error|unavailable)$/i.test(model.status ?? "") || typeof model.raw.error === "string";
}

function loadFailedError(modelId: string, model: RouterModel): Error {
  const detail = readFirstString(model.raw, ["error", "message", "detail"]) ?? model.status ?? "router reported failed model state";
  return new Error(`llamacpp load failed for model ${modelId}: ${detail}`);
}

function loadGateTimeoutError(modelId: string, timeoutMs: number): Error {
  return new Error(`llamacpp load gate timed out for model ${modelId} after ${timeoutMs}ms.`);
}

function normalizeLoadGateListError(error: unknown): Error {
  const message = errorToMessage(error);
  if (/HTTP (401|403)/.test(message)) return new Error(`llamacpp router auth failed during model list: ${message.replace(/^Router \/models returned /, "")}`);
  if (/timed out/i.test(message)) return new Error(`llamacpp router model list timed out: ${message}`);
  if (/aborted/i.test(message)) return new Error(`llamacpp router model list aborted: ${message}`);
  return new Error(`llamacpp router unreachable: ${message}`);
}

function normalizeLoadGateLoadError(modelId: string, error: unknown): Error {
  const message = errorToMessage(error);
  if (/auth failed/.test(message)) return new Error(message);
  if (/load request failed/.test(message)) return new Error(message);
  if (/timed out/i.test(message)) return new Error(`llamacpp load request timed out for model ${modelId}: ${message}`);
  if (/aborted/i.test(message)) return new Error(`llamacpp load request aborted for model ${modelId}: ${message}`);
  return new Error(`llamacpp router unreachable during model load for model ${modelId}: ${message}`);
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readFirstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return undefined;
}

export class LoadGate {
  private readonly settings: LlamaCppSettings;
  private readonly routerClient: RouterClient;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private readonly signal?: AbortSignal;

  constructor(
    settings: LlamaCppSettings,
    routerClient = new RouterClient(settings),
    options: { sleep?: (ms: number) => Promise<void>; now?: () => number; signal?: AbortSignal } = {},
  ) {
    this.settings = settings;
    this.routerClient = routerClient;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.now = options.now ?? (() => Date.now());
    this.signal = options.signal;
  }

  async ensureRequestReady(modelId: string): Promise<void> {
    const timeoutMs = Math.min(this.settings.timeouts.loadMs, this.settings.timeouts.requestGateMs);
    const deadline = this.now() + timeoutMs;
    let model = await this.fetchModelForGate(modelId, deadline);
    this.assertWithinGate(modelId, deadline, timeoutMs);
    if (isFailedRouterModel(model)) throw loadFailedError(modelId, model);
    if (isRequestReadyRouterModel(model)) return;

    await this.loadModelForGate(modelId, deadline);
    this.assertWithinGate(modelId, deadline, timeoutMs);

    do {
      model = await this.fetchModelForGate(modelId, deadline);
      this.assertWithinGate(modelId, deadline, timeoutMs);
      if (isFailedRouterModel(model)) throw loadFailedError(modelId, model);
      if (isRequestReadyRouterModel(model)) return;
      const remaining = deadline - this.now();
      if (remaining <= 0) break;
      await this.sleep(Math.min(this.settings.timeouts.pollMs, remaining));
    } while (this.now() < deadline);

    throw loadGateTimeoutError(modelId, timeoutMs);
  }

  private async fetchModelForGate(modelId: string, deadline: number): Promise<RouterModel> {
    let list: RouterModelList;
    try {
      list = await this.routerClient.fetchModelList(this.operationTimeout(this.settings.timeouts.statusMs, deadline), this.signal);
    } catch (error) {
      throw normalizeLoadGateListError(error);
    }
    const model = list.models.find((candidate) => candidate.id === modelId);
    if (!model) throw new Error(`llamacpp unknown model id ${modelId}: model is not present in Router Model List.`);
    return model;
  }

  private async loadModelForGate(modelId: string, deadline: number): Promise<void> {
    try {
      await this.routerClient.loadModel(modelId, this.operationTimeout(this.settings.timeouts.loadMs, deadline), this.signal);
    } catch (error) {
      throw normalizeLoadGateLoadError(modelId, error);
    }
  }

  private operationTimeout(configuredMs: number, deadline: number): number {
    return Math.max(1, Math.min(configuredMs, deadline - this.now()));
  }

  private assertWithinGate(modelId: string, deadline: number, timeoutMs: number): void {
    if (this.now() > deadline) throw loadGateTimeoutError(modelId, timeoutMs);
  }
}
