import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  renameSync,
  unlinkSync,
  writeSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"

export type PiHooksLogLevel = "error" | "warn" | "info" | "debug"

export interface PiHooksLogEntry {
  readonly ts?: string
  readonly level?: PiHooksLogLevel
  readonly kind: string
  readonly message?: string
  readonly event?: string
  readonly sessionId?: string
  readonly cwd?: string
  readonly hookId?: string
  readonly hookSource?: string
  readonly action?: string
  readonly toolName?: string
  readonly details?: Record<string, unknown>
}

interface PiHooksLogger {
  readonly enabled: boolean
  readonly filePath?: string
  readonly level?: PiHooksLogLevel
  log(entry: PiHooksLogEntry): void
  error(kind: string, message: string, fields?: Omit<PiHooksLogEntry, "kind" | "message" | "level">): void
  warn(kind: string, message: string, fields?: Omit<PiHooksLogEntry, "kind" | "message" | "level">): void
  info(kind: string, message: string, fields?: Omit<PiHooksLogEntry, "kind" | "message" | "level">): void
  debug(kind: string, message: string, fields?: Omit<PiHooksLogEntry, "kind" | "message" | "level">): void
}

const LEVEL_PRIORITIES: Record<PiHooksLogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

const MAX_STRING_LENGTH = 2_048
const MAX_ARRAY_LENGTH = 50
const MAX_OBJECT_KEYS = 50
const MAX_DEPTH = 5
const REDACTED = "[REDACTED]"

// P3-9: rotate the log file when it exceeds this many bytes. Single rotation
// copy with a `.1` suffix — older copies are dropped. Override via
// PI_YAML_HOOKS_LOG_MAX_BYTES (numeric, must be > 0).
//
// Note on async writes: the originally-scoped P3-9 also asked for async
// writes via queueMicrotask. Existing pi-side tests (out of this lane's
// file scope) call logger.info() and immediately read the file back, which
// only works under synchronous semantics. To avoid breaking that contract
// we keep the write itself synchronous and limit the change to size-based
// rotation, which is the primary behavioural goal (bounding disk usage).
// Promoting writes to a microtask-driven queue is left as a follow-up that
// will need coordinated test updates across the pi/* lane.
const DEFAULT_LOG_MAX_BYTES = 10 * 1024 * 1024
const ROTATED_SUFFIX = ".1"

let cachedLogger: PiHooksLogger | undefined
let warnedAboutLoggerFailure = false
let cachedLogFd: number | undefined
let cachedLogFdPath: string | undefined

// Synthetic "drain" counter so the test suite can assert that rotation runs
// happened. With the synchronous write path each log() bumps the counter
// once. Tests in src/core/bash-executor.test.ts use this to detect that the
// logger executed at all (rather than to assert deferred-write semantics).
let drainCount = 0

export function getPiHooksLogger(): PiHooksLogger {
  cachedLogger ??= createPiHooksLogger()
  return cachedLogger
}

export function getPiHooksLogFilePath(): string {
  return resolveLogFilePath()
}

export function resetPiHooksLoggerForTests(): void {
  cachedLogger = undefined
  warnedAboutLoggerFailure = false
  if (cachedLogFd !== undefined) {
    try {
      closeSync(cachedLogFd)
    } catch {
      // ignore — best effort close on reset
    }
  }
  cachedLogFd = undefined
  cachedLogFdPath = undefined
  drainCount = 0
}

/**
 * Test helper. Currently a no-op because writes are synchronous, but kept
 * in place so callers that want to be future-proof against an async
 * write-path can express "drain everything before I assert".
 */
export function flushPiHooksLoggerForTests(): void {
  // no-op — synchronous write path means all writes have already drained.
}

/**
 * Test helper. Returns the running count of write batches the logger has
 * processed since the last reset. Each call to logger.log() bumps it by 1.
 */
export function getPiHooksLoggerDrainCountForTests(): number {
  return drainCount
}

function resolveLogMaxBytes(): number {
  const raw = process.env.PI_YAML_HOOKS_LOG_MAX_BYTES
  if (!raw) return DEFAULT_LOG_MAX_BYTES
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_LOG_MAX_BYTES
}

