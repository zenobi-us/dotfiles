import { execFileSync, spawn } from "node:child_process"
import path from "node:path"

import {
  DEFAULT_BASH_TIMEOUT,
  TIMEOUT_EXIT_CODE,
  type BashExecutionRequest,
  type BashHookContext,
  type BashHookResult,
  type BashProcessResult,
} from "./bash-types.js"

const BLOCKING_EXIT_CODE = 2
// Exit code used when the child process fails to spawn (e.g. ENOENT). Distinct
// from TIMEOUT_EXIT_CODE so that consumers can tell a spawn error from a
// timeout. 127 mirrors the POSIX shell convention for "command not found".
const SPAWN_ERROR_EXIT_CODE = 127
const KILL_GRACE_PERIOD_MS = 250
// Prefer the PI-native override, but fall back to the legacy OpenCode env var so
// existing deployments continue to work during the transition.
const BASH_EXECUTABLE = process.env.PI_YAML_HOOKS_BASH_EXECUTABLE || process.env.OPENCODE_HOOKS_BASH_EXECUTABLE || "bash"
const MAX_LOG_FIELD_LENGTH = 400
const REDACTED = "[REDACTED]"
const SUPPORTS_PROCESS_GROUP_TIMEOUT_KILL = process.platform !== "win32"
// P1 #9: cap captured stdout/stderr per hook invocation. A misbehaving hook
// (e.g. `find / -type f`) would otherwise buffer arbitrarily large output
// into the host process. Override via PI_YAML_HOOKS_MAX_OUTPUT_BYTES.
//
// P1-7: the cap is measured in UTF-8 bytes, NOT UTF-16 code units. Output is
// buffered as Node Buffers and sliced on a UTF-8 codepoint boundary so that
// emoji-heavy or CJK output never produces a U+FFFD replacement character at
// the truncation seam.
const MAX_OUTPUT_BYTES = parseMaxOutputBytes(process.env.PI_YAML_HOOKS_MAX_OUTPUT_BYTES) ?? 1_048_576
const TRUNCATION_MARKER = "\n…[pi-hooks: output truncated]"
// P3 #25: cap the JSON-serialized context payload that we feed to the bash
// hook over stdin. A pathological hook context (e.g. a write tool with a
// multi-MB content body) would otherwise be buffered into the child's stdin
// in one shot. Override via PI_YAML_HOOKS_MAX_STDIN_BYTES.
const MAX_STDIN_BYTES = parseMaxOutputBytes(process.env.PI_YAML_HOOKS_MAX_STDIN_BYTES) ?? 262_144
const REQUIRED_CONTEXT_ENV_KEYS = new Set([
  "PI_PROJECT_DIR",
  "OPENCODE_PROJECT_DIR",
  "PI_WORKTREE_DIR",
  "OPENCODE_WORKTREE_DIR",
  "PI_SESSION_ID",
  "OPENCODE_SESSION_ID",
  "PI_GIT_COMMON_DIR",
  "OPENCODE_GIT_COMMON_DIR",
])

// P3-8: executionContextCache TTL. Without invalidation, a worktree replaced
// in-place under the same path would keep returning the stale gitCommonDir
// for the lifetime of the process. A coarse 5-minute TTL since last access
// keeps the cache useful for hot paths (we often resolve the same projectDir
// dozens of times per session) while ensuring eventual consistency for
// long-lived agent processes.
const EXECUTION_CONTEXT_CACHE_TTL_MS = 5 * 60_000
let executionContextNowFn: () => number = () => Date.now()
const executionContextCache = new Map<string, ExecutionContextCacheEntry>()

interface ExecutionContext {
  worktreeDir: string
  gitCommonDir?: string
  resolvedFromGit: boolean
}

interface ExecutionContextCacheEntry {
  context: ExecutionContext
  expiresAt: number
}

interface ExecutionContextResolver {
  execFileSync(command: string, args: string[], options: { cwd: string; encoding: "utf8"; stdio: ["ignore", "pipe", "ignore"] }): string
}

