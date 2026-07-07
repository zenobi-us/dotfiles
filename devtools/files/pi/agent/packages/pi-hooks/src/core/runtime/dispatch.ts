/**
 * Dispatch layer extracted from runtime.ts.
 *
 * Owns the hook bucket lookup, alias-deduped tool dispatch (P1-14),
 * single-flight + queueing per `(event, sessionID)` (P1-13, P2 #23), and
 * the `executeHook` -> `executeAction` invocation chain. Behaviour is
 * preserved verbatim from the pre-split implementation. The runtime
 * passes its mutable state (dispatchStates, asyncQueues,
 * actionRecursionGuards, the bound glob matcher) and a host adapter into
 * the entry points.
 */

import type { AsyncLocalStorage } from "node:async_hooks"

import type { BashExecutionRequest, BashHookResult } from "../bash-types.js"
import { getPiHooksLogger } from "../logger.js"
import {
  executeAction,
  logHookFailure,
} from "./actions.js"
import {
  enqueueAsyncHook,
  resolveAsyncExecutionConfig,
  type AsyncQueueState,
} from "./async-queue.js"
import {
  buildPathMatchContext,
  defaultGlobMatcher,
  evaluatePathConditions,
  type GlobMatcher,
} from "./path-filter.js"
import { resolveParentSessionID } from "./actions.js"
import type {
  HookExecutionResult,
  HookMatchDecision,
  RuntimeActionContext,
} from "../runtime.js"
import type { SessionStateStore } from "../session-state.js"
import { getMutationToolHookNames } from "../tool-paths.js"
import type {
  FileChange,
  HookConfig,
  HookEvent,
  HookMap,
  HostAdapter,
} from "../types.js"

type ExecuteBashHook = (request: BashExecutionRequest) => Promise<BashHookResult>

export interface DispatchState {
  active: boolean
  pending: DispatchRequest[]
}

export interface DispatchRequest {
  readonly context: RuntimeActionContext
  readonly options: { canBlock?: boolean }
  readonly resolve?: (result: HookExecutionResult) => void
  readonly reject?: (error: unknown) => void
  // P1-13 fix: capture the AsyncLocalStorage store at park time so the
  // queued execution re-enters the *enqueueing* dispatch's recursion-guard
  // frame on drain. Without this, drained requests run under whatever the
  // initial-dispatch's frame happens to be (often a fresh, empty Set), and
  // the per-action dedup keys leak across unrelated dispatch chains.
  readonly recursionGuardStore?: Set<string>
}

export async function dispatchToolHooks(
  hooks: HookMap,
  state: SessionStateStore,
  host: HostAdapter,
  projectDir: string,
  runBashHook: ExecuteBashHook,
  dispatchStates: Map<string, DispatchState>,
  actionRecursionGuards: AsyncLocalStorage<Set<string>>,
  asyncQueues: Map<string, AsyncQueueState>,
  warnedAsyncStopSources: Set<string>,
  phase: "before" | "after",
  toolName: string,
  sessionID: string,
  context: RuntimeActionContext,
  globMatcher: GlobMatcher = defaultGlobMatcher,
): Promise<HookExecutionResult> {
  const wildcardResult = await dispatchHooks(
    hooks,
    state,
    host,
    projectDir,
    runBashHook,
    `tool.${phase}.*`,
    sessionID,
    context,
    { canBlock: phase === "before" },
    dispatchStates,
    actionRecursionGuards,
    asyncQueues,
    warnedAsyncStopSources,
    globMatcher,
  )
  if (wildcardResult.blocked) {
    return wildcardResult
  }

  // P1-14 fix: when a tool has multiple alias names (e.g. apply_patch resolves
  // to ["patch", "apply_patch"]), dispatching against each alias key fires
  // every hook bucket independently. A hook registered under `tool.after.patch`
  // and another under `tool.after.apply_patch` would both run for a single
  // apply_patch call even though they describe the same logical event.
  // Dedupe HookConfig instances across alias buckets by reference identity
  // and dispatch the union once under the canonical alias name (the last
  // entry in `resolvedNames`, which is the normalized form returned by
  // `normalizeMutationToolName`). Single-alias tools keep the original
  // single-pass behaviour.
  const mutationNames = getMutationToolHookNames(toolName);
  const resolvedNames = mutationNames.length > 0 ? mutationNames : [toolName];
  if (resolvedNames.length > 1) {
    const unionedHooks = collectUniqueHooksAcrossAliases(hooks, phase, resolvedNames)
    if (unionedHooks.length === 0) {
      return { blocked: false }
    }
    const canonicalEvent = `tool.${phase}.${resolvedNames[resolvedNames.length - 1]}` as HookEvent
    const aliasMap: HookMap = new Map()
    aliasMap.set(canonicalEvent, unionedHooks)
    return await dispatchHooks(
      aliasMap,
      state,
      host,
      projectDir,
      runBashHook,
      canonicalEvent,
      sessionID,
      context,
      { canBlock: phase === "before" },
      dispatchStates,
      actionRecursionGuards,
      asyncQueues,
      warnedAsyncStopSources,
      globMatcher,
    )
  }

  for (const resolvedToolName of resolvedNames) {
    const result = await dispatchHooks(
      hooks,
      state,
      host,
      projectDir,
      runBashHook,
      `tool.${phase}.${resolvedToolName}`,
      sessionID,
      context,
      { canBlock: phase === "before" },
      dispatchStates,
      actionRecursionGuards,
      asyncQueues,
      warnedAsyncStopSources,
      globMatcher,
    )

    if (result.blocked) {
      return result
    }
  }

  return { blocked: false }
}

