/**
 * Action recursion guard extracted from runtime.ts.
 *
 * Wraps an `execute()` body in an AsyncLocalStorage frame keyed by an
 * action key, deduping nested re-entries (per-key) and capping nesting
 * depth (`RECURSION_DEPTH_CAP`) so a misconfigured hook chain that
 * triggers another event whose hook triggers another event (etc.) cannot
 * run unbounded.
 *
 * Behaviour preserved verbatim — see P3 #24 commentary in the original
 * implementation for the rationale behind storing the depth meta in a
 * WeakMap keyed by the ALS Set so the surrounding handler signatures stay
 * unchanged.
 */

import type { AsyncLocalStorage } from "node:async_hooks"

import { getPiHooksLogger } from "../logger.js"

// P3 #24: cap the depth of nested action chains so a misconfigured hook that
// triggers an event whose hook triggers another event (etc.) cannot run
// unbounded. We keep the existing per-key dedup AND add a numeric counter
// stored alongside the key set via a WeakMap so the type signature on
// surrounding handlers stays unchanged.
export const RECURSION_DEPTH_CAP = 32
export const recursionDepthByStore = new WeakMap<Set<string>, { depth: number; loggedExceedance: boolean }>()

export async function withActionRecursionGuard<T>(
  actionRecursionGuards: AsyncLocalStorage<Set<string>>,
  actionKey: string,
  execute: () => Promise<T>,
): Promise<T | undefined> {
  const activeKeys = actionRecursionGuards.getStore()
  if (activeKeys?.has(actionKey)) {
    return undefined
  }

  if (activeKeys) {
    const meta = recursionDepthByStore.get(activeKeys) ?? { depth: 0, loggedExceedance: false }
    if (meta.depth >= RECURSION_DEPTH_CAP) {
      if (!meta.loggedExceedance) {
        meta.loggedExceedance = true
        recursionDepthByStore.set(activeKeys, meta)
        getPiHooksLogger().warn(
          "hook_recursion_cap",
          `Hook action recursion depth exceeded ${RECURSION_DEPTH_CAP}; skipping further nested actions.`,
          { details: { actionKey, depth: meta.depth, cap: RECURSION_DEPTH_CAP } },
        )
      }
      return undefined
    }
    activeKeys.add(actionKey)
    meta.depth += 1
    recursionDepthByStore.set(activeKeys, meta)
    try {
      return await execute()
    } finally {
      activeKeys.delete(actionKey)
      meta.depth -= 1
      if (meta.depth === 0) {
        recursionDepthByStore.delete(activeKeys)
      }
    }
  }

  const rootKeys = new Set<string>([actionKey])
  recursionDepthByStore.set(rootKeys, { depth: 1, loggedExceedance: false })
  return await actionRecursionGuards.run(rootKeys, async () => {
    try {
      return await execute()
    } finally {
      rootKeys.delete(actionKey)
      recursionDepthByStore.delete(rootKeys)
    }
  })
}
