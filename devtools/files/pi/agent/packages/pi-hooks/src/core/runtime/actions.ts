/**
 * Action execution extracted from runtime.ts.
 *
 * The original runtime ran a long `if ("command" in action) ... if ("tool"
 * in action) ...` cascade. This module preserves the exact per-action
 * behaviour but routes dispatch through a Record-keyed table indexed by
 * the discriminator key on `HookAction`. Adding a new action variant now
 * means adding one entry to `ACTION_HANDLERS` and one branch to
 * `getActionType`/`getActionDetails`.
 *
 * Every handler returns a `HookExecutionResult`. Only `confirm` can
 * surface `blocked: true`; the rest swallow handler errors to avoid
 * pinning the dispatch loop on a misconfigured action.
 */

import type { AsyncLocalStorage } from "node:async_hooks"

import { redactSensitiveContent } from "../bash-executor.js"
import { getPiHooksLogger } from "../logger.js"
import type {
  HookExecutionResult,
  RuntimeActionContext,
} from "../runtime.js"
import { withActionRecursionGuard } from "./recursion-guard.js"
import { sanitizeToolArgsForSerialization, type SessionStateStore } from "../session-state.js"
import type { BashExecutionRequest, BashHookResult } from "../bash-types.js"
import type {
  HookAction,
  HookEvent,
  HookRunIn,
  HostAdapter,
  HostDeliveryResult,
} from "../types.js"

type ExecuteBashHook = (request: BashExecutionRequest) => Promise<BashHookResult>

/**
 * Inputs every action handler receives. The shape mirrors the parameter
 * list of the original `executeAction` so handlers can be swapped between
 * cascade and table dispatch without behavioural drift.
 */
interface ActionContext {
  readonly action: HookAction
  readonly runIn: HookRunIn
  readonly host: HostAdapter
  readonly projectDir: string
  readonly state: SessionStateStore
  readonly runBashHook: ExecuteBashHook
  readonly event: HookEvent
  readonly sessionID: string
  readonly context: RuntimeActionContext
  readonly sourceFilePath: string
  readonly hookId: string
  readonly actionRecursionGuards: AsyncLocalStorage<Set<string>>
  readonly actionType: string
  readonly logger: ReturnType<typeof getPiHooksLogger>
}

type ActionHandler = (input: ActionContext) => Promise<HookExecutionResult>

/**
 * Discriminator keys on `HookAction`. Each variant is identified by the
 * key its config carries (`{ bash: ... }`, `{ tool: ... }`, etc.). The
 * dispatch table keys on this discriminator and routes to the matching
 * handler.
 */
type ActionKind = "command" | "tool" | "notify" | "confirm" | "setStatus" | "bash"

export async function executeAction(
  action: HookAction,
  runIn: HookRunIn,
  host: HostAdapter,
  projectDir: string,
  state: SessionStateStore,
  runBashHook: ExecuteBashHook,
  event: HookEvent,
  sessionID: string,
  context: RuntimeActionContext,
  sourceFilePath: string,
  hookId: string,
  actionRecursionGuards: AsyncLocalStorage<Set<string>>,
): Promise<HookExecutionResult> {
  const logger = getPiHooksLogger()
  const actionType = getActionType(action)

  logger.debug("action_start", "Starting hook action.", {
    cwd: projectDir,
    event,
    sessionId: sessionID,
    hookId,
    hookSource: sourceFilePath,
    action: actionType,
    details: getActionDetails(action),
  })

  const handler = ACTION_HANDLERS[actionType as ActionKind]
  return await handler({
    action,
    runIn,
    host,
    projectDir,
    state,
    runBashHook,
    event,
    sessionID,
    context,
    sourceFilePath,
    hookId,
    actionRecursionGuards,
    actionType,
    logger,
  })
}