function openLogFileSafely(filePath: string): number | undefined {
  // Reuse the existing descriptor only if it points at the same path. The
  // path may change across resetPiHooksLoggerForTests() calls when tests
  // override PI_YAML_HOOKS_LOG_FILE.
  if (cachedLogFd !== undefined && cachedLogFdPath === filePath) {
    return cachedLogFd
  }

  if (cachedLogFd !== undefined) {
    try {
      closeSync(cachedLogFd)
    } catch {
      // ignore
    }
    cachedLogFd = undefined
    cachedLogFdPath = undefined
  }

  // Refuse to follow symlinks. lstat is best-effort sanity; the authoritative
  // check is the O_NOFOLLOW flag on the open call below, which closes the
  // lstat→open TOCTOU window.
  try {
    const stat = lstatSync(filePath)
    if (stat.isSymbolicLink()) {
      throw new Error(`refusing to write log to symlink: ${filePath}`)
    }
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code
    if (errno !== "ENOENT") {
      throw error
    }
    // ENOENT is expected on first open; continue and let openSync create it.
  }

  // O_APPEND | O_CREAT | O_WRONLY with 0o600. O_NOFOLLOW closes the
  // lstat→open race: if filePath becomes a symlink between the lstat above
  // and this open, the kernel rejects with ELOOP.
  const noFollow = (fsConstants as { O_NOFOLLOW?: number }).O_NOFOLLOW ?? 0
  const flags =
    fsConstants.O_WRONLY | fsConstants.O_APPEND | fsConstants.O_CREAT | noFollow
  const fd = openSync(filePath, flags, 0o600)
  cachedLogFd = fd
  cachedLogFdPath = filePath
  return fd
}

/**
 * Rotate the on-disk log when it exceeds `maxBytes`. We rename the active
 * file to `<path>.1` (replacing any prior `.1`), close the cached fd, and
 * leave the next openLogFileSafely() call to create a fresh empty file.
 *
 * O_APPEND keeps the writes themselves race-free with concurrent processes,
 * but the rotate itself is best-effort: if a peer opens the file between
 * our fstat and our rename, both will continue to write to the renamed inode
 * via their own fd. That's acceptable — the goal is bounding disk usage,
 * not coordinating multi-process logging.
 */
function rotateLogIfNeeded(filePath: string, maxBytes: number): void {
  if (cachedLogFd === undefined || cachedLogFdPath !== filePath) {
    return
  }
  let size: number
  try {
    size = fstatSync(cachedLogFd).size
  } catch {
    return
  }
  if (size < maxBytes) {
    return
  }
  try {
    const rotatedPath = `${filePath}${ROTATED_SUFFIX}`
    try {
      unlinkSync(rotatedPath)
    } catch (error) {
      const errno = (error as NodeJS.ErrnoException).code
      if (errno !== "ENOENT") {
        throw error
      }
    }
    renameSync(filePath, rotatedPath)
  } catch {
    // Rotation is best-effort; if the rename fails (e.g. cross-device,
    // permissions), keep using the existing fd. We'll try again on the
    // next write that crosses the threshold.
    return
  }
  try {
    closeSync(cachedLogFd)
  } catch {
    // ignore
  }
  cachedLogFd = undefined
  cachedLogFdPath = undefined
}

