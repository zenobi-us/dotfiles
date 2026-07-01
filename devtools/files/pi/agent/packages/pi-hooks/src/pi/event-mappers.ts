/**
 * Pure helpers that translate SDK event shapes (`ToolCallEvent`,
 * `ToolResultEvent`, session lifecycle events) into the runtime's input
 * envelopes. Kept side-effect-free so they can be exercised in isolation
 * and so the dispatch handlers in `register-adapter.ts` stay focused on
 * orchestration rather than shape massaging.
 *
 * Extracted from `adapter.ts` as part of the P0/P1 refactor; behaviour is
 * unchanged.
 */

import type { ToolCallEvent, ToolResultEvent } from "@earendil-works/pi-coding-agent";

import type {
  ToolExecuteAfterInput,
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from "../core/runtime.js";

/** Build the `tool.execute.before` input envelope from a PI `tool_call`. */
export function mapToolCallToBeforeInput(
  event: ToolCallEvent,
  sessionId: string,
): ToolExecuteBeforeInput {
  return {
    tool: event.toolName,
    sessionID: sessionId,
    callID: event.toolCallId,
  };
}

/** Build the `tool.execute.before` output envelope (carries the live args). */
export function mapToolCallToBeforeOutput(event: ToolCallEvent): ToolExecuteBeforeOutput {
  return {
    args: (event.input ?? {}) as Record<string, unknown>,
  };
}

/** Build the `tool.execute.after` input envelope from a PI `tool_result`. */
export function mapToolResultToAfterInput(
  event: ToolResultEvent,
  sessionId: string,
): ToolExecuteAfterInput {
  return {
    tool: event.toolName,
    sessionID: sessionId,
    callID: event.toolCallId,
    args: (event.input ?? {}) as Record<string, unknown>,
  };
}

/** Envelope for the runtime `session.idle` dispatch. */
export function buildSessionIdleEvent(sessionId: string): {
  event: { type: "session.idle"; properties: { sessionID: string } };
} {
  return {
    event: { type: "session.idle", properties: { sessionID: sessionId } },
  };
}

/** Envelope for the runtime `session.created` dispatch. */
export function buildSessionCreatedEvent(sessionId: string): {
  event: { type: "session.created"; properties: { info: { id: string } } };
} {
  // P1-3 fix: do NOT forward `header.parentSession` here. PI's
  // `parentSession` field is a FILE PATH to the parent session's JSONL
  // file, not a session ID. Forwarding it as `parentID` poisoned the
  // runtime's session-state with a non-id value and mis-classified
  // scope:main|child for forked sessions. Instead, omit it and let the
  // runtime resolve lineage lazily via `host.getRootSessionId`, which is
  // wired up to the session-lineage helper that walks parent files
  // correctly.
  return {
    event: { type: "session.created", properties: { info: { id: sessionId } } },
  };
}

/**
 * Envelope for the runtime `session.deleted` dispatch. P1-4: we forward the
 * SDK's optional `reason` field on the envelope so hook authors can tell a
 * graceful shutdown apart from PI tearing the session down for /new, /resume,
 * /fork, or /reload.
 */
export function buildSessionDeletedEvent(
  sessionId: string,
  reason: string | undefined,
): {
  event: { type: "session.deleted"; properties: { info: { id: string }; reason?: string } };
} {
  return {
    event: {
      type: "session.deleted",
      properties: {
        info: { id: sessionId },
        ...(reason ? { reason } : {}),
      },
    },
  };
}

/** Read a string `reason` field from any SDK session-lifecycle event, tolerating absence. */
export function extractReason(event: { reason?: unknown } | undefined): string | undefined {
  return typeof event?.reason === "string" ? event.reason : undefined;
}
