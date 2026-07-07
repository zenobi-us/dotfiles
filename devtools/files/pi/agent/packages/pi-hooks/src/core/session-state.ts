import type { FileChange } from "./types.js"

export interface PendingToolCall {
  readonly sessionID: string
  readonly toolArgs: Record<string, unknown>
}

interface PendingToolCallEntry extends PendingToolCall {
  insertedAt: number
}

interface SessionRecord {
  parentID?: string | null
  rootSessionID?: string
  deleted: boolean
  /**
   * Map keyed by serialized FileChange; insertion order is preserved (V8 spec).
   * Replaces the prior `changes[]` + `changeKeys` Set pair so dedupe is O(1)
   * and `consumeFileChanges` is O(n) over the consumed slice instead of
   * O(n*m) over the full pending list (P3-6).
   */
  changes: Map<string, FileChange>
  activeIdleDispatchKeys?: Set<string>
  replayedDuringIdleKeys: Set<string>
}

export type SessionScope = "all" | "main" | "child"

const MAX_DELETED_TOMBSTONES = 256

/**
 * Maximum number of pending tool-call entries kept in memory. P1-5: PI may
 * fire `tool.execute.before` without ever firing `tool.execute.after` (e.g.
 * the agent is killed mid-tool, the host crashes, the call is rejected by a
 * sibling extension). Without a cap, pending entries grew unboundedly for the
 * lifetime of the host process. The bound is generous enough that a healthy
 * session never trips it; a pathological one is clamped instead of leaking.
 */
const MAX_PENDING_TOOL_CALLS = 1000

/**
 * Maximum age of a pending tool-call entry. Anything older than this is
 * swept on the next insert. PI never legitimately keeps a single tool call
 * pending for more than seconds; a 5-minute ceiling absorbs even the worst
 * confirmation prompt or LLM stall while still preventing an unbounded leak.
 */
const PENDING_TOOL_CALL_TTL_MS = 5 * 60_000

export class SessionStateStore {
  private readonly sessions = new Map<string, SessionRecord>()
  private readonly pendingToolCalls = new Map<string, PendingToolCallEntry>()
  // Bounded LRU-ish set of recently-deleted session ids so isDeleted() still
  // returns true after the SessionRecord has been removed (P1 #11).
  private readonly deletedTombstones = new Set<string>()
  // Injection seam for tests; defaults to Date.now().
  private readonly nowFn: () => number

  constructor(options: { nowFn?: () => number } = {}) {
    this.nowFn = options.nowFn ?? (() => Date.now())
  }

  rememberSession(sessionID: string, parentID?: string | null): void {
    const record = this.getOrCreateSession(sessionID)
    record.deleted = false

    if (parentID !== undefined) {
      record.parentID = parentID
      record.rootSessionID = parentID ? this.sessions.get(parentID)?.rootSessionID : sessionID
    }
  }

  async evaluateScope(
    sessionID: string,
    scope: SessionScope,
    resolveParentID: (sessionID: string) => Promise<string | null | undefined>,
  ): Promise<boolean> {
    if (scope === "all") {
      return true
    }

    const rootSessionID = await this.getRootSessionID(sessionID, resolveParentID)
    const isMainSession = rootSessionID === sessionID
    return scope === "main" ? isMainSession : !isMainSession
  }

  async getRootSessionID(
    sessionID: string,
    resolveParentID: (sessionID: string) => Promise<string | null | undefined>,
  ): Promise<string> {
    return this.resolveRootSessionID(sessionID, resolveParentID, new Set(), true)
  }

  isDeleted(sessionID: string): boolean {
    // P1 #11: After deleteSession() removes the entry, lookups should still
    // report the session as deleted (best-effort). The tombstone set keeps a
    // small bounded record of recently-deleted ids without retaining full
    // SessionRecord objects.
    if (this.sessions.has(sessionID)) {
      return this.sessions.get(sessionID)?.deleted ?? false
    }
    return this.deletedTombstones.has(sessionID)
  }

  deleteSession(sessionID: string): void {
    // Drop pending tool calls owned by this session before removing the record.
    for (const [callID, pending] of this.pendingToolCalls) {
      if (pending.sessionID === sessionID) {
        this.pendingToolCalls.delete(callID)
      }
    }

    // P1 #11 fix: remove the SessionRecord entirely instead of leaving a
    // tombstone in the Map. A long-running PI process that creates many
    // sessions previously accumulated one record per historical session.
    this.sessions.delete(sessionID)
    this.recordTombstone(sessionID)
  }

  private recordTombstone(sessionID: string): void {
    this.deletedTombstones.add(sessionID)
    if (this.deletedTombstones.size > MAX_DELETED_TOMBSTONES) {
      // Evict the oldest entry. Set iteration order is insertion order in v8.
      const oldest = this.deletedTombstones.values().next().value
      if (oldest !== undefined) this.deletedTombstones.delete(oldest)
    }
  }