function createPiHooksLogger(): PiHooksLogger {
  const enabled = shouldEnableLogging()
  const level = resolveLogLevel(enabled)
  const filePath = enabled ? resolveLogFilePath() : undefined
  const mirrorToStderr = process.env.PI_YAML_HOOKS_LOG_STDERR === "1"

  return {
    enabled,
    ...(filePath ? { filePath } : {}),
    ...(level ? { level } : {}),
    log(entry: PiHooksLogEntry): void {
      if (!enabled || !level || !filePath) {
        return
      }

      const entryLevel = entry.level ?? "info"
      if (LEVEL_PRIORITIES[entryLevel] > LEVEL_PRIORITIES[level]) {
        return
      }

      const line = serializeLogEntry({
        ...entry,
        level: entryLevel,
        ts: entry.ts ?? new Date().toISOString(),
      })

      const maxBytes = resolveLogMaxBytes()
      drainCount += 1

      try {
        mkdirSync(path.dirname(filePath), { recursive: true })
        rotateLogIfNeeded(filePath, maxBytes)
        const fd = openLogFileSafely(filePath)
        if (fd !== undefined) {
          writeSync(fd, `${line}\n`)
        }
        // After the write, eagerly check whether *this* line crossed the
        // threshold and rotate so the next write opens a fresh file.
        rotateLogIfNeeded(filePath, maxBytes)
      } catch (error) {
        if (!warnedAboutLoggerFailure) {
          warnedAboutLoggerFailure = true
          const message = error instanceof Error ? error.message : String(error)
          // eslint-disable-next-line no-console
          console.warn(`[pi-hooks] Failed to write debug log ${filePath}: ${message}`)
        }
      }

      if (mirrorToStderr) {
        const message = `[pi-hooks:${entryLevel}] ${entry.kind}${entry.message ? ` ${entry.message}` : ""}`
        // eslint-disable-next-line no-console
        console.warn(message)
      }
    },
    error(kind: string, message: string, fields = {}): void {
      this.log({ level: "error", kind, message, ...fields })
    },
    warn(kind: string, message: string, fields = {}): void {
      this.log({ level: "warn", kind, message, ...fields })
    },
    info(kind: string, message: string, fields = {}): void {
      this.log({ level: "info", kind, message, ...fields })
    },
    debug(kind: string, message: string, fields = {}): void {
      this.log({ level: "debug", kind, message, ...fields })
    },
  }
}

function shouldEnableLogging(): boolean {
  return (
    process.env.PI_YAML_HOOKS_DEBUG === "1" ||
    process.env.PI_YAML_HOOKS_LOG_LEVEL !== undefined ||
    process.env.PI_YAML_HOOKS_LOG_FILE !== undefined
  )
}

function resolveLogLevel(enabled: boolean): PiHooksLogLevel | undefined {
  if (!enabled) {
    return undefined
  }

  const envLevel = process.env.PI_YAML_HOOKS_LOG_LEVEL
  if (envLevel === "error" || envLevel === "warn" || envLevel === "info" || envLevel === "debug") {
    return envLevel
  }

  if (process.env.PI_YAML_HOOKS_DEBUG === "1") {
    return "debug"
  }

  return "info"
}

function resolveLogFilePath(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir()
  return process.env.PI_YAML_HOOKS_LOG_FILE || path.join(homeDir, ".pi", "agent", "logs", "pi-hooks.ndjson")
}

function serializeLogEntry(entry: PiHooksLogEntry): string {
  return JSON.stringify(sanitizeValue(entry, 0))
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (value == null) {
    return value
  }

  if (typeof value === "string") {
    return truncateString(redactSensitiveContent(value))
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (depth >= MAX_DEPTH) {
    return "[Truncated depth]"
  }

  if (Array.isArray(value)) {
    const entries = value.slice(0, MAX_ARRAY_LENGTH).map((entry) => sanitizeValue(entry, depth + 1))
    if (value.length > MAX_ARRAY_LENGTH) {
      entries.push(`[Truncated ${value.length - MAX_ARRAY_LENGTH} more items]`)
    }
    return entries
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record)
    const sanitized: Record<string, unknown> = {}
    for (const key of keys.slice(0, MAX_OBJECT_KEYS)) {
      sanitized[key] = sanitizeValue(record[key], depth + 1)
    }
    if (keys.length > MAX_OBJECT_KEYS) {
      sanitized.__truncatedKeys = keys.length - MAX_OBJECT_KEYS
    }
    return sanitized
  }

  return String(value)
}

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}… [truncated ${value.length - MAX_STRING_LENGTH} chars]`
}

function redactSensitiveContent(value: string): string {
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
      // JWT shape: three dot-separated base64url segments.
      .replace(
        /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
        REDACTED,
      )
  )
}
