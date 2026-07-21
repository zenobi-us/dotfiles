import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import type { CommentIntent } from "./types.js";

export type ShortcutSide = "added" | "deleted" | "both";

export interface CommentShortcut {
  id: string;
  key: string;
  label: string;
  intent: CommentIntent;
  side: ShortcutSide;
  text: string;
}

interface ShortcutConfigFile {
  $schema?: string;
  version?: unknown;
  builtins?: {
    disable?: unknown;
  };
  shortcuts?: unknown;
}

interface ShortcutConfigEntry {
  id?: unknown;
  key?: unknown;
  label?: unknown;
  intent?: unknown;
  side?: unknown;
  text?: unknown;
}

export interface LoadedCommentShortcuts {
  shortcuts: CommentShortcut[];
  warnings: string[];
  path: string;
}

const CONFIG_FILE_NAME = "slopchop.json";

export const BUILTIN_COMMENT_SHORTCUTS: CommentShortcut[] = [
  { id: "explain-added", key: "e", label: "explain", intent: "discuss", side: "added", text: "Explain what this code is doing." },
  { id: "why-added", key: "w", label: "why", intent: "discuss", side: "added", text: "Why was this added?" },
  { id: "intent-added", key: "i", label: "intent", intent: "discuss", side: "added", text: "What problem is this solving?" },
  { id: "rename-added", key: "r", label: "rename", intent: "fix", side: "added", text: "Consider a clearer name here." },
  { id: "simplify-added", key: "s", label: "simplify", intent: "fix", side: "added", text: "Can this be simplified?" },
  { id: "tests-added", key: "t", label: "tests", intent: "fix", side: "added", text: "Add or update tests covering this change." },
  { id: "explain-deleted", key: "e", label: "explain", intent: "discuss", side: "deleted", text: "Explain what this deleted code was doing." },
  { id: "why-deleted", key: "w", label: "why", intent: "discuss", side: "deleted", text: "Why was this deleted?" },
  { id: "impact-deleted", key: "i", label: "impact", intent: "discuss", side: "deleted", text: "What behavior changed because of this deletion?" },
  { id: "restore-deleted", key: "k", label: "restore", intent: "fix", side: "deleted", text: "This may need to be restored." },
];

function overlaps(a: ShortcutSide, b: ShortcutSide): boolean {
  return a === "both" || b === "both" || a === b;
}

function isPrintableSingleCharacter(value: string): boolean {
  return /^[ -~]$/.test(value) && value !== "/";
}

function validateShortcut(entry: ShortcutConfigEntry, index: number, warnings: string[]): CommentShortcut | null {
  if (typeof entry.id !== "string" || !/^[a-z0-9-]+$/.test(entry.id)) {
    warnings.push(`Ignoring shortcut #${index + 1}: id must be kebab-case.`);
    return null;
  }
  if (typeof entry.key !== "string" || !isPrintableSingleCharacter(entry.key)) {
    warnings.push(`Ignoring shortcut \"${entry.id}\": key must be a single printable character other than '/'.`);
    return null;
  }
  if (typeof entry.label !== "string" || entry.label.trim().length === 0) {
    warnings.push(`Ignoring shortcut \"${entry.id}\": label must be a non-empty string.`);
    return null;
  }
  if (entry.intent !== "fix" && entry.intent !== "discuss") {
    warnings.push(`Ignoring shortcut \"${entry.id}\": intent must be 'fix' or 'discuss'.`);
    return null;
  }
  if (entry.side !== "added" && entry.side !== "deleted" && entry.side !== "both") {
    warnings.push(`Ignoring shortcut \"${entry.id}\": side must be 'added', 'deleted', or 'both'.`);
    return null;
  }
  if (typeof entry.text !== "string" || entry.text.trim().length === 0) {
    warnings.push(`Ignoring shortcut \"${entry.id}\": text must be a non-empty string.`);
    return null;
  }

  return {
    id: entry.id,
    key: entry.key.toLowerCase(),
    label: entry.label.trim(),
    intent: entry.intent,
    side: entry.side,
    text: entry.text.trim(),
  };
}

export function parseShortcutConfig(config: unknown): { shortcuts: CommentShortcut[]; warnings: string[] } {
  const warnings: string[] = [];
  const parsed = (config ?? {}) as ShortcutConfigFile;

  if (parsed.version != null && parsed.version !== 1) {
    warnings.push(`Unsupported slopchop shortcut config version: ${String(parsed.version)}. Expected version 1.`);
  }

  const disabledBuiltinIds = new Set<string>();
  const disableList = parsed.builtins?.disable;
  if (Array.isArray(disableList)) {
    for (const id of disableList) {
      if (typeof id === "string") disabledBuiltinIds.add(id);
      else warnings.push("Ignoring non-string builtin disable entry.");
    }
  } else if (disableList != null) {
    warnings.push("Ignoring builtins.disable because it is not an array.");
  }

  const shortcuts = BUILTIN_COMMENT_SHORTCUTS.filter((shortcut) => !disabledBuiltinIds.has(shortcut.id));
  const activeById = new Set(shortcuts.map((shortcut) => shortcut.id));

  if (parsed.shortcuts != null && !Array.isArray(parsed.shortcuts)) {
    warnings.push("Ignoring shortcuts because it is not an array.");
    return { shortcuts, warnings };
  }

  for (const [index, rawEntry] of (parsed.shortcuts ?? []).entries()) {
    const shortcut = validateShortcut(rawEntry as ShortcutConfigEntry, index, warnings);
    if (shortcut == null) continue;

    if (activeById.has(shortcut.id)) {
      warnings.push(`Ignoring shortcut \"${shortcut.id}\": duplicate id.`);
      continue;
    }

    const conflicting = shortcuts.find((existing) => existing.key === shortcut.key && overlaps(existing.side, shortcut.side));
    if (conflicting != null) {
      warnings.push(`Ignoring shortcut \"${shortcut.id}\": key '${shortcut.key}' conflicts with shortcut \"${conflicting.id}\".`);
      continue;
    }

    activeById.add(shortcut.id);
    shortcuts.push(shortcut);
  }

  return { shortcuts, warnings };
}

export function getShortcutsForSide(shortcuts: CommentShortcut[], side: Exclude<ShortcutSide, "both">): CommentShortcut[] {
  return shortcuts.filter((shortcut) => shortcut.side === "both" || shortcut.side === side);
}

export function getShortcutConfigPath(): string {
  return join(getAgentDir(), "extensions", CONFIG_FILE_NAME);
}

export function loadCommentShortcuts(): LoadedCommentShortcuts {
  const path = getShortcutConfigPath();
  if (!existsSync(path)) {
    return { shortcuts: BUILTIN_COMMENT_SHORTCUTS, warnings: [], path };
  }

  try {
    const config = JSON.parse(readFileSync(path, "utf8")) as unknown;
    const parsed = parseShortcutConfig(config);
    return { shortcuts: parsed.shortcuts, warnings: parsed.warnings, path };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      shortcuts: BUILTIN_COMMENT_SHORTCUTS,
      warnings: [`Could not read shortcut config at ${path}: ${message}`],
      path,
    };
  }
}
