import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import type {
  Api,
  AssistantMessageEventStream,
  Context,
  Model,
  SimpleStreamOptions,
  } from "@mariozechner/pi-ai";
import { streamSimpleOpenAICompletions } from "@mariozechner/pi-ai/openai-completions";
import { spawn as spawnChildProcess } from "node:child_process";
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
  managedStart: boolean;
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

export type PresetMetadata = {
  contextWindow?: number;
  maxTokens?: number;
  reasoning?: boolean;
  reasoningMode?: "on" | "off" | "auto";
  reasoningFormat?: string;
};

export type ModelPreset = {
  id: string;
  runtimeArgs: Record<string, string>;
  metadata: PresetMetadata;
};

export type PresetFileReadResult = {
  path: string;
  exists: boolean;
  presets: ModelPreset[];
  warnings: string[];
  error?: string;
};

export type PresetFileStatus = {
  path: string;
  exists: boolean;
  presetCount: number;
  warnings: string[];
  error?: string;
};

export type ManagedServerStartPreparation = {
  canStart: boolean;
  presetFile: PresetFileStatus;
  error?: string;
};

export type OperationalStatus = {
  settings: LlamaCppSettings;
  routerReachable: boolean;
  providerRegistered: boolean;
  providerModelCount: number;
  routerModelCount?: number;
  routerModels?: RouterModel[];
  modelStatusCounts?: Record<string, number>;
  lastError?: string;
  presetFile?: PresetFileStatus;
  routerOwnership: RouterOwnership;
  managedProcess?: ManagedProcessStatus;
  managedLogTail?: { stdout: string[]; stderr: string[] };
};

export type RouterOwnership = "none" | "external" | "managed";

export type ManagedProcessStatus = {
  state: "not-started" | "starting" | "running" | "timed-out" | "exited";
  pid?: number;
  exitCode?: number | null;
  signal?: string | null;
  stdoutTail: string[];
  stderrTail: string[];
};

export type ManagedRouterStatus = {
  ownership: RouterOwnership;
  process?: ManagedProcessStatus;
  lastError?: string;
};

export type ManagedRouterStartResult = ManagedRouterStatus & {
  message: string;
};

type ManagedProcessLike = {
  pid?: number;
  stdout?: { on: (event: "data", handler: (chunk: unknown) => void) => void; unref?: () => void };
  stderr?: { on: (event: "data", handler: (chunk: unknown) => void) => void; unref?: () => void };
  on: (
    event: "exit" | "error",
    handler: ((code: number | null, signal: string | null) => void) | ((error: Error) => void),
  ) => unknown;
  kill: (signal?: NodeJS.Signals | number) => boolean;
  unref?: () => void;
};

type ProcessSpawner = (command: string, args: string[]) => ManagedProcessLike;

type RouterProbe = () => Promise<unknown>;

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
  on?: (event: string, handler: (event?: unknown, ctx?: unknown) => void | Promise<void>) => void;
};

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
type FetchSignalLease = { signal: AbortSignal; cleanup: () => void };
type StreamSimpleDelegate = (
  model: Model<"openai-completions">,
  context: Context,
  options?: SimpleStreamOptions,
) => AssistantMessageEventStream;

type LlamaCppStreamSimpleOptions = SimpleStreamOptions & {
  delegate?: StreamSimpleDelegate;
};


type LlamaCppProviderOptions = {
  loadSettings?: (ctx?: ExtensionCommandContext) => Promise<LlamaCppSettings> | LlamaCppSettings;
  fetch?: FetchLike;
  managedRouter?: ManagedRouterProcess;
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
  managedStart: false,
  timeouts: DEFAULT_LLAMACPP_TIMEOUTS,
};

export class ManagedRouterProcess {
  private ownership: RouterOwnership = "none";
  private processState: ManagedProcessStatus = {
    state: "not-started",
    stdoutTail: [],
    stderrTail: [],
  };
  private process?: ManagedProcessLike;
  private lastError?: string;
  private readonly spawnProcess: ProcessSpawner;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly maxLogLines: number;
  private readonly maxLogLineChars: number;
  private readonly maxLogChunkChars: number;

