import { spawn } from "node:child_process"
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent"

import { getPiHooksLogFilePath } from "../core/logger.js"
import {
  resolveProjectHookResolution,
  resolveHookConfigPaths,
} from "../core/config-paths.js"
import {
  formatHookLoadSummary,
  loadDiscoveredHooksSnapshot,
  loadHooksFile,
  summarizeHookSources,
} from "../core/load-hooks.js"
import { sendHookDiagnostics } from "./diagnostics.js"

export function registerCommands(pi: ExtensionAPI): void {
  pi.registerCommand("hooks-status", {
    description: "Show active hook files, trust state, and log path",
    handler: async (_args, ctx) => {
      const status = getHooksStatus(ctx)
      const lines = [
        `Hooks status for ${status.projectDir}`,
        `Active summary: ${formatHookLoadSummary({ sources: status.active.sources })}`,
        `Global config: ${formatStatusPath(status.paths.global)}`,
        `Project config: ${formatStatusPath(status.projectStatusPath)}`,
        `Project trusted: ${status.projectTrusted ? "yes" : "no"}`,
        `Hook log: ${status.logFilePath}`,
      ]
      if (status.projectConfigExists && !status.projectTrusted) {
        lines.push("Project hooks exist but are not active until the project is trusted.")
      }
      sendHookDiagnostics(pi, {
        title: "Hook status",
        level: "info",
        content: lines.join("\n"),
        sections: [
          {
            label: "Loaded sources",
            lines: status.active.sources.map((source) => `${source.scope}: ${source.filePath} (${source.hookCount} hooks)`),
          },
        ],
      })
      notifyCommand(ctx, lines.join("\n"), "info", false)
    },
  })

  pi.registerCommand("hooks-validate", {
    description: "Validate active and project hook files with actionable feedback",
    handler: async (_args, ctx) => {
      // P2-13: validation is grouped by source scope (global / project /
      // imported) and surfaces loader advisories so a broken global file is
      // never hidden by a healthy project file.
      const validation = validateHooks(ctx)
      const lines = [`Hook validation for ${ctx.cwd}`]

      const totalScopedErrors =
        validation.byScope.global.length +
        validation.byScope.project.length +
        validation.byScope.imported.length

      if (totalScopedErrors === 0) {
        const summary = summarizeHookSources(validation.active.sources)
        lines.push(`Active hooks are valid: ${summary.total} loaded (${summary.global} global, ${summary.project} project).`)
      } else {
        if (validation.byScope.global.length > 0) {
          lines.push("Global hook errors:")
          lines.push(...validation.byScope.global.map(formatValidationError))
        }
        if (validation.byScope.project.length > 0) {
          lines.push("Project hook errors:")
          lines.push(...validation.byScope.project.map(formatValidationError))
        }
        if (validation.byScope.imported.length > 0) {
          lines.push("Imported file errors:")
          lines.push(...validation.byScope.imported.map(formatValidationError))
        }
      }

      if (validation.advisories.length > 0) {
        lines.push("Loader advisories:")
        lines.push(...validation.advisories.map((message) => `- ${message}`))
      }

      if (validation.project.exists && !validation.project.trusted) {
        if (validation.project.errors.length === 0) {
          lines.push(`Project hook file is valid but untrusted: ${validation.project.path}`)
          lines.push('Run /hooks-trust to activate it without editing trusted-projects.json by hand.')
        } else {
          lines.push(`Project hook file is untrusted and has validation errors: ${validation.project.path}`)
          lines.push(...validation.project.errors.map(formatValidationError))
        }
      } else if (!validation.project.exists) {
        lines.push("No project hook file is present for the current repo/worktree scope.")
      }

      const level =
        totalScopedErrors > 0 || validation.project.errors.length > 0 ? "warning" : "info"
      sendHookDiagnostics(pi, {
        title: "Hook validation",
        level,
        content: lines.join("\n"),
        sections: compactDiagnosticSections([
          {
            label: "Global validation errors",
            lines: validation.byScope.global.map(formatValidationError),
          },
          {
            label: "Project validation errors",
            lines: validation.byScope.project.map(formatValidationError),
          },
          {
            label: "Imported file validation errors",
            lines: validation.byScope.imported.map(formatValidationError),
          },
          {
            label: "Untrusted project file errors",
            lines: validation.project.errors.map(formatValidationError),
          },
          {
            label: "Loader advisories",
            lines: validation.advisories.map((message) => `- ${message}`),
          },
        ]),
      })
      notifyCommand(ctx, lines.join("\n"), level, false)
    },
  })

  pi.registerCommand("hooks-trust", {
    description: "Trust the current project hook file",
    handler: async (_args, ctx) => {
      const projectDir = path.resolve(ctx.cwd)
      const project = resolveProjectHookResolution({ projectDir })
      if (!project?.projectConfigPath || !existsSync(project.projectConfigPath)) {
        notifyCommand(
          ctx,
          `No project hook file was found for ${projectDir}. Create ${project?.projectConfigPath ?? path.join(projectDir, ".pi", "hook", "hooks.yaml")} first, then run /hooks-trust again.`,
          "warning",
        )
        return
      }

      const trustFile = getTrustedProjectsFilePath()
      const trustAnchor = project.canonicalAnchorDir
      const updated = updateTrustedProjectsWithLock(trustFile, trustAnchor)
      if (!updated.ok) {
        notifyCommand(
          ctx,
          `Cannot update ${trustFile} because it is not valid JSON. Fix or remove that file, then run /hooks-trust again.`,
          "error",
        )
        return
      }

      notifyCommand(
        ctx,
        `Trusted project hooks for ${project.anchorDir}. Run /hooks-validate or trigger another PI event to confirm the active hook set.`,
        "info",
      )
    },
  })

  pi.registerCommand("hooks-reload", {
    description: "Reload extensions and hook command surfaces",
    handler: async (_args, ctx) => {
      // P2-19: PI exposes no public counter for in-flight hook executions and
      // we cannot edit `src/pi/adapter.ts` from this lane, so we cannot block
      // until quiescent. Instead the success copy is honest: in-flight bash
      // hooks keep running against the old config, and the autocomplete
      // refresh claim is dropped — autocomplete state now memoizes off the
      // hook-snapshot signature (P1-11) and refreshes lazily on the next
      // /hooks- keystroke regardless of whether ctx.reload() ran.
      const message =
        "Reloading PI extensions. Edited hooks.yaml files also refresh on the next relevant PI event. In-flight hooks finish under the previously loaded configuration."
      if (ctx.hasUI) {
        ctx.ui.notify(message, "info")
      } else {
        // eslint-disable-next-line no-console
        console.info(`[pi-hooks] ${message}`)
      }
      await ctx.reload()
    },
  })

  pi.registerCommand("hooks-tail-log", {
    description: "Show the hook log path, or start a live log tail with --follow",
    handler: async (args, ctx) => {
      const logFilePath = getPiHooksLogFilePath()
      const argv = parseTailLogArgs(args)

      if (argv.printPath) {
        // --path: print only the file path. Useful when piping into another
        // tool or when the user just wants to know where to look.
        notifyCommand(ctx, logFilePath, "info")
        return
      }

      if (argv.follow) {
        // P2-12: actually tail. We spawn `scripts/tail-hook-log.sh` detached
        // with inherited stdio so the user sees a live feed; the launched
        // process keeps running after this command returns. If spawn fails
        // (e.g. the script is missing in a packaged install), fall through
        // to the copy-pasteable tail -F hint instead of erroring out.
        const scriptPath = locateTailHookLogScript()
        if (scriptPath) {
          try {
            const child = spawn("bash", [scriptPath], { detached: true, stdio: "inherit" })
            child.on("error", (error) => {
              // eslint-disable-next-line no-console
              console.error(`[pi-hooks] tail-hook-log.sh failed to start: ${error.message}`)
            })
            child.unref()
            notifyCommand(
              ctx,
              `Tailing hook log via ${scriptPath} (pid ${child.pid ?? "?"}). Hook log: ${logFilePath}`,
              "info",
            )
            return
          } catch (error) {
            const detail = error instanceof Error ? error.message : String(error)
            notifyCommand(
              ctx,
              `Could not start a live log tail (${detail}). Falling back to a copy-pasteable command. Hook log: ${logFilePath}\nTail it with: tail -F ${JSON.stringify(logFilePath)}`,
              "warning",
            )
            return
          }
        }
        notifyCommand(
          ctx,
          `Could not start a live log tail from this install. Hook log: ${logFilePath}\nTail it with: tail -F ${JSON.stringify(logFilePath)}`,
          "warning",
        )
        return
      }

      notifyCommand(
        ctx,
        `Hook log: ${logFilePath}\nTail it with: tail -F ${JSON.stringify(logFilePath)}\n(Pass --follow to start a live tail, or --path to print only the path.)`,
        "info",
      )
    },
  })
}