const handleCommand: ActionHandler = async ({ event, sessionID, projectDir, hookId, sourceFilePath, actionType, logger }) => {
  const error = new Error("command: actions are not supported on PI — remove this action or use bash instead")
  logger.error("action_result", "Unsupported command action encountered.", {
    cwd: projectDir,
    event,
    sessionId: sessionID,
    hookId,
    hookSource: sourceFilePath,
    action: actionType,
    details: { error: error.message },
  })
  logHookFailure(event, sourceFilePath, error)
  return { blocked: false }
}

const handleTool: ActionHandler = async ({
  action,
  runIn,
  host,
  projectDir,
  state,
  event,
  sessionID,
  sourceFilePath,
  hookId,
  actionRecursionGuards,
  actionType,
  logger,
}) => {
  if (!("tool" in action)) {
    return { blocked: false }
  }

  try {
    const targetSessionID = await resolveActionSessionID(state, host, sessionID, runIn)
    if (!targetSessionID) {
      logger.warn("action_result", "Tool action skipped because target session is unavailable.", {
        cwd: projectDir,
        event,
        sessionId: sessionID,
        hookId,
        hookSource: sourceFilePath,
        action: actionType,
      })
      return { blocked: false }
    }

    const prompt = `Use the ${action.tool.name} tool with these arguments: ${JSON.stringify(action.tool.args ?? {})}`
    const actionKey = `${event}:${targetSessionID}:tool:${sourceFilePath}:${JSON.stringify(action.tool)}`
    let delivery: HostDeliveryResult = { status: "accepted" }
    await withActionRecursionGuard(actionRecursionGuards, actionKey, async () => {
      delivery = normalizeHostDeliveryResult(await host.sendPrompt(targetSessionID, prompt))
    })
    const deliveryDetails = {
      targetSessionID,
      prompt,
      args: action.tool.args ?? {},
      ...(delivery.reason ? { reason: delivery.reason } : {}),
      ...(delivery.details ? delivery.details : {}),
    }
    if (delivery.status === "degraded") {
      logger.warn("action_result", "Tool action degraded before the follow-up prompt was accepted.", {
        cwd: projectDir,
        event,
        sessionId: sessionID,
        hookId,
        hookSource: sourceFilePath,
        action: actionType,
        toolName: action.tool.name,
        details: deliveryDetails,
      })
    } else {
      logger.info("action_result", "Tool action queued a follow-up prompt.", {
        cwd: projectDir,
        event,
        sessionId: sessionID,
        hookId,
        hookSource: sourceFilePath,
        action: actionType,
        toolName: action.tool.name,
        details: deliveryDetails,
      })
    }
  } catch (error) {
    logger.error("action_result", "Tool action failed.", {
      cwd: projectDir,
      event,
      sessionId: sessionID,
      hookId,
      hookSource: sourceFilePath,
      action: actionType,
      details: { error: error instanceof Error ? error.message : String(error) },
    })
    logHookFailure(event, sourceFilePath, error)
  }

  return { blocked: false }
}

const handleNotify: ActionHandler = async ({
  action,
  host,
  projectDir,
  event,
  sessionID,
  sourceFilePath,
  hookId,
  actionType,
  logger,
}) => {
  if (!("notify" in action)) {
    return { blocked: false }
  }

  try {
    const config = typeof action.notify === "string" ? { text: action.notify } : action.notify
    const level = config.level ?? "info"
    if (typeof host.notify === "function") {
      const delivery = normalizeHostDeliveryResult(await host.notify(config.text, level))
      const deliveryDetails = {
        text: config.text,
        level,
        ...(delivery.reason ? { reason: delivery.reason } : {}),
        ...(delivery.details ? delivery.details : {}),
      }
      if (delivery.status === "degraded") {
        logger.warn("action_result", "Notification action degraded before the host accepted it.", {
          cwd: projectDir,
          event,
          sessionId: sessionID,
          hookId,
          hookSource: sourceFilePath,
          action: actionType,
          details: deliveryDetails,
        })
      } else {
        logger.info("action_result", "Notification action delivered.", {
          cwd: projectDir,
          event,
          sessionId: sessionID,
          hookId,
          hookSource: sourceFilePath,
          action: actionType,
          details: deliveryDetails,
        })
      }
    } else {
      console.warn(`[pi-hooks] notify action skipped (host.notify not implemented): ${config.text}`)
      logger.warn("action_result", "Notification action skipped because host.notify is unavailable.", {
        cwd: projectDir,
        event,
        sessionId: sessionID,
        hookId,
        hookSource: sourceFilePath,
        action: actionType,
        details: { text: config.text, level },
      })
    }
  } catch (error) {
    logger.error("action_result", "Notification action failed.", {
      cwd: projectDir,
      event,
      sessionId: sessionID,
      hookId,
      hookSource: sourceFilePath,
      action: actionType,
      details: { error: error instanceof Error ? error.message : String(error) },
    })
    logHookFailure(event, sourceFilePath, error)
  }
  return { blocked: false }
}