  constructor(options: {
    spawn?: ProcessSpawner;
    sleep?: (ms: number) => Promise<void>;
    maxLogLines?: number;
    maxLogLineChars?: number;
    maxLogChunkChars?: number;
  } = {}) {
    this.spawnProcess = options.spawn ?? ((command, args) => spawnChildProcess(command, args));
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.maxLogLines = options.maxLogLines ?? 50;
    this.maxLogLineChars = options.maxLogLineChars ?? 4096;
    this.maxLogChunkChars = options.maxLogChunkChars ?? 64 * 1024;
  }

  async start(settings: LlamaCppSettings, probe: RouterProbe): Promise<ManagedRouterStartResult> {
    this.lastError = undefined;
    if (this.ownership === "managed" && this.process && this.processState.state !== "exited") {
      return { ...this.status(), message: "Managed Llama Server Router is already package-owned." };
    }
    if (await this.isReachable(probe)) {
      this.ownership = "external";
      this.process = undefined;
      this.processState = { state: "not-started", stdoutTail: [], stderrTail: [] };
      return { ...this.status(), message: "Adopted compatible External Router." };
    }

    if (!settings.managedStart) {
      this.lastError = "Managed start is disabled.";
      return { ...this.status(), message: this.lastError };
    }

    const presetState = await validateManagedServerStartPreparation(settings);
    if (!presetState.canStart) {
      this.lastError = presetState.error ?? "Configured Preset File blocks managed start.";
      return { ...this.status(), message: this.lastError };
    }

    let spawnFailed = false;
    let spawnErrorMessage: string | undefined;
    const args = buildManagedRouterArgs(settings);
    this.ownership = "managed";
    this.processState = { state: "starting", stdoutTail: [], stderrTail: [] };
    try {
      this.process = this.spawnProcess(settings.serverBinaryPath, args);
      this.processState.pid = this.process.pid;
      this.attachLogs(this.process);
      this.process.on("error", (error: Error) => {
        spawnFailed = true;
        spawnErrorMessage = error instanceof Error ? error.message : String(error);
        this.lastError = spawnErrorMessage;
        this.ownership = "none";
        this.processState = { ...this.processState, state: "exited", exitCode: null, signal: null };
      });
      this.process.on("exit", (code: number | null, signal: string | null) => {
        this.processState = { ...this.processState, state: "exited", exitCode: code, signal };
        if (this.ownership === "managed") this.ownership = "none";
      });
      if (!settings.stopOnQuit) this.unrefPersistentProcess(this.process);
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.ownership = "none";
      this.processState.state = "exited";
      return { ...this.status(), message: this.lastError };
    }

    const deadline = Date.now() + settings.timeouts.startMs;
    do {
      if (await this.isReachable(probe)) {
        this.lastError = undefined;
        this.processState.state = "running";
        return { ...this.status(), message: "Managed Llama Server Router started." };
      }
      if (spawnFailed) {
        this.lastError = spawnErrorMessage ?? this.lastError ?? "Managed Llama Server Router spawn failed.";
        return { ...this.status(), message: this.lastError };
      }
      await this.sleep(Math.min(settings.timeouts.pollMs, Math.max(0, deadline - Date.now())));
      if (spawnFailed) {
        this.lastError = spawnErrorMessage ?? this.lastError ?? "Managed Llama Server Router spawn failed.";
        return { ...this.status(), message: this.lastError };
      }
    } while (Date.now() < deadline);

    this.lastError = `Timed out waiting ${settings.timeouts.startMs}ms for managed Llama Server Router.`;
    this.processState.state = "timed-out";
    return { ...this.status(), message: this.lastError };
  }

