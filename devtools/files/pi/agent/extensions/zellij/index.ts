/**
 * Zellij Extension - Preset-based tab management for terminal multiplexer
 *
 * Provides commands to manage Zellij tab presets and create tabs with predefined layouts.
 *
 * Usage:
 *   /zellij preset create <name>              - Create a new preset
 *   /zellij preset list                       - List all presets
 *   /zellij preset delete <name>              - Delete a preset
 *   /zellij tab new <name> <cwd> [--preset]   - Create a new tab
 *
 * Configuration (~/.pi/agent/pi-zellij.json):
 *   {
 *     "preset-name": {
 *       "layout": "layout-file-name",
 *       "panes": [
 *         { "id": "main", "command": "npm run dev", "args": [], "cwd": "~/project" }
 *       ]
 *     }
 *   }
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";

// ============================================================================
// Types
// ============================================================================

interface ZellijPane {
	id: string;
	command: string;
	args?: string[];
	cwd?: string;
}

interface ZellijPreset {
	layout: string;
	panes: ZellijPane[];
}

type ZellijPresetMap = Record<string, ZellijPreset>;

// ============================================================================
// Help Text
// ============================================================================

const HELP_TEXT = `
/zellij - Preset-based tab management

Commands:
  /zellij preset create <name>              Create a new preset interactively
  /zellij preset list                       List all presets
  /zellij preset delete <name>              Delete a preset
  /zellij tab new <name> <cwd> [--preset]   Create a new tab (with optional preset)

Presets are stored in: ~/.pi/agent/pi-zellij.json

Examples:
  /zellij preset create my-dev
  /zellij preset list
  /zellij tab new backend ~/api --preset my-dev
  /zellij preset delete my-dev
`.trim();

// ============================================================================
// Preset Storage (Task ze11ts01)
// ============================================================================

/**
 * Get the path to the presets JSON file
 */
function getPresetsPath(): string {
	return join(homedir(), ".pi", "agent", "pi-zellij.json");
}

/**
 * Load all presets from JSON file
 * Returns empty object if file doesn't exist
 */
function loadPresets(): ZellijPresetMap {
	const presetsPath = getPresetsPath();
	
	try {
		if (!existsSync(presetsPath)) {
			return {};
		}
		
		const content = readFileSync(presetsPath, "utf-8");
		return JSON.parse(content) as ZellijPresetMap;
	} catch (error) {
		throw new Error(`Failed to load presets: ${(error as Error).message}`);
	}
}

/**
 * Save presets to JSON file
 */
function savePresets(presets: ZellijPresetMap): void {
	const presetsPath = getPresetsPath();
	const presetsDir = dirname(presetsPath);
	
	try {
		// Ensure ~/.pi/agent directory exists
		if (!existsSync(presetsDir)) {
			mkdirSync(presetsDir, { recursive: true });
		}
		
		// Write with pretty formatting
		writeFileSync(presetsPath, JSON.stringify(presets, null, 2) + "\n", "utf-8");
	} catch (error) {
		throw new Error(`Failed to save presets: ${(error as Error).message}`);
	}
}

/**
 * Get a specific preset by name
 */
function getPreset(name: string): ZellijPreset | null {
	const presets = loadPresets();
	return presets[name] || null;
}

/**
 * Set/update a preset
 */
function setPreset(name: string, preset: ZellijPreset): void {
	const presets = loadPresets();
	presets[name] = preset;
	savePresets(presets);
}

/**
 * Delete a preset
 * Returns true if deleted, false if didn't exist
 */
function deletePreset(name: string): boolean {
	const presets = loadPresets();
	
	if (!presets[name]) {
		return false;
	}
	
	delete presets[name];
	savePresets(presets);
	return true;
}

// ============================================================================
// Zellij CLI Wrapper (Task ze11ts02)
// ============================================================================

/**
 * Check if Zellij is installed
 */
