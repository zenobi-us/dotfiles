import type { FileChange } from "./types.js"

const DIRECT_MUTATION_TOOL_NAMES = ["write", "edit", "multiedit"] as const
const PATCH_MUTATION_TOOL_NAMES = ["patch", "apply_patch"] as const
const BASH_TOOL_NAME = "bash" as const

export const MUTATION_TOOL_NAMES = new Set([...DIRECT_MUTATION_TOOL_NAMES, ...PATCH_MUTATION_TOOL_NAMES, BASH_TOOL_NAME])

export type MutationToolName = (typeof DIRECT_MUTATION_TOOL_NAMES)[number] | (typeof PATCH_MUTATION_TOOL_NAMES)[number] | typeof BASH_TOOL_NAME
export type NormalizedMutationToolName = "write" | "edit" | "multiedit" | "apply_patch" | "bash"

export function normalizeMutationToolName(toolName: string): NormalizedMutationToolName | undefined {
  if ((DIRECT_MUTATION_TOOL_NAMES as readonly string[]).includes(toolName)) {
    return toolName as NormalizedMutationToolName
  }

  if ((PATCH_MUTATION_TOOL_NAMES as readonly string[]).includes(toolName)) {
    return "apply_patch"
  }

  if (toolName === BASH_TOOL_NAME) {
    return "bash"
  }

  return undefined
}

export function getMutationToolHookNames(toolName: string): string[] {
  const normalized = normalizeMutationToolName(toolName)
  if (!normalized) {
    return []
  }

  if (normalized === "apply_patch") {
    return ["patch", "apply_patch"]
  }

  if (normalized === "bash") {
    return ["bash"]
  }

  return [normalized]
}

export function getToolAffectedPaths(toolName: string, args: Record<string, unknown>): string[] {
  return getChangedPaths(getToolFileChanges(toolName, args))
}

export function getToolFileChanges(toolName: string, args: Record<string, unknown>): FileChange[] {
  const normalized = normalizeMutationToolName(toolName)
  if (!normalized) {
    return []
  }

  if (normalized === "apply_patch") {
    const patchText = pickString(args.patchText, args.patch, args.diff)
    return patchText ? parsePatchChanges(patchText) : []
  }

  if (normalized === "bash") {
    const command = pickString(args.command, args.cmd)
    return command ? parseBashChanges(command) : []
  }

  // P1-16: MultiEdit (and some Edit variants) ship an `edits` array, where
  // each item is a single-edit shape. The previous code only inspected the
  // top-level path keys, silently losing every change beyond the first one.
  // Walk the array first; fall back to single-shape extraction otherwise.
  if (normalized === "multiedit") {
    const fromArray = extractEditsArrayChanges(args)
    if (fromArray.length > 0) {
      return fromArray
    }
  }

  const filePath = pickString(args.filePath, args.file_path, args.path, args.file)
  if (!filePath) {
    return []
  }

  return [{ operation: "modify", path: filePath }]
}

export function getChangedPaths(changes: readonly FileChange[]): string[] {
  const paths = new Set<string>()

  for (const change of changes) {
    if (change.operation === "rename") {
      if (change.fromPath) {
        paths.add(change.fromPath)
      }
      if (change.toPath) {
        paths.add(change.toPath)
      }
      continue
    }

    if (change.path) {
      paths.add(change.path)
    }
  }

  return Array.from(paths)
}

function pickString(...values: unknown[]): string | undefined {
  const value = values.find((candidate) => typeof candidate === "string" && candidate.trim().length > 0)
  return typeof value === "string" ? value : undefined
}

function extractEditsArrayChanges(args: Record<string, unknown>): FileChange[] {
  const editsRaw = args.edits
  if (!Array.isArray(editsRaw) || editsRaw.length === 0) {
    return []
  }

  // Top-level path is the canonical target for MultiEdit. Each edit may
  // override it (rare, but supported for forward-compat with hosts that nest
  // the path under each edit).
  const topLevelPath = pickString(args.filePath, args.file_path, args.path, args.file)

  const changes: FileChange[] = []
  for (const edit of editsRaw) {
    if (!edit || typeof edit !== "object") {
      continue
    }
    const editRecord = edit as Record<string, unknown>
    const editPath =
      pickString(editRecord.filePath, editRecord.file_path, editRecord.path, editRecord.file) ?? topLevelPath
    if (!editPath) {
      continue
    }
    changes.push({ operation: "modify", path: editPath })
  }

  return changes
}