  async stop(timeoutMs = DEFAULT_LLAMACPP_TIMEOUTS.statusMs): Promise<ManagedRouterStartResult> {
    if (this.ownership !== "managed" || !this.process) {
      this.lastError = "No package-owned managed router process to stop.";
      return { ...this.status(), message: this.lastError };
    }
    const accepted = this.process.kill("SIGTERM");
    if (!accepted) {
      this.lastError = "Failed to stop package-owned managed router process: SIGTERM was not accepted.";
      return { ...this.status(), message: this.lastError };
    }

    const deadline = Date.now() + timeoutMs;
    while (this.ownership === "managed" && this.processState.state !== "exited" && Date.now() < deadline) {
      await this.sleep(Math.min(25, Math.max(0, deadline - Date.now())));
    }

    if (this.ownership === "managed" && this.processState.state !== "exited") {
      this.lastError = `Failed to stop package-owned managed router process within ${timeoutMs}ms.`;
      return { ...this.status(), message: this.lastError };
    }

    this.lastError = undefined;
    return { ...this.status(), message: "Stopped package-owned managed router process." };
  }

  async stopOnQuit(settings: LlamaCppSettings): Promise<void> {
    if (settings.stopOnQuit) await this.stop();
  }

  status(): ManagedRouterStatus {
    return {
      ownership: this.ownership,
      process: { ...this.processState, stdoutTail: [...this.processState.stdoutTail], stderrTail: [...this.processState.stderrTail] },
      lastError: this.lastError,
    };
  }

  private async isReachable(probe: RouterProbe): Promise<boolean> {
    try {
      await probe();
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      return false;
    }
  }

  private attachLogs(process: ManagedProcessLike): void {
    process.stdout?.on("data", (chunk) => this.appendLog("stdoutTail", chunk));
    process.stderr?.on("data", (chunk) => this.appendLog("stderrTail", chunk));
  }

  private unrefPersistentProcess(process: ManagedProcessLike): void {
    process.stdout?.unref?.();
    process.stderr?.unref?.();
    process.unref?.();
  }

  private appendLog(target: "stdoutTail" | "stderrTail", chunk: unknown): void {
    const text = this.truncateLogChunk(chunk);
    const lines = text
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.length > this.maxLogLineChars ? `${line.slice(0, this.maxLogLineChars)}…` : line);
    this.processState[target].push(...lines);
    if (this.processState[target].length > this.maxLogLines) {
      this.processState[target] = this.processState[target].slice(-this.maxLogLines);
    }
  }


  private truncateLogChunk(chunk: unknown): string {
    if (Buffer.isBuffer(chunk)) return chunk.subarray(0, this.maxLogChunkChars).toString();
    if (typeof chunk === "string") return chunk.slice(0, this.maxLogChunkChars);
    if (chunk instanceof Uint8Array) {
      return Buffer.from(chunk.buffer, chunk.byteOffset, Math.min(chunk.byteLength, this.maxLogChunkChars)).toString();
    }
    return String(chunk).slice(0, this.maxLogChunkChars);
  }
}

function buildManagedRouterArgs(settings: LlamaCppSettings): string[] {
  const url = new URL(settings.serverBaseUrl);
  return [
    "--host", url.hostname,
    "--port", url.port || (url.protocol === "https:" ? "443" : "80"),
    "--model-presets", normalizeConfiguredPresetFilePath(settings.configuredPresetFilePath),
  ];
}

