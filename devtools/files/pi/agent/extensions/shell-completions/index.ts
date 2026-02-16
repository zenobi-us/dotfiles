/**
 * Shell Completions Extension for Pi
 *
 * Adds native shell completions (fish/zsh/bash) to pi's `!` and `!!` bash mode.
 * Uses the user's actual shell completion configuration - if they haven't
 * set up completions, we don't provide them (no magic).
 *
 * Usage: Place in ~/.pi/agent/extensions/shell-completions/index.ts
 *
 * Shell priority:
 * 1. User's $SHELL (if fish/zsh/bash) - uses their configured completions
 * 2. Fish (if available) - always has completions (core feature)
 * 3. Zsh (if compinit is configured)
 * 4. Bash (if bash-completion is installed)
 *
 * Philosophy: Don't magically provide completions the user hasn't configured.
 * This means completions respect the user's shell setup, aliases, and customizations.
 */

import { CustomEditor, type ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { AutocompleteItem, AutocompleteProvider } from "@mariozechner/pi-tui";
import * as fs from "node:fs";
import * as path from "node:path";

import type { ShellInfo, ShellType, CompletionResult } from "./types.js";
import { getFishCompletions } from "./fish.js";
import { getBashCompletions } from "./bash.js";
import { getZshCompletions } from "./zsh.js";

// ============================================================================
// Shell Detection
// ============================================================================

/**
 * Detect shell type from path.
 */
function detectShellType(shellPath: string): ShellType {
	const name = path.basename(shellPath);
	if (name === "fish" || name.startsWith("fish")) return "fish";
	if (name === "zsh" || name.startsWith("zsh")) return "zsh";
	return "bash";
}

/**
 * Find a shell suitable for running completion scripts.
 *
 * Priority:
 * 1. User's $SHELL if it's fish/zsh/bash (respects user's configured completions)
 * 2. Fish if available (best completion UX)
 * 3. Zsh if available
 * 4. Bash as fallback
 */
function findCompletionShell(): ShellInfo {
	// First, try user's $SHELL - they've configured their completions there
	const userShell = process.env.SHELL;
	if (userShell && fs.existsSync(userShell)) {
		const shellType = detectShellType(userShell);
		// Only use it if it's a shell we support (fish/zsh/bash)
		if (shellType === "fish" || shellType === "zsh" || shellType === "bash") {
			return { path: userShell, type: shellType };
		}
	}

	// If user's shell isn't suitable, prefer fish for best completions
	const fishPaths = [
		"/opt/homebrew/bin/fish",
		"/usr/local/bin/fish",
		"/usr/bin/fish",
		"/bin/fish",
	];
	for (const fishPath of fishPaths) {
		if (fs.existsSync(fishPath)) {
			return { path: fishPath, type: "fish" };
		}
	}

	// Then zsh
	const zshPaths = [
		"/bin/zsh",
		"/usr/bin/zsh",
		"/usr/local/bin/zsh",
		"/opt/homebrew/bin/zsh",
	];
	for (const zshPath of zshPaths) {
		if (fs.existsSync(zshPath)) {
			return { path: zshPath, type: "zsh" };
		}
	}

	// Bash fallback
	const bashPaths = [
		"/bin/bash",
		"/usr/bin/bash",
		"/usr/local/bin/bash",
		"/opt/homebrew/bin/bash",
	];
	for (const bashPath of bashPaths) {
		if (fs.existsSync(bashPath)) {
			return { path: bashPath, type: "bash" };
		}
	}

	return { path: "/bin/bash", type: "bash" };
}

// ============================================================================
// Completion Context Extraction
// ============================================================================

/**
 * Extract the command line and completion prefix from editor text.
 */
function extractCompletionContext(text: string): {
	commandLine: string;
	prefix: string;
} {
	// Remove ! or !! prefix
	let commandLine = text.trimStart();
	if (commandLine.startsWith("!!")) {
		commandLine = commandLine.slice(2);
	} else if (commandLine.startsWith("!")) {
		commandLine = commandLine.slice(1);
	}

	const trimmed = commandLine.trimStart();

	// If ends with space, completing a new word
	if (trimmed.endsWith(" ")) {
		return { commandLine: trimmed, prefix: "" };
	}

	// Last word is the prefix
	const words = trimmed.split(/\s+/);
	const prefix = words[words.length - 1] || "";

	return { commandLine: trimmed, prefix };
}

// ============================================================================
// Shell Completion Dispatcher
// ============================================================================

/**
 * Get shell completions for a command line.
 * Returns null if the user hasn't configured completions for their shell.
 */
function getShellCompletions(
	text: string,
	cwd: string,
	shell: ShellInfo
): CompletionResult | null {
	const { commandLine } = extractCompletionContext(text);

	if (!commandLine.trim()) {
		return null;
	}

	// Each shell provider checks if user has completions configured
	// and returns null if not
	switch (shell.type) {
		case "fish":
			// Fish always has completions (it's a core feature)
			return getFishCompletions(commandLine, cwd, shell.path);
		case "bash":
			// Bash: only works if bash-completion is available
			return getBashCompletions(commandLine, cwd, shell.path);
		case "zsh":
			// Zsh: only works if user has compinit in their .zshrc
			return getZshCompletions(commandLine, cwd, shell.path);
		default:
			return null;
	}
}

// ============================================================================
// Shell-Aware Autocomplete Provider Wrapper
// ============================================================================

/**
 * Wraps an existing autocomplete provider to add shell completion support
 * when in bash mode (text starts with ! or !!).
 */
function wrapWithShellCompletion(
	baseProvider: AutocompleteProvider,
	shell: ShellInfo
): AutocompleteProvider {
	const isBashMode = (lines: string[]): boolean => {
		const text = lines.join("\n").trimStart();
		return text.startsWith("!") || text.startsWith("!!");
	};

	const getTextUpToCursor = (
		lines: string[],
		cursorLine: number,
		cursorCol: number
	): string => {
		const textLines = lines.slice(0, cursorLine + 1);
		if (textLines.length > 0) {
			textLines[textLines.length - 1] = textLines[textLines.length - 1].slice(0, cursorCol);
		}
		return textLines.join("\n");
	};

	return {
		getSuggestions(
			lines: string[],
			cursorLine: number,
			cursorCol: number
		): { items: AutocompleteItem[]; prefix: string } | null {
			if (isBashMode(lines)) {
				const text = getTextUpToCursor(lines, cursorLine, cursorCol);
				const result = getShellCompletions(text, process.cwd(), shell);
				if (result && result.items.length > 0) {
					return result;
				}
			}
			return baseProvider.getSuggestions(lines, cursorLine, cursorCol);
		},

		applyCompletion(
			lines: string[],
			cursorLine: number,
			cursorCol: number,
			item: AutocompleteItem,
			prefix: string
		): { lines: string[]; cursorLine: number; cursorCol: number } {
			if (isBashMode(lines)) {
				const currentLine = lines[cursorLine] || "";
				const prefixStart = cursorCol - prefix.length;
				const beforePrefix = currentLine.slice(0, prefixStart);
				const afterCursor = currentLine.slice(cursorCol);

				// Don't add space after directories
				const isDirectory = item.value.endsWith("/");
				const suffix = isDirectory ? "" : " ";

				const newLine = beforePrefix + item.value + suffix + afterCursor;
				const newLines = [...lines];
				newLines[cursorLine] = newLine;

				return {
					lines: newLines,
					cursorLine,
					cursorCol: prefixStart + item.value.length + suffix.length,
				};
			}

			return baseProvider.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
		},

		// Forward optional methods
		getForceFileSuggestions(
			lines: string[],
			cursorLine: number,
			cursorCol: number
		): { items: AutocompleteItem[]; prefix: string } | null {
			if (isBashMode(lines)) {
				const text = getTextUpToCursor(lines, cursorLine, cursorCol);
				return getShellCompletions(text, process.cwd(), shell);
			}
			if ("getForceFileSuggestions" in baseProvider) {
				return (baseProvider as any).getForceFileSuggestions(lines, cursorLine, cursorCol);
			}
			return this.getSuggestions(lines, cursorLine, cursorCol);
		},

		shouldTriggerFileCompletion(
			lines: string[],
			cursorLine: number,
			cursorCol: number
		): boolean {
			if (isBashMode(lines)) {
				return true;
			}
			if ("shouldTriggerFileCompletion" in baseProvider) {
				return (baseProvider as any).shouldTriggerFileCompletion(lines, cursorLine, cursorCol);
			}
			return true;
		},
	};
}

// ============================================================================
// Custom Editor with Shell Completion
// ============================================================================

/**
 * Custom editor that intercepts setAutocompleteProvider to wrap with shell completion.
 */
class ShellCompletionEditor extends CustomEditor {
	private shell: ShellInfo;
	private wrappedProvider = false;

	constructor(tui: any, theme: any, keybindings: any, shell: ShellInfo) {
		super(tui, theme, keybindings);
		this.shell = shell;
	}

	// Override setAutocompleteProvider to wrap the base provider
	setAutocompleteProvider(provider: AutocompleteProvider): void {
		if (!this.wrappedProvider && provider) {
			// Wrap the provider with shell completion support
			const wrapped = wrapWithShellCompletion(provider, this.shell);
			super.setAutocompleteProvider(wrapped);
			this.wrappedProvider = true;
		} else {
			super.setAutocompleteProvider(provider);
		}
	}
}

// ============================================================================
// Extension Entry Point
// ============================================================================

export default function (pi: ExtensionAPI) {
	const shell = findCompletionShell();
	const shellName = path.basename(shell.path);

	pi.on("session_start", (_event, ctx) => {
		ctx.ui.setEditorComponent((tui, theme, keybindings) => {
			return new ShellCompletionEditor(tui, theme, keybindings, shell);
		});

		ctx.ui.notify(`Shell completions enabled (${shellName})`, "info");
	});
}

// Re-export types for potential external use
export type { ShellInfo, ShellType, CompletionResult } from "./types.js";
