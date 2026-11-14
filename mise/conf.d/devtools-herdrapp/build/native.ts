// Runs canonical domain commands on the selected target. No command installs tools.
import { AsyncLocalStorage } from "node:async_hooks";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Exec } from "../../devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib";

export const QUERY_TIMEOUT_MS = 180_000;
const COMMAND_TIMEOUT_MS = 30_000;
const COMMAND_OUTPUT_BYTES = 16 * 1024 * 1024;
const scopes = new AsyncLocalStorage<{ signal: AbortSignal; children: Set<Promise<number>> }>();
const commandCache = new Map<string, Promise<ResolvedCommand | null>>();
const environment = { ...process.env, LC_ALL: "C", GIT_OPTIONAL_LOCKS: "0", MISE_AUTO_INSTALL: "0", MISE_EXEC_AUTO_INSTALL: "0" };
export const sessionRoot = path.join(process.env.XDG_STATE_HOME || path.join(os.homedir(), ".local/state"), "herdr/shared-context-sessions");
type ResolvedCommand = { binary: string; args: string[] };

export class QueryError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = "QueryError"; }
}

/** A deadline or Core cancellation stops only commands started by this request. */
export async function withDeadline<T>(work: () => Promise<T>, timeout = QUERY_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const scope = { signal: controller.signal, children: new Set<Promise<number>>() };
  const cancel = () => controller.abort(new QueryError("CANCELLED", "The target query was cancelled."));
  process.once("SIGTERM", cancel);
  process.once("SIGINT", cancel);
  const { promise: aborted, reject } = Promise.withResolvers<never>();
  const rejectAbort = () => reject(controller.signal.reason);
  controller.signal.addEventListener("abort", rejectAbort, { once: true });
  const timer = setTimeout(() => controller.abort(new QueryError("DEADLINE_EXCEEDED", "The target query exceeded its deadline.")), timeout);
  try { return await scopes.run(scope, () => Promise.race([work(), aborted])); }
  finally {
    clearTimeout(timer);
    process.removeListener("SIGTERM", cancel);
    process.removeListener("SIGINT", cancel);
    controller.signal.removeEventListener("abort", rejectAbort);
    if (scope.children.size) {
      controller.abort(new QueryError("CANCELLED", "The target query stopped before its commands finished."));
      await Promise.allSettled(scope.children);
    }
  }
}

export function executor(cwd: string): Exec {
  return async (command, args, directory = cwd) => {
    scopes.getStore()?.signal.throwIfAborted();
    const tool = await resolveCommand(command, directory);
    if (!tool) throw new QueryError("COMMAND_UNAVAILABLE", "A required target command is unavailable. Check its installation and mise project trust.");
    return execute(tool.binary, [...tool.args, ...args], directory);
  };
}

export async function resolveCommand(command: string, cwd: string): Promise<ResolvedCommand | null> {
  const key = JSON.stringify([command, cwd]);
  let pending = commandCache.get(key);
  if (!pending) {
    pending = findCommand(command, cwd);
    commandCache.set(key, pending);
    pending.catch(() => commandCache.delete(key));
  }
  return pending;
}

export async function ensurePrivateDirectory(directory: string): Promise<void> {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const info = await fs.lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== process.getuid!() || (info.mode & 0o077) !== 0) {
    throw new QueryError("UNSAFE_PATH", "The target storage directory must be a private directory owned by the current user.");
  }
}

export async function discardSession(session: string): Promise<{ removed: true }> {
  if (!path.isAbsolute(session) || path.dirname(session) !== sessionRoot || !/^session-[A-Za-z0-9]+$/.test(path.basename(session))) {
    throw new QueryError("UNSAFE_PATH", "Session removal requires a session directory inside the target session root.");
  }
  await ensurePrivateDirectory(sessionRoot);
  let info;
  try { info = await fs.lstat(session); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { removed: true }; throw error; }
  if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== process.getuid!() || await fs.realpath(session) !== path.join(await fs.realpath(sessionRoot), path.basename(session))) {
    throw new QueryError("UNSAFE_PATH", "Session removal refused an unsafe directory.");
  }
  await fs.rm(session, { recursive: true, force: true });
  return { removed: true };
}

async function findCommand(command: string, cwd: string): Promise<ResolvedCommand | null> {
  const direct = Bun.which(command, { cwd });
  if (direct) return { binary: direct, args: [] };
  const mise = Bun.which("mise", { cwd });
  if (!mise) return null;
  const found = await execute(mise, ["which", command], cwd);
  if (found.code !== 0) return null;
  return { binary: "env", args: ["MISE_AUTO_INSTALL=0", "MISE_EXEC_AUTO_INSTALL=0", mise, "exec", "--no-deps", "--", command] };
}

async function execute(binary: string, args: string[], cwd: string): Promise<{ stdout: string; code: number }> {
  const scope = scopes.getStore(), signal = scope?.signal;
  signal?.throwIfAborted();
  const child = Bun.spawn([binary, ...args], { cwd, env: environment, stdin: "ignore", stdout: "pipe", stderr: "pipe" });
  const exited = child.exited;
  scope?.children.add(exited);
  const commandAbort = new AbortController();
  const { promise: stopped, reject } = Promise.withResolvers<never>();
  const stop = (error: unknown) => {
    if (commandAbort.signal.aborted) return;
    reject(error);
    commandAbort.abort(error);
    if (child.exitCode === null) child.kill("SIGKILL");
  };
  const cancel = () => stop(signal?.reason);
  signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => stop(new QueryError("COMMAND_TIMEOUT", "A target command exceeded its deadline.")), COMMAND_TIMEOUT_MS);
  const budget = { bytes: 0 };
  try {
    const [stdout, stderr, code] = await Promise.race([Promise.all([
      readOutput(child.stdout, budget, stop, commandAbort.signal),
      readOutput(child.stderr, budget, stop, commandAbort.signal),
      exited,
    ]), stopped]);
    return { stdout: code === 0 ? stdout : [stdout, stderr].filter(Boolean).join("\n"), code };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
    if (child.exitCode === null) child.kill("SIGKILL");
    await exited;
    scope?.children.delete(exited);
  }
}

async function readOutput(stream: ReadableStream<Uint8Array>, budget: { bytes: number }, stop: (error: unknown) => void, signal: AbortSignal): Promise<string> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  const cancel = () => { void reader.cancel().catch(() => { }); };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      budget.bytes += value.byteLength;
      if (budget.bytes > COMMAND_OUTPUT_BYTES) {
        stop(new QueryError("OUTPUT_TOO_LARGE", "A target command exceeded the output limit."));
        return "";
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally {
    signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
}