function collectUniqueHooksAcrossAliases(
  hooks: HookMap,
  phase: "before" | "after",
  aliasNames: readonly string[],
): HookConfig[] {
  const seen = new Set<HookConfig>()
  const out: HookConfig[] = []
  for (const aliasName of aliasNames) {
    const eventKey = `tool.${phase}.${aliasName}` as HookEvent
    const bucket = hooks.get(eventKey)
    if (!bucket) continue
    for (const hook of bucket) {
      if (seen.has(hook)) continue
      seen.add(hook)
      out.push(hook)
    }
  }
  return out
}

export async function dispatchHooks(
  hooks: HookMap,
  state: SessionStateStore,
  host: HostAdapter,
  projectDir: string,
  runBashHook: ExecuteBashHook,
  event: HookEvent,
  sessionID: string,
  context: RuntimeActionContext = {},
  options: { canBlock?: boolean } = {},
  dispatchStates: Map<string, DispatchState>,
  actionRecursionGuards: AsyncLocalStorage<Set<string>>,
  asyncQueues: Map<string, AsyncQueueState>,
  warnedAsyncStopSources: Set<string>,
  globMatcher: GlobMatcher = defaultGlobMatcher,
): Promise<HookExecutionResult> {
  const eventHooks = hooks.get(event)
  if (!eventHooks || eventHooks.length === 0) {
    getPiHooksLogger().debug("dispatch_skip", "No hooks registered for event.", {
      cwd: projectDir,
      event,
      sessionId: sessionID,
      details: { files: context.files, changes: summarizeChanges(context.changes ?? []) },
    })
    return { blocked: false }
  }

  getPiHooksLogger().debug("dispatch_event", "Dispatching hooks for event.", {
    cwd: projectDir,
    event,
    sessionId: sessionID,
    details: { hookCount: eventHooks.length, files: context.files, changes: summarizeChanges(context.changes ?? []) },
  })

  const hooksForEvent = eventHooks

  const dispatchKey = `${event}:${sessionID}`
  const dispatchState = dispatchStates.get(dispatchKey)
  if (dispatchState?.active) {
    // P1-13 fix: snapshot the ALS recursion-guard store *now* so the queued
    // dispatch re-enters the same frame on drain. `getStore()` returns the
    // current Set if we are inside a withActionRecursionGuard run, or
    // `undefined` if no guard is active — both cases are safe to capture.
    const recursionGuardStore = actionRecursionGuards.getStore()
    if (!options.canBlock) {
      dispatchState.pending.push({ context, options, ...(recursionGuardStore ? { recursionGuardStore } : {}) })
      return { blocked: false }
    }

    return await new Promise<HookExecutionResult>((resolve, reject) => {
      dispatchState.pending.push({
        context,
        options,
        resolve,
        reject,
        ...(recursionGuardStore ? { recursionGuardStore } : {}),
      })
    })
  }

  const currentState = dispatchState ?? { active: false, pending: [] }
  currentState.active = true
  dispatchStates.set(dispatchKey, currentState)

  let currentResult: HookExecutionResult = { blocked: false }
  let currentError: unknown

  try {
    currentResult = await executeDispatchRequest({ context, options })
  } catch (error) {
    currentError = error
  }

  if (currentState.pending.length > 0) {
    // P2 #23 fix: previously the canBlock branch deferred drain via
    // setTimeout(..., 0) and returned synchronously. That created a window
    // where a fresh dispatch with the same key could race with the deferred
    // drain's `dispatchStates.delete(dispatchKey)`. Always await inline so
    // dispatch state lifetime is well-defined.
    await drainPendingRequests()
  } else {
    currentState.active = false
    currentState.pending = []
    dispatchStates.delete(dispatchKey)
  }

  if (currentError !== undefined) {
    throw currentError
  }

  return currentResult

  async function executeDispatchRequest(request: DispatchRequest): Promise<HookExecutionResult> {
    for (const hook of hooksForEvent) {
      const result = await executeHook(
        hook,
        state,
        host,
        projectDir,
        runBashHook,
        sessionID,
        prepareRuntimeActionContext(projectDir, request.context),
        request.options,
        actionRecursionGuards,
        asyncQueues,
        warnedAsyncStopSources,
        globMatcher,
      )
      if (result.blocked) {
        return result
      }
    }

    return { blocked: false }
  }

  async function drainPendingRequests(): Promise<void> {
    try {
      while (currentState.pending.length > 0) {
        const request = currentState.pending.shift()!

        try {
          // P1-13 fix: re-enter the recursion-guard frame that was active
          // when this request was parked. Without this, queued dispatches
          // resume under an empty Set (or whatever the *current* frame
          // happens to be) and the recursion guard either misses real
          // re-entries or falsely dedupes unrelated ones.
          const result = request.recursionGuardStore
            ? await actionRecursionGuards.run(request.recursionGuardStore, () => executeDispatchRequest(request))
            : await executeDispatchRequest(request)
          request.resolve?.(result)
        } catch (error) {
          request.reject?.(error)
        }
      }
    } finally {
      currentState.active = false
      currentState.pending = []
      dispatchStates.delete(dispatchKey)
    }
  }
}