function checkZellijInstalled(): boolean {
	try {
		execSync("which zellij", { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

/**
 * Check if we're inside a Zellij session
 */
function isInZellijSession(): boolean {
	return !!process.env.ZELLIJ;
}

/**
 * Execute a Zellij command and return stdout
 * Throws descriptive errors on failure
 */
function zellij(args: string[], cwd?: string): string {
	// Check if Zellij is installed
	if (!checkZellijInstalled()) {
		throw new Error(
			"Zellij is not installed. Please install it first.\n" +
			"Install via: cargo install zellij\n" +
			"Or visit: https://zellij.dev/documentation/installation"
		);
	}
	
	try {
		return execSync(`zellij ${args.join(" ")}`, {
			cwd,
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		}).trim();
	} catch (error) {
		const err = error as Error & { stderr?: string };
		throw new Error(`zellij ${args[0]} failed: ${err.message || err.stderr}`);
	}
}

/**
 * Execute a Zellij action command
 * Convenience wrapper for 'zellij action <action> <args>'
 */
function zellijAction(action: string, args: string[] = []): void {
	// Must be in a Zellij session for actions
	if (!isInZellijSession()) {
		throw new Error(
			"Not inside a Zellij session. Please run this command from within Zellij.\n" +
			"Start Zellij with: zellij"
		);
	}
	
	zellij(["action", action, ...args]);
}

// ============================================================================
// Validation (Task ze11ts03)
// ============================================================================

/**
 * Validate preset structure
 */
function validatePreset(preset: unknown): preset is ZellijPreset {
	if (typeof preset !== "object" || preset === null) {
		throw new Error("Preset must be an object");
	}
	
	const p = preset as Partial<ZellijPreset>;
	
	// Validate layout
	if (!p.layout || typeof p.layout !== "string" || p.layout.trim() === "") {
		throw new Error("Preset must have a non-empty 'layout' string");
	}
	
	// Validate panes array
	if (!Array.isArray(p.panes) || p.panes.length === 0) {
		throw new Error("Preset must have at least one pane");
	}
	
	// Validate each pane
	for (let i = 0; i < p.panes.length; i++) {
		const pane = p.panes[i];
		
		if (typeof pane !== "object" || pane === null) {
			throw new Error(`Pane ${i} must be an object`);
		}
		
		if (!pane.id || typeof pane.id !== "string" || pane.id.trim() === "") {
			throw new Error(`Pane ${i} must have a non-empty 'id' string`);
		}
		
		if (!pane.command || typeof pane.command !== "string" || pane.command.trim() === "") {
			throw new Error(`Pane ${i} must have a non-empty 'command' string`);
		}
		
		if (pane.args !== undefined && !Array.isArray(pane.args)) {
			throw new Error(`Pane ${i} 'args' must be an array if provided`);
		}
		
		if (pane.args && !pane.args.every((arg) => typeof arg === "string")) {
			throw new Error(`Pane ${i} 'args' must be an array of strings`);
		}
		
		if (pane.cwd !== undefined && (typeof pane.cwd !== "string" || pane.cwd.trim() === "")) {
			throw new Error(`Pane ${i} 'cwd' must be a non-empty string if provided`);
		}
	}
	
	return true;
}

/**
 * Check if a layout file exists in Zellij config
 */
function validateLayoutExists(layoutName: string): boolean {
	const layoutPath = join(homedir(), ".config", "zellij", "layouts", `${layoutName}.kdl`);
	return existsSync(layoutPath);
}

/**
 * Get the path to a layout file (for display purposes)
 */
function getLayoutPath(layoutName: string): string {
	return join(homedir(), ".config", "zellij", "layouts", `${layoutName}.kdl`);
}

// ============================================================================
// Command Handlers
// ============================================================================

async function handlePresetCreate(args: string, ctx: ExtensionCommandContext): Promise<void> {
	const presetName = args.trim();
	
	if (!presetName) {
		ctx.ui.notify("Usage: /zellij preset create <name>", "error");
		return;
	}
	
	// Check if preset already exists
	const existing = getPreset(presetName);
	if (existing) {
		const confirmed = await ctx.ui.confirm(
			`Preset '${presetName}' already exists. Overwrite?`,
			"This will replace the existing preset."
		);
		
		if (!confirmed) {
			ctx.ui.notify("Cancelled", "info");
			return;
		}
	}
	
	ctx.ui.notify(`Creating preset: ${presetName}`, "info");
	
	// Prompt for layout name
	const layoutName = await ctx.ui.input(
		"Enter Zellij layout file name (from ~/.config/zellij/layouts/):",
		"default"
	);
	
	if (layoutName === undefined) {
		ctx.ui.notify("Cancelled", "info");
		return;
	}
	
	if (!layoutName.trim()) {
		ctx.ui.notify("Layout name cannot be empty", "error");
		return;
	}
	
	// Validate layout exists
	if (!validateLayoutExists(layoutName)) {
		const layoutPath = getLayoutPath(layoutName);
		ctx.ui.notify(
			`Warning: Layout file not found at:\n${layoutPath}\n\nYou'll need to create this layout file in Zellij before using this preset.`,
			"warning"
		);
	}
	
	// Prompt for number of panes
	const paneCountStr = await ctx.ui.input("How many panes in this layout?", "1");
	
	if (paneCountStr === undefined) {
		ctx.ui.notify("Cancelled", "info");
		return;
	}
	
	const paneCount = parseInt(paneCountStr, 10);
	if (isNaN(paneCount) || paneCount < 1) {
		ctx.ui.notify("Invalid pane count. Must be at least 1.", "error");
		return;
	}
	
	// Collect pane information
	const panes: ZellijPane[] = [];
	
	for (let i = 0; i < paneCount; i++) {
		ctx.ui.notify(`\nConfiguring pane ${i + 1} of ${paneCount}:`, "info");
		
		// Pane ID
		const paneId = await ctx.ui.input(
			`Pane ${i + 1} - Enter identifier (e.g., 'main', 'sidebar', 'terminal'):`,
			`pane-${i + 1}`
		);
		
		if (paneId === undefined) {
			ctx.ui.notify("Cancelled", "info");
			return;
		}
		
		if (!paneId.trim()) {
			ctx.ui.notify("Pane ID cannot be empty", "error");
			return;
		}
		
		// Command
		const command = await ctx.ui.input(
			`Pane ${i + 1} - Enter command to run:`,
			"zsh"
		);
		
		if (command === undefined) {
			ctx.ui.notify("Cancelled", "info");
			return;
		}
		
		if (!command.trim()) {
			ctx.ui.notify("Command cannot be empty", "error");
			return;
		}
		
		// Args (optional)
		const argsStr = await ctx.ui.input(
			`Pane ${i + 1} - Enter command arguments (space-separated, or leave empty):`,
			""
		);
		
		if (argsStr === undefined) {
			ctx.ui.notify("Cancelled", "info");
			return;
		}
		
		const args = argsStr.trim() ? argsStr.trim().split(/\s+/) : undefined;
		
		// CWD (optional)
		const cwd = await ctx.ui.input(
			`Pane ${i + 1} - Enter working directory (or leave empty for default):`,
			""
		);
		
		if (cwd === undefined) {
			ctx.ui.notify("Cancelled", "info");
			return;
		}
		
		panes.push({
			id: paneId.trim(),
			command: command.trim(),
			args,
			cwd: cwd.trim() || undefined,
		});
	}
	
	// Build preset
	const preset: ZellijPreset = {
		layout: layoutName.trim(),
		panes,
	};
	
	// Validate
	try {
		validatePreset(preset);
	} catch (error) {
		ctx.ui.notify(`Invalid preset: ${(error as Error).message}`, "error");
		return;
	}
	
	// Save
	try {
		setPreset(presetName, preset);
		
		// Show success with summary
		const summary = [
			`✓ Preset '${presetName}' created!`,
			"",
			`Layout: ${preset.layout}`,
			`Panes: ${preset.panes.length}`,
			...preset.panes.map((p) => {
				const parts = [`  - ${p.id}: ${p.command}`];
				if (p.args && p.args.length > 0) {
					parts.push(` ${p.args.join(" ")}`);
				}
				if (p.cwd) {
					parts.push(` (cwd: ${p.cwd})`);
				}
				return parts.join("");
			}),
			"",
			`Saved to: ${getPresetsPath()}`,
		].join("\n");
		
		ctx.ui.notify(summary, "info");
	} catch (error) {
		ctx.ui.notify(`Failed to save preset: ${(error as Error).message}`, "error");
	}
}

async function handlePresetList(_args: string, ctx: ExtensionCommandContext): Promise<void> {
	try {
		const presets = loadPresets();
		const names = Object.keys(presets);
		
		if (names.length === 0) {
			ctx.ui.notify(
				"No presets defined.\n\nCreate one with: /zellij preset create <name>",
				"info"
			);
			return;
		}
		
		const lines = ["Available Zellij Presets:", ""];
		
		for (const name of names) {
			const preset = presets[name];
			lines.push(`${name}`);
			lines.push(`  Layout: ${preset.layout}`);
			lines.push(`  Panes: ${preset.panes.length}`);
			
			for (const pane of preset.panes) {
				const parts = [`    - ${pane.id}: ${pane.command}`];
				if (pane.args && pane.args.length > 0) {
					parts.push(` ${pane.args.join(" ")}`);
				}
				if (pane.cwd) {
					parts.push(` (cwd: ${pane.cwd})`);
				}
				lines.push(parts.join(""));
			}
			
			lines.push(""); // Empty line between presets
		}
		
		lines.push(`Storage: ${getPresetsPath()}`);
		
		ctx.ui.notify(lines.join("\n"), "info");
	} catch (error) {
		ctx.ui.notify(`Failed to list presets: ${(error as Error).message}`, "error");
	}
}

async function handlePresetDelete(args: string, ctx: ExtensionCommandContext): Promise<void> {
	const presetName = args.trim();
	
	if (!presetName) {
		ctx.ui.notify("Usage: /zellij preset delete <name>", "error");
		return;
	}
	
	// Check if preset exists
	const preset = getPreset(presetName);
	if (!preset) {
		ctx.ui.notify(`Preset '${presetName}' not found`, "error");
		return;
	}
	
	// Confirm deletion
	const confirmed = await ctx.ui.confirm(
		`Delete preset '${presetName}'?`,
		"This cannot be undone."
	);
	
	if (!confirmed) {
		ctx.ui.notify("Deletion cancelled", "info");
		return;
	}
	
	// Delete
	try {
		deletePreset(presetName);
		ctx.ui.notify(`✓ Preset '${presetName}' deleted`, "info");
	} catch (error) {
		ctx.ui.notify(`Failed to delete preset: ${(error as Error).message}`, "error");
	}
}

async function handleTabNew(args: string, ctx: ExtensionCommandContext): Promise<void> {
	// TODO: Implement in Phase 3
	ctx.ui.notify("Tab creation coming in Phase 3", "info");
}

// ============================================================================
// Preset Command Router
// ============================================================================

const presetCommands: Record<string, (args: string, ctx: ExtensionCommandContext) => Promise<void>> = {
	create: handlePresetCreate,
	list: handlePresetList,
	delete: handlePresetDelete,
};

async function handlePreset(args: string, ctx: ExtensionCommandContext): Promise<void> {
	const [cmd, ...rest] = args.trim().split(/\s+/);
	const handler = presetCommands[cmd];
	
	if (handler) {
		await handler(rest.join(" "), ctx);
	} else {
		ctx.ui.notify(
			"Usage: /zellij preset <create|list|delete> [args]\n\n" +
			"Commands:\n" +
			"  create <name>  - Create a new preset\n" +
			"  list           - List all presets\n" +
			"  delete <name>  - Delete a preset",
			"error"
		);
	}
}

// ============================================================================
// Tab Command Router
// ============================================================================

const tabCommands: Record<string, (args: string, ctx: ExtensionCommandContext) => Promise<void>> = {
	new: handleTabNew,
};

async function handleTab(args: string, ctx: ExtensionCommandContext): Promise<void> {
	const [cmd, ...rest] = args.trim().split(/\s+/);
	const handler = tabCommands[cmd];
	
	if (handler) {
		await handler(rest.join(" "), ctx);
	} else {
		ctx.ui.notify(
			"Usage: /zellij tab <new> [args]\n\n" +
			"Commands:\n" +
			"  new <name> <cwd> [--preset <name>]  - Create a new tab",
			"error"
		);
	}
}

// ============================================================================
// Main Command Router
// ============================================================================

const commands: Record<string, (args: string, ctx: ExtensionCommandContext) => Promise<void>> = {
	preset: handlePreset,
	tab: handleTab,
};

// ============================================================================
// Extension Export
// ============================================================================

export default function (pi: ExtensionAPI) {
	pi.registerCommand("zellij", {
		description: "Preset-based tab management for Zellij terminal multiplexer",
		handler: async (args, ctx) => {
			const [cmd, ...rest] = args.trim().split(/\s+/);
			const handler = commands[cmd];
			
			if (handler) {
				await handler(rest.join(" "), ctx);
			} else {
				ctx.ui.notify(HELP_TEXT, "info");
			}
		},
	});
}