export default async function llamacppProvider(
  pi: LlamaCppPiApi,
  options: LlamaCppProviderOptions = {},
): Promise<void> {
  const loadSettings = options.loadSettings ?? loadLlamaCppSettings;
  const clientFor = (settings: LlamaCppSettings) => new RouterClient(settings, { fetch: options.fetch });
  let cachedStatus: OperationalStatus | undefined;
  let cachedRouterModels: RouterModel[] = [];
  const managedRouter = options.managedRouter ?? new ManagedRouterProcess();
  const withLifecycle = (status: OperationalStatus): OperationalStatus => addManagedRouterStatus(status, managedRouter.status());

  const refresh = async (ctx?: ExtensionCommandContext): Promise<OperationalStatus> => {
    const settings = await loadSettings(ctx);
    const client = clientFor(settings);
    const status = withLifecycle(await refreshProviderModels(pi, settings, client));
    cachedStatus = status;
    cachedRouterModels = status.routerReachable ? (status.routerModels ?? cachedRouterModels) : [];
    return status;
  };

  cachedStatus = await refresh().catch((error: unknown) => createBaselineOperationalStatus(
    parseLlamaCppSettings({}),
    error instanceof Error ? error.message : String(error),
  ));

  pi.on?.("session_shutdown", async (event) => {
    if (isRecord(event) && event.reason !== "quit") return;
    await managedRouter.stopOnQuit(await loadSettings());
  });


  // Do not gate in before_provider_request: Pi logs/swallow hook errors and continues requests.

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
          const status = await refresh(ctx).catch((error: unknown) => createBaselineOperationalStatus(settings, errorToMessage(error)));
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
          ctx.ui.notify(formatRouterModelListCommandResult(result.models), "info");
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
            `Last Error: ${status.lastError ? sanitizeDiagnosticMessage(status.lastError) : "none"}`,
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
          const refreshed = await refresh(ctx).catch((error: unknown) => createBaselineOperationalStatus(settings, errorToMessage(error)));
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
          const refreshed = await refresh(ctx).catch((error: unknown) => createBaselineOperationalStatus(settings, errorToMessage(error)));
          const status = refreshed.lastError ? { ...withLifecycle(refreshed), lastError: refreshed.lastError } : withLifecycle(refreshed);
          ctx.ui.notify(["llamacpp stop", "", result.message, "", formatOperationalStatus(status)].join("\n"), result.lastError || status.lastError ? "warning" : "info");
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
      const detail = sanitizeDiagnosticMessage(normalizeHttpErrorBody(await response.text().catch(() => "")));
      const suffix = detail ? `: ${detail}` : "";
      if (response.status === 401 || response.status === 403) {
        throw new Error(`llamacpp router auth failed during model list: HTTP ${response.status}${suffix}`);
      }
      throw new Error(`Router /models returned HTTP ${response.status}${suffix}`);
    }
    const raw = await response.json();
    return { raw, models: normalizeRouterModelList(raw) };
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
      const detail = sanitizeDiagnosticMessage(await response.text().catch(() => ""));
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


export class PresetFileReader {
  static read(path: string): PresetFileReadResult {
    const resolvedPath = normalizeConfiguredPresetFilePath(path);
    if (!existsSync(resolvedPath)) {
      return {
        path,
        exists: false,
        presets: [],
        warnings: [],
        error: `Configured Preset File not found: ${path}`,
      };
    }

    const warnings: string[] = [];
    const presets = parsePresetIni(readFileSync(resolvedPath, "utf8"), warnings);
    return { path, exists: true, presets, warnings };
  }
}

export function validateManagedServerStartPreparation(settings: LlamaCppSettings): ManagedServerStartPreparation {
  const presetFile = toPresetFileStatus(PresetFileReader.read(settings.configuredPresetFilePath));
  if (!presetFile.exists) {
    return { canStart: false, presetFile, error: presetFile.error };
  }
  return { canStart: true, presetFile };
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
    return createBaselineOperationalStatus(settings, errorToMessage(error));
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
      return await delegate(
        { ...model, api: "openai-completions" } as Model<"openai-completions">,
        context,
        delegateOptions,
      );
    } catch (error) {
      throw new Error(`llamacpp provider chat failed after load gate for model ${model.id}: ${errorToMessage(error)}`);
    }
  };
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
    lines.push(
      `Managed Process State: ${status.managedProcess.state}`,
      `Managed Process PID: ${status.managedProcess.pid ?? "n/a"}`,
      `Managed stdout tail: ${status.managedLogTail?.stdout.length ? status.managedLogTail.stdout.join(" | ") : "(empty)"}`,
      `Managed stderr tail: ${status.managedLogTail?.stderr.length ? status.managedLogTail.stderr.join(" | ") : "(empty)"}`,
    );
  }
  lines.push(`Last Error: ${status.lastError ? sanitizeDiagnosticMessage(status.lastError) : "none"}`);
  return lines.join("\n");
}

