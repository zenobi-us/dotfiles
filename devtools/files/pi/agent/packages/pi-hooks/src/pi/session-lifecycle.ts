/**
 * PI session-lifecycle wiring: `session_start`, `session_shutdown`, and
 * `session_before_switch` handlers, plus the dedupe tombstone that absorbs
 * the duplicate session.deleted PI emits for the same logical /new, /resume,
 * /fork transition.
 *
 * Extracted from `adapter.ts` as part of the P0/P1 refactor; behaviour is
 * unchanged and the registration order matches the original adapter.
 */

import type {
  ExtensionAPI,
  ExtensionContext,
  SessionBeforeSwitchEvent,
  SessionShutdownEvent,
  SessionStartEvent,
} from "@earendil-works/pi-coding-agent";

import type { getPiHooksLogger } from "../core/logger.js";
import type { HooksRuntime } from "../core/runtime.js";
import {
  buildSessionCreatedEvent,
  buildSessionDeletedEvent,
  extractReason,
} from "./event-mappers.js";
import { safeGetSessionId } from "./host-adapter.js";

export interface SessionLifecycleDeps {
  /** Returns the runtime for `cwd`, lazily constructing it on first use. */
  getRuntimeFor(cwd: string): HooksRuntime;
  /** Records the freshest ExtensionContext for this cwd. */
  rememberContext(cwd: string, ctx: ExtensionContext): void;
  /** Logger reference (already constructed by the caller). */
  logger: ReturnType<typeof getPiHooksLogger>;
  /** Shared dispatch-failure reporter for adapter handlers. */
  reportDispatchFailure(
    logger: ReturnType<typeof getPiHooksLogger>,
    context: {
      cwd: string;
      event: string;
      sessionId?: string;
      details?: Record<string, unknown>;
    },
    error: unknown,
  ): void;
}

/**
 * Install `session_start`, `session_shutdown`, and `session_before_switch`
 * handlers on the given `pi`. Returns nothing — registration is the side
 * effect.
 */
export function installSessionLifecycleHandlers(
  pi: ExtensionAPI,
  deps: SessionLifecycleDeps,
): void {
  const { getRuntimeFor, rememberContext, logger, reportDispatchFailure } = deps;

  // P1 #4 fix: PI emits both session_before_switch AND session_shutdown for
  // the same logical /new, /resume, /fork transition. Track which session
  // ids we have already fired session.deleted for so cleanup hooks do not
  // double-run. Entries are cleared shortly after to keep the set bounded.
  const deletedSessionIds = new Set<string>();
  function markSessionDeleted(sessionId: string): boolean {
    if (deletedSessionIds.has(sessionId)) return false;
    deletedSessionIds.add(sessionId);
    // Drop the marker after a few seconds — long enough to absorb the
    // before_switch/shutdown pair, short enough not to leak forever.
    setTimeout(() => deletedSessionIds.delete(sessionId), 5_000).unref?.();
    return true;
  }

  // ---- session_start ----
  // Filter to genuine session creation (new/startup). resume/reload/fork are
  // existing sessions being re-entered; firing session.created there would
  // overfire hooks that are meant to run once per fresh session.
  pi.on("session_start", async (event: SessionStartEvent, ctx: ExtensionContext): Promise<void> => {
    rememberContext(ctx.cwd, ctx);
    if (event.reason !== "new" && event.reason !== "startup") return;
    const sessionId = safeGetSessionId(ctx.sessionManager);
    if (!sessionId) return;

    // P1-3 fix: do NOT forward `header.parentSession` here. PI's
    // `parentSession` field is a FILE PATH to the parent session's JSONL
    // file, not a session ID. Forwarding it as `parentID` poisoned the
    // runtime's session-state with a non-id value and mis-classified
    // scope:main|child for forked sessions. Instead, omit it and let the
    // runtime resolve lineage lazily via `host.getRootSessionId`, which is
    // wired up to the session-lineage helper that walks parent files
    // correctly.
    try {
      const runtime = getRuntimeFor(ctx.cwd);
      await runtime.event(buildSessionCreatedEvent(sessionId));
    } catch (error) {
      reportDispatchFailure(logger, { cwd: ctx.cwd, event: "session.created", sessionId }, error);
    }
  });

  // ---- session_shutdown ----
  // P1-4 fix: forward the SDK's `reason` field on the envelope so hook
  // authors can distinguish a graceful shutdown ("quit") from PI internally
  // tearing down for /new, /resume, /fork, or /reload. session_shutdown
  // also fires on terminal exit; the runtime re-entry after the process
  // dies is harmless.
  pi.on("session_shutdown", async (event: SessionShutdownEvent, ctx: ExtensionContext): Promise<void> => {
    rememberContext(ctx.cwd, ctx);
    const sessionId = safeGetSessionId(ctx.sessionManager);
    if (!sessionId) return;
    if (!markSessionDeleted(sessionId)) return; // already fired via before_switch

    const reason = extractReason(event);
    try {
      const runtime = getRuntimeFor(ctx.cwd);
      await runtime.event(buildSessionDeletedEvent(sessionId, reason));
    } catch (error) {
      reportDispatchFailure(
        logger,
        {
          cwd: ctx.cwd,
          event: "session.deleted",
          sessionId,
          ...(reason ? { details: { reason } } : {}),
        },
        error,
      );
    }
  });

  // ---- session_before_switch ----
  // P1-4 fix: forward the SDK's `reason` ("new" | "resume") on the envelope.
  // session_shutdown also fires for the same logical transition; whichever
  // arrives first wins (markSessionDeleted dedupes), so the reason actually
  // delivered to hooks may be either of the two.
  pi.on("session_before_switch", async (event: SessionBeforeSwitchEvent, ctx: ExtensionContext): Promise<void> => {
    rememberContext(ctx.cwd, ctx);
    const sessionId = safeGetSessionId(ctx.sessionManager);
    if (!sessionId) return;
    if (!markSessionDeleted(sessionId)) return; // session_shutdown already fired

    const reason = extractReason(event);
    try {
      const runtime = getRuntimeFor(ctx.cwd);
      await runtime.event(buildSessionDeletedEvent(sessionId, reason));
    } catch (error) {
      reportDispatchFailure(
        logger,
        {
          cwd: ctx.cwd,
          event: "session.deleted",
          sessionId,
          details: { trigger: "session_before_switch", ...(reason ? { reason } : {}) },
        },
        error,
      );
    }
  });
}
