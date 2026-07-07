/**
 * Session lineage helper for the PI adapter.
 *
 * PI exposes a `ReadonlySessionManager` with `getHeader()` that returns the
 * header for the current session. The header carries `parentSession` which is
 * the path to the parent session's file (not a session id). Because the core
 * `HostAdapter` only asks for the root session id reachable from a starting
 * id, we walk best-effort: when the current request matches the session
 * manager's current session we return its ultimate parent-less ancestor's id
 * (falling back to the current id when the lineage chain cannot be resolved).
 *
 * This is intentionally conservative. PI's read-only API does not expose a
 * way to look up arbitrary session headers by id, so for any sessionId that
 * isn't the currently-active one we return the input id unchanged. That keeps
 * the `runIn: "main"` semantics sane: the current session resolves to its
 * root, everything else resolves to itself.
 */

import type { ExtensionContext, SessionHeader } from "@earendil-works/pi-coding-agent";
import { closeSync, constants as fsConstants, fstatSync, openSync, readSync } from "node:fs";

import { getPiHooksLogger } from "../core/logger.js";

// P2 #19: bound the lineage walk + per-file read so a pathological session
// chain or oversized session header line cannot block the event loop.
const MAX_LINEAGE_DEPTH = 64;
const MAX_HEADER_BYTES = 64 * 1024;

// P2-14: cache previously resolved (sessionId → rootId) pairs so subsequent
// `runIn: main` lookups during the same session can skip the file walk.
// The map is intentionally tiny — every entry is two short ids — and is
// bounded by SESSION_ROOT_CACHE_MAX so a long-running PI process that
// accumulates many session ids does not retain them forever.
const SESSION_ROOT_CACHE_MAX = 64;
const sessionRootCache = new Map<string, string>();

function rememberSessionRoot(sessionId: string, rootId: string): void {
  if (sessionRootCache.has(sessionId)) {
    sessionRootCache.delete(sessionId);
  }
  sessionRootCache.set(sessionId, rootId);
  while (sessionRootCache.size > SESSION_ROOT_CACHE_MAX) {
    const oldest = sessionRootCache.keys().next().value;
    if (oldest === undefined) break;
    sessionRootCache.delete(oldest);
  }
}

/** Test-only: clear the resolution cache so each case starts fresh. */
export function resetSessionLineageCacheForTests(): void {
  sessionRootCache.clear();
}

/**
 * P3-2: same justification as in `adapter.ts` — use the SDK's
 * `ReadonlySessionManager` shape by indexing `ExtensionContext["sessionManager"]`
 * (its only public surface) rather than a structural mirror.
 */
type ReadonlySessionManager = ExtensionContext["sessionManager"];

/**
 * Return the root session id reachable from `currentSessionId`.
 *
 * Walks `sessionManager.getHeader().parentSession` when it points to a file
 * path we can read; otherwise returns the starting id. Best-effort by design.
 */
export function getRootSessionId(
  currentSessionId: string,
  sessionManager: ReadonlySessionManager | undefined,
): string {
  if (!currentSessionId) return currentSessionId;
  if (!sessionManager) return currentSessionId;

  let header: SessionHeader | null = null;
  try {
    header = sessionManager.getHeader();
  } catch {
    return currentSessionId;
  }
  if (!header) return currentSessionId;

  // If the caller is asking about a session that isn't the session manager's
  // current one, we cannot resolve lineage without loading arbitrary session
  // files. Try the in-memory cache first (populated by earlier successful
  // walks) so /resume and /fork that surface a previously-seen child id can
  // still hit a known root. P2-14: also emit a debug log so the silent
  // miss is observable in the structured log.
  if (header.id !== currentSessionId) {
    const cached = sessionRootCache.get(currentSessionId);
    if (cached) return cached;
    try {
      getPiHooksLogger().debug("lineage_unresolved", "lineage walker skipped: header.id mismatch", {
        sessionId: currentSessionId,
        details: { headerId: header.id, parentSession: header.parentSession ?? null },
      });
    } catch {
      /* logger is best-effort; never let logging break lineage */
    }
    return currentSessionId;
  }

  // Cache hit on the active session id (e.g. when getRootSessionId is called
  // multiple times within the same hook event).
  const cachedRoot = sessionRootCache.get(currentSessionId);
  if (cachedRoot) return cachedRoot;

  // Walk up via parentSession file paths. We read just the header prefix of
  // each parent file (capped at MAX_HEADER_BYTES) to pick up the
  // id/parentSession for the next hop.
  const visited = new Set<string>([header.id]);
  let cursor: SessionHeader | null = header;
  let depth = 0;
  while (cursor?.parentSession) {
    if (++depth > MAX_LINEAGE_DEPTH) break;
    const parent = readSessionHeaderFromFile(cursor.parentSession);
    if (!parent) break;
    if (visited.has(parent.id)) break;
    visited.add(parent.id);
    cursor = parent;
  }

  const rootId = cursor?.id ?? currentSessionId;
  rememberSessionRoot(currentSessionId, rootId);
  return rootId;
}

function readSessionHeaderFromFile(filePath: string): SessionHeader | null {
  // Read at most MAX_HEADER_BYTES from the start of the file. This is
  // enough to recover the JSON header line on any sane session file and
  // bounded if a file is unexpectedly huge.
  let fd: number | undefined;
  try {
    // P2-15: open with O_NONBLOCK so a FIFO with no writer doesn't block
    // openSync forever. We immediately fstat the descriptor and bail on
    // anything that isn't a regular file (FIFO, socket, char/block device).
    // For regular files O_NONBLOCK is a no-op, so this is safe to apply
    // unconditionally — Linux/macOS both ignore the flag when opening
    // disk files. The flag is dropped before readSync via fstat-only path.
    fd = openSync(filePath, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
    const stat = fstatSync(fd);
    if (!stat.isFile()) {
      return null;
    }
    const buffer = Buffer.allocUnsafe(MAX_HEADER_BYTES);
    const read = readSync(fd, buffer, 0, MAX_HEADER_BYTES, 0);
    const text = buffer.toString("utf8", 0, read);
    const newlineIndex = text.indexOf("\n");
    const firstLine = newlineIndex === -1 ? text : text.slice(0, newlineIndex);
    if (!firstLine.trim()) return null;
    const parsed = JSON.parse(firstLine) as { type?: string; id?: string; parentSession?: string; timestamp?: string; cwd?: string };
    if (parsed?.type !== "session" || typeof parsed.id !== "string") return null;
    return {
      type: "session",
      id: parsed.id,
      timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : "",
      cwd: typeof parsed.cwd === "string" ? parsed.cwd : "",
      ...(typeof parsed.parentSession === "string" ? { parentSession: parsed.parentSession } : {}),
    };
  } catch {
    return null;
  } finally {
    if (fd !== undefined) {
      try { closeSync(fd); } catch { /* ignore */ }
    }
  }
}