async function executeHook(
  hook: HookConfig,
  state: SessionStateStore,
  host: HostAdapter,
  projectDir: string,
  runBashHook: ExecuteBashHook,
  sessionID: string,
  context: RuntimeActionContext,
  options: { canBlock?: boolean },
  actionRecursionGuards: AsyncLocalStorage<Set<string>>,
  asyncQueues: Map<string, AsyncQueueState>,
  warnedAsyncStopSources: Set<string>,
  globMatcher: GlobMatcher = defaultGlobMatcher,
): Promise<HookExecutionResult> {
  const logger = getPiHooksLogger()
  const hookId = getHookIdentifier(hook)
  let decision: HookMatchDecision

  logger.debug("hook_consider", "Evaluating hook against event context.", {
    cwd: projectDir,
    event: hook.event,
    sessionId: sessionID,
    hookId,
    hookSource: formatHookSource(hook),
    details: {
      scope: hook.scope,
      runIn: hook.runIn,
      async: hook.async === true,
      files: context.files,
      changes: summarizeChanges(context.changes ?? []),
      toolName: context.toolName,
    },
  })

  try {
    decision = await shouldRunHook(hook, state, host, projectDir, sessionID, context, globMatcher)
  } catch (error) {
    logger.error("hook_skip", "Hook evaluation failed.", {
      cwd: projectDir,
      event: hook.event,
      sessionId: sessionID,
      hookId,
      hookSource: formatHookSource(hook),
      details: { error: error instanceof Error ? error.message : String(error) },
    })
    logHookFailure(hook.event, hook.source.filePath, error)
    return { blocked: false }
  }

  if (!decision.matched) {
    logger.debug("hook_skip", "Hook did not match the current event context.", {
      cwd: projectDir,
      event: hook.event,
      sessionId: sessionID,
      hookId,
      hookSource: formatHookSource(hook),
      details: {
        reason: decision.reason,
        changedPaths: decision.changedPaths,
        ...decision.details,
      },
    })
    return { blocked: false }
  }

  logger.info("hook_match", "Hook matched the current event context.", {
    cwd: projectDir,
    event: hook.event,
    sessionId: sessionID,
    hookId,
    hookSource: formatHookSource(hook),
    details: {
      changedPaths: decision.changedPaths,
      files: context.files,
      changes: summarizeChanges(context.changes ?? []),
      toolName: context.toolName,
    },
  })

  if (hook.async) {
    // P1-15 runtime guard: async hooks cannot enforce `action: stop` because
    // the dispatch loop has already returned by the time the queued action
    // runs. The proper rejection belongs in load-hooks parseHookAction
    // (lane: core-loader); we surface a one-shot warning here so operators
    // notice the silent no-op without spamming on every dispatch.
    if (hook.action === "stop") {
      warnAsyncStopOnce(logger, hook, projectDir, warnedAsyncStopSources)
    }
    const asyncConfig = resolveAsyncExecutionConfig(hook, sessionID)
    enqueueAsyncHook(
      asyncQueues,
      asyncConfig,
      async () => {
        for (const action of hook.actions) {
          await executeAction(
            action,
            hook.runIn,
            host,
            projectDir,
            state,
            runBashHook,
            hook.event,
            sessionID,
            context,
            hook.source.filePath,
            hookId,
            actionRecursionGuards,
          )
        }
      },
      (error) => {
        logger.error("hook_async", "Async hook execution failed.", {
          cwd: projectDir,
          event: hook.event,
          sessionId: sessionID,
          hookId,
          hookSource: formatHookSource(hook),
          details: { error: error instanceof Error ? error.message : String(error) },
        })
        logHookFailure(hook.event, hook.source.filePath, error)
      },
      {
        onWarning: (warning) => {
          logger.warn("hook_async", "Async hook queue warning.", {
            cwd: projectDir,
            event: hook.event,
            sessionId: sessionID,
            hookId,
            hookSource: formatHookSource(hook),
            details: { ...warning },
          })
        },
      },
    )
    logger.debug("hook_async", "Queued hook for asynchronous execution.", {
      cwd: projectDir,
      event: hook.event,
      sessionId: sessionID,
      hookId,
      hookSource: formatHookSource(hook),
      details: {
        queueKey: asyncConfig.queueKey,
        concurrency: asyncConfig.concurrency,
        maxPending: process.env.PI_YAML_HOOKS_ASYNC_MAX_PENDING ?? "1000",
        watchdogMs: process.env.PI_YAML_HOOKS_ASYNC_WATCHDOG_MS ?? "disabled",
      },
    })
    return { blocked: false }
  }

  for (const action of hook.actions) {
    const result = await executeAction(
      action,
      hook.runIn,
      host,
      projectDir,
      state,
      runBashHook,
      hook.event,
      sessionID,
      context,
      hook.source.filePath,
      hookId,
      actionRecursionGuards,
    )
    if (result.blocked && options.canBlock) {
      logger.warn("hook_block", "Hook action blocked event execution.", {
        cwd: projectDir,
        event: hook.event,
        sessionId: sessionID,
        hookId,
        hookSource: formatHookSource(hook),
        details: { blockReason: result.blockReason, stopSession: hook.action === "stop" },
      })
      return {
        ...result,
        ...(hook.action === "stop" ? { stopSession: true } : {}),
      }
    }
  }

  return { blocked: false }
}