interface HooksStatus {
  readonly projectDir: string
  readonly projectTrusted: boolean
  readonly projectConfigExists: boolean
  readonly projectStatusPath: string
  readonly paths: ReturnType<typeof resolveHookConfigPaths>
  readonly active: ReturnType<typeof loadDiscoveredHooksSnapshot>
  readonly logFilePath: string
}

function getHooksStatus(ctx: ExtensionCommandContext): HooksStatus {
  const projectDir = path.resolve(ctx.cwd)
  const paths = resolveHookConfigPaths({ projectDir })
  const active = loadDiscoveredHooksSnapshot({ projectDir })
  const project = resolveProjectHookResolution({ projectDir })
  const projectStatusPath =
    project?.projectConfigPath ??
    path.join(project?.discoveredProjectRoot ?? project?.worktreeRoot ?? projectDir, ".pi", "hook", "hooks.yaml")
  const projectConfigExists = existsSync(projectStatusPath)
  const projectTrusted = project?.trusted ?? false

  return {
    projectDir,
    projectTrusted,
    projectConfigExists,
    projectStatusPath,
    paths,
    active,
    logFilePath: getPiHooksLogFilePath(),
  }
}

interface ScopedValidationErrors {
  readonly global: Array<{ filePath: string; path?: string; message: string }>
  readonly project: Array<{ filePath: string; path?: string; message: string }>
  readonly imported: Array<{ filePath: string; path?: string; message: string }>
}

