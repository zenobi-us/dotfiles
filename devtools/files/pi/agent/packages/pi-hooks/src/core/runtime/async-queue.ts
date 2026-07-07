/**
 * Async hook queue extracted from runtime.ts.
 *
 * Hooks declared `async: true` are not part of the dispatch loop —
 * they queue onto a per-(event|group)+session lane that respects the
 * configured concurrency limit. Behaviour preserved verbatim, including
 * the P3-1 simplification (`Promise.resolve().then(next)` over a sync
 * IIFE) for converting synchronous throws into rejected promises.
 */

import type { HookConfig } from "../types.js"

export interface AsyncQueueState {
  activeCount: number
  pending: Array<() => Promise<void>>
}

export interface AsyncQueueWarning {
  readonly reason: "pending_limit" | "watchdog_timeout"
  readonly queueKey: string
  readonly pendingCount: number
  readonly activeCount: number
  readonly limit?: number
  readonly timeoutMs?: number
}

export interface AsyncQueueOptions {
  readonly maxPending?: number
  readonly watchdogMs?: number
  readonly onWarning?: (warning: AsyncQueueWarning) => void
}

export function resolveAsyncExecutionConfig(
  hook: HookConfig,
  sessionID: string,
): { queueKey: string; concurrency: number } {
  if (hook.async === true || hook.async === undefined) {
    return { queueKey: `${hook.event}:${sessionID}`, concurrency: 1 }
  }

  const group = hook.async.group?.trim()
  return {
    queueKey: group ? `${sessionID}:${group}` : `${hook.event}:${sessionID}`,
    concurrency: hook.async.concurrency ?? 1,
  }
}

export function enqueueAsyncHook(
  asyncQueues: Map<string, AsyncQueueState>,
  config: { queueKey: string; concurrency: number },
  run: () => Promise<void>,
  onError: (error: unknown) => void,
  options: AsyncQueueOptions = {},
): void {
  const state = asyncQueues.get(config.queueKey) ?? { activeCount: 0, pending: [] }
  asyncQueues.set(config.queueKey, state)
  const maxPending = options.maxPending ?? parsePositiveInt(process.env.PI_YAML_HOOKS_ASYNC_MAX_PENDING) ?? 1_000
  const watchdogMs = options.watchdogMs ?? parsePositiveInt(process.env.PI_YAML_HOOKS_ASYNC_WATCHDOG_MS)

  if (state.pending.length >= maxPending) {
    options.onWarning?.({
      reason: "pending_limit",
      queueKey: config.queueKey,
      pendingCount: state.pending.length,
      activeCount: state.activeCount,
      limit: maxPending,
    })
    return
  }

  const startNext = (): void => {
    while (state.activeCount < config.concurrency && state.pending.length > 0) {
      const next = state.pending.shift()
      if (!next) {
        continue
      }

      state.activeCount += 1
      // P2 #13: wrap the call so a synchronous throw from `next()` (e.g.
      // before the function awaits) is converted into a rejected promise.
      // Without this wrapper a sync throw would skip .catch/.finally and
      // leak activeCount, eventually wedging the queue.
      // P3-1 simplification: `Promise.resolve().then(next)` expresses the
      // same semantics with one fewer Promise allocation than the
      // previous `(async () => next())()` IIFE — both convert sync
      // throws to rejections; the `.then` form skips the implicit
      // async-function wrapper promise.
      let watchdog: NodeJS.Timeout | undefined
      if (watchdogMs) {
        watchdog = setTimeout(() => {
          options.onWarning?.({
            reason: "watchdog_timeout",
            queueKey: config.queueKey,
            pendingCount: state.pending.length,
            activeCount: state.activeCount,
            timeoutMs: watchdogMs,
          })
        }, watchdogMs)
      }

      void Promise.resolve().then(next)
        .catch(onError)
        .finally(() => {
          if (watchdog) clearTimeout(watchdog)
          state.activeCount -= 1
          if (state.activeCount === 0 && state.pending.length === 0) {
            asyncQueues.delete(config.queueKey)
            return
          }
          startNext()
        })
    }
  }

  state.pending.push(run)
  startNext()
}

function parsePositiveInt(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) && value > 0 ? value : undefined
}
