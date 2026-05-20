import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import type {
  Api,
  AssistantMessageEventStream,
  Context,
  Model,
  SimpleStreamOptions,
} from "@earendil-works/pi-ai";

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

export type ManagedProcessLike = {
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

export type ProcessSpawner = (command: string, args: string[]) => ManagedProcessLike;
export type RouterProbe = () => Promise<unknown>;

export type ProviderModel = {
  id: string;
  name: string;
  reasoning: boolean;
  input: Array<"text">;
  cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
  contextWindow: number;
  maxTokens: number;
};

export type LlamaCppPiApi = Pick<ExtensionAPI, "registerCommand"> & {
  registerProvider?: (name: string, provider: unknown) => void | Promise<void>;
  unregisterProvider?: (name: string) => void | Promise<void>;
  on?: (event: string, handler: (event?: unknown, ctx?: unknown) => void | Promise<void>) => void;
};

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
export type FetchSignalLease = { signal: AbortSignal; cleanup: () => void };
export type StreamSimpleDelegate = (
  model: Model<"openai-completions">,
  context: Context,
  options?: SimpleStreamOptions,
) => AssistantMessageEventStream;

export type LlamaCppStreamSimpleOptions = SimpleStreamOptions & {
  delegate?: StreamSimpleDelegate;
};

export type LlamaCppProviderOptions = {
  loadSettings?: (ctx?: ExtensionCommandContext) => Promise<LlamaCppSettings> | LlamaCppSettings;
  fetch?: FetchLike;
  managedRouter?: import("./managed-router-process.js").ManagedRouterProcess;
};

export type ConfigModule = {
  createConfigService<T>(name: string, options: { defaults: T; parse: (raw: unknown) => T | Promise<T> }): Promise<{ config: T }>;
};

export type LlamaCppStreamSimpleFn = (model: Model<Api>, context: Context, options?: LlamaCppStreamSimpleOptions) => Promise<AssistantMessageEventStream>;