function validateHooks(ctx: ExtensionCommandContext): {
  readonly active: ReturnType<typeof loadDiscoveredHooksSnapshot>
  readonly byScope: ScopedValidationErrors
  readonly advisories: string[]
  readonly project: {
    readonly exists: boolean
    readonly trusted: boolean
    readonly path?: string
    readonly errors: Array<{ filePath: string; path?: string; message: string }>
  }
} {
  const status = getHooksStatus(ctx)
  const activeProjectRootPaths = new Set(
    status.active.sources
      .filter((source) => source.scope === "project" && source.filePath === status.paths.project)
      .map((source) => source.filePath),
  )
  const activeGlobalRootPaths = new Set(
    status.active.sources
      .filter((source) => source.scope === "global" && source.filePath === status.paths.global)
      .map((source) => source.filePath),
  )
  const projectPath = status.paths.project
  const projectExists = Boolean(projectPath && existsSync(projectPath))
  const trusted = Boolean(projectPath && activeProjectRootPaths.has(projectPath))
  const projectErrors = projectExists && projectPath ? loadHooksFile(projectPath).errors : []

  // P2-13: bucket every error from the active discovery result by source
  // scope. A "global" error is one whose filePath was loaded as a global
  // source; "project" is symmetric; everything else (typically files pulled
  // in via `imports:`) lands in the imported bucket so users can see it
  // separately from the top-level files.
  const byScope: ScopedValidationErrors = {
    global: [],
    project: [],
    imported: [],
  }
  for (const error of status.active.errors) {
    if (activeGlobalRootPaths.has(error.filePath)) {
      byScope.global.push(error)
    } else if (activeProjectRootPaths.has(error.filePath)) {
      byScope.project.push(error)
    } else {
      byScope.imported.push(error)
    }
  }

  // P2-13: also re-validate the global file directly. The discovery result
  // skips a global file with hard parse errors when an alternate scope
  // succeeds, so a broken global config could otherwise be invisible here.
  const globalPath = status.paths.global
  if (globalPath && existsSync(globalPath) && !activeGlobalRootPaths.has(globalPath)) {    const directGlobal = loadHooksFile(globalPath).errors
    if (directGlobal.length > 0) {
      // Avoid duplicate reporting if the same error is already in the bucket
      // (defensive — discovery and direct load should not double-emit).
      const seen = new Set(byScope.global.map((error) => `${error.filePath}#${error.path ?? ""}|${error.message}`))
      for (const error of directGlobal) {
        const key = `${error.filePath}#${error.path ?? ""}|${error.message}`
        if (!seen.has(key)) {
          seen.add(key)
          byScope.global.push(error)
        }
      }
    }
  }

  // P2-13: surface loader advisories (e.g. tool follow-up-prompt warning,
  // scope: child advisory) through the validate command so users see them
  // alongside hard errors.
  const advisories: string[] = []
  for (const filePath of new Set([...activeGlobalRootPaths, ...activeProjectRootPaths])) {    const loaded = loadHooksFile(filePath)
    if (loaded.advisories) {
      advisories.push(...loaded.advisories)
    }
  }

  return {
    active: status.active,
    byScope,
    advisories,
    project: {
      exists: projectExists,
      trusted,
      ...(projectPath ? { path: projectPath } : {}),
      errors: projectErrors,
    },
  }
}

