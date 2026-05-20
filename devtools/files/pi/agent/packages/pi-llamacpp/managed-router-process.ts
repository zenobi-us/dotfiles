import { spawn as spawnChildProcess } from "node:child_process";
import type {
  LlamaCppSettings,
  ManagedProcessLike,
  ManagedProcessStatus,
  ManagedRouterStartResult,
  ManagedRouterStatus,
  ProcessSpawner,
  RouterOwnership,
  RouterProbe,
} from "./types.js";
import { DEFAULT_LLAMACPP_TIMEOUTS, normalizeConfiguredPresetFilePath } from "./settings-module.js";
import { validateManagedServerStartPreparation } from "./preset-file-reader.js";

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
      return { ...this.status(), message: this.lastError ?? "Managed start failed." };
    }

    const presetState = validateManagedServerStartPreparation(settings);
    if (!presetState.canStart) {
      this.lastError = presetState.error ?? "Configured Preset File blocks managed start.";
      return { ...this.status(), message: this.lastError ?? "Managed start failed." };
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
      return { ...this.status(), message: this.lastError ?? "Managed start failed." };
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
        return { ...this.status(), message: this.lastError ?? "Managed start failed." };
      }
      await this.sleep(Math.min(settings.timeouts.pollMs, Math.max(0, deadline - Date.now())));
      if (spawnFailed) {
        this.lastError = spawnErrorMessage ?? this.lastError ?? "Managed Llama Server Router spawn failed.";
        return { ...this.status(), message: this.lastError ?? "Managed start failed." };
      }
    } while (Date.now() < deadline);

    this.lastError = `Timed out waiting ${settings.timeouts.startMs}ms for managed Llama Server Router.`;
    this.processState.state = "timed-out";
    return { ...this.status(), message: this.lastError };
  }

  async stop(timeoutMs = DEFAULT_LLAMACPP_TIMEOUTS.statusMs): Promise<ManagedRouterStartResult> {
    if (this.ownership !== "managed" || !this.process) {
      this.lastError = "No package-owned managed router process to stop.";
      return { ...this.status(), message: this.lastError ?? "Managed start failed." };
    }
    const accepted = this.process.kill("SIGTERM");
    if (!accepted) {
      this.lastError = "Failed to stop package-owned managed router process: SIGTERM was not accepted.";
      return { ...this.status(), message: this.lastError ?? "Managed start failed." };
    }

    const deadline = Date.now() + timeoutMs;
    while (this.ownership === "managed" && this.processState.state !== "exited" && Date.now() < deadline) {
      await this.sleep(Math.min(25, Math.max(0, deadline - Date.now())));
    }

    if (this.ownership === "managed" && this.processState.state !== "exited") {
      this.lastError = `Failed to stop package-owned managed router process within ${timeoutMs}ms.`;
      return { ...this.status(), message: this.lastError ?? "Managed start failed." };
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