function parseMaxOutputBytes(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

interface SerializeContextResult {
  payload: string
  truncated: boolean
}

export function serializeContextForStdinDetailed(context: BashHookContext): SerializeContextResult {
  const json = JSON.stringify(context)
  if (Buffer.byteLength(json, "utf8") <= MAX_STDIN_BYTES) {
    return { payload: json, truncated: false }
  }
  // The payload exceeds the byte cap. We can't safely truncate JSON in the
  // middle (the hook would receive invalid JSON), so emit a synthetic but
  // still-valid object describing the truncation. Hooks that rely on the
  // full payload will see a clear marker rather than OOM the host.
  const truncated = {
    ...context,
    _pi_hooks_truncated: true,
    _pi_hooks_original_byte_length: Buffer.byteLength(json, "utf8"),
    _pi_hooks_max_byte_length: MAX_STDIN_BYTES,
  }
  // Replace any large nested fields with placeholders to keep the truncated
  // payload itself under the cap. Tool args/results are the typical culprit.
  for (const key of Object.keys(truncated) as Array<keyof typeof truncated>) {
    if (key === "_pi_hooks_truncated" || key === "_pi_hooks_original_byte_length" || key === "_pi_hooks_max_byte_length") {
      continue
    }
    const value = (truncated as Record<string, unknown>)[key as string]
    if (typeof value === "string" && value.length > 1024) {
      (truncated as Record<string, unknown>)[key as string] = `[pi-hooks: truncated string of ${value.length} chars]`
    } else if (value && typeof value === "object") {
      const nestedSize = Buffer.byteLength(JSON.stringify(value), "utf8")
      if (nestedSize > 4096) {
        (truncated as Record<string, unknown>)[key as string] = `[pi-hooks: truncated nested value of ${nestedSize} bytes]`
      }
    }
  }
  const reduced = JSON.stringify(truncated)
  if (Buffer.byteLength(reduced, "utf8") <= MAX_STDIN_BYTES) {
    return { payload: reduced, truncated: true }
  }
  // Last-resort: drop everything except the bare metadata.
  return {
    payload: JSON.stringify({
      session_id: context.session_id,
      event: context.event,
      cwd: context.cwd,
      _pi_hooks_truncated: true,
      _pi_hooks_original_byte_length: Buffer.byteLength(json, "utf8"),
      _pi_hooks_max_byte_length: MAX_STDIN_BYTES,
    }),
    truncated: true,
  }
}

export function serializeContextForStdin(context: BashHookContext): string {
  return serializeContextForStdinDetailed(context).payload
}

/**
 * Accumulates child-process output bytes against MAX_OUTPUT_BYTES.
 *
 * Output is captured as raw UTF-8 bytes so that a multi-byte codepoint
 * straddling the cap is never split mid-sequence. Once the cap is reached we
 * (1) clamp the buffer to a safe codepoint boundary, (2) append a textual
 * truncation marker, and (3) refuse further bytes.
 */
class CappedOutputBuffer {
  private chunks: Buffer[] = []
  private byteLength = 0
  private _truncated = false

  /**
   * Returns true if at least one byte was dropped during this lifetime.
   */
  get truncated(): boolean {
    return this._truncated
  }

  append(chunk: Buffer): void {
    if (this._truncated) {
      return
    }
    if (this.byteLength + chunk.length <= MAX_OUTPUT_BYTES) {
      this.chunks.push(chunk)
      this.byteLength += chunk.length
      return
    }

    const remaining = MAX_OUTPUT_BYTES - this.byteLength
    if (remaining > 0) {
      const safeEnd = trimToUtf8Boundary(chunk, remaining)
      if (safeEnd > 0) {
        this.chunks.push(chunk.subarray(0, safeEnd))
        this.byteLength += safeEnd
      }
    }
    this._truncated = true
  }

  toString(): string {
    const joined = Buffer.concat(this.chunks, this.byteLength).toString("utf8")
    return this._truncated ? joined + TRUNCATION_MARKER : joined
  }
}

/**
 * Given a Buffer and a desired maximum byte length, return the largest length
 * `<= maxBytes` that does not split a UTF-8 codepoint sequence. UTF-8
 * continuation bytes match `0b10xxxxxx`; a starter byte is anything else.
 *
 * The marker text we append after truncation is itself ASCII (<= 0x7F), so we
 * only need to walk back as far as the most recent starter byte and verify
 * that the codepoint it begins is fully present in the slice.
 */
export function trimToUtf8Boundary(chunk: Buffer, maxBytes: number): number {
  if (maxBytes <= 0) return 0
  const limit = Math.min(maxBytes, chunk.length)
  if (limit === 0) return 0

  // Walk backwards from `limit` looking for the start of the last codepoint.
  // Stop as soon as we hit a byte whose top two bits are not `10`.
  let i = limit
  while (i > 0) {
    const b = chunk[i - 1]
    if (b === undefined) {
      return 0
    }
    if ((b & 0b1100_0000) !== 0b1000_0000) {
      // Found the starter byte. Determine codepoint length from the high
      // bits and check whether the full sequence fits inside `limit`.
      const expectedLen =
        (b & 0b1000_0000) === 0 ? 1 :
        (b & 0b1110_0000) === 0b1100_0000 ? 2 :
        (b & 0b1111_0000) === 0b1110_0000 ? 3 :
        (b & 0b1111_1000) === 0b1111_0000 ? 4 :
        // Invalid starter — drop this byte rather than emit U+FFFD.
        0
      const start = i - 1
      if (expectedLen > 0 && start + expectedLen <= limit) {
        return start + expectedLen
      }
      return start
    }
    i -= 1
  }
  // The whole prefix was continuation bytes (corrupt stream). Drop them.
  return 0
}

export async function executeBashHook(request: BashExecutionRequest): Promise<BashHookResult> {
  const processResult = await executeBashProcess(request)
  const hookResult = mapBashProcessResultToHookResult(processResult, request.context)

  logBashOutcome(hookResult, request)
  return hookResult
}

export function mapBashProcessResultToHookResult(result: BashProcessResult, context: BashHookContext): BashHookResult {
  if (result.timedOut) {
    return { ...result, status: "timed_out", blocking: false }
  }

  if (result.exitCode === 0) {
    return { ...result, status: "success", blocking: false }
  }

  if (result.exitCode === BLOCKING_EXIT_CODE && isBlockingToolBeforeEvent(context.event)) {
    return { ...result, status: "blocked", blocking: true }
  }

  return { ...result, status: "failed", blocking: false }
}

export function isBlockingToolBeforeEvent(event: string): boolean {
  return event.startsWith("tool.before.")
}

async function executeBashProcess(request: BashExecutionRequest): Promise<BashProcessResult> {
  const timeout = request.timeout ?? DEFAULT_BASH_TIMEOUT
  const startTime = Date.now()
  const executionContext = resolveExecutionContext(request.projectDir)

  return new Promise((resolve) => {
    // Inject both PI_* (canonical) and OPENCODE_* (legacy alias) env vars so that
    // bash actions migrated from OpenCode keep working. By default we preserve
    // historical compatibility and inherit the host environment. Operators can
    // opt in to a stricter inherited-env allowlist with
    // PI_YAML_HOOKS_ENV_ALLOWLIST=NAME,NAME. In allowlist mode, PATH/HOME and
    // credential vars are inherited only when named explicitly; PI/OPENCODE
    // runtime context vars are always injected below.
    const contextEnv = {
      PI_PROJECT_DIR: request.projectDir,
      OPENCODE_PROJECT_DIR: request.projectDir,
      PI_WORKTREE_DIR: executionContext.worktreeDir,
      OPENCODE_WORKTREE_DIR: executionContext.worktreeDir,
      PI_SESSION_ID: request.context.session_id,
      OPENCODE_SESSION_ID: request.context.session_id,
      ...(executionContext.gitCommonDir
        ? {
            PI_GIT_COMMON_DIR: executionContext.gitCommonDir,
            OPENCODE_GIT_COMMON_DIR: executionContext.gitCommonDir,
          }
        : {}),
    }
    const env = buildBashEnvironment(process.env, contextEnv)

    const child = spawn(BASH_EXECUTABLE, ["-c", request.command], {
      cwd: request.context.cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      detached: SUPPORTS_PROCESS_GROUP_TIMEOUT_KILL,
    })

    const stdout = new CappedOutputBuffer()
    const stderr = new CappedOutputBuffer()
    let timedOut = false
    let settled = false
    let killTimer: NodeJS.Timeout | undefined
    const timeoutCleanupNotes: string[] = []

    const finalize = (result: Omit<BashProcessResult, "durationMs">): void => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeoutTimer)
      if (killTimer) {
        clearTimeout(killTimer)
      }

      resolve({
        ...result,
        durationMs: Date.now() - startTime,
      })
    }

    const timeoutTimer = setTimeout(() => {
      timedOut = true
      const sigtermResult = signalTimedOutProcess(child, "SIGTERM")
      timeoutCleanupNotes.push(...formatTimeoutCleanupLines(sigtermResult, timeout, "SIGTERM"))
      killTimer = setTimeout(() => {
        const sigkillResult = signalTimedOutProcess(child, "SIGKILL")
        timeoutCleanupNotes.push(...formatTimeoutCleanupLines(sigkillResult, timeout, "SIGKILL"))
      }, KILL_GRACE_PERIOD_MS)
    }, timeout)

    child.stdout.on("data", (chunk: Buffer) => {
      stdout.append(chunk)
    })

    child.stderr.on("data", (chunk: Buffer) => {
      stderr.append(chunk)
    })

    const stdinSerialization = serializeContextForStdinDetailed(request.context)
    const stdinTruncated = stdinSerialization.truncated

    child.stdin.on("error", () => {})
    child.stdin.end(stdinSerialization.payload)

    child.on("error", (error) => {
      stderr.append(Buffer.from(`\n${error.message}`, "utf8"))
      finalize({
        command: request.command,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: SPAWN_ERROR_EXIT_CODE,
        signal: null,
        timedOut: false,
        outputTruncated: stdout.truncated || stderr.truncated,
        stdinTruncated,
      })
    })

    child.on("close", (code, signal) => {
      const exitCode = timedOut ? TIMEOUT_EXIT_CODE : (code ?? SPAWN_ERROR_EXIT_CODE)
      const timeoutMessages = timedOut
        ? [
            `Command timed out after ${timeout}ms`,
            ...timeoutCleanupNotes,
            `Timeout cleanup: final result exitCode=${code ?? "none"} signal=${signal ?? "none"}`,
          ]
        : []

      for (const message of timeoutMessages) {
        appendStderrLine(stderr, message)
      }

      finalize({
        command: request.command,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode,
        signal,
        timedOut,
        outputTruncated: stdout.truncated || stderr.truncated,
        stdinTruncated,
      })
    })
  })
}