function notifyCommand(
  ctx: ExtensionCommandContext,
  message: string,
  level: "info" | "warning" | "error",
  notifyUi = true,
): void {
  if (notifyUi && ctx.hasUI) {
    ctx.ui.notify(message, level)
  }
  // eslint-disable-next-line no-console
  console.info(`[pi-hooks] ${message}`)
}

function getTrustedProjectsFilePath(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir()
  return path.join(homeDir, ".pi", "agent", "trusted-projects.json")
}

function readTrustedProjects(filePath: string):
  | { readonly ok: true; readonly entries: string[] }
  | { readonly ok: false } {
  try {
    if (!existsSync(filePath)) {
      return { ok: true, entries: [] }
    }
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown
    if (!Array.isArray(parsed)) {
      return { ok: false }
    }
    return { ok: true, entries: parsed.filter((entry): entry is string => typeof entry === "string") }
  } catch {
    return { ok: false }
  }
}

function updateTrustedProjectsWithLock(filePath: string, trustAnchor: string): { readonly ok: true } | { readonly ok: false } {
  return withTrustedProjectsLock(filePath, () => {
    const current = readTrustedProjects(filePath)
    if (!current.ok) {
      return { ok: false }
    }

    const normalizedCurrent = new Set(current.entries.map(canonicalizeForTrust))
    if (!normalizedCurrent.has(trustAnchor)) {
      const nextContent = JSON.stringify([...current.entries, trustAnchor], null, 2) + "\n"
      atomicallyWriteFile(filePath, nextContent, 0o600)
    }
    return { ok: true }
  })
}

function withTrustedProjectsLock<T>(filePath: string, run: () => T): T {
  const dir = path.dirname(filePath)
  mkdirSync(dir, { recursive: true })
  const lockDir = path.join(dir, `${path.basename(filePath)}.lock`)
  const deadline = Date.now() + 5_000
  while (true) {
    try {
      mkdirSync(lockDir, 0o700)
      break
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : ""
      if (code !== "EEXIST" || Date.now() >= deadline) {
        throw error
      }
      sleepSync(25)
    }
  }

  try {
    return run()
  } finally {
    rmSync(lockDir, { recursive: true, force: true })
  }
}

