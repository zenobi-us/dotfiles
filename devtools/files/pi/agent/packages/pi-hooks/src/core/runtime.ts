import { AsyncLocalStorage } from "node:async_hooks"
import { statSync } from "node:fs"

import { executeBashHook } from "./bash-executor.js"
import type { BashExecutionRequest, BashHookResult } from "./bash-types.js"
import { discoverHookConfigEntries } from "./config-paths.js"
import { loadDiscoveredHooksSnapshot } from "./load-hooks.js"
import { getPiHooksLogger } from "./logger.js"
import { abortSession, isHostDiedError } from "./runtime/actions.js"
import type { AsyncQueueState } from "./runtime/async-queue.js"
import {
  dispatchHooks,
  dispatchToolHooks,
  summarizeChanges,
  type DispatchState,
} from "./runtime/dispatch.js"
import {
  createGlobMatcherCache,
  getGlobMatcher,
  type GlobMatcher,
  type GlobMatcherCache,
} from "./runtime/path-filter.js"
import { SessionStateStore } from "./session-state.js"
import { getChangedPaths, getToolFileChanges } from "./tool-paths.js"
import type {
  FileChange,
  HookEvent,
  HookMap,
  HookValidationError,
  HostAdapter,
} from "./types.js"

export { buildPathMatchContext } from "./runtime/path-filter.js"

export interface ToolExecuteBeforeInput {
  readonly tool: string
  readonly sessionID?: string
  readonly callID: string
}

export interface ToolExecuteBeforeOutput {
  readonly args?: Record<string, unknown>
}

export interface ToolExecuteAfterInput {
  readonly tool: string
  readonly sessionID?: string
  readonly callID: string
  readonly args?: Record<string, unknown>
}

export interface RuntimeEventEnvelope {
  readonly event: {
    readonly type: string
    readonly properties?: Record<string, unknown>
  }
}

export interface RuntimeActionContext {
  readonly files?: readonly string[]
  readonly changes?: readonly FileChange[]
  readonly toolName?: string
  readonly toolArgs?: Record<string, unknown>
  readonly sourceSessionID?: string
  readonly targetSessionID?: string
  readonly pathMatchContext?: PathMatchContext
}

export interface PathMatchContext {
  readonly changedPaths: readonly string[]
  readonly hasCodeFiles: boolean
}

export interface HookExecutionResult {
  readonly blocked: boolean
  readonly blockReason?: string
  readonly stopSession?: boolean
}

export interface HookMatchDecision {
  readonly matched: boolean
  readonly reason: string
  readonly changedPaths: readonly string[]
  readonly details?: Record<string, unknown>
}

type ExecuteBashHook = (request: BashExecutionRequest) => Promise<BashHookResult>

export interface HooksRuntime {
  readonly "tool.execute.before": (
    input: ToolExecuteBeforeInput,
    output: ToolExecuteBeforeOutput,
  ) => Promise<void>
  readonly "tool.execute.after": (
    input: ToolExecuteAfterInput,
    output?: unknown,
  ) => Promise<void>
  readonly "user.bash.before": (input: ToolExecuteBeforeInput, output: ToolExecuteBeforeOutput) => Promise<void>
  readonly event: (envelope: RuntimeEventEnvelope) => Promise<void>
}

export interface CreateHooksRuntimeOptions {
  readonly directory: string
  readonly hooks?: HookMap
  readonly initialSignature?: string
  readonly reloadDiscoveredHooks?: boolean
  readonly executeBash?: ExecuteBashHook
}