const handleConfirm: ActionHandler = async ({
  action,
  host,
  projectDir,
  event,
  sessionID,
  sourceFilePath,
  hookId,
  actionType,
  logger,
}) => {
  if (!("confirm" in action)) {
    return { blocked: false }
  }

  try {
    if (typeof host.confirm === "function") {
      const approved = await host.confirm({
        ...(action.confirm.title !== undefined ? { title: action.confirm.title } : {}),
        message: action.confirm.message,
      })
      logger.info("action_result", "Confirmation action completed.", {
        cwd: projectDir,
        event,
        sessionId: sessionID,
        hookId,
        hookSource: sourceFilePath,
        action: actionType,
        details: { title: action.confirm.title, message: action.confirm.message, approved },
      })
      if (!approved) {
        return { blocked: true, blockReason: "Blocked by user via confirm action" }
      }
    } else {
      console.warn(`[pi-hooks] confirm action skipped (host.confirm not implemented): ${action.confirm.message}`)
      logger.warn("action_result", "Confirmation action skipped because host.confirm is unavailable.", {
        cwd: projectDir,
        event,
        sessionId: sessionID,
        hookId,
        hookSource: sourceFilePath,
        action: actionType,
        details: { title: action.confirm.title, message: action.confirm.message },
      })
    }
  } catch (error) {
    logger.error("action_result", "Confirmation action failed.", {
      cwd: projectDir,
      event,
      sessionId: sessionID,
      hookId,
      hookSource: sourceFilePath,
      action: actionType,
      details: { error: error instanceof Error ? error.message : String(error) },
    })
    logHookFailure(event, sourceFilePath, error)
  }
  return { blocked: false }
}

const handleSetStatus: ActionHandler = async ({
  action,
  host,
  projectDir,
  event,
  sessionID,
  sourceFilePath,
  hookId,
  actionType,
  logger,
}) => {
  if (!("setStatus" in action)) {
    return { blocked: false }
  }

  try {
    const config = typeof action.setStatus === "string" ? { text: action.setStatus } : action.setStatus
    if (typeof host.setStatus === "function") {
      const statusHookId = getStatusSlotKey(hookId, sourceFilePath)
      const delivery = normalizeHostDeliveryResult(await host.setStatus(statusHookId, config.text))
      const deliveryDetails = {
        statusHookId,
        text: config.text,
        ...(delivery.reason ? { reason: delivery.reason } : {}),
        ...(delivery.details ? delivery.details : {}),
      }
      if (delivery.status === "degraded") {
        logger.warn("action_result", "Status action degraded before the host accepted it.", {
          cwd: projectDir,
          event,
          sessionId: sessionID,
          hookId,
          hookSource: sourceFilePath,
          action: actionType,
          details: deliveryDetails,
        })
      } else {
        logger.info("action_result", "Status action updated the PI status surface.", {
          cwd: projectDir,
          event,
          sessionId: sessionID,
          hookId,
          hookSource: sourceFilePath,
          action: actionType,
          details: deliveryDetails,
        })
      }
    } else {
      console.warn(`[pi-hooks] setStatus action skipped (host.setStatus not implemented): ${config.text}`)
      logger.warn("action_result", "Status action skipped because host.setStatus is unavailable.", {
        cwd: projectDir,
        event,
        sessionId: sessionID,
        hookId,
        hookSource: sourceFilePath,
        action: actionType,
        details: { text: config.text },
      })
    }
  } catch (error) {
    logger.error("action_result", "Status action failed.", {
      cwd: projectDir,
      event,
      sessionId: sessionID,
      hookId,
      hookSource: sourceFilePath,
      action: actionType,
      details: { error: error instanceof Error ? error.message : String(error) },
    })
    logHookFailure(event, sourceFilePath, error)
  }
  return { blocked: false }
}

