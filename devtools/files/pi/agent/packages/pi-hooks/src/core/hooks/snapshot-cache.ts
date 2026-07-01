import { createHash } from "node:crypto"
import { readFileSync, statSync, type Stats } from "node:fs"

import {
  type HookConfig,
  type HookMap,
  type HookValidationError,
} from "../types.js"
import {
  discoverHookConfigEntries,
  resolveProjectHookResolution,
  type DiscoveredHookConfigPath,
  type HookConfigDiscoveryOptions,
  type HookConfigSourceScope,
  type ProjectHookResolution,
} from "../config-paths.js"
import {
  type ParsedHooksFileEnvelope,
  defaultReadFile,
  formatHookReadError,
} from "./yaml-envelope.js"
import {
  canonicalizeHookPath,
  expandSnapshotImports,
  type DiscoveredHooksFileSnapshot,
} from "./imports.js"
import {
  countHookConfigs,
  dedupeValidationErrors,
  mergeHookMapsInto,
  parseHooksFile,
  parseHooksObject,
  resolveOverrides,
  validateAsyncQueueConfigs,
  type ParsedHooksFileResult,
} from "./composition.js"

export interface HookSourceSummary {
  readonly scope: HookConfigSourceScope
  readonly filePath: string
  readonly hookCount: number
}

export interface HookDiscoveryResult {
  readonly hooks: HookMap
  readonly errors: HookValidationError[]
  readonly advisories: string[]
  readonly files: string[]
  readonly sources: HookSourceSummary[]
}

export interface HookLoadOptions extends HookConfigDiscoveryOptions {
  readonly readFile?: (filePath: string) => string
}

export interface HookLoadSnapshot extends HookDiscoveryResult {
  readonly signature: string
}

export function loadDiscoveredHooks(options: HookLoadOptions = {}): HookDiscoveryResult {
  const entries = discoverHookConfigEntries(options)
  const projectResolution = resolveProjectHookResolution(options)
  return loadDiscoveredHooksFromFiles(entries, options, projectResolution)
}

// P1 #10 fix: cache the last parsed snapshot keyed on a cheap stat-based
// fingerprint so the hot-path dispatcher does not re-read + re-parse every
// hooks.yaml on every tool call.
//
// P1 #8 fix: the cache is now an LRU bounded at SNAPSHOT_CACHE_MAX entries.
// Operators who switch between worktrees, run multi-project tooling, or
// invoke the dispatcher across several `projectDir` values would otherwise
// grow the map unbounded for the lifetime of the process. The cache key is
// the discovered-entry file list (after import expansion is implicit via the
// fingerprint), so each distinct project context contributes one entry.
const SNAPSHOT_CACHE_MAX = 16

interface CachedSnapshot {
  signature: string
  result: HookDiscoveryResult
}
// `Map` preserves insertion order in JS. We reuse that ordering to implement
// classic LRU semantics: every read re-inserts the entry so it becomes the
// most-recently-used; eviction drops the first key, which is the LRU one.
const snapshotCache = new Map<string, CachedSnapshot>()

// Test-only hook so unit tests can assert eviction behaviour deterministically
// without leaking state across cases.
export function __resetSnapshotCacheForTests(): void {
  snapshotCache.clear()
}

export function __snapshotCacheSizeForTests(): number {
  return snapshotCache.size
}

export function __snapshotCacheKeysForTests(): string[] {
  return Array.from(snapshotCache.keys())
}

export function loadDiscoveredHooksSnapshot(options: HookLoadOptions = {}): HookLoadSnapshot {
  const entries = discoverHookConfigEntries(options)
  const projectResolution = resolveProjectHookResolution(options)
  const snapshots = snapshotDiscoveredHookFiles(entries, options.readFile ?? defaultReadFile)
  const result = loadDiscoveredHooksFromSnapshots(snapshots, projectResolution)
  // computeFingerprintSignature consumes `result.files`, which already
  // contains every imported file expanded by `expandSnapshotImports`. Editing
  // an imported file therefore changes the signature and busts the cache.
  const fingerprintSignature = computeFingerprintSignature(result.files)
  const cacheKey = entries.map((entry) => entry.filePath).join("\0")
  const cached = snapshotCache.get(cacheKey)
  if (cached && cached.signature === fingerprintSignature) {
    // Touch on read so this entry becomes most-recently-used.
    snapshotCache.delete(cacheKey)
    snapshotCache.set(cacheKey, cached)
    return { ...cached.result, signature: cached.signature }
  }

  // Insert (or refresh) the entry as the most-recently-used.
  if (snapshotCache.has(cacheKey)) {
    snapshotCache.delete(cacheKey)
  }
  snapshotCache.set(cacheKey, { signature: fingerprintSignature, result })

  // Evict LRU entries until we are within bounds.
  while (snapshotCache.size > SNAPSHOT_CACHE_MAX) {
    const oldestKey = snapshotCache.keys().next().value
    if (oldestKey === undefined) break
    snapshotCache.delete(oldestKey)
  }

  return { ...result, signature: fingerprintSignature }
}

function computeFingerprintSignature(files: readonly string[]): string {
  const parts: string[] = []
  for (const filePath of files) {
    parts.push(`${filePath}|${computeConsistentFileFingerprint(filePath)}`)
  }
  return parts.join("\n")
}