async function shouldRunHook(
  hook: HookConfig,
  state: SessionStateStore,
  host: HostAdapter,
  projectDir: string,
  sessionID: string,
  context: RuntimeActionContext,
  globMatcher: GlobMatcher,
): Promise<HookMatchDecision> {
  const pathMatchContext = context.pathMatchContext ?? buildPathMatchContext(projectDir, context)
  const changedPaths = pathMatchContext.changedPaths

  if (!(await state.evaluateScope(sessionID, hook.scope, (currentSessionID) => resolveParentSessionID(host, currentSessionID)))) {
    return {
      matched: false,
      reason: "scope_mismatch",
      changedPaths,
      details: { scope: hook.scope },
    }
  }

  const conditionFailure = evaluatePathConditions(hook, context, pathMatchContext, globMatcher)
  if (conditionFailure) {
    return conditionFailure
  }

  return { matched: true, reason: "matched", changedPaths }
}

function prepareRuntimeActionContext(projectDir: string, context: RuntimeActionContext): RuntimeActionContext {
  if (context.pathMatchContext) {
    return context
  }

  return {
    ...context,
    pathMatchContext: buildPathMatchContext(projectDir, context),
  }
}

function getHookIdentifier(hook: HookConfig): string {
  return hook.id ?? `${hook.source.filePath}#hooks[${hook.source.index}]`
}

function formatHookSource(hook: HookConfig): string {
  return `${hook.source.filePath}#hooks[${hook.source.index}]`
}

// P1-15 runtime guard: warn (once per hook source) when a hook combines
// `async: true` with `action: stop`. The async queue runs after the
// dispatch loop has already returned, so `action: stop` is silently
// dropped. Parse-time rejection should land in load-hooks; this warning
// is the runtime safety net. The dedup Set lives on the runtime instance
// so it does not leak across `createHooksRuntime` calls or in-process
// test runs.
function warnAsyncStopOnce(
  logger: ReturnType<typeof getPiHooksLogger>,
  hook: HookConfig,
  projectDir: string,
  warnedAsyncStopSources: Set<string>,
): void {
  const sourceKey = formatHookSource(hook)
  if (warnedAsyncStopSources.has(sourceKey)) {
    return
  }
  warnedAsyncStopSources.add(sourceKey)
  const message = `[pi-hooks] hook ${sourceKey} declares both async and action: stop; the stop directive is ignored because async hooks cannot block dispatch.`
  // eslint-disable-next-line no-console
  console.warn(message)
  logger.warn("hook_async_stop_ignored", "Async hook combined with action: stop; stop ignored.", {
    cwd: projectDir,
    event: hook.event,
    hookId: getHookIdentifier(hook),
    hookSource: formatHookSource(hook),
  })
}

export function summarizeChanges(changes: readonly FileChange[]): Array<Record<string, unknown>> {
  return changes.map((change) =>
    change.operation === "rename"
      ? { operation: change.operation, fromPath: change.fromPath, toPath: change.toPath }
      : { operation: change.operation, path: change.path },
  )
}