const handleBash: ActionHandler = async ({
  action,
  projectDir,
  runBashHook,
  event,
  sessionID,
  context,
  sourceFilePath,
  hookId,
  actionType,
  logger,
}) => {
  if (!("bash" in action)) {
    return { blocked: false }
  }

  const executionDirectory = projectDir
  const config = typeof action.bash === "string" ? { command: action.bash } : action.bash
  const result = await runBashHook({
    command: config.command,
    timeout: config.timeout,
    projectDir: executionDirectory,
    context: {
      session_id: sessionID,
      event,
      cwd: executionDirectory,
      files: context.files,
      changes: context.changes,
      tool_name: context.toolName,
      tool_args: sanitizeToolArgsForSerialization(context.toolArgs),
    },
  })

  logger.info("action_result", "Bash action completed.", {
    cwd: projectDir,
    event,
    sessionId: sessionID,
    hookId,
    hookSource: sourceFilePath,
    action: actionType,
    details: {
      command: config.command,
      timeout: config.timeout,
      status: result.status,
      exitCode: result.exitCode,
      blocking: result.blocking,
      durationMs: result.durationMs,
      stdout: redactSensitiveContent(result.stdout),
      stderr: redactSensitiveContent(result.stderr),
    },
  })

  if (result.blocking) {
    return { blocked: true, blockReason: redactSensitiveContent(result.stderr.trim()) || "Blocked by hook" }
  }

  return { blocked: false }
}

const ACTION_HANDLERS: Record<ActionKind, ActionHandler> = {
  command: handleCommand,
  tool: handleTool,
  notify: handleNotify,
  confirm: handleConfirm,
  setStatus: handleSetStatus,
  bash: handleBash,
}

export async function resolveActionSessionID(
  state: SessionStateStore,
  host: HostAdapter,
  sessionID: string,
  runIn: HookRunIn,
): Promise<string | undefined> {
  const targetSessionID =
    runIn === "main"
      ? await state.getRootSessionID(sessionID, (currentSessionID) => resolveParentSessionID(host, currentSessionID))
      : sessionID

  return state.isDeleted(targetSessionID) ? undefined : targetSessionID
}

export async function resolveParentSessionID(host: HostAdapter, sessionID: string): Promise<string | null> {
  // The host only exposes a root-session lookup, so callers that need a parent
  // fall back to "is this already the root?" as a best-effort parent resolver.
  try {
    const rootID = await host.getRootSessionId(sessionID)
    return rootID && rootID !== sessionID ? rootID : null
  } catch {
    return null
  }
}

export function getActionType(action: HookAction): string {
  if ("command" in action) return "command"
  if ("tool" in action) return "tool"
  if ("bash" in action) return "bash"
  if ("notify" in action) return "notify"
  if ("confirm" in action) return "confirm"
  return "setStatus"
}