function computeConsistentFileFingerprint(filePath: string): string {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const before = statSync(filePath)
      const content = readFileSync(filePath)
      const after = statSync(filePath)
      if (sameStatFingerprint(before, after)) {
        const hash = createHash("sha256").update(content).digest("hex")
        return `${after.mtimeMs}|${after.size}|${after.ino}|${after.mode}|${hash}`
      }
    } catch {
      return "missing"
    }
  }

  try {
    const stat = statSync(filePath)
    return `${stat.mtimeMs}|${stat.size}|${stat.ino}|${stat.mode}|unstable`
  } catch {
    return "missing"
  }
}

function sameStatFingerprint(a: Stats, b: Stats): boolean {
  return a.mtimeMs === b.mtimeMs && a.size === b.size && a.ino === b.ino && a.mode === b.mode
}

function loadDiscoveredHooksFromFiles(
  entries: DiscoveredHookConfigPath[],
  options: HookLoadOptions,
  projectResolution: ProjectHookResolution | undefined,
): HookDiscoveryResult {
  const readFile = options.readFile ?? defaultReadFile
  const snapshots = snapshotDiscoveredHookFiles(entries, readFile)

  return loadDiscoveredHooksFromSnapshots(snapshots, projectResolution)
}

function loadDiscoveredHooksFromSnapshots(
  snapshots: readonly DiscoveredHooksFileSnapshot[],
  projectResolution: ProjectHookResolution | undefined,
): HookDiscoveryResult {
  const hooks = new Map<HookConfig["event"], HookConfig[]>()
  const errors: HookValidationError[] = []
  const advisories: string[] = []
  const sources: HookSourceSummary[] = []
  const files: string[] = []
  const loadedFiles = new Set<string>()
  // P2 #4 fix: cache the parsed envelope per file path so the imports tree
  // walk does not re-parse the same YAML body when we later parse the same
  // file's hooks. Keyed on the canonical file path so duplicate import paths
  // referring to the same realpath share the parsed envelope.
  const envelopeCache = new Map<string, ParsedHooksFileEnvelope>()

  for (const snapshot of snapshots) {
    const expanded = expandSnapshotImports(snapshot, loadedFiles, envelopeCache, projectResolution)
    errors.push(...expanded.errors)

    for (const entry of expanded.snapshots) {
      files.push(entry.filePath)
      const result = loadSnapshotHooksFile(entry, envelopeCache)
      const resolved = resolveOverrides(hooks, result.overrides)
      hooks.clear()
      mergeHookMapsInto(hooks, resolved.hooks)
      mergeHookMapsInto(hooks, result.hooks)
      errors.push(...resolved.errors)
      errors.push(...result.errors)
      advisories.push(...(result.advisories ?? []))
      sources.push({
        scope: entry.scope,
        filePath: entry.filePath,
        hookCount: countHookConfigs(result.hooks),
      })
    }
  }

  errors.push(...validateAsyncQueueConfigs(hooks))

  return { hooks, errors: dedupeValidationErrors(errors), advisories, files, sources }
}

function snapshotDiscoveredHookFiles(
  entries: readonly DiscoveredHookConfigPath[],
  readFile: (filePath: string) => string,
): DiscoveredHooksFileSnapshot[] {
  return entries.map(({ scope, filePath }) => {
    try {
      return { scope, filePath, content: readFile(filePath) }
    } catch (error) {
      return { scope, filePath, readError: formatHookReadError(error) }
    }
  })
}

function loadSnapshotHooksFile(
  snapshot: DiscoveredHooksFileSnapshot,
  envelopeCache?: Map<string, ParsedHooksFileEnvelope>,
): ParsedHooksFileResult {
  if ("content" in snapshot) {
    // P2 #4 fix: reuse the parsed envelope from the imports walk so we do
    // not re-run YAML.parseDocument for the same file body. If the cache
    // miss happens (e.g. a top-level discovered file with no imports walk),
    // we fall through to the regular parse path which still works.
    if (envelopeCache) {
      const cached = envelopeCache.get(canonicalizeHookPath(snapshot.filePath))
      if (cached) {
        if (cached.errors.length > 0 || !cached.body) {
          return {
            hooks: new Map(),
            overrides: [],
            errors: cached.errors,
            advisories: [],
            files: [snapshot.filePath],
          }
        }
        return parseHooksObject(snapshot.filePath, cached.body)
      }
    }
    return parseHooksFile(snapshot.filePath, snapshot.content)
  }

  return {
    hooks: new Map(),
    overrides: [],
    errors: [{ code: "invalid_frontmatter", filePath: snapshot.filePath, message: snapshot.readError }],
    advisories: [],
    files: [snapshot.filePath],
  }
}

export interface HookLoadSummary {
  readonly global: number
  readonly project: number
  readonly total: number
}

export function summarizeHookSources(sources: readonly HookSourceSummary[]): HookLoadSummary {
  let global = 0
  let project = 0

  for (const source of sources) {
    if (source.scope === "global") {
      global += source.hookCount
    } else {
      project += source.hookCount
    }
  }

  return { global, project, total: global + project }
}

export function formatHookLoadSummary(result: Pick<HookDiscoveryResult, "sources">): string {
  const summary = summarizeHookSources(result.sources)
  const label = summary.total === 1 ? "hook" : "hooks"
  return `[pi-hooks] Loaded ${summary.total} ${label} (global: ${summary.global}, project: ${summary.project}).`
}
