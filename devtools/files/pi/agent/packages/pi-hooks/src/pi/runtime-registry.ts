/**
 * Per-cwd PI runtime registry.
 *
 * Holds the cwd-keyed `HooksRuntime` cache, the most-recent `ExtensionContext`
 * per cwd (so HostAdapter UI calls can reach `ctx.ui` outside the event
 * handler scope), and the LRU bookkeeping that bounds both maps.
 *
 * Exposes:
 * - `getRuntimeFor(cwd)`   — lazy-construct + memoise the runtime for a cwd
 * - `rememberContext(cwd, ctx)` — record the freshest ctx for that cwd
 * - `getLatestContext(cwd)` — peek the freshest ctx (used by user-bash plumbing)
 * - `touchLruEntry` / `evictLruEntries` — pure helpers, exported for tests (P2-6)
 *
 * Extracted from `adapter.ts` as part of the P0/P1 refactor; behaviour and
 * eviction policy are unchanged.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

import { getPiHooksLogger } from "../core/logger.js";
import { formatHookLoadSummary, loadDiscoveredHooksSnapshot } from "../core/load-hooks.js";
import { createHooksRuntime, type HooksRuntime } from "../core/runtime.js";
import { sendHookDiagnostics } from "./diagnostics.js";
import { createHostAdapter, type ReadonlySessionManager } from "./host-adapter.js";

const MAX_CWD_ENTRIES = 8;

export interface RuntimeRegistry {
  getRuntimeFor(cwd: string): HooksRuntime;
  rememberContext(cwd: string, ctx: ExtensionContext): void;
  getLatestContext(cwd: string): ExtensionContext | undefined;
}

export function createRuntimeRegistry(pi: ExtensionAPI): RuntimeRegistry {
  const logger = getPiHooksLogger();

  // Runtime is created lazily on the first event so that `ctx.cwd` is
  // available and we honour the project's hooks.yaml location. Once built,
  // we cache the runtime keyed by cwd so subsequent cwd changes in the same
  // process (should PI ever support that) pick up the right project config.
  //
  // P2 #18: bound the runtime + latestContexts maps with an LRU eviction so
  // long-lived processes that move between many directories (e.g. monorepo
  // tooling) do not retain runtimes for cwds we will never see again. Maps
  // preserve insertion order, so we promote on access by re-setting the key.
  const runtimes = new Map<string, HooksRuntime>();
  // P2-23: track cwds whose runtime construction is currently in-flight so
  // a re-entrant call (e.g. an early hook firing during construction) can
  // see and reuse the partially-built runtime instead of triggering a
  // second `loadDiscoveredHooksSnapshot` + `createHooksRuntime`. Today
  // construction is synchronous so reentry is the only realistic dual-load
  // path; if we ever make `loadDiscoveredHooksSnapshot` async, this slot
  // also gives us a place to stash the in-flight Promise.
  const constructingRuntimes = new Set<string>();
  // Track the most recently observed ExtensionContext per cwd so that the
  // HostAdapter UI methods (notify/confirm/setStatus) can reach ctx.ui even
  // though they live outside the event handler scope. The ctx is replayed
  // for each PI event, so "last seen" is the right handle to use.
  const latestContexts = new Map<string, ExtensionContext>();

  function touchCwd(cwd: string): void {
    // P2-6 fix: prod LRU promotion goes through the same helper used by
    // tests so the eviction policy has a single implementation.
    touchLruEntry(latestContexts, cwd);
    touchLruEntry(runtimes, cwd);
  }

  function evictIfNeeded(): void {
    // P2-6 fix: same — prod eviction reuses the shared helper. The companion
    // map keeps both maps in sync as the oldest entries are dropped.
    evictLruEntries(latestContexts, MAX_CWD_ENTRIES, runtimes);
    evictLruEntries(runtimes, MAX_CWD_ENTRIES, latestContexts);
  }

  function rememberContext(cwd: string, ctx: ExtensionContext): void {
    // Promote this cwd to most-recent, then evict oldest if over the cap.
    if (latestContexts.has(cwd)) latestContexts.delete(cwd);
    latestContexts.set(cwd, ctx);
    touchCwd(cwd);
    evictIfNeeded();
  }

  function getRuntimeFor(cwd: string): HooksRuntime {
    const existing = runtimes.get(cwd);
    if (existing) {
      touchCwd(cwd);
      return existing;
    }

    // P2-23: if construction for this cwd is already in flight, refuse to
    // start a second one. Any caller that re-enters mid-construction (e.g.
    // a hook running during initial load that itself dispatches another
    // event) would otherwise trigger a duplicate `loadDiscoveredHooksSnapshot`
    // and `createHooksRuntime`. The in-flight runtime will be in `runtimes`
    // momentarily; throwing is preferable to silently returning a stale
    // runtime, since legitimate re-entry is a programming error.
    if (constructingRuntimes.has(cwd)) {
      throw new Error(
        `[pi-hooks] runtime construction is already in flight for ${cwd}; a hook fired during initial load is the most likely cause.`,
      );
    }
    constructingRuntimes.add(cwd);
    try {
      // P1 #3 fix: do not close over a particular sessionManager. Read the
      // current one from the latest ctx on every host call so /new, /resume,
      // /fork get the correct lineage.
      const getLiveSessionManager = (): ReadonlySessionManager | undefined =>
        latestContexts.get(cwd)?.sessionManager;
      const host = createHostAdapter(pi, cwd, getLiveSessionManager, () => latestContexts.get(cwd));
      const loaded = loadDiscoveredHooksSnapshot({ projectDir: cwd });
      if (loaded.advisories.length > 0) {
        sendHookDiagnostics(pi, {
          title: "Hook loader advisories",
          level: "info",
          content: `Hook loading found ${loaded.advisories.length} advisory note(s). Hooks still loaded.`,
          sections: [
            {
              label: "Advisories",
              lines: loaded.advisories,
            },
          ],
        });
      }
      if (loaded.errors.length > 0) {
        // eslint-disable-next-line no-console
        console.error(
          `[pi-hooks] Failed to load some hooks; continuing with valid hooks:\n${loaded.errors
            .map((error) => `${error.filePath}${error.path ? `#${error.path}` : ""}: ${error.message}`)
            .join("\n")}`,
        );
        logger.error("config_load", "Hook loading reported validation errors.", {
          cwd,
          details: {
            files: loaded.files,
            errors: loaded.errors.map((error) => ({
              filePath: error.filePath,
              path: error.path,
              code: error.code,
              message: error.message,
            })),
          },
        });
        sendHookDiagnostics(pi, {
          title: "Hook configuration issues",
          level: "warning",
          content: `Hook loading found ${loaded.errors.length} validation issue(s). Valid hooks, if any, stayed active.`,
          sections: [
            {
              label: "Files",
              lines: loaded.files,
            },
            {
              label: "Validation errors",
              lines: loaded.errors.map((error) => `${error.filePath}${error.path ? `#${error.path}` : ""}: ${error.message}`),
            },
            ...(loaded.advisories.length > 0
              ? [{ label: "Advisories", lines: loaded.advisories }]
              : []),
          ],
        });
      }
      const summary = formatHookLoadSummary(loaded);
      // eslint-disable-next-line no-console
      console.info(summary);
      logger.info("config_load", "Hook configuration loaded.", {
        cwd,
        details: { files: loaded.files, summary, sources: loaded.sources },
      });
      const runtime = createHooksRuntime(host, {
        directory: cwd,
        hooks: loaded.hooks,
        initialSignature: loaded.signature,
        reloadDiscoveredHooks: true,
      });
      runtimes.set(cwd, runtime);
      evictIfNeeded();
      return runtime;
    } finally {
      constructingRuntimes.delete(cwd);
    }
  }

  return {
    getRuntimeFor,
    rememberContext,
    getLatestContext: (cwd: string): ExtensionContext | undefined => latestContexts.get(cwd),
  };
}

/**
 * Promote `cwd` to most-recent. If the key exists, it is re-inserted so that
 * Map iteration order places it last (the freshest entry). Used by both the
 * production runtime (via `touchCwd`) and unit tests (via `__testing__`),
 * so the LRU eviction policy has a single source of truth (P2-6).
 */
export function touchLruEntry<T>(map: Map<string, T>, cwd: string): void {
  if (!map.has(cwd)) return;
  const value = map.get(cwd) as T;
  map.delete(cwd);
  map.set(cwd, value);
}

/**
 * Drop oldest entries from `map` (and `companion`, if provided) until at
 * most `maxEntries` remain. Returns the keys that were evicted. Shared
 * between the production `evictIfNeeded` and the test surface (P2-6).
 */
export function evictLruEntries<T>(
  map: Map<string, T>,
  maxEntries: number,
  companion?: Map<string, unknown>,
): string[] {
  const evicted: string[] = [];
  while (map.size > maxEntries) {
    const oldest = map.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    map.delete(oldest);
    companion?.delete(oldest);
    evicted.push(oldest);
  }
  return evicted;
}
