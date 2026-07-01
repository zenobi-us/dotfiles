import { readdirSync, realpathSync, statSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

import { getPiHooksLogger } from "../logger.js"
import type { HookValidationError } from "../types.js"
import type { HookConfigSourceScope, ProjectHookResolution } from "../config-paths.js"
import {
  MAX_HOOKS_YAML_BYTES,
  type ParsedHooksFileEnvelope,
  defaultReadFile,
  formatHookReadError,
  parseHooksFileEnvelope,
} from "./yaml-envelope.js"
import { createError } from "./schema.js"

export type DiscoveredHooksFileSnapshot =
  | { readonly scope: HookConfigSourceScope; readonly filePath: string; readonly content: string }
  | { readonly scope: HookConfigSourceScope; readonly filePath: string; readonly readError: string }

// P2 #1 fix: cap import recursion depth. 32 is well above any legitimate
// hook layering — the deepest realistic chain is global → project → shared
// dir → packaged → leaf, an order of magnitude below the cap.
const MAX_IMPORT_DEPTH = 32

// P2 #1 fix: bound recursion when the realpath fallback path canonicalises
// a symlink-laden tree. `realpathSync` resolves symlink chains in one shot,
// but it can throw on missing intermediates, in which case we used to return
// `path.resolve(filePath)` unchanged — leaving cycle detection to compare
// post-resolve names that might still differ across cycle steps. We now
// hand-walk the chain ourselves, bounded at MAX_CANONICALIZE_DEPTH, so a
// pathological symlink ring still terminates instead of blowing the stack.
const MAX_CANONICALIZE_DEPTH = 32

export function expandSnapshotImports(
  snapshot: DiscoveredHooksFileSnapshot,
  loadedFiles: Set<string>,
  envelopeCache: Map<string, ParsedHooksFileEnvelope>,
  projectResolution: ProjectHookResolution | undefined,
): { snapshots: DiscoveredHooksFileSnapshot[]; errors: HookValidationError[] } {
  const ordered: DiscoveredHooksFileSnapshot[] = []
  const errors: HookValidationError[] = []
  const visiting = new Set<string>()

  const visit = (current: DiscoveredHooksFileSnapshot, depth: number): void => {
    // P2 #1 fix: cap recursion depth on the realpath fallback path. When a
    // symlink-induced cycle escapes `realpathSync` (because the target is
    // missing or a permission error trips the system call), the canonical
    // form falls back to `path.resolve` which never collapses symlink loops.
    // The visiting-set check above stops single-cycle recursion through the
    // same canonical path, but a chain of differently-named symlinks pointing
    // at one another can still slip past it. The depth cap is the belt-and-
    // suspenders that bounds total recursion regardless of how the canonical
    // path resolves.
    if (depth > MAX_IMPORT_DEPTH) {
      errors.push(
        createError(
          current.filePath,
          "invalid_imports",
          `Import depth limit reached at ${current.filePath} (>${MAX_IMPORT_DEPTH}); refusing to recurse further.`,
          "imports",
        ),
      )
      return
    }
    const canonicalPath = canonicalizeHookPath(current.filePath)
    if (loadedFiles.has(canonicalPath)) {
      return
    }
    if (visiting.has(canonicalPath)) {
      errors.push(createError(current.filePath, "invalid_imports", `Import cycle detected involving ${current.filePath}.`, "imports"))
      return
    }

    visiting.add(canonicalPath)
    const imports = readSnapshotImports(current, errors, envelopeCache, projectResolution)
    for (const imported of imports) {
      visit(imported, depth + 1)
    }
    visiting.delete(canonicalPath)

    if (!loadedFiles.has(canonicalPath)) {
      loadedFiles.add(canonicalPath)
      ordered.push(current)
    }
  }

  visit(snapshot, 0)
  return { snapshots: ordered, errors }
}

export function readSnapshotImports(
  snapshot: DiscoveredHooksFileSnapshot,
  errors: HookValidationError[],
  envelopeCache: Map<string, ParsedHooksFileEnvelope>,
  projectResolution: ProjectHookResolution | undefined,
): DiscoveredHooksFileSnapshot[] {
  if (!("content" in snapshot)) {
    return []
  }

  const envelope = getOrParseEnvelope(snapshot.filePath, snapshot.content, envelopeCache)
  // Only surface envelope errors the first time we cache them — duplicate
  // imports referring to the same canonical file would otherwise emit the
  // same error twice. The dedupe pass at the end of `loadDiscoveredHooksFromSnapshots`
  // collapses the duplicates, but reporting once at source keeps the
  // intermediate buffer cleaner for callers that read `errors` directly.
  errors.push(...envelope.errors)
  if (envelope.errors.length > 0) {
    return []
  }

  const imports: DiscoveredHooksFileSnapshot[] = []
  for (const specifier of envelope.imports) {
    const resolved = resolveHookImportTargets(snapshot.filePath, specifier, snapshot.scope)
    if (resolved.error) {
      errors.push(resolved.error)
      continue
    }
    for (const filePath of resolved.filePaths) {
      // P1 #2 fix: imports declared in a *project* hook file may not escape
      // the project's trust anchor. Without this guard a trusted project
      // could `imports: - ../../etc/passwd`-style step out of its own tree
      // and pull arbitrary YAML/bash from anywhere on disk. The check
      // canonicalises both anchor and target (so symlink games are followed
      // before comparison) and applies to both file and bare-specifier
      // resolutions. Operators who legitimately need to import outside the
      // anchor (multi-repo monorepos, shared system-wide hook packs) can
      // opt out via PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR=1.
      if (snapshot.scope === "project") {
        const containment = checkProjectImportContainment(snapshot.filePath, filePath, projectResolution, specifier)
        if (containment) {
          errors.push(containment)
          continue
        }
      }
      try {
        // Pre-read size guard: refuse to load imported files that exceed the
        // YAML cap. parseHooksFileEnvelope re-checks after read, but stating
        // first avoids holding multi-MB strings in memory just to reject them.
        try {
          const importStat = statSync(filePath)
          if (importStat.size > MAX_HOOKS_YAML_BYTES) {
            errors.push(
              createError(
                snapshot.filePath,
                "invalid_imports",
                `[PIYAMLHOOKS] imported hooks file ${filePath} exceeds the ${MAX_HOOKS_YAML_BYTES}-byte size cap (got ${importStat.size} bytes); refusing to read.`,
                "imports",
              ),
            )
            continue
          }
        } catch {
          // statSync errors fall through to defaultReadFile which surfaces them.
        }
        imports.push({ scope: snapshot.scope, filePath, content: defaultReadFile(filePath) })
      } catch (error) {
        imports.push({ scope: snapshot.scope, filePath, readError: formatHookReadError(error) })
      }
    }
  }

  return imports
}

export function getOrParseEnvelope(
  filePath: string,
  content: string,
  envelopeCache: Map<string, ParsedHooksFileEnvelope>,
): ParsedHooksFileEnvelope {
  const canonicalKey = canonicalizeHookPath(filePath)
  const cached = envelopeCache.get(canonicalKey)
  if (cached) {
    return cached
  }
  const envelope = parseHooksFileEnvelope(filePath, content)
  envelopeCache.set(canonicalKey, envelope)
  return envelope
}

const warnedImportBypasses = new Set<string>()

function warnImportBypassOnce(env: string, boundary: string, details: Record<string, unknown>): void {
  const key = `${env}:${boundary}`
  if (warnedImportBypasses.has(key)) return
  warnedImportBypasses.add(key)
  const message = `[pi-hooks] ${env}=1 bypasses ${boundary}. Imported hooks may execute bash with the importing hook's trust.`
  // eslint-disable-next-line no-console
  console.warn(message)
  getPiHooksLogger().warn("import_trust_bypass", "Hook import trust bypass enabled by environment.", {
    details: { env, boundary, ...details },
  })
}

// Trust-anchor containment helper. Returns a HookValidationError if the
// resolved import target falls outside the project trust anchor (and the
// override env is not set); returns undefined if the import is allowed.
function checkProjectImportContainment(
  importerPath: string,
  resolvedTargetPath: string,
  projectResolution: ProjectHookResolution | undefined,
  specifier: string,
): HookValidationError | undefined {
  if (process.env.PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR === "1") {
    warnImportBypassOnce("PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR", "project import trust anchor", {
      importerPath,
      resolvedTargetPath,
      specifier,
    })
    return undefined
  }
  const anchor = projectResolution?.canonicalAnchorDir
  if (!anchor) {
    return undefined
  }
  // Resolve the canonical realpath of the import target. If `realpathSync`
  // fails (target missing, permission error) we still need to compare against
  // the *intended* path so a stale or guarded link cannot bypass the check.
  const canonicalTarget = canonicalizeHookPath(resolvedTargetPath)
  if (isPathInsideAnchor(canonicalTarget, anchor)) {
    return undefined
  }
  return createError(
    importerPath,
    "invalid_imports",
    `[PIYAMLHOOKS] Refusing to resolve project import ${JSON.stringify(specifier)} → ${canonicalTarget}: target escapes the trust anchor ${anchor}. Move the file inside the project, or set PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR=1 to opt in.`,
    "imports",
  )
}

function isPathInsideAnchor(target: string, anchor: string): boolean {
  // path.relative returns "" when target === anchor, "../foo" when target is
  // outside, and a relative descent otherwise. The platform separator check
  // is needed so we do not accept "/anchor-extra" as inside "/anchor".
  if (target === anchor) return true
  const rel = path.relative(anchor, target)
  if (rel === "" || rel === ".") return true
  if (rel.startsWith("..")) return false
  if (path.isAbsolute(rel)) return false
  return true
}

// Trust gate: imports declared inside the global hooks.yaml are refused by
// default. Global hooks live in $HOME/.pi/hook and run for every project, so a
// stray import there is effectively an unsanctioned escalation. Operators who
// rely on global imports must opt in explicitly.
function isGlobalImportsAllowed(): boolean {
  const allowed = process.env.PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS === "1"
  if (allowed) {
    warnImportBypassOnce("PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS", "global hooks import boundary", {})
  }
  return allowed
}

// Trust gate: package-specifier (bare) imports resolve through Node's module
// resolution and can therefore pull a hooks.yaml from any installed npm
// dependency. That is too much implicit trust for default discovery, so we
// require an explicit opt-in.
function isPackageImportsAllowed(): boolean {
  const allowed = process.env.PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS === "1"
  if (allowed) {
    warnImportBypassOnce("PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS", "package import boundary", {})
  }
  return allowed
}

function isBareSpecifier(specifier: string): boolean {
  if (specifier.startsWith(".")) return false
  if (path.isAbsolute(specifier)) return false
  return true
}

export function resolveHookImportTargets(
  importerPath: string,
  specifier: string,
  importerScope: HookConfigSourceScope,
): { filePaths: string[]; error?: undefined } | { filePaths?: undefined; error: HookValidationError } {
  if (importerScope === "global" && !isGlobalImportsAllowed()) {
    return {
      error: createError(
        importerPath,
        "invalid_imports",
        `[PIYAMLHOOKS] Refusing to resolve import ${JSON.stringify(specifier)} from the global hooks file. Global imports are disabled by default; set PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS=1 to opt in.`,
        "imports",
      ),
    }
  }

  if (isBareSpecifier(specifier) && !isPackageImportsAllowed()) {
    return {
      error: createError(
        importerPath,
        "invalid_imports",
        `[PIYAMLHOOKS] Refusing to resolve package import ${JSON.stringify(specifier)}. Bare-specifier (npm package) imports are disabled by default; use a relative path or set PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS=1 to opt in.`,
        "imports",
      ),
    }
  }

  try {
    const resolvedPath = !isBareSpecifier(specifier)
      ? path.resolve(path.dirname(importerPath), specifier)
      : createRequire(importerPath).resolve(specifier, { paths: [path.dirname(importerPath)] })
    return { filePaths: expandHookImportPath(resolvedPath) }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return {
      error: createError(importerPath, "invalid_imports", `Failed to resolve import ${JSON.stringify(specifier)}: ${detail}`, "imports"),
    }
  }
}

// Directory imports must only pick up real hook files. Restricting to
// .yaml/.yml extensions and skipping dotfiles keeps OS metadata (e.g. macOS
// `.DS_Store`), editor swap files, and stray non-yaml content from being
// treated as hook configuration.
function isImportableHookEntry(entryName: string): boolean {
  if (entryName.startsWith(".")) {
    return false
  }
  const lower = entryName.toLowerCase()
  return lower.endsWith(".yaml") || lower.endsWith(".yml")
}

export function expandHookImportPath(resolvedPath: string): string[] {
  const stat = statSync(resolvedPath)
  if (stat.isDirectory()) {
    return readdirSync(resolvedPath)
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .filter((entryName) => isImportableHookEntry(entryName))
      .map((entry) => path.join(resolvedPath, entry))
      .filter((entryPath) => statSync(entryPath).isFile())
  }
  return [resolvedPath]
}

export function canonicalizeHookPath(filePath: string): string {
  try {
    return realpathSync(filePath)
  } catch {
    return canonicalizeHookPathFallback(path.resolve(filePath))
  }
}

function canonicalizeHookPathFallback(startPath: string): string {
  let current = startPath
  for (let depth = 0; depth < MAX_CANONICALIZE_DEPTH; depth += 1) {
    try {
      const resolved = realpathSync(current)
      return resolved
    } catch {
      // Try walking up one component and retry. If that does not progress,
      // bail out with the best-effort resolved path. This mirrors how the
      // OS would surface ENOENT for the leaf while leaving the parent
      // symlink chain intact.
      const parent = path.dirname(current)
      if (parent === current) {
        return startPath
      }
      try {
        const parentReal = realpathSync(parent)
        return path.join(parentReal, path.basename(current))
      } catch {
        current = parent
      }
    }
  }
  // Reached the depth cap without resolving — return the original input so
  // the caller still has a stable key. The cycle-detection set will still
  // mark this path as visited so we cannot loop forever.
  return startPath
}