export function createHooksRuntime(host: HostAdapter, options: CreateHooksRuntimeOptions): HooksRuntime {
  const projectDir = options.directory
  const logger = getPiHooksLogger()
  const shouldReloadDiscoveredHooks = options.reloadDiscoveredHooks === true

  let loaded = options.hooks
    ? {
        hooks: options.hooks,
        errors: [] as HookValidationError[],
        signature: options.initialSignature ?? "manual",
      }
    : loadDiscoveredHooksSnapshot({ projectDir })
  if (loaded.errors.length > 0) {
    console.error(formatHookLoadErrors(loaded.errors))
    logger.error("config_load", "Initial hook load reported validation errors.", {
      cwd: projectDir,
      details: {
        errors: loaded.errors.map((error) => ({
          filePath: error.filePath,
          path: error.path,
          message: error.message,
        })),
      },
    })
  }

  let hooks = loaded.hooks
  let lastLoadedSignature = loaded.signature
  let lastReportedInvalidSignature = loaded.errors.length > 0 ? loaded.signature : undefined
  // P1-1 fix: stat-only fingerprint computed from the most recently loaded
  // file set so refreshHooks can short-circuit without re-entering the
  // (heavier) load-hooks parsing path on every event. The fingerprint covers
  // the discovered roots PLUS any imports that the previous load resolved,
  // so editing an imported file still busts the cache. The first refresh
  // after construction uses the file set captured by the initial discovery
  // call above (or, for `options.hooks`, an empty set so the gate below
  // continues to short-circuit).
  let lastLoadedFiles: readonly string[] = options.hooks
    ? []
    : (loaded as { files?: readonly string[] }).files ?? []
  let lastStatFingerprint = computeStatFingerprint(lastLoadedFiles)
  const state = new SessionStateStore()
  const runBashHook: ExecuteBashHook = options.executeBash ?? ((request) => host.runBash(request))
  const dispatchStates = new Map<string, DispatchState>()
  const asyncQueues = new Map<string, AsyncQueueState>()
  const actionRecursionGuards = new AsyncLocalStorage<Set<string>>()
  // Per-runtime dedup set for the async + action: stop one-shot warning so
  // the warning does not leak across runtime instances or in-process tests.
  const warnedAsyncStopSources = new Set<string>()
  // P2-5 fix: per-runtime glob matcher cache. Rebuilt on hooks reload so a
  // changed pattern set does not retain stale match closures or stale
  // (path → boolean) entries.
  let globMatcherCache: GlobMatcherCache = createGlobMatcherCache(lastLoadedSignature)
  const boundGlobMatcher: GlobMatcher = (filePath, pattern) =>
    getGlobMatcher(globMatcherCache, pattern)(filePath)

  // Bind the per-runtime mutable state into invokers so the entry-point
  // handlers below can call dispatch with just the per-event arguments.
  // This is a pure refactor of the cascade-style call sites in the original
  // factory — every call still flows through the same exported
  // `dispatchHooks` / `dispatchToolHooks` functions in `runtime/dispatch.ts`.
  const invokeDispatchHooks = (
    activeHooks: HookMap,
    event: HookEvent,
    sessionID: string,
    context: RuntimeActionContext,
    options: { canBlock?: boolean } = {},
  ): Promise<HookExecutionResult> =>
    dispatchHooks(
      activeHooks,
      state,
      host,
      projectDir,
      runBashHook,
      event,
      sessionID,
      context,
      options,
      dispatchStates,
      actionRecursionGuards,
      asyncQueues,
      warnedAsyncStopSources,
      boundGlobMatcher,
    )

  const invokeDispatchToolHooks = (
    activeHooks: HookMap,
    phase: "before" | "after",
    toolName: string,
    sessionID: string,
    context: RuntimeActionContext,
  ): Promise<HookExecutionResult> =>
    dispatchToolHooks(
      activeHooks,
      state,
      host,
      projectDir,
      runBashHook,
      dispatchStates,
      actionRecursionGuards,
      asyncQueues,
      warnedAsyncStopSources,
      phase,
      toolName,
      sessionID,
      context,
      boundGlobMatcher,
    )

  function refreshHooks(): HookMap {
    if (options.hooks && !shouldReloadDiscoveredHooks) {
      return hooks
    }

    // P1-1 fix: compute a cheap stat fingerprint over the previously loaded
    // file set plus the currently discovered roots. If nothing has changed
    // we skip the YAML parse + import expansion entirely. Discovered roots
    // are included so a newly added (or removed) hooks.yaml still triggers
    // a real reload — `statSync` returns "missing" for absent paths, which
    // changes the fingerprint as expected.
    const discoveredEntries = discoverHookConfigEntries({ projectDir })
    const discoveredFiles = discoveredEntries.map((entry) => entry.filePath)
    const fingerprintFiles = mergeUnique(lastLoadedFiles, discoveredFiles)
    const nextStatFingerprint = computeStatFingerprint(fingerprintFiles)
    if (nextStatFingerprint === lastStatFingerprint && lastLoadedFiles.length > 0) {
      return hooks
    }

    const nextLoaded = loadDiscoveredHooksSnapshot({ projectDir })
    lastLoadedFiles = nextLoaded.files
    lastStatFingerprint = computeStatFingerprint(mergeUnique(nextLoaded.files, discoveredFiles))
    if (nextLoaded.signature === lastLoadedSignature) {
      return hooks
    }

    lastLoadedSignature = nextLoaded.signature
    if (nextLoaded.errors.length > 0) {
      if (lastReportedInvalidSignature !== nextLoaded.signature) {
        console.error(formatHookReloadErrors(nextLoaded.errors))
        logger.error("config_reload", "Hook reload failed; keeping last known good hooks.", {
          cwd: projectDir,
          details: {
            signature: nextLoaded.signature,
            errors: nextLoaded.errors.map((error) => ({
              filePath: error.filePath,
              path: error.path,
              message: error.message,
            })),
          },
        })
        lastReportedInvalidSignature = nextLoaded.signature
      }
      return hooks
    }

    hooks = nextLoaded.hooks
    // P2-5 fix: rebuild the glob-matcher cache on every successful reload
    // so newly added/removed conditions do not reuse stale match closures
    // and so the per-pattern result cache is dropped along with the old
    // hook set.
    globMatcherCache = createGlobMatcherCache(nextLoaded.signature)
    // P3 #23: prefer the precomputed loaded.files list over re-flattening the
    // hook map on every reload. The two are equivalent (both are the unique
    // file paths a hook came from), but `loaded.files` is built once during
    // discovery and avoids an O(hooks) flatten + dedupe on the hot path.
    logger.info("config_reload", "Hook configuration reloaded.", {
      cwd: projectDir,
      details: {
        signature: nextLoaded.signature,
        eventCount: hooks.size,
        files: nextLoaded.files,
      },
    })
    lastReportedInvalidSignature = undefined
    return hooks
  }

  return {
    "tool.execute.before": async (
      eventInput: ToolExecuteBeforeInput,
      eventOutput: ToolExecuteBeforeOutput,
    ): Promise<void> => {
      const activeHooks = refreshHooks()
      const sessionID = eventInput.sessionID
      if (!sessionID) {
        return
      }

      const toolArgs = eventOutput.args ?? {}
      state.setPendingToolCall(eventInput.callID, sessionID, toolArgs)
      logger.debug("dispatch_start", "Dispatching pre-tool hooks.", {
        cwd: projectDir,
        event: `tool.before.${eventInput.tool}`,
        sessionId: sessionID,
        toolName: eventInput.tool,
        details: { callID: eventInput.callID, toolArgs },
      })

      const result = await invokeDispatchToolHooks(activeHooks, "before", eventInput.tool, sessionID, {
        toolName: eventInput.tool,
        toolArgs,
      })

      if (result.blocked) {
        state.consumePendingToolCall(eventInput.callID)
        logger.warn("dispatch_end", "Pre-tool dispatch blocked the tool call.", {
          cwd: projectDir,
          event: `tool.before.${eventInput.tool}`,
          sessionId: sessionID,
          toolName: eventInput.tool,
          details: { callID: eventInput.callID, blockReason: result.blockReason, stopSession: result.stopSession === true },
        })
        if (result.stopSession) {
          await abortSession(host, sessionID)
        }
        throw new Error(result.blockReason ?? "Blocked by hook")
      }

      logger.debug("dispatch_end", "Finished pre-tool dispatch.", {
        cwd: projectDir,
        event: `tool.before.${eventInput.tool}`,
        sessionId: sessionID,
        toolName: eventInput.tool,
        details: { callID: eventInput.callID },
      })
    },

    "tool.execute.after": async (
      eventInput: ToolExecuteAfterInput,
      _eventOutput?: unknown,
    ): Promise<void> => {
      const activeHooks = refreshHooks()
      const sessionID = eventInput.sessionID
      if (!sessionID) {
        return
      }

      const pending = state.consumePendingToolCall(eventInput.callID)
      const toolArgs = resolveToolArgs(eventInput.args, pending?.toolArgs)
      const changes = getToolFileChanges(eventInput.tool, toolArgs)
      const files = changes.length > 0 ? getChangedPaths(changes) : undefined

      logger.debug("dispatch_start", "Dispatching post-tool hooks.", {
        cwd: projectDir,
        event: `tool.after.${eventInput.tool}`,
        sessionId: sessionID,
        toolName: eventInput.tool,
        details: { callID: eventInput.callID, toolArgs, files, changes: summarizeChanges(changes) },
      })

      state.addFileChanges(sessionID, changes)

      if (changes.length > 0) {
        await invokeDispatchHooks(activeHooks, "file.changed", sessionID, {
          files,
          changes,
          toolName: eventInput.tool,
          toolArgs,
        })
      }

      await invokeDispatchToolHooks(activeHooks, "after", eventInput.tool, sessionID, {
        files,
        changes,
        toolName: eventInput.tool,
        toolArgs,
      })

      logger.debug("dispatch_end", "Finished post-tool dispatch.", {
        cwd: projectDir,
        event: `tool.after.${eventInput.tool}`,
        sessionId: sessionID,
        toolName: eventInput.tool,
        details: { callID: eventInput.callID, files, changes: summarizeChanges(changes) },
      })
    },

    "user.bash.before": async (
      eventInput: ToolExecuteBeforeInput,
      eventOutput: ToolExecuteBeforeOutput,
    ): Promise<void> => {
      const activeHooks = refreshHooks()
      const sessionID = eventInput.sessionID
      if (!sessionID) {
        return
      }

      const toolArgs = eventOutput.args ?? {}
      const result = await invokeDispatchToolHooks(activeHooks, "before", eventInput.tool, sessionID, {
        toolName: eventInput.tool,
        toolArgs,
      })

      if (result.blocked) {
        if (result.stopSession) {
          await abortSession(host, sessionID)
        }
        throw new Error(result.blockReason ?? "Blocked by hook")
      }
    },

    event: async ({ event }: RuntimeEventEnvelope): Promise<void> => {
      const activeHooks = refreshHooks()
      const properties = event.properties ?? {}

      if (event.type === "session.created") {
        const info = asRecord(properties.info)
        const sessionID = pickString(info?.id)
        if (!sessionID) {
          return
        }

        // P1-3 fix: when `parentID` is omitted (the PI adapter no longer
        // forwards `header.parentSession`, which was a file path rather than
        // a session ID), seed the SessionRecord without a parentID so the
        // runtime defers lineage resolution to `host.getRootSessionId`. When
        // a host does provide a parentID, honour it as-is.
        const parentID = pickString(info?.parentID)
        state.rememberSession(sessionID, parentID === undefined ? undefined : parentID)
        logger.debug("dispatch_start", "Dispatching session.created hooks.", {
          cwd: projectDir,
          event: "session.created",
          sessionId: sessionID,
          details: { parentID: parentID ?? null },
        })
        await invokeDispatchHooks(activeHooks, "session.created", sessionID, {})
        return
      }

      if (event.type === "session.deleted") {
        const info = asRecord(properties.info)
        const sessionID = pickString(info?.id)
        if (!sessionID) {
          return
        }

        state.rememberSession(sessionID, pickString(info?.parentID) ?? undefined)
        state.deleteSession(sessionID)
        // P1-4 fix: surface the `reason` PI emits on session_shutdown /
        // session_before_switch (e.g. "quit", "reload", "new", "resume",
        // "fork") in dispatch telemetry so operators can tell graceful
        // shutdowns apart from /new|/resume|/fork transitions. The reason
        // travels with the envelope but is otherwise advisory; hook
        // matching is unaffected.
        const deletedReason = pickString(properties.reason)
        logger.debug("dispatch_start", "Dispatching session.deleted hooks.", {
          cwd: projectDir,
          event: "session.deleted",
          sessionId: sessionID,
          ...(deletedReason ? { details: { reason: deletedReason } } : {}),
        })
        await invokeDispatchHooks(activeHooks, "session.deleted", sessionID, {})
        return
      }

      if (event.type === "session.idle") {
        const sessionID = pickString(properties.sessionID)
        if (!sessionID) {
          return
        }

        const changes = state.getFileChanges(sessionID)
        const files = state.getModifiedPaths(sessionID)
        logger.debug("idle_changes_snapshot", "Captured pending idle changes.", {
          cwd: projectDir,
          event: "session.idle",
          sessionId: sessionID,
          details: { files, changes: summarizeChanges(changes) },
        })
        state.beginIdleDispatch(sessionID, changes)

        try {
          await invokeDispatchHooks(activeHooks, "session.idle", sessionID, { files, changes })
          state.consumeFileChanges(sessionID, changes)
          logger.debug("idle_changes_consumed", "Consumed idle changes after dispatch.", {
            cwd: projectDir,
            event: "session.idle",
            sessionId: sessionID,
            details: { files, changes: summarizeChanges(changes) },
          })
        } catch (error) {
          // P2-10 fix: distinguish a hook-returned-failure (the dispatch
          // ran, a hook threw and was logged elsewhere) from a host-died
          // failure (the embedding host went down mid-dispatch). The
          // former is bounded — re-dispatching the same idle changes will
          // just re-throw the same error and pin the session. The latter
          // is transient — the operator will restart and we want the
          // pending changes intact when the next idle fires. Heuristic:
          // host errors usually surface as connection/abort/EPIPE-style
          // messages, while in-process hook failures bubble up generic
          // Error instances (or are already swallowed by executeHook's
          // try/catch). On host-died, keep the changes for replay; on a
          // hook failure, consume so the session does not loop.
          if (isHostDiedError(error)) {
            state.cancelIdleDispatch(sessionID)
            logger.warn("idle_dispatch_host_died", "Idle dispatch failed because the host appears to have died; pending changes retained for replay.", {
              cwd: projectDir,
              event: "session.idle",
              sessionId: sessionID,
              details: {
                files,
                changes: summarizeChanges(changes),
                error: error instanceof Error ? error.message : String(error),
              },
            })
            throw error
          }

          state.consumeFileChanges(sessionID, changes)
          logger.error("idle_dispatch_failed", "Idle dispatch failed; consumed pending changes to avoid a re-dispatch loop.", {
            cwd: projectDir,
            event: "session.idle",
            sessionId: sessionID,
            details: {
              files,
              changes: summarizeChanges(changes),
              error: error instanceof Error ? error.message : String(error),
            },
          })
          throw error
        }
      }
    },
  }
}