  setPendingToolCall(callID: string, sessionID: string, toolArgs: Record<string, unknown>): void {
    // P1-5: sweep stale entries on every insert and cap the map size. The
    // sweep is O(k) where k is the number of expired entries since the last
    // sweep; in steady state k is 0 or 1 because we sweep on every insert.
    this.sweepExpiredPendingToolCalls()

    if (this.pendingToolCalls.size >= MAX_PENDING_TOOL_CALLS) {
      // Evict the oldest entry (insertion order is preserved by Map). This
      // keeps the cap a hard ceiling even if every entry is fresh: the
      // assumption is that an unbounded backlog of "fresh" pending calls
      // means the host is wedged, and dropping the oldest is preferable to
      // OOM.
      const oldest = this.pendingToolCalls.keys().next().value
      if (oldest !== undefined) {
        this.pendingToolCalls.delete(oldest)
      }
    }

    this.pendingToolCalls.set(callID, { sessionID, toolArgs, insertedAt: this.nowFn() })
  }

  consumePendingToolCall(callID: string): PendingToolCall | undefined {
    const pending = this.pendingToolCalls.get(callID)
    if (!pending) {
      return undefined
    }

    this.pendingToolCalls.delete(callID)
    return { sessionID: pending.sessionID, toolArgs: pending.toolArgs }
  }

  /**
   * Number of currently-tracked pending tool calls. Exposed for tests and
   * diagnostics; not part of the public consumer surface.
   */
  pendingToolCallCount(): number {
    return this.pendingToolCalls.size
  }

  private sweepExpiredPendingToolCalls(): void {
    if (this.pendingToolCalls.size === 0) {
      return
    }
    const cutoff = this.nowFn() - PENDING_TOOL_CALL_TTL_MS
    // Map iteration is insertion order, and entries are inserted in
    // monotonically increasing time order, so the first non-expired entry
    // marks the boundary.
    for (const [callID, entry] of this.pendingToolCalls) {
      if (entry.insertedAt >= cutoff) {
        return
      }
      this.pendingToolCalls.delete(callID)
    }
  }

  addFileChanges(sessionID: string, changes: Iterable<FileChange>): void {
    const record = this.getOrCreateSession(sessionID)
    for (const change of changes) {
      const key = serializeFileChange(change)
      if (record.activeIdleDispatchKeys?.has(key)) {
        record.replayedDuringIdleKeys.add(key)
      }

      if (!record.changes.has(key)) {
        record.changes.set(key, change)
      }
    }
  }

  getFileChanges(sessionID: string): FileChange[] {
    const record = this.sessions.get(sessionID)
    if (!record || record.changes.size === 0) {
      return []
    }

    return Array.from(record.changes.values())
  }

  getModifiedPaths(sessionID: string): string[] {
    return getChangedPaths(this.getFileChanges(sessionID))
  }

  beginIdleDispatch(sessionID: string, changes: readonly FileChange[]): void {
    const record = this.getOrCreateSession(sessionID)
    record.activeIdleDispatchKeys = new Set(changes.map((change) => serializeFileChange(change)))
    record.replayedDuringIdleKeys.clear()
  }

  consumeFileChanges(sessionID: string, changes: readonly FileChange[]): void {
    const record = this.sessions.get(sessionID)
    if (!record) {
      return
    }

    // P3-6: O(n) over consumed changes. The single-Map storage means
    // delete/has/set are all O(1); the previous filter() over the full
    // changes[] array was O(n*m).
    for (const change of changes) {
      const key = serializeFileChange(change)
      const wasReplayed = record.replayedDuringIdleKeys.has(key)
      record.changes.delete(key)
      if (wasReplayed) {
        // Re-insert so the change survives consumption and is replayed on
        // the next idle dispatch.
        record.changes.set(key, change)
      }
    }

    record.activeIdleDispatchKeys = undefined
    record.replayedDuringIdleKeys.clear()
  }

  cancelIdleDispatch(sessionID: string): void {
    const record = this.sessions.get(sessionID)
    if (!record) {
      return
    }

    record.activeIdleDispatchKeys = undefined
    record.replayedDuringIdleKeys.clear()
  }

  private getOrCreateSession(sessionID: string): SessionRecord {
    let record = this.sessions.get(sessionID)
    if (!record) {
      record = { deleted: false, changes: new Map(), replayedDuringIdleKeys: new Set() }
      this.sessions.set(sessionID, record)
    }
    return record
  }

