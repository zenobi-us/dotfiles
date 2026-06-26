import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import type { KeyId } from "@earendil-works/pi-tui";
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
  globalShortcut?: unknown;
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
  globalShortcut: KeyId;
  warnings: string[];
  path: string;
}

const CONFIG_FILE_NAME = "slopchop.json";
export const DEFAULT_GLOBAL_SHORTCUT: KeyId = "alt+s";

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

// These key tables mirror the `BaseKey` and `ModifierName` unions that pi-tui
// uses to build `KeyId` (see node_modules/@earendil-works/pi-tui/dist/keys.d.ts).
// Pi ships no runtime validator, so we keep them in sync by hand — update them if
// the library adds keys or modifiers. Names are lower-cased because pi-tui matches
// keys case-insensitively (`parseKeyId` lower-cases every KeyId before comparing),
// which is why `pageup`/`pagedown` appear here rather than the type-level
// `pageUp`/`pageDown`.
const VALID_MODIFIERS = new Set(["ctrl", "shift", "alt", "super"]);
const SYMBOL_KEYS = new Set([
  "`", "-", "=", "[", "]", "\\", ";", "'", ",", ".", "/", "!", "@", "#", "$", "%",
  "^", "&", "*", "(", ")", "_", "+", "|", "~", "{", "}", ":", "<", ">", "?",
]);
const SPECIAL_KEYS = new Set([
  "escape", "esc", "enter", "return", "tab", "space", "backspace", "delete", "insert",
  "clear", "home", "end", "pageup", "pagedown", "up", "down", "left", "right",
  "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12",
]);

// A "printable" key is a single character that produces text when typed on its
// own (letters, digits, symbols), as opposed to special keys like arrows or
// function keys. Used as a single-char global shortcut it would capture normal
// typing, so we require a modifier for these.
function isPrintableKey(key: string): boolean {
  return /^[a-z0-9]$/.test(key) || SYMBOL_KEYS.has(key);
}

// Expects an already-normalized (trimmed, lower-cased) value; the only caller is
// parseGlobalShortcut, which normalizes first.
function isValidKeyId(value: string): boolean {
  const parts = value.split("+");
  const key = parts.at(-1);
  if (key == null || key.length === 0) return false;

  const modifiers = parts.slice(0, -1);
  if (modifiers.length !== new Set(modifiers).size) return false;
  if (!modifiers.every((modifier) => VALID_MODIFIERS.has(modifier))) return false;
  // Escape is supported as an unmodified key.
  if ((key === "escape" || key === "esc") && modifiers.length > 0) return false;

  return isPrintableKey(key) || SPECIAL_KEYS.has(key);
}

function parseGlobalShortcut(value: unknown, warnings: string[]): KeyId {
  if (value == null) return DEFAULT_GLOBAL_SHORTCUT;
  if (typeof value !== "string" || value.trim().length === 0) {
    warnings.push(`Ignoring globalShortcut: expected a non-empty key identifier. Using ${DEFAULT_GLOBAL_SHORTCUT}.`);
    return DEFAULT_GLOBAL_SHORTCUT;
  }

  const normalized = value.trim().toLowerCase();
  if (!isValidKeyId(normalized)) {
    warnings.push(`Ignoring globalShortcut "${value}": expected a valid key identifier. Using ${DEFAULT_GLOBAL_SHORTCUT}.`);
    return DEFAULT_GLOBAL_SHORTCUT;
  }

  // A bare printable character (no modifier) would fire while the user is typing,
  // so require at least one modifier for those. Special keys (f-keys, arrows, …)
  // are safe on their own.
  if (!normalized.includes("+") && isPrintableKey(normalized)) {
    warnings.push(`Ignoring globalShortcut "${value}": a single character needs a modifier (e.g. "alt+s") so it does not capture normal typing. Using ${DEFAULT_GLOBAL_SHORTCUT}.`);
    return DEFAULT_GLOBAL_SHORTCUT;
  }

  return normalized as KeyId;
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

export function parseShortcutConfig(config: unknown): { shortcuts: CommentShortcut[]; globalShortcut: KeyId; warnings: string[] } {
  const warnings: string[] = [];
  const parsed = (config ?? {}) as ShortcutConfigFile;
  const globalShortcut = parseGlobalShortcut(parsed.globalShortcut, warnings);

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
    return { shortcuts, globalShortcut, warnings };
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

  return { shortcuts, globalShortcut, warnings };
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
    return { shortcuts: BUILTIN_COMMENT_SHORTCUTS, globalShortcut: DEFAULT_GLOBAL_SHORTCUT, warnings: [], path };
  }

  try {
    const config = JSON.parse(readFileSync(path, "utf8")) as unknown;
    const parsed = parseShortcutConfig(config);
    return { shortcuts: parsed.shortcuts, globalShortcut: parsed.globalShortcut, warnings: parsed.warnings, path };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      shortcuts: BUILTIN_COMMENT_SHORTCUTS,
      globalShortcut: DEFAULT_GLOBAL_SHORTCUT,
      warnings: [`Could not read shortcut config at ${path}: ${message}`],
      path,
    };
  }
}
