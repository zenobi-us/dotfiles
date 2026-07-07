/**
 * PI HostAdapter implementation. Provides the runtime-facing surface that the
 * core hooks runtime calls into for bash execution, follow-up prompts, UI
 * notifications, confirmations, and status updates.
 *
 * Extracted from the original `adapter.ts` as part of the P0/P1 refactor; the
 * behaviour is unchanged and the public symbol (`createHostAdapter`) is still
 * re-exported through `./adapter.ts` so existing import sites continue to work.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

import { executeBashHook } from "../core/bash-executor.js";
import type { BashExecutionRequest, BashHookResult } from "../core/bash-types.js";
import { getPiHooksLogger } from "../core/logger.js";
import type { HookNotifyLevel, HostAdapter, HostDeliveryResult } from "../core/types.js";
import { getRootSessionId } from "./session-lineage.js";

/**
 * P3-2: prefer the SDK's `ReadonlySessionManager` shape via the canonical
 * accessor on `ExtensionContext`. The SDK defines `ReadonlySessionManager`
 * in `core/session-manager.ts` but does not re-export it from the package
 * root, and `package.json#exports` blocks deep subpath imports under
 * `moduleResolution: "NodeNext"`. Indexing `ExtensionContext["sessionManager"]`
 * is the SDK's only public surface for this type, so we use it directly
 * rather than maintain a hand-rolled `Pick<SessionManager, ...>` mirror.
 */
export type ReadonlySessionManager = ExtensionContext["sessionManager"];