  /**
   * Walks `parentID` chain to the root session id. Caches the result on the
   * caller's session record only; intermediate parent records are NOT
   * mutated when reached transitively (P1-6). Previously every parent on the
   * walk got a `getOrCreateSession` call, which would resurrect a deleted
   * session (or invent one that PI never told us about) just because we
   * traversed through it. The fix is to read parent records when they exist
   * and otherwise treat the parent chain as opaque, only resolving via the
   * host adapter without writing through.
   */
  private async resolveRootSessionID(
    sessionID: string,
    resolveParentID: (sessionID: string) => Promise<string | null | undefined>,
    visited: Set<string>,
    isOriginalCaller: boolean,
  ): Promise<string> {
    if (visited.has(sessionID)) {
      // Cycle: treat the cycle entry point as its own root. Only the
      // original caller may write the cached value; intermediate parents
      // are read-only.
      if (isOriginalCaller) {
        const record = this.getOrCreateSession(sessionID)
        record.rootSessionID = sessionID
      }
      return sessionID
    }

    visited.add(sessionID)

    // For the original caller we may create the record (it represents the
    // session we are evaluating, so it must exist anyway). For transitive
    // parent walks we only read.
    const existing = this.sessions.get(sessionID)
    const record = isOriginalCaller ? this.getOrCreateSession(sessionID) : existing

    let parentID = record?.parentID
    if (parentID === undefined) {
      parentID = (await resolveParentID(sessionID)) ?? null
      if (record) {
        record.parentID = parentID
      }
    }

    if (!parentID) {
      if (record) {
        record.rootSessionID = sessionID
      }
      return sessionID
    }

    if (record?.rootSessionID) {
      const parentRootSessionID = this.sessions.get(parentID)?.rootSessionID
      if (parentRootSessionID && parentRootSessionID === record.rootSessionID) {
        return record.rootSessionID
      }
    }

    const rootSessionID = await this.resolveRootSessionID(parentID, resolveParentID, visited, false)
    if (record) {
      record.rootSessionID = rootSessionID
    }
    return rootSessionID
  }
}

function getChangedPaths(changes: readonly FileChange[]): string[] {
  const paths = new Set<string>()

  for (const change of changes) {
    if (change.operation === "rename") {
      if (change.fromPath) {
        paths.add(change.fromPath)
      }
      if (change.toPath) {
        paths.add(change.toPath)
      }
      continue
    }

    if (change.path) {
      paths.add(change.path)
    }
  }

  return Array.from(paths)
}

function serializeFileChange(change: FileChange): string {
  if (change.operation === "rename") {
    return `${change.operation}:${change.fromPath}->${change.toPath}`
  }

  return `${change.operation}:${change.path}`
}

/**
 * P3 secret hygiene: redact known-sensitive keys from a tool_args object
 * before serialise. Returns a shallow-cloned object with sensitive values
 * replaced by `"[REDACTED]"`. Recursive over nested objects/arrays.
 */
const SENSITIVE_KEY_PATTERNS: readonly RegExp[] = [
  /^password$/i,
  /^token$/i,
  /^api[_-]?key$/i,
  /^secret$/i,
  /^authorization$/i,
  /^auth$/i,
  /^private[_-]?key$/i,
  /^bearer$/i,
]

const REDACTED = "[REDACTED]"
const TOOL_ARGS_MAX_BYTES = 64 * 1024
const TOOL_ARGS_TRUNCATED_PLACEHOLDER = "[pi-hooks: tool_args truncated]"

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

function redactValue(value: unknown, depth: number): unknown {
  if (depth > 8) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1))
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = isSensitiveKey(k) ? REDACTED : redactValue(v, depth + 1)
    }
    return out
  }
  return value
}

/**
 * Returns a shallow-cloned tool_args with sensitive keys redacted and the
 * total JSON-serialized size capped at `TOOL_ARGS_MAX_BYTES` (64 KiB). If
 * the JSON exceeds the cap the result collapses to a single-key placeholder
 * indicating truncation.
 */
export function sanitizeToolArgsForSerialization(
  toolArgs: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!toolArgs) {
    return toolArgs
  }
  const redacted = redactValue(toolArgs, 0) as Record<string, unknown>
  let json: string
  try {
    json = JSON.stringify(redacted)
  } catch {
    return { _pi_hooks_tool_args_unserialisable: true }
  }
  if (Buffer.byteLength(json, "utf8") <= TOOL_ARGS_MAX_BYTES) {
    return redacted
  }
  return {
    _pi_hooks_tool_args_truncated: true,
    _pi_hooks_tool_args_original_byte_length: Buffer.byteLength(json, "utf8"),
    _pi_hooks_tool_args_max_byte_length: TOOL_ARGS_MAX_BYTES,
    note: TOOL_ARGS_TRUNCATED_PLACEHOLDER,
  }
}