function formatRouterModelListCommandResult(models: RouterModel[]): string {
  return `llamacpp list complete\n\nRouter Models: ${models.length}\n\n${formatRouterModelList(models)}`;
}

export function formatRouterModelList(models: RouterModel[]): string {
  const lines = [
    "llamacpp Router Model List",
    "",
    "| id | name | availability | runtime status | loaded |",
    "|---|---|---|---|---|",
  ];
  if (models.length === 0) lines.push("| (none) | - | - | - | no |");
  for (const model of models) {
    lines.push(`| ${model.id} | ${model.name} | ${formatRouterModelAvailability(model)} | ${model.status ?? "unknown"} | ${model.loaded ? "yes" : "no"} |`);
  }
  return lines.join("\n");
}

function toProviderModel(model: RouterModel, metadata: PresetMetadata = {}): ProviderModel {
  return {
    id: model.id,
    name: model.name,
    reasoning: metadata.reasoning ?? false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: metadata.contextWindow ?? 128_000,
    maxTokens: metadata.maxTokens ?? 16_384,
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

function parsePresetIni(text: string, warnings: string[]): ModelPreset[] {
  const presets: ModelPreset[] = [];
  let current: ModelPreset | undefined;

  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;
    const sectionMatch = /^\[([^\]]+)\]$/u.exec(line);
    if (sectionMatch) {
      current = { id: sectionMatch[1].trim(), runtimeArgs: {}, metadata: {} };
      if (current.id) presets.push(current);
      continue;
    }
    if (!current) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = stripIniValueComment(line.slice(separatorIndex + 1).trim());
    if (!key) continue;
    current.runtimeArgs[key] = value;
    normalizePresetMetadataValue(current, key, value, warnings);
  }

  return presets;
}

function normalizePresetMetadataValue(preset: ModelPreset, key: string, value: string, warnings: string[]): void {
  const canonicalKey = normalizePresetMetadataKey(key);
  if (!canonicalKey) return;

  if (canonicalKey === "reasoningMode") {
    const parsed = parseReasoningMode(value);
    if (parsed === undefined) {
      warnings.push(`Invalid reasoning metadata for preset ${preset.id}: ${value}`);
      return;
    }
    preset.metadata.reasoningMode = parsed;
    preset.metadata.reasoning = parsed !== "off";
    return;
  }

  if (canonicalKey === "reasoningFormat") {
    const parsed = parseReasoningFormat(value);
    if (parsed === undefined) {
      warnings.push(`Invalid reasoning format metadata for preset ${preset.id}: ${value}`);
      return;
    }
    preset.metadata.reasoningFormat = parsed;
    preset.metadata.reasoning = parsed !== "none";
    return;
  }

  const parsed = parseMetadataPositiveInteger(value);
  if (parsed === undefined) {
    warnings.push(`Invalid ${canonicalKey} metadata for preset ${preset.id}: ${value}`);
    return;
  }
  if (canonicalKey === "contextWindow") preset.metadata.contextWindow = parsed;
  if (canonicalKey === "maxTokens") preset.metadata.maxTokens = parsed;
}

function normalizePresetMetadataKey(key: string): keyof PresetMetadata | undefined {
  const normalized = key.trim();
  if (["-c", "--ctx-size", "LLAMA_ARG_CTX_SIZE"].includes(normalized)) return "contextWindow";
  if (["-n", "--predict", "--n-predict", "LLAMA_ARG_N_PREDICT"].includes(normalized)) return "maxTokens";
  if (["-rea", "--reasoning", "LLAMA_ARG_REASONING"].includes(normalized)) return "reasoningMode";
  if (["--reasoning-format"].includes(normalized)) return "reasoningFormat";
  return undefined;
}

function parseMetadataPositiveInteger(value: string): number | undefined {
  if (!/^\d+$/u.test(value)) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseReasoningMode(value: string): "on" | "off" | "auto" | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === "on" || normalized === "off" || normalized === "auto") return normalized;
  return undefined;
}