// P1-1 helper: cheap stat-based fingerprint shared by the runtime-side
// refreshHooks short-circuit. Returns a stable string that changes whenever
// any of the listed files' mtime/size changes, or whenever a file appears
// or disappears. Mirrors the shape used by load-hooks' own snapshot cache.
function computeStatFingerprint(files: readonly string[]): string {
  if (files.length === 0) {
    return ""
  }
  const parts: string[] = []
  for (const filePath of files) {
    try {
      const stat = statSync(filePath)
      parts.push(`${filePath}|${stat.mtimeMs}|${stat.size}`)
    } catch {
      parts.push(`${filePath}|missing`)
    }
  }
  return parts.join("\n")
}

function mergeUnique(a: readonly string[], b: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of a) {
    if (!seen.has(value)) {
      seen.add(value)
      out.push(value)
    }
  }
  for (const value of b) {
    if (!seen.has(value)) {
      seen.add(value)
      out.push(value)
    }
  }
  return out
}

function formatHookLoadErrors(errors: Array<{ filePath: string; message: string; path?: string }>): string {
  const details = errors.map((error) => `${error.filePath}${error.path ? `#${error.path}` : ""}: ${error.message}`)
  return `[pi-hooks] Failed to load some hooks; continuing with valid hooks:\n${details.join("\n")}`
}

function formatHookReloadErrors(errors: Array<{ filePath: string; message: string; path?: string }>): string {
  const details = errors.map((error) => `${error.filePath}${error.path ? `#${error.path}` : ""}: ${error.message}`)
  return `[pi-hooks] Failed to reload hooks.yaml; keeping last known good hooks:\n${details.join("\n")}`
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined
}

function resolveToolArgs(
  eventArgs: Record<string, unknown> | undefined,
  pendingArgs: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (eventArgs && Object.keys(eventArgs).length > 0) {
    return eventArgs
  }

  return pendingArgs ?? eventArgs ?? {}
}