export function buildBashEnvironment(
  inheritedEnv: NodeJS.ProcessEnv,
  contextEnv: Record<string, string>,
): NodeJS.ProcessEnv {
  const allowlist = parseEnvAllowlist(inheritedEnv.PI_YAML_HOOKS_ENV_ALLOWLIST)
  if (!allowlist) {
    return { ...inheritedEnv, ...contextEnv }
  }

  const env: NodeJS.ProcessEnv = {}
  for (const key of allowlist) {
    if (REQUIRED_CONTEXT_ENV_KEYS.has(key)) continue
    const value = inheritedEnv[key]
    if (value !== undefined) {
      env[key] = value
    }
  }
  return { ...env, ...contextEnv }
}

function parseEnvAllowlist(raw: string | undefined): Set<string> | undefined {
  if (raw === undefined) return undefined
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(entry)),
  )
}

function appendStderrLine(buffer: CappedOutputBuffer, message: string): void {
  if (!message) return
  // Always start each cleanup message on its own line so that downstream
  // log parsing (and humans) can read them.
  buffer.append(Buffer.from(`\n${message}`, "utf8"))
}

function signalTimedOutProcess(child: ReturnType<typeof spawn>, signal: NodeJS.Signals): {
  readonly signal: NodeJS.Signals
  readonly target: "process_group" | "process" | "process_group_and_pid"
  readonly targetPid?: number
  readonly error?: string
} {
  const pid = child.pid ?? undefined
  if (SUPPORTS_PROCESS_GROUP_TIMEOUT_KILL && typeof pid === "number" && pid > 0) {
    let groupResult: { ok: boolean; error?: string }
    try {
      process.kill(-pid, signal)
      groupResult = { ok: true }
    } catch (error) {
      groupResult = { ok: false, error: error instanceof Error ? error.message : String(error) }
    }

    // Defence in depth (descendant-kill flake fix): even when the process
    // group kill above succeeds, we ALSO signal the direct child PID. If the
    // shell already exited but a backgrounded grandchild lingered, the group
    // signal targets the pgrp; the direct PID signal makes sure the bash
    // process itself can never become a leaked zombie that holds resources.
    let directResult: { ok: boolean; error?: string } = { ok: false }
    try {
      child.kill(signal)
      directResult = { ok: true }
    } catch (error) {
      directResult = { ok: false, error: error instanceof Error ? error.message : String(error) }
    }

    if (groupResult.ok) {
      return {
        signal,
        target: directResult.ok ? "process_group_and_pid" : "process_group",
        targetPid: pid,
      }
    }

    if (directResult.ok) {
      return {
        signal,
        target: "process",
        targetPid: pid,
        error: `process group kill failed: ${groupResult.error ?? "unknown"}`,
      }
    }

    return {
      signal,
      target: "process",
      targetPid: pid,
      error: `process group kill failed: ${groupResult.error ?? "unknown"}; fallback process kill failed: ${directResult.error ?? "unknown"}`,
    }
  }

  try {
    child.kill(signal)
    return { signal, target: "process", ...(pid ? { targetPid: pid } : {}) }
  } catch (error) {
    return {
      signal,
      target: "process",
      ...(pid ? { targetPid: pid } : {}),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function formatTimeoutCleanupLines(
  result: {
    readonly signal: NodeJS.Signals
    readonly target: "process_group" | "process" | "process_group_and_pid"
    readonly targetPid?: number
    readonly error?: string
  },
  timeout: number,
  signal: NodeJS.Signals,
): string[] {
  const pidText = result.targetPid !== undefined ? ` ${result.targetPid}` : ""
  const targetText =
    result.target === "process_group" ? `process group${pidText}` :
    result.target === "process_group_and_pid" ? `process group${pidText} and pid${pidText}` :
    `process${pidText}`
  const action = signal === "SIGKILL" ? `escalated to ${signal}` : `sent ${signal}`
  const lines = [`Timeout cleanup: ${action} to ${targetText} after ${timeout}ms timeout`]
  if (result.error) {
    lines.push(`Timeout cleanup: ${result.error}`)
  }
  return lines
}

function logBashOutcome(result: BashHookResult, request: BashExecutionRequest): void {
  if (result.status !== "failed" && result.status !== "timed_out") {
    return
  }

  const details = [
    `[pi-hooks] Bash hook ${result.status}`,
    `event=${request.context.event}`,
    `session=${request.context.session_id}`,
    `cwd=${request.context.cwd}`,
    `projectDir=${request.projectDir}`,
    `exitCode=${result.exitCode}`,
    `signal=${result.signal ?? "none"}`,
    `durationMs=${result.durationMs}`,
    `command=${JSON.stringify(sanitizeLogValue(result.command))}`,
  ]

  if (result.stderr.trim()) {
    details.push(`stderr=${JSON.stringify(sanitizeLogValue(result.stderr.trim()))}`)
  }

  if (result.stdout.trim()) {
    details.push(`stdout=${JSON.stringify(sanitizeLogValue(result.stdout.trim()))}`)
  }

  if (result.outputTruncated) {
    details.push(`outputTruncated=true`)
  }

  if (result.stdinTruncated) {
    details.push(`stdinTruncated=true`)
  }

  console.error(details.join(" | "))
}

function sanitizeLogValue(value: string): string {
  const redacted = redactSensitiveContent(value)
  if (redacted.length <= MAX_LOG_FIELD_LENGTH) {
    return redacted
  }

  return `${redacted.slice(0, MAX_LOG_FIELD_LENGTH)}… [truncated ${redacted.length - MAX_LOG_FIELD_LENGTH} chars]`
}

export function redactSensitiveContent(value: string): string {
  return (
    value
      // PEM blocks (private keys, RSA keys, etc.) — collapse the entire block to a marker
      .replace(
        /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/g,
        REDACTED,
      )
      // GitHub tokens (ghp_, gho_, ghu_, ghs_, ghr_) and fine-grained github_pat_
      .replace(/\bgh[opusr]_[A-Za-z0-9]{20,255}\b/g, REDACTED)
      .replace(/\bgithub_pat_[A-Za-z0-9_]{20,255}\b/g, REDACTED)
      // GitLab personal access tokens
      .replace(/\bglpat-[A-Za-z0-9_-]{20,255}\b/g, REDACTED)
      // Slack tokens (xoxb-, xoxp-, xoxa-, xoxr-, xoxs-)
      .replace(/\bxox[bpars]-[A-Za-z0-9-]{10,255}\b/g, REDACTED)
      // Basic-auth credentials embedded in URLs: scheme://user:pass@host
      .replace(
        /\b((?:https?|ftp|ssh|git|mongodb|postgres(?:ql)?|mysql|redis|amqp):\/\/)([^\s:/@]+):([^\s/@]+)@/gi,
        `$1$2:${REDACTED}@`,
      )
      // Authorization: Bearer <token>
      .replace(/\b(authorization\s*:\s*bearer\s+)([^\s]+)/gi, `$1${REDACTED}`)
      // Quoted secret assignments (api_key="..." / token: "..." / etc.)
      .replace(
        /((?:\\?["'])?(?:api[-_ ]?key|token|secret|password|passwd|pwd)(?:\\?["'])?[^\S\r\n]*[:=][^\S\r\n]*)(\\?["'])(.*?)(\2)/gi,
        (_match, prefix: string, openingQuote: string, _secretValue: string, closingQuote: string) =>
          `${prefix}${openingQuote}${REDACTED}${closingQuote}`,
      )
      // Unquoted secret assignments (api-key=..., token: ..., etc.)
      .replace(
        /(["']?(?:api[-_ ]?key|token|secret|password|passwd|pwd)["']?[^\S\r\n]*[:=][^\S\r\n]*)([^\s,"'}\]`]+)/gi,
        `$1${REDACTED}`,
      )
      // Uppercase env-style names ending in KEY/TOKEN/SECRET/PASSWORD: GITHUB_TOKEN=abc, AWS_SECRET_ACCESS_KEY: ...
      .replace(
        /\b([A-Z][A-Z0-9_]*_(?:KEY|TOKEN|SECRET|PASSWORD))(\s*[:=]\s*)(["']?)([^\s,"'}\]`]+)\3/g,
        (_match, name: string, sep: string, quote: string) => `${name}${sep}${quote}${REDACTED}${quote}`,
      )
      // JWT shape: three dot-separated base64url segments. Header is always >=10 chars,
      // payload >=10, signature >=10 — keep the threshold high enough to avoid false positives.
      .replace(
        /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
        REDACTED,
      )
  )
}

export function resetExecutionContextCacheForTests(): void {
  executionContextCache.clear()
  executionContextNowFn = () => Date.now()
}

/**
 * Test-only override for the cache clock. Allows tests to advance virtual
 * time past the TTL without sleeping. Always paired with
 * `resetExecutionContextCacheForTests()` afterwards.
 */
export function setExecutionContextNowForTests(now: () => number): void {
  executionContextNowFn = now
}

export function resolveExecutionContext(
  projectDir: string,
  resolver: ExecutionContextResolver = { execFileSync },
): ExecutionContext {
  const normalizedProjectDir = path.resolve(projectDir)
  const cached = getCachedExecutionContext(normalizedProjectDir)
  if (cached) {
    return cached
  }

  try {
    const output = resolver.execFileSync("git", ["rev-parse", "--show-toplevel", "--git-common-dir"], {
      cwd: normalizedProjectDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()

    const [worktreeDirLine, gitCommonDirLine] = output.split(/\r?\n/)
    const worktreeDir = path.resolve(worktreeDirLine?.trim() || normalizedProjectDir)
    const gitCommonDir = gitCommonDirLine?.trim()

    const context = {
      worktreeDir,
      resolvedFromGit: true,
      ...(gitCommonDir
        ? {
            gitCommonDir: path.isAbsolute(gitCommonDir) ? gitCommonDir : path.resolve(normalizedProjectDir, gitCommonDir),
          }
        : {}),
    }
    cacheExecutionContext(normalizedProjectDir, context)
    return context
  } catch {
    return { worktreeDir: normalizedProjectDir, resolvedFromGit: false }
  }
}

function getCachedExecutionContext(projectDir: string): ExecutionContext | undefined {
  const entry = executionContextCache.get(projectDir)
  if (!entry) {
    return undefined
  }

  const now = executionContextNowFn()
  if (entry.expiresAt <= now) {
    // P3-8: TTL expired. Drop both keys (project + worktree alias) so we
    // re-probe git on the next call. Worktree replacement under the same
    // path therefore becomes visible within EXECUTION_CONTEXT_CACHE_TTL_MS.
    executionContextCache.delete(projectDir)
    if (entry.context.worktreeDir !== projectDir) {
      executionContextCache.delete(entry.context.worktreeDir)
    }
    return undefined
  }

  // Sliding-window TTL: refresh expiry on hot-path access so a directory we
  // resolve continuously stays cached.
  entry.expiresAt = now + EXECUTION_CONTEXT_CACHE_TTL_MS
  return entry.context
}

function cacheExecutionContext(projectDir: string, context: ExecutionContext): void {
  const expiresAt = executionContextNowFn() + EXECUTION_CONTEXT_CACHE_TTL_MS
  executionContextCache.set(projectDir, { context, expiresAt })
  executionContextCache.set(context.worktreeDir, { context, expiresAt })
}

// Re-export TIMEOUT_EXIT_CODE for any consumer that still imports it from
// the executor module rather than bash-types.
export { TIMEOUT_EXIT_CODE }