function parseReasoningFormat(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized || /\s/u.test(normalized)) return undefined;
  return normalized;
}

function stripIniValueComment(value: string): string {
  return value.replace(/\s+[;#].*$/u, "").trim();
}

function toPresetFileStatus(result: PresetFileReadResult): PresetFileStatus {
  const status: PresetFileStatus = {
    path: result.path,
    exists: result.exists,
    presetCount: result.presets.length,
    warnings: result.warnings,
  };
  if (result.error !== undefined) status.error = result.error;
  return status;
}

function formatPresetFileStatus(status?: PresetFileStatus): string {
  if (!status) return "unknown";
  const state = status.exists ? `present (${status.presetCount} presets)` : "missing";
  const warnings = status.warnings.length > 0 ? `; warnings=${status.warnings.length}` : "";
  const error = status.error ? `; ${status.error}` : "";
  return `${state}${warnings}${error}`;
}

async function safeFetchRouterModels(client: RouterClient): Promise<{ models: RouterModel[]; error?: string }> {
  try {
    const result = await client.fetchModelList();
    return { models: result.models };
  } catch (error) {
    return { models: [], error: errorToMessage(error) };
  }
}

function withModelStatusCounts(status: OperationalStatus): OperationalStatus {
  return {
    ...status,
    modelStatusCounts: countRouterModelStatuses(status.routerModels ?? []),
  };
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
  return entries.map(([status, count]) => `  ${status}: ${count}`);
}

function formatRouterModelAvailability(model: RouterModel): string {
  const availability = readFirstString(model.raw, ["availability", "available", "state"]);
  if (availability !== undefined) return availability;
  if (typeof model.raw.available === "boolean") return model.raw.available ? "available" : "unavailable";
  return "unknown";
}


async function refreshUnsupportedProviderApiStatus(
  settings: LlamaCppSettings,
  routerClient: RouterClient,
  pi: Pick<LlamaCppPiApi, "registerProvider" | "unregisterProvider">,
): Promise<OperationalStatus> {
  const missing = [
    typeof pi.unregisterProvider === "function" ? undefined : "unregisterProvider",
    typeof pi.registerProvider === "function" ? undefined : "registerProvider",
  ].filter((value): value is string => value !== undefined);
  const apiError = `Provider API unsupported: Pi is missing ${missing.join(" and ")}.`;

  try {
    const routerModelList = await routerClient.fetchModelList();
    return withModelStatusCounts({
      settings,
      routerReachable: true,
      providerRegistered: false,
      providerModelCount: 0,
      routerModelCount: routerModelList.models.length,
      routerModels: routerModelList.models,
      lastError: apiError,
      routerOwnership: "external",
    });
  } catch (error) {
    return createBaselineOperationalStatus(settings, `${apiError} ${errorToMessage(error)}`);
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

function isRequestReadyRouterModel(model: RouterModel): boolean {
  if (isFailedRouterModel(model)) return false;
  return model.loaded || /^(loaded|running|ready|active|sleeping)$/i.test(model.status ?? "");
}

function isFailedRouterModel(model: RouterModel): boolean {
  return /^(failed|error|unavailable)$/i.test(model.status ?? "") || typeof model.raw.error === "string";
}

function loadFailedError(modelId: string, model: RouterModel): Error {
  const detail = sanitizeDiagnosticMessage(readFirstString(model.raw, ["error", "message", "detail"]) ?? model.status ?? "router reported failed model state");
  return new Error(`llamacpp load failed for model ${modelId}: ${detail}`);
}

function loadGateTimeoutError(modelId: string, timeoutMs: number): Error {
  return new Error(`llamacpp load gate timed out for model ${modelId} after ${timeoutMs}ms.`);
}


function composeFetchAbortSignal(callerSignal: AbortSignal | undefined, timeoutMs: number): FetchSignalLease {
  const safeTimeoutMs = Math.max(1, timeoutMs);
  const timeoutSignal = AbortSignal.timeout(safeTimeoutMs);
  if (!callerSignal) return { signal: timeoutSignal, cleanup: noop };
  if (callerSignal.aborted) return { signal: callerSignal, cleanup: noop };
  if (typeof AbortSignal.any === "function") {
    return { signal: AbortSignal.any([callerSignal, timeoutSignal]), cleanup: noop };
  }

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(callerSignal.reason ?? new DOMException("The operation was aborted", "AbortError"));
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException(`The operation timed out after ${safeTimeoutMs}ms`, "TimeoutError"));
  }, safeTimeoutMs);
  callerSignal.addEventListener("abort", abortFromCaller, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      callerSignal.removeEventListener("abort", abortFromCaller);
    },
  };
}

