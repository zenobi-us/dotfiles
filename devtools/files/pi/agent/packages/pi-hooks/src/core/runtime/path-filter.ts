/**
 * Path-condition utilities extracted from runtime.ts.
 *
 * Pure helpers: no host, no session-state, no logger. They operate on the
 * `RuntimeActionContext` shape exported by runtime.ts and produce the
 * `PathMatchContext` consumed by the dispatch path. The runtime owns
 * lifetime of the per-runtime glob-matcher cache (see `createGlobMatcherCache`)
 * and rebuilds it on hooks reload to avoid stale match closures across hook
 * sets — see P2-5 in the runtime change log.
 */

import { extname, isAbsolute, matchesGlob, relative } from "node:path"

import type { HookConfig } from "../types.js"
import type {
  HookMatchDecision,
  PathMatchContext,
  RuntimeActionContext,
} from "../runtime.js"

export const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
  ".json5",
  ".yml",
  ".yaml",
  ".toml",
  ".xml",
  ".ini",
  ".cfg",
  ".conf",
  ".properties",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".html",
  ".vue",
  ".svelte",
  ".astro",
  ".mdx",
  ".graphql",
  ".gql",
  ".proto",
  ".sql",
  ".prisma",
  ".go",
  ".rs",
  ".zig",
  ".c",
  ".h",
  ".cpp",
  ".cc",
  ".cxx",
  ".hpp",
  ".java",
  ".groovy",
  ".gradle",
  ".py",
  ".rb",
  ".php",
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".ps1",
  ".psm1",
  ".psd1",
  ".bat",
  ".cmd",
  ".kt",
  ".kts",
  ".swift",
  ".m",
  ".mm",
  ".cs",
  ".fs",
  ".scala",
  ".clj",
  ".hs",
  ".lua",
  ".dart",
  ".elm",
  ".ex",
  ".exs",
  ".erl",
  ".hrl",
  ".nim",
  ".nix",
  ".r",
  ".rkt",
  ".tf",
  ".tfvars",
])

export function hasCodeExtension(filePath: string): boolean {
  const extension = extname(filePath).toLowerCase()
  return Boolean(extension && CODE_EXTENSIONS.has(extension))
}

export type GlobMatcher = (filePath: string, pattern: string) => boolean

export const defaultGlobMatcher: GlobMatcher = (filePath, pattern) => matchesGlob(filePath, pattern)

// P2-5 fix: memoize per-pattern glob matchers so condition evaluation does
// not re-parse the same glob string on every dispatch. node:path.matchesGlob
// has no compile step we can hold on to, but we can cache the (pattern,
// path) result in a bounded LRU per pattern. Cache is rebuilt whenever the
// runtime swaps the active hooks signature, so stale entries cannot
// outlive a hooks reload.
const GLOB_RESULT_LRU_PER_PATTERN = 256

interface GlobMatcherCacheEntry {
  match: (path: string) => boolean
}

export interface GlobMatcherCache {
  signature: string
  matchers: Map<string, GlobMatcherCacheEntry>
}

export function createGlobMatcherCache(signature: string): GlobMatcherCache {
  return { signature, matchers: new Map() }
}

export function getGlobMatcher(cache: GlobMatcherCache, pattern: string): (path: string) => boolean {
  const existing = cache.matchers.get(pattern)
  if (existing) {
    return existing.match
  }
  // Insertion-ordered Map, used as a tiny LRU of recent path → boolean
  // results for this pattern. Eviction drops the oldest entry once the cap
  // is reached. Hot files (the ones that show up repeatedly during a
  // dispatch chain) stay cached; one-shot paths fall out naturally.
  const resultCache = new Map<string, boolean>()
  const match = (filePath: string): boolean => {
    const cached = resultCache.get(filePath)
    if (cached !== undefined) {
      // Touch on read so the entry becomes most-recently-used.
      resultCache.delete(filePath)
      resultCache.set(filePath, cached)
      return cached
    }
    const result = matchesGlob(filePath, pattern)
    resultCache.set(filePath, result)
    if (resultCache.size > GLOB_RESULT_LRU_PER_PATTERN) {
      const oldestKey = resultCache.keys().next().value
      if (oldestKey !== undefined) {
        resultCache.delete(oldestKey)
      }
    }
    return result
  }
  cache.matchers.set(pattern, { match })
  return match
}

export function buildPathMatchContext(projectDir: string, context: RuntimeActionContext): PathMatchContext {
  const changedPaths = getFinalChangedPaths(projectDir, context)
  return {
    changedPaths,
    hasCodeFiles: changedPaths.some(hasCodeExtension),
  }
}

export function getFinalChangedPaths(projectDir: string, context: RuntimeActionContext): readonly string[] {
  if (context.changes && context.changes.length > 0) {
    return context.changes.map((change) => normalizeConditionPath(projectDir, change.operation === "rename" ? change.toPath : change.path))
  }

  return (context.files ?? []).map((filePath) => normalizeConditionPath(projectDir, filePath))
}

export function normalizeConditionPath(projectDir: string, filePath: string): string {
  const normalizedPath = normalizeGlobCandidate(filePath)
  if (!isAbsolute(filePath)) {
    return normalizedPath
  }

  const projectRelativePath = normalizeGlobCandidate(relative(projectDir, filePath))
  if (projectRelativePath !== "" && projectRelativePath !== "." && !projectRelativePath.startsWith("../")) {
    return projectRelativePath
  }

  return normalizedPath
}

export function normalizeGlobCandidate(filePath: string): string {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "")
}

/**
 * Path-condition body of `shouldRunHook`. Scope evaluation stays in the
 * runtime entry-point because it requires session-state and host access;
 * here we only evaluate the (matchesCodeFiles | matchesAnyPath |
 * matchesAllPaths) conditions against an already-built path match context.
 *
 * Returns either `null` if the hook should still match (i.e. all conditions
 * passed) or a populated `HookMatchDecision` describing the failure.
 */
export function evaluatePathConditions(
  hook: HookConfig,
  context: RuntimeActionContext,
  pathMatchContext: PathMatchContext,
  globMatcher: GlobMatcher,
): HookMatchDecision | null {
  const changedPaths = pathMatchContext.changedPaths

  for (const condition of hook.conditions ?? []) {
    if (condition === "matchesCodeFiles") {
      if (!pathMatchContext.hasCodeFiles) {
        return {
          matched: false,
          reason: "matchesCodeFiles_failed",
          changedPaths,
          details: { files: context.files ?? [] },
        }
      }

      continue
    }

    if ("matchesAnyPath" in condition) {
      if (changedPaths.length === 0) {
        return {
          matched: false,
          reason: "matchesAnyPath_no_paths",
          changedPaths,
          details: { patterns: condition.matchesAnyPath },
        }
      }

      if (!changedPaths.some((filePath) => condition.matchesAnyPath.some((pattern) => globMatcher(filePath, pattern)))) {
        return {
          matched: false,
          reason: "matchesAnyPath_failed",
          changedPaths,
          details: { patterns: condition.matchesAnyPath },
        }
      }

      continue
    }

    if (changedPaths.length === 0) {
      return {
        matched: false,
        reason: "matchesAllPaths_no_paths",
        changedPaths,
        details: { patterns: condition.matchesAllPaths },
      }
    }

    if (!changedPaths.every((filePath) => condition.matchesAllPaths.some((pattern) => globMatcher(filePath, pattern)))) {
      return {
        matched: false,
        reason: "matchesAllPaths_failed",
        changedPaths,
        details: { patterns: condition.matchesAllPaths },
      }
    }
  }

  return null
}