export function getActionDetails(action: HookAction): Record<string, unknown> {
  if ("command" in action) {
    return { command: action.command }
  }

  if ("tool" in action) {
    return { name: action.tool.name, args: action.tool.args ?? {} }
  }

  if ("bash" in action) {
    const config = typeof action.bash === "string" ? { command: action.bash } : action.bash
    return { command: config.command, timeout: config.timeout }
  }

  if ("notify" in action) {
    const config = typeof action.notify === "string" ? { text: action.notify } : action.notify
    return { text: config.text, level: config.level ?? "info" }
  }

  if ("confirm" in action) {
    return { title: action.confirm.title, message: action.confirm.message }
  }

  const config = typeof action.setStatus === "string" ? { text: action.setStatus } : action.setStatus
  return { text: config.text }
}

export function getStatusSlotKey(hookId: string, _sourceFilePath: string): string {
  // P3 #28: previously suffixed with sourceFilePath, which meant a hooks file
  // move (rename, dir reshuffle) caused the host's status slot to be
  // orphaned and re-created. Key on the stable hookId only so a renamed
  // hooks.yaml keeps its slot. Hook IDs are user-supplied via `id:` and
  // namespaced via `${filePath}#hooks[idx]` when missing — the latter still
  // changes on file move, in which case the slot is intentionally
  // drop-and-recreate (the hook has no stable identity to track).
  return `pi-hooks:${hookId}`
}

export function logHookFailure(event: HookEvent, filePath: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  getPiHooksLogger().error("hook_error", "Hook execution failed.", {
    event,
    hookSource: filePath,
    details: { error: message },
  })
  console.error(`[pi-hooks] ${event} hook from ${filePath} failed: ${message}`)
}

export function normalizeHostDeliveryResult(result: void | HostDeliveryResult | undefined): HostDeliveryResult {
  if (
    result &&
    typeof result === "object" &&
    (result.status === "accepted" || result.status === "degraded")
  ) {
    return result
  }

  return { status: "accepted" }
}

// P2-10 helper: classify a thrown idle-dispatch error as transient
// (host-died-style) vs. terminal (hook-no). Host-died errors are kept for
// replay; everything else is consumed so a poisonous hook does not pin the
// session in an infinite re-dispatch loop. We match a small set of
// well-known IPC/socket failure shapes plus errors that explicitly tag
// themselves with `code` strings the PI host emits when it goes down.
export function isHostDiedError(error: unknown): boolean {
  if (error === null || typeof error !== "object") {
    return false
  }
  const code = (error as { code?: unknown }).code
  if (typeof code === "string") {
    if (
      code === "ECONNREFUSED" ||
      code === "ECONNRESET" ||
      code === "EPIPE" ||
      code === "ENOTCONN" ||
      code === "EHOSTDOWN" ||
      code === "ESHUTDOWN" ||
      code === "HOST_DIED" ||
      code === "HOST_DISCONNECTED"
    ) {
      return true
    }
  }
  const message = error instanceof Error ? error.message : String((error as { message?: unknown }).message ?? "")
  if (typeof message === "string" && message.length > 0) {
    const lowered = message.toLowerCase()
    return (
      lowered.includes("host died") ||
      lowered.includes("host disconnected") ||
      lowered.includes("connection refused") ||
      lowered.includes("connection reset") ||
      lowered.includes("broken pipe") ||
      lowered.includes("socket hang up") ||
      lowered.includes("not connected")
    )
  }
  return false
}

export async function abortSession(host: HostAdapter, sessionID: string): Promise<void> {
  try {
    await host.abort(sessionID)
  } catch (error) {
    // P2-11 fix: route abort failures through the structured logger so
    // operators tailing ~/.pi/agent/log/hooks.log see the failure with
    // sessionID and error context. Previously the raw console.error
    // bypassed the logger entirely, which made tail-hook-log workflows
    // miss aborted-session signals.
    const message = error instanceof Error ? error.message : String(error)
    getPiHooksLogger().error("session_abort_failed", "Failed to abort session.", {
      sessionId: sessionID,
      details: { error: message },
    })
  }
}