function sleepSync(ms: number): void {
  const view = new Int32Array(new SharedArrayBuffer(4))
  Atomics.wait(view, 0, 0, ms)
}

function formatValidationError(error: { filePath: string; path?: string; message: string }): string {
  return `- ${error.filePath}${error.path ? `#${error.path}` : ""}: ${error.message}`
}

function formatStatusPath(filePath: string | undefined): string {
  if (!filePath) {
    return "not applicable"
  }
  return existsSync(filePath) ? filePath : `${filePath} (missing)`
}

function canonicalizeForTrust(filePath: string): string {
  try {
    return path.resolve(realpathSync.native(filePath))
  } catch {
    return path.resolve(filePath)
  }
}

// P1-12: atomic file write. mkdir parent → open <file>.tmp.<pid>.<rand>
// with mode 0o600 → write → fsync → close → rename. The rename is atomic
// on POSIX same-filesystem, so concurrent writers never observe a partial
// file.
function atomicallyWriteFile(filePath: string, content: string, mode: number): void {
  const dir = path.dirname(filePath)
  mkdirSync(dir, { recursive: true })
  const tmpPath = path.join(
    dir,
    `${path.basename(filePath)}.tmp.${process.pid}.${Math.random().toString(36).slice(2, 10)}`,
  )

  // O_WRONLY | O_CREAT | O_EXCL ensures we don't clobber a leftover temp
  // and gives us a fresh inode whose mode we control.
  const fd = openSync(tmpPath, "wx", mode)
  try {
    const buffer = Buffer.from(content, "utf8")
    let written = 0
    while (written < buffer.length) {
      written += writeSync(fd, buffer, written, buffer.length - written)
    }
    try {
      fsyncSync(fd)
    } catch {
      // fsync may fail on exotic filesystems (e.g. some network mounts).
      // We still rename — losing fsync is preferable to corrupting the
      // trust file by aborting halfway.
    }
  } finally {
    try {
      closeSync(fd)
    } catch {
      /* ignore */
    }
  }

  try {
    renameSync(tmpPath, filePath)
  } catch (error) {
    // Clean up the temp file on rename failure so we don't leak it.
    try {
      unlinkSync(tmpPath)
    } catch {
      /* ignore */
    }
    throw error
  }
}

function compactDiagnosticSections<T extends { readonly lines: readonly string[] }>(sections: T[]): T[] {
  return sections.filter((section) => section.lines.length > 0)
}

interface TailLogArgs {
  readonly follow: boolean
  readonly printPath: boolean
}

function parseTailLogArgs(args: string): TailLogArgs {
  // Tokenise on whitespace; quoting is unnecessary because the only
  // recognised flags are --follow and --path.
  const tokens = args.trim().length > 0 ? args.trim().split(/\s+/) : []
  let follow = false
  let printPath = false
  for (const token of tokens) {
    if (token === "--follow" || token === "-f") follow = true
    else if (token === "--path" || token === "-p") printPath = true
  }
  return { follow, printPath }
}

// Resolve the path to scripts/tail-hook-log.sh. The compiled output lives
// in dist/pi/commands.js; the script ships at <repo>/scripts/tail-hook-log.sh
// alongside dist/. We walk up from this file's URL until we find it.
function locateTailHookLogScript(): string | undefined {
  let currentDir: string
  try {
    currentDir = path.dirname(fileURLToPath(import.meta.url))
  } catch {
    return undefined
  }
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(currentDir, "scripts", "tail-hook-log.sh")
    if (existsSync(candidate)) {
      return candidate
    }
    const parent = path.dirname(currentDir)
    if (parent === currentDir) break
    currentDir = parent
  }
  return undefined
}