function parsePatchChanges(patchText: string): FileChange[] {
  const changes: FileChange[] = []
  let pendingUpdatePath: string | undefined

  const flushPendingModify = (): void => {
    if (!pendingUpdatePath) {
      return
    }

    changes.push({ operation: "modify", path: pendingUpdatePath })
    pendingUpdatePath = undefined
  }

  for (const line of patchText.split("\n")) {
    const addMatch = line.match(/^\*\*\* Add File: (.+)$/)
    if (addMatch?.[1]) {
      flushPendingModify()
      changes.push({ operation: "create", path: addMatch[1].trim() })
      continue
    }

    const deleteMatch = line.match(/^\*\*\* Delete File: (.+)$/)
    if (deleteMatch?.[1]) {
      flushPendingModify()
      changes.push({ operation: "delete", path: deleteMatch[1].trim() })
      continue
    }

    const updateMatch = line.match(/^\*\*\* Update File: (.+)$/)
    if (updateMatch?.[1]) {
      flushPendingModify()
      pendingUpdatePath = updateMatch[1].trim()
      continue
    }

    const renameMatch = line.match(/^\*\*\* Move to: (.+)$/)
    if (renameMatch?.[1] && pendingUpdatePath) {
      changes.push({ operation: "rename", fromPath: pendingUpdatePath, toPath: renameMatch[1].trim() })
      pendingUpdatePath = undefined
    }
  }

  flushPendingModify()
  return changes
}

function parseBashChanges(command: string): FileChange[] {
  const changes: FileChange[] = []

  for (const segment of splitBashCommands(command)) {
    const tokens = shellTokenize(segment)
    if (tokens.length === 0) {
      continue
    }

    const cmd = tokens[0]

    // P1-17: parenthesise the `&&` / `||` properly. The previous code read
    // `cmd === "rm" || cmd === "git" && tokens[1] === "rm"`, which JS
    // evaluates as `cmd === "rm" || (cmd === "git" && tokens[1] === "rm")`
    // — coincidentally correct for `rm`, but the same shape was applied to
    // `mv`/`cp`, where the right-side test must also disqualify a bare `mv`
    // when a `git`-prefix is expected. Make the grouping explicit.
    if (cmd === "rm" || (cmd === "git" && tokens[1] === "rm")) {
      const paths = extractPathArgs(tokens, cmd === "git" ? 2 : 1)
      for (const p of paths) {
        changes.push({ operation: "delete", path: p })
      }
      continue
    }

    if (cmd === "mv" || (cmd === "git" && tokens[1] === "mv")) {
      const paths = extractPathArgs(tokens, cmd === "git" ? 2 : 1)
      if (paths.length >= 2) {
        const dest = paths[paths.length - 1]
        for (const src of paths.slice(0, -1)) {
          changes.push({ operation: "rename", fromPath: src, toPath: dest })
        }
      }
      continue
    }

    if (cmd === "cp" || (cmd === "git" && tokens[1] === "cp")) {
      const paths = extractPathArgs(tokens, cmd === "git" ? 2 : 1)
      if (paths.length >= 2) {
        changes.push({ operation: "create", path: paths[paths.length - 1] })
      }
      continue
    }

    if (cmd === "touch") {
      const paths = extractPathArgs(tokens, 1)
      for (const p of paths) {
        changes.push({ operation: "create", path: p })
      }
      continue
    }

    if (cmd === "mkdir") {
      const paths = extractPathArgs(tokens, 1)
      for (const p of paths) {
        changes.push({ operation: "create", path: p })
      }
      continue
    }
  }

  return changes
}

function splitBashCommands(command: string): string[] {
  return command.split(/\s*(?:&&|\|\||;)\s*/)
}

function shellTokenize(segment: string): string[] {
  const tokens: string[] = []
  let current = ""
  let inSingle = false
  let inDouble = false
  let escape = false

  for (const ch of segment) {
    if (escape) {
      current += ch
      escape = false
      continue
    }

    if (ch === "\\" && !inSingle) {
      escape = true
      continue
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle
      continue
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble
      continue
    }

    if (/\s/.test(ch) && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current)
        current = ""
      }
      continue
    }

    current += ch
  }

  if (current.length > 0) {
    tokens.push(current)
  }

  return tokens
}

/**
 * Extract positional path arguments from a tokenised shell segment, skipping
 * flags. POSIX `--` is honoured: every token after `--` is treated as a
 * positional argument even if it begins with `-` (so `rm -- --bad-name`
 * extracts `--bad-name` as a path).
 */
function extractPathArgs(tokens: string[], startIndex: number): string[] {
  const paths: string[] = []
  let positionalOnly = false
  for (let i = startIndex; i < tokens.length; i++) {
    const token = tokens[i]
    if (positionalOnly) {
      paths.push(token)
      continue
    }
    if (token === "--") {
      // P1-17: a bare `--` flips the parser into positional-only mode for
      // the remainder of the segment. The previous loop tried to do the
      // same via `startIndex = i + 1` + `continue`, but the outer `for`
      // header keeps using its captured `startIndex`, so the reassignment
      // had no effect and the next `-`-prefixed token was still treated as
      // a flag.
      positionalOnly = true
      continue
    }
    if (token.startsWith("-")) {
      continue
    }
    paths.push(token)
  }
  return paths
}