export function createHostAdapter(
  pi: ExtensionAPI,
  projectDir: string,
  getSessionManager: () => ReadonlySessionManager | undefined,
  getContext: () => ExtensionContext | undefined,
): HostAdapter {
  const logger = getPiHooksLogger();
  // Once-per-missing-capability warning flags. We log a single warning per
  // process lifetime instead of spamming on every hook invocation when the
  // host's UI surface is absent (ctx.hasUI is false) or ctx has not yet been
  // captured before the first event. RPC mode can expose UI in Pi >=0.79, so
  // UI actions are capability-gated by ctx.hasUI/ctx.ui methods, not mode.
  let warnedNoNotify = false;
  let warnedNoConfirm = false;
  let warnedNoSetStatus = false;

  return {
    // PI only exposes abort on the current ExtensionContext; we do not have
    // a cross-session abort channel. When the runtime asks us to abort a
    // session that isn't the currently-active one, the call is a no-op.
    // The runtime's `action: stop` handling triggers this from inside a handler,
    // at which point the current ctx IS the right session, so the common
    // case works.
    abort: (sessionId: string) => {
      // P2 #20: surface a debug line so operators relying on `action: stop`
      // for tool.after.* / session.idle hooks can see why the session
      // wasn't aborted (PI has no extension-side abort outside tool_call).
      debugLog(
        `abort requested for session ${sessionId}: handled via tool_call block result for pre-tool hooks; ` +
          `action: stop on tool.after.* or session.idle is a no-op on PI.`,
      );
    },
    getRootSessionId: (sessionId: string): string => getRootSessionId(sessionId, getSessionManager()),
    runBash: (request: BashExecutionRequest): Promise<BashHookResult> =>
      executeBashHook({ ...request, projectDir: request.projectDir || projectDir }),
    sendPrompt: (sessionId: string, text: string): HostDeliveryResult => {
      // PI's sendUserMessage always targets the current session. For tool:
      // actions runIn: "current" this matches the runtime's intent; runIn:
      // "main" cannot be honoured from a subprocess-less extension and is
      // treated the same as "current".
      // P2-8 fix: check sessions match BEFORE calling sendUserMessage.
      // Previously the call was made first and then the result was
      // downgraded if the session mismatched, which queued a follow-up
      // prompt in the WRONG session as a side effect. Skip the call when
      // the live session does not match the requested target — the runtime
      // can degrade gracefully instead.
      const currentSessionId = safeGetSessionId(getSessionManager());
      if (!currentSessionId || currentSessionId !== sessionId) {
        const detail = {
          requestedSessionId: sessionId,
          ...(currentSessionId ? { currentSessionId } : {}),
          text,
        };
        logger.debug(
          "host_send_prompt",
          "Skipped sendUserMessage because the live PI session no longer matches the hook's target.",
          {
            cwd: projectDir,
            details: detail,
          },
        );
        return {
          status: "degraded",
          reason: "current_session_only",
          details: {
            requestedSessionId: sessionId,
            ...(currentSessionId ? { currentSessionId } : {}),
          },
        };
      }

      try {
        pi.sendUserMessage(text, { deliverAs: "followUp" });
        logger.info("host_send_prompt", "Queued follow-up prompt in the current PI session.", {
          cwd: projectDir,
          details: { sessionId, text },
        });
        return { status: "accepted" };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("host_send_prompt", "sendUserMessage failed.", {
          cwd: projectDir,
          details: { text, error: message, staleSessionContext: isStaleSessionBoundError(error) },
        });
        if (isStaleSessionBoundError(error)) {
          return {
            status: "degraded",
            reason: "stale_session_context",
            details: { text, error: message },
          };
        }
        throw new Error(`sendUserMessage failed: ${message}`);
      }
    },
    notify: (text: string, level?: HookNotifyLevel): HostDeliveryResult => {
      // PI's ctx.ui.notify only supports "info" | "warning" | "error".
      // We collapse our "success" level into "info" so the YAML schema
      // stays aligned with common notification systems; if PI adds a
      // native success level in the future we'll forward it verbatim.
      const ctx = getContext();
      if (!ctx?.hasUI || typeof ctx.ui?.notify !== "function") {
        if (!warnedNoNotify) {
          // eslint-disable-next-line no-console
          console.warn(
            "[pi-hooks] notify action skipped: PI UI surface unavailable for this context.",
          );
          logger.warn("host_notify", "notify action skipped because PI UI surface is unavailable.", {
            cwd: projectDir,
          });
          warnedNoNotify = true;
        }
        return {
          status: "degraded",
          reason: "ui_unavailable",
          details: { text, level: level ?? "info" },
        };
      }
      const piLevel: "info" | "warning" | "error" =
        level === "warning" || level === "error" ? level : "info";
      try {
        ctx.ui.notify(text, piLevel);
        logger.info("host_notify", "Delivered UI notification.", {
          cwd: projectDir,
          details: { text, level: piLevel },
        });
        return { status: "accepted" };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("host_notify", "UI notification failed.", {
          cwd: projectDir,
          details: { text, level: piLevel, error: message, staleSessionContext: isStaleSessionBoundError(error) },
        });
        if (isStaleSessionBoundError(error)) {
          return {
            status: "degraded",
            reason: "stale_session_context",
            details: { text, level: piLevel, error: message },
          };
        }
        throw new Error(`ui.notify failed: ${message}`);
      }
    },
    confirm: async (options: { title?: string; message: string }): Promise<boolean> => {
      const ctx = getContext();
      if (!ctx?.hasUI || typeof ctx.ui?.confirm !== "function") {
        if (!warnedNoConfirm) {
          // eslint-disable-next-line no-console
          console.warn(
            "[pi-hooks] confirm action denied: PI UI surface unavailable for this context. " +
              "confirm: hooks fail closed in headless mode so destructive operations are not silently auto-approved. " +
              "Set PI_YAML_HOOKS_CONFIRM_AUTO_APPROVE=1 to override.",
          );
          logger.warn("host_confirm", "confirm action denied because PI UI surface is unavailable.", {
            cwd: projectDir,
            details: { autoApprove: process.env.PI_YAML_HOOKS_CONFIRM_AUTO_APPROVE === "1" },
          });
          warnedNoConfirm = true;
        }
        // P1 #5 fix: fail closed in headless mode. Returning false routes
        // through the runtime's block path for pre-tool hooks. Operators who
        // explicitly want to keep the old behavior can opt back in.
        return process.env.PI_YAML_HOOKS_CONFIRM_AUTO_APPROVE === "1";
      }
      try {
        // PI's confirm takes (title, message) as positional args; title is
        // required on the PI side, so we synthesize a neutral default when
        // the YAML omits it.
        const approved = await ctx.ui.confirm(options.title ?? "Confirm", options.message);
        logger.info("host_confirm", "Completed UI confirmation request.", {
          cwd: projectDir,
          details: { title: options.title ?? "Confirm", message: options.message, approved },
        });
        return approved;
      } catch (error) {
        logger.error("host_confirm", "UI confirmation failed.", {
          cwd: projectDir,
          details: { title: options.title ?? "Confirm", message: options.message, error: error instanceof Error ? error.message : String(error) },
        });
        debugLog(`ui.confirm failed: ${error instanceof Error ? error.message : String(error)}`);
        // Errors from the UI surface (dismissed, aborted) fall through as
        // "not approved" so the runtime's block semantics still fire when
        // the hook is pre-tool.
        return false;
      }
    },
    setStatus: (hookId: string, text: string): HostDeliveryResult => {
      const ctx = getContext();
      if (!ctx?.hasUI || typeof ctx.ui?.setStatus !== "function") {
        if (!warnedNoSetStatus) {
          // eslint-disable-next-line no-console
          console.warn(
            "[pi-hooks] setStatus action skipped: PI UI surface unavailable for this context.",
          );
          logger.warn("host_set_status", "setStatus action skipped because PI UI surface is unavailable.", {
            cwd: projectDir,
          });
          warnedNoSetStatus = true;
        }
        return {
          status: "degraded",
          reason: "ui_unavailable",
          details: { hookId, text },
        };
      }
      try {
        // PI clears a status slot when text is undefined. We expose a plain
        // string-only API at the hook layer and collapse empty strings to
        // "clear" so YAML authors can write `setStatus: ""` to reset.
        ctx.ui.setStatus(hookId, text.length > 0 ? text : undefined);
        logger.info("host_set_status", "Updated PI status surface.", {
          cwd: projectDir,
          details: { hookId, text },
        });
        return { status: "accepted" };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("host_set_status", "Updating PI status surface failed.", {
          cwd: projectDir,
          details: { hookId, text, error: message, staleSessionContext: isStaleSessionBoundError(error) },
        });
        if (isStaleSessionBoundError(error)) {
          return {
            status: "degraded",
            reason: "stale_session_context",
            details: { hookId, text, error: message },
          };
        }
        throw new Error(`ui.setStatus failed: ${message}`);
      }
    },
  };
}

/**
 * Read a session id from a (possibly missing) PI `ReadonlySessionManager`,
 * tolerating both throws and empty strings. Used by the adapter handlers and
 * the host adapter's `sendPrompt` to detect session replacement.
 */
export function safeGetSessionId(sessionManager: ReadonlySessionManager | undefined): string | undefined {
  if (!sessionManager) return undefined;
  try {
    const id = sessionManager.getSessionId();
    return typeof id === "string" && id.length > 0 ? id : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Heuristic detection of stale-session errors emitted by the PI SDK when an
 * extension uses a captured `ctx`/`pi` after `newSession`/`fork`/`switchSession`/`reload`.
 * Pinned by `adapter.test.ts` against known SDK error messages so it does not
 * silently drift if the SDK rewrites the wording (P2-9).
 */
export function isStaleSessionBoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /stale|invalidated|replaced session|session-bound/i.test(message);
}

export function debugLog(message: string): void {
  if (process.env.PI_YAML_HOOKS_DEBUG) {
    getPiHooksLogger().debug("adapter_debug", message);
    // eslint-disable-next-line no-console
    console.warn(`[pi-hooks] ${message}`);
  }
}