function noop(): void {}

function normalizeLoadGateListError(error: unknown): Error {
  const message = sanitizeDiagnosticMessage(errorToMessage(error));
  if (/HTTP (401|403)/.test(message)) return new Error(`llamacpp router auth failed during model list: ${message.replace(/^Router \/models returned /, "")}`);
  if (/timed out/i.test(message)) return new Error(`llamacpp router model list timed out: ${message}`);
  if (/aborted/i.test(message)) return new Error(`llamacpp router model list aborted: ${message}`);
  return new Error(`llamacpp router unreachable: ${message}`);
}

function normalizeLoadGateLoadError(modelId: string, error: unknown): Error {
  const message = sanitizeDiagnosticMessage(errorToMessage(error));
  if (/auth failed/.test(message)) return new Error(message);
  if (/load request failed/.test(message)) return new Error(message);
  if (/timed out/i.test(message)) return new Error(`llamacpp load request timed out for model ${modelId}: ${message}`);
  if (/aborted/i.test(message)) return new Error(`llamacpp load request aborted for model ${modelId}: ${message}`);
  return new Error(`llamacpp router unreachable during model load for model ${modelId}: ${message}`);
}

function normalizeFetchTransportError(label: string, error: unknown): Error {
  const message = sanitizeDiagnosticMessage(errorToMessage(error));
  const name = error instanceof Error ? error.name : "";
  if (name === "TimeoutError") return new Error(`${label} timed out: ${message}`);
  if (name === "AbortError") return new Error(`${label} aborted: ${message}`);
  return new Error(message);
}


function isLlamaCppSelectedModel(model: unknown): model is { provider: string; id: string } {
  return isRecord(model) && model.provider === PROVIDER_ID && typeof model.id === "string" && model.id.trim() !== "";
}

function readHookContextModel(ctx: unknown): unknown {
  return isRecord(ctx) ? ctx.model : undefined;
}

function readModelSelectEventModel(event: unknown): unknown {
  return isRecord(event) ? event.model : undefined;
}

function sanitizeDiagnosticMessage(message: string): string {
  return message
    .replace(/\b(?:authorization|bearer|api[_-]?key|token|password|secret)=\S+/giu, "[redacted]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gu, "Bearer [redacted]")
    .replace(/\b(sk-[A-Za-z0-9._~+/=-]+)/gu, "[redacted]");
}

function normalizeHttpErrorBody(body: string): string {
  try {
    const parsed = JSON.parse(body) as unknown;
    if (typeof parsed === "string") return parsed;
    if (isRecord(parsed)) return readFirstString(parsed, ["error", "message", "detail"]) ?? body;
  } catch {
    // Not JSON; keep original text.
  }
  return body;
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
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(`unsupported protocol ${url.protocol}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid Server Base URL: ${trimmed} (${detail})`);
  }
  return trimmed.replace(/\/+$/, "");
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
  return sanitizeDiagnosticMessage(error instanceof Error ? error.message : String(error));
}

function addManagedRouterStatus(status: OperationalStatus, managed: ManagedRouterStatus): OperationalStatus {
  return {
    ...status,
    routerOwnership: managed.ownership === "none" && status.routerReachable ? "external" : managed.ownership,
    managedProcess: managed.process,
    managedLogTail: managed.process ? { stdout: managed.process.stdoutTail, stderr: managed.process.stderrTail } : undefined,
    lastError: managed.lastError ?? status.lastError,
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
