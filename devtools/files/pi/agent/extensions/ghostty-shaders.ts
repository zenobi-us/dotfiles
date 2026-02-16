/**
 * Ghostty Shaders Extension
 *
 * Manage Ghostty terminal shaders with live preview.
 * Equivalent to the ghostty-shaders bash CLI tool.
 *
 * Features:
 * - Interactive shader picker with fuzzy search
 * - Live preview (shaders apply immediately)
 * - Favorites management
 * - Add shader sources (GitHub repos, local paths, URLs)
 *
 * Commands:
 * - /shaders          - Interactive shader picker
 * - /shaders list     - List available shaders
 * - /shaders add <src>- Add shader source (GitHub, path, URL)
 * - /shaders apply <n>- Apply shader by name
 * - /shaders clear    - Remove current shader
 * - /shaders fav      - Manage favorites
 *
 * Usage: pi --extension ./ghostty-shaders/index.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, realpathSync, copyFileSync, symlinkSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, basename } from "node:path";
import type { ExtensionAPI, ExtensionCommandContext, Theme } from "@mariozechner/pi-coding-agent";
import { matchesKey, visibleWidth } from "@mariozechner/pi-tui";

// === Configuration ===
const DATA_DIR = join(process.env.XDG_DATA_HOME ?? join(homedir(), ".local/share"), "ghostty-shaders");
const SOURCES_DIR = join(DATA_DIR, "sources");
const FAVORITES_FILE = join(DATA_DIR, "favorites");
const GHOSTTY_CONFIG = join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "ghostty/config");
const BACKUP_CONFIG = join(DATA_DIR, ".config.backup");

// === Helpers ===

function ensureDirs(): void {
	mkdirSync(SOURCES_DIR, { recursive: true });
	if (!existsSync(FAVORITES_FILE)) {
		writeFileSync(FAVORITES_FILE, "", "utf-8");
	}
}

function readFavorites(): string[] {
	try {
		return readFileSync(FAVORITES_FILE, "utf-8")
			.split("\n")
			.filter((line) => line.trim().length > 0);
	} catch {
		return [];
	}
}

function writeFavorites(favorites: string[]): void {
	writeFileSync(FAVORITES_FILE, favorites.join("\n") + "\n", "utf-8");
}

function isFavorite(path: string): boolean {
	return readFavorites().includes(path);
}

function addFavorite(path: string): void {
	const favs = readFavorites();
	if (!favs.includes(path)) {
		favs.push(path);
		writeFavorites(favs);
	}
}

function removeFavorite(path: string): void {
	const favs = readFavorites().filter((f) => f !== path);
	writeFavorites(favs);
}

async function findShaders(pi: ExtensionAPI): Promise<string[]> {
	const result = await pi.exec("find", [SOURCES_DIR, "-name", "*.glsl", "-type", "f"], { timeout: 5000 });
	if (result.code !== 0) return [];
	return result.stdout
		.split("\n")
		.filter((line) => line.trim().length > 0)
		.sort();
}

function getShaderDisplayName(path: string): string {
	return path.replace(SOURCES_DIR + "/", "");
}

function getCurrentShader(): string | undefined {
	try {
		const config = readFileSync(GHOSTTY_CONFIG, "utf-8");
		const match = config.match(/^custom-shader\s*=\s*(.+)$/m);
		return match?.[1]?.trim();
	} catch {
		return undefined;
	}
}

function backupConfig(): void {
	try {
		if (existsSync(GHOSTTY_CONFIG)) {
			copyFileSync(GHOSTTY_CONFIG, BACKUP_CONFIG);
		}
	} catch {
		// Ignore backup failures
	}
}

function restoreConfig(): void {
	try {
		if (existsSync(BACKUP_CONFIG)) {
			copyFileSync(BACKUP_CONFIG, GHOSTTY_CONFIG);
			// Trigger reload
			reloadGhostty();
		}
	} catch {
		// Ignore restore failures
	}
}

async function reloadGhostty(): Promise<void> {
	// Use DBus on Linux
	try {
		const { execSync } = await import("node:child_process");
		if (process.platform === "linux") {
			execSync(
				'gdbus call --session --dest com.mitchellh.ghostty --object-path /com/mitchellh/ghostty --method org.gtk.Actions.Activate "reload-config" "[]" "{}"',
				{ stdio: "ignore" }
			);
		} else if (process.platform === "darwin") {
			execSync(
				'osascript -e \'tell application "System Events" to keystroke "," using {command down, shift down}\'',
				{ stdio: "ignore" }
			);
		}
	} catch {
		// Ignore reload failures - user can manually reload
	}
}

function applyShader(shaderPath: string): void {
	try {
		let config = "";
		if (existsSync(GHOSTTY_CONFIG)) {
			config = readFileSync(GHOSTTY_CONFIG, "utf-8");
			// Remove existing custom-shader line and comment
			config = config
				.split("\n")
				.filter((line) => !line.match(/^custom-shader\s*=/) && !line.includes("# Shader applied by ghostty-shaders"))
				.join("\n");
		}

		// Add new shader
		config = config.trimEnd() + "\n\n# Shader applied by ghostty-shaders\ncustom-shader = " + shaderPath + "\n";
		writeFileSync(GHOSTTY_CONFIG, config, "utf-8");
		reloadGhostty();
	} catch {
		// Ignore apply failures
	}
}

function clearShader(): void {
	try {
		if (!existsSync(GHOSTTY_CONFIG)) return;
		let config = readFileSync(GHOSTTY_CONFIG, "utf-8");
		config = config
			.split("\n")
			.filter((line) => !line.match(/^custom-shader\s*=/) && !line.includes("# Shader applied by ghostty-shaders"))
			.join("\n");
		writeFileSync(GHOSTTY_CONFIG, config, "utf-8");
		reloadGhostty();
	} catch {
		// Ignore clear failures
	}
}

function detectSourceType(source: string): "path" | "github" | "repo-url" | "url" | "unknown" {
	if (existsSync(source)) {
		return "path";
	}
	if (source.match(/^https?:\/\//)) {
		if (source.endsWith(".glsl")) {
			return "url";
		}
		return "repo-url";
	}
	if (source.match(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/)) {
		return "github";
	}
	return "unknown";
}

async function addSource(pi: ExtensionAPI, source: string): Promise<{ ok: boolean; message: string }> {
	const type = detectSourceType(source);

	switch (type) {
		case "path": {
			const absPath = realpathSync(source);
			const stat = statSync(absPath);
			if (stat.isDirectory()) {
				const linkName = basename(absPath);
				const linkPath = join(SOURCES_DIR, linkName);
				try {
					symlinkSync(absPath, linkPath);
					return { ok: true, message: `Linked directory: ${linkName}` };
				} catch {
					return { ok: false, message: `Failed to link: ${linkName}` };
				}
			} else if (stat.isFile()) {
				mkdirSync(join(SOURCES_DIR, "local"), { recursive: true });
				copyFileSync(absPath, join(SOURCES_DIR, "local", basename(absPath)));
				return { ok: true, message: `Copied shader: ${basename(absPath)}` };
			}
			return { ok: false, message: "Invalid path" };
		}

		case "github": {
			const repoName = source.replace("/", "_");
			const repoDir = join(SOURCES_DIR, repoName);
			if (existsSync(repoDir)) {
				const result = await pi.exec("git", ["-C", repoDir, "pull", "--quiet"], { timeout: 30000 });
				if (result.code === 0) {
					return { ok: true, message: `Updated: ${source}` };
				}
				return { ok: false, message: `Failed to update: ${source}` };
			}
			const result = await pi.exec("git", ["clone", "--quiet", `https://github.com/${source}.git`, repoDir], {
				timeout: 60000,
			});
			if (result.code === 0) {
				return { ok: true, message: `Cloned: ${source}` };
			}
			return { ok: false, message: `Failed to clone: ${source}` };
		}

		case "repo-url": {
			const repoName = basename(source, ".git");
			const repoDir = join(SOURCES_DIR, repoName);
			if (existsSync(repoDir)) {
				const result = await pi.exec("git", ["-C", repoDir, "pull", "--quiet"], { timeout: 30000 });
				if (result.code === 0) {
					return { ok: true, message: `Updated: ${repoName}` };
				}
				return { ok: false, message: `Failed to update: ${repoName}` };
			}
			const result = await pi.exec("git", ["clone", "--quiet", source, repoDir], { timeout: 60000 });
			if (result.code === 0) {
				return { ok: true, message: `Cloned: ${repoName}` };
			}
			return { ok: false, message: `Failed to clone: ${repoName}` };
		}

		case "url": {
			mkdirSync(join(SOURCES_DIR, "downloaded"), { recursive: true });
			const filename = basename(source);
			const result = await pi.exec("curl", ["-sSL", source, "-o", join(SOURCES_DIR, "downloaded", filename)], {
				timeout: 30000,
			});
			if (result.code === 0) {
				return { ok: true, message: `Downloaded: ${filename}` };
			}
			return { ok: false, message: `Failed to download: ${filename}` };
		}

		default:
			return { ok: false, message: `Unknown source type: ${source}` };
	}
}

// === Interactive Shader Picker Component ===

interface ShaderItem {
	path: string;
	name: string;
	isFavorite: boolean;
}

interface PickerState {
	shaders: ShaderItem[];
	filtered: ShaderItem[];
	cursor: number;
	scrollOffset: number;
	filterQuery: string;
	backupMade: boolean;
}

const VIEWPORT_HEIGHT = 12;

function clampCursor(state: PickerState): void {
	if (state.filtered.length === 0) {
		state.cursor = 0;
		state.scrollOffset = 0;
		return;
	}

	state.cursor = Math.max(0, Math.min(state.cursor, state.filtered.length - 1));
	const maxOffset = Math.max(0, state.filtered.length - VIEWPORT_HEIGHT);
	state.scrollOffset = Math.max(0, Math.min(state.scrollOffset, maxOffset));

	if (state.cursor < state.scrollOffset) {
		state.scrollOffset = state.cursor;
	} else if (state.cursor >= state.scrollOffset + VIEWPORT_HEIGHT) {
		state.scrollOffset = state.cursor - VIEWPORT_HEIGHT + 1;
	}
}

function fuzzyMatch(query: string, text: string): boolean {
	const lq = query.toLowerCase();
	const lt = text.toLowerCase();
	if (lt.includes(lq)) return true;

	let qi = 0;
	for (let i = 0; i < lt.length && qi < lq.length; i++) {
		if (lt[i] === lq[qi]) qi++;
	}
	return qi === lq.length;
}

function filterShaders(shaders: ShaderItem[], query: string): ShaderItem[] {
	if (!query.trim()) return shaders;
	return shaders.filter((s) => fuzzyMatch(query, s.name));
}

class ShaderPickerComponent {
	private state: PickerState;
	private theme: Theme;
	private done: (result: { action: string; shader?: string } | null) => void;
	private width = 80;

	constructor(shaders: ShaderItem[], theme: Theme, done: (result: { action: string; shader?: string } | null) => void) {
		this.theme = theme;
		this.done = done;

		// Sort: favorites first, then alphabetically
		const sorted = [...shaders].sort((a, b) => {
			if (a.isFavorite && !b.isFavorite) return -1;
			if (!a.isFavorite && b.isFavorite) return 1;
			return a.name.localeCompare(b.name);
		});

		this.state = {
			shaders: sorted,
			filtered: sorted,
			cursor: 0,
			scrollOffset: 0,
			filterQuery: "",
			backupMade: false,
		};
	}

	handleInput(data: string): void {
		const th = this.theme;

		// Escape to cancel
		if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
			// Hierarchical escape: clear filter first, then cancel
			if (this.state.filterQuery.length > 0) {
				this.state.filterQuery = "";
				this.state.filtered = filterShaders(this.state.shaders, "");
				this.state.cursor = 0;
				this.state.scrollOffset = 0;
				clampCursor(this.state);
				return;
			}
			this.done({ action: "cancel" });
			return;
		}

		// Enter to apply
		if (matchesKey(data, "return") || matchesKey(data, "enter")) {
			const selected = this.state.filtered[this.state.cursor];
			if (selected) {
				this.done({ action: "apply", shader: selected.path });
			}
			return;
		}

		// Navigation
		if (matchesKey(data, "up")) {
			this.state.cursor--;
			clampCursor(this.state);
			// Preview on navigate
			const selected = this.state.filtered[this.state.cursor];
			if (selected) {
				if (!this.state.backupMade) {
					backupConfig();
					this.state.backupMade = true;
				}
				applyShader(selected.path);
			}
			return;
		}

		if (matchesKey(data, "down")) {
			this.state.cursor++;
			clampCursor(this.state);
			// Preview on navigate
			const selected = this.state.filtered[this.state.cursor];
			if (selected) {
				if (!this.state.backupMade) {
					backupConfig();
					this.state.backupMade = true;
				}
				applyShader(selected.path);
			}
			return;
		}

		// Toggle favorite with 'f' key
		if (data === "f" && this.state.filtered.length > 0) {
			const selected = this.state.filtered[this.state.cursor];
			if (selected) {
				if (selected.isFavorite) {
					removeFavorite(selected.path);
					selected.isFavorite = false;
				} else {
					addFavorite(selected.path);
					selected.isFavorite = true;
				}
				// Also update in main shaders array
				const mainItem = this.state.shaders.find((s) => s.path === selected.path);
				if (mainItem) {
					mainItem.isFavorite = selected.isFavorite;
				}
			}
			return;
		}

		// Backspace to remove from filter
		if (matchesKey(data, "backspace")) {
			if (this.state.filterQuery.length > 0) {
				this.state.filterQuery = this.state.filterQuery.slice(0, -1);
				this.state.filtered = filterShaders(this.state.shaders, this.state.filterQuery);
				this.state.cursor = 0;
				this.state.scrollOffset = 0;
				clampCursor(this.state);
			}
			return;
		}

		// Character input for filter
		if (data.length === 1 && data.charCodeAt(0) >= 32) {
			this.state.filterQuery += data;
			this.state.filtered = filterShaders(this.state.shaders, this.state.filterQuery);
			this.state.cursor = 0;
			this.state.scrollOffset = 0;
			clampCursor(this.state);
			return;
		}
	}

	render(width: number): string[] {
		const th = this.theme;
		const w = Math.min(width - 4, this.width);
		const innerW = w - 2;
		const lines: string[] = [];

		const pad = (s: string, len: number) => {
			const vis = visibleWidth(s);
			return s + " ".repeat(Math.max(0, len - vis));
		};

		const row = (content: string) => th.fg("border", "│") + pad(content, innerW) + th.fg("border", "│");

		const centerText = (text: string) => {
			const textWidth = visibleWidth(text);
			const padLen = Math.max(0, innerW - textWidth);
			const padLeft = Math.floor(padLen / 2);
			const padRight = padLen - padLeft;
			return (
				th.fg("border", "╭" + "─".repeat(padLeft)) +
				th.fg("accent", text) +
				th.fg("border", "─".repeat(padRight) + "╮")
			);
		};

		// Header
		lines.push(centerText(" 🎨 Ghostty Shaders "));
		lines.push(row(""));

		// Search input
		const searchLabel = th.fg("dim", "Search: ");
		const searchQuery = this.state.filterQuery || th.fg("dim", "Type to filter...");
		lines.push(row(" " + searchLabel + searchQuery));
		lines.push(row(""));

		// No results
		if (this.state.filtered.length === 0) {
			lines.push(row(" " + th.fg("warning", "No shaders found")));
			if (this.state.filterQuery) {
				lines.push(row(" " + th.fg("dim", "Try a different search term")));
			} else {
				lines.push(row(" " + th.fg("dim", "Run: /shaders add 0xhckr/ghostty-shaders")));
			}
			lines.push(row(""));
		} else {
			// Shader list
			const startIdx = this.state.scrollOffset;
			const endIdx = Math.min(this.state.filtered.length, startIdx + VIEWPORT_HEIGHT);
			const visible = this.state.filtered.slice(startIdx, endIdx);

			for (let i = 0; i < visible.length; i++) {
				const shader = visible[i];
				const isSelected = startIdx + i === this.state.cursor;
				const favIcon = shader.isFavorite ? "⭐ " : "   ";
				const cursor = isSelected ? th.fg("accent", "▸ ") : "  ";
				const name = isSelected ? th.fg("accent", shader.name) : shader.name;
				lines.push(row(" " + favIcon + cursor + name));
			}

			// Pad remaining viewport
			for (let i = visible.length; i < VIEWPORT_HEIGHT; i++) {
				lines.push(row(""));
			}

			// Scroll indicator
			const above = this.state.scrollOffset;
			const below = this.state.filtered.length - endIdx;
			let scrollInfo = "";
			if (above > 0) scrollInfo += `↑ ${above} more`;
			if (below > 0) scrollInfo += `${scrollInfo ? "  " : ""}↓ ${below} more`;
			if (scrollInfo) {
				lines.push(row(" " + th.fg("dim", scrollInfo)));
			} else {
				lines.push(row(""));
			}
		}

		// Footer
		lines.push(row(""));
		const footer = th.fg("dim", "↑↓ navigate • Enter apply • f favorite • Esc cancel");
		const footerPad = Math.max(0, innerW - visibleWidth(footer));
		const footerLeft = Math.floor(footerPad / 2);
		const footerRight = footerPad - footerLeft;
		lines.push(
			th.fg("border", "╰" + "─".repeat(footerLeft)) +
				th.fg("dim", footer.replace(th.fg("dim", ""), "").replace(/\x1b\[0m/g, "")) +
				th.fg("border", "─".repeat(footerRight) + "╯")
		);

		// Actually render the footer properly
		lines.pop();
		lines.push(row(" " + footer));
		lines.push(th.fg("border", "╰" + "─".repeat(innerW) + "╯"));

		return lines;
	}

	invalidate(): void {}
	dispose(): void {}
}

// === Extension ===

export default function ghosttyShadersExtension(pi: ExtensionAPI) {
	ensureDirs();

	pi.registerCommand("shaders", {
		description: "Manage Ghostty terminal shaders",
		handler: async (args, ctx) => {
			const argParts = args?.trim().split(/\s+/) ?? [];
			const subcommand = argParts[0] ?? "";
			const rest = argParts.slice(1).join(" ");

			switch (subcommand) {
				case "":
				case "pick":
				case "preview": {
					// Interactive picker
					const shaderPaths = await findShaders(pi);

					if (shaderPaths.length === 0) {
						ctx.ui.notify("No shaders found! Run: /shaders add 0xhckr/ghostty-shaders", "warning");
						return;
					}

					const favorites = readFavorites();
					const shaders: ShaderItem[] = shaderPaths.map((path) => ({
						path,
						name: getShaderDisplayName(path),
						isFavorite: favorites.includes(path),
					}));

					const result = await ctx.ui.custom<{ action: string; shader?: string } | null>(
						(tui, theme, _kb, done) => {
							const component = new ShaderPickerComponent(shaders, theme, done);
							return {
								render: (w: number) => component.render(w),
								handleInput: (data: string) => {
									component.handleInput(data);
									tui.requestRender();
								},
								invalidate: () => component.invalidate(),
							};
						},
						{
							overlay: true,
							overlayOptions: {
								anchor: "center",
								width: 80,
								maxHeight: "80%",
							},
						}
					);

					if (!result || result.action === "cancel") {
						restoreConfig();
						ctx.ui.notify("Cancelled - restored previous config", "info");
						return;
					}

					if (result.action === "apply" && result.shader) {
						// Already applied during preview, just clean up backup
						try {
							const { unlinkSync } = await import("node:fs");
							if (existsSync(BACKUP_CONFIG)) {
								unlinkSync(BACKUP_CONFIG);
							}
						} catch {}
						ctx.ui.notify(`Applied: ${getShaderDisplayName(result.shader)}`, "info");
					}
					break;
				}

				case "list":
				case "ls": {
					const shaderPaths = await findShaders(pi);
					const current = getCurrentShader();
					const favorites = readFavorites();

					if (shaderPaths.length === 0) {
						ctx.ui.notify("No shaders found", "warning");
						return;
					}

					let output = "Available Shaders:\n\n";
					for (const path of shaderPaths) {
						const name = getShaderDisplayName(path);
						const isFav = favorites.includes(path) ? "⭐ " : "   ";
						const isActive = path === current ? " (active)" : "";
						output += `${isFav}${name}${isActive}\n`;
					}
					ctx.ui.notify(output, "info");
					break;
				}

				case "add": {
					if (!rest) {
						ctx.ui.notify("Usage: /shaders add <source>\n\nExamples:\n  /shaders add 0xhckr/ghostty-shaders\n  /shaders add /path/to/shaders\n  /shaders add https://example.com/shader.glsl", "warning");
						return;
					}
					const result = await addSource(pi, rest);
					ctx.ui.notify(result.message, result.ok ? "info" : "error");
					break;
				}

				case "apply":
				case "use": {
					if (!rest) {
						ctx.ui.notify("Usage: /shaders apply <shader-name>", "warning");
						return;
					}
					const shaderPaths = await findShaders(pi);
					const match = shaderPaths.find((p) => p.includes(rest));
					if (!match) {
						ctx.ui.notify(`No shader matching: ${rest}`, "error");
						return;
					}
					applyShader(match);
					ctx.ui.notify(`Applied: ${getShaderDisplayName(match)}`, "info");
					break;
				}

				case "clear":
				case "reset":
				case "rm": {
					clearShader();
					ctx.ui.notify("Shader cleared", "info");
					break;
				}

				case "fav":
				case "favorite":
				case "favorites": {
					const favSubcmd = argParts[1] ?? "list";
					const favArg = argParts.slice(2).join(" ");

					switch (favSubcmd) {
						case "list": {
							const favorites = readFavorites();
							if (favorites.length === 0) {
								ctx.ui.notify("No favorites yet", "info");
								return;
							}
							let output = "Favorites:\n\n";
							for (const path of favorites) {
								if (existsSync(path)) {
									output += `⭐ ${getShaderDisplayName(path)}\n`;
								}
							}
							ctx.ui.notify(output, "info");
							break;
						}

						case "add": {
							if (!favArg) {
								ctx.ui.notify("Usage: /shaders fav add <shader>", "warning");
								return;
							}
							const shaderPaths = await findShaders(pi);
							const match = shaderPaths.find((p) => p.includes(favArg));
							if (match) {
								addFavorite(match);
								ctx.ui.notify(`Added to favorites: ${getShaderDisplayName(match)}`, "info");
							} else {
								ctx.ui.notify(`Shader not found: ${favArg}`, "error");
							}
							break;
						}

						case "rm":
						case "remove": {
							if (!favArg) {
								ctx.ui.notify("Usage: /shaders fav rm <shader>", "warning");
								return;
							}
							const shaderPaths = await findShaders(pi);
							const match = shaderPaths.find((p) => p.includes(favArg));
							if (match) {
								removeFavorite(match);
								ctx.ui.notify(`Removed from favorites: ${getShaderDisplayName(match)}`, "info");
							} else {
								ctx.ui.notify(`Shader not found: ${favArg}`, "error");
							}
							break;
						}

						default:
							ctx.ui.notify(`Unknown favorites command: ${favSubcmd}\nUsage: /shaders fav [list|add|rm] [shader]`, "error");
					}
					break;
				}

				default:
					ctx.ui.notify(`Unknown command: ${subcommand}\n\nUsage:\n  /shaders              Interactive picker\n  /shaders list         List available shaders\n  /shaders add <source> Add shader source\n  /shaders apply <name> Apply shader by name\n  /shaders clear        Remove current shader\n  /shaders fav [cmd]    Manage favorites`, "warning");
			}
		},
	});

	// Register keyboard shortcut for quick access
	pi.registerShortcut("ctrl+shift+s", {
		description: "Open Ghostty shader picker",
		handler: async (ctx) => {
			// Trigger the shaders command
			const shaderPaths = await findShaders(pi);

			if (shaderPaths.length === 0) {
				ctx.ui.notify("No shaders found! Run: /shaders add 0xhckr/ghostty-shaders", "warning");
				return;
			}

			const favorites = readFavorites();
			const shaders: ShaderItem[] = shaderPaths.map((path) => ({
				path,
				name: getShaderDisplayName(path),
				isFavorite: favorites.includes(path),
			}));

			const result = await ctx.ui.custom<{ action: string; shader?: string } | null>(
				(tui, theme, _kb, done) => {
					const component = new ShaderPickerComponent(shaders, theme, done);
					return {
						render: (w: number) => component.render(w),
						handleInput: (data: string) => {
							component.handleInput(data);
							tui.requestRender();
						},
						invalidate: () => component.invalidate(),
					};
				},
				{
					overlay: true,
					overlayOptions: {
						anchor: "center",
						width: 80,
						maxHeight: "80%",
					},
				}
			);

			if (!result || result.action === "cancel") {
				restoreConfig();
				ctx.ui.notify("Cancelled - restored previous config", "info");
				return;
			}

			if (result.action === "apply" && result.shader) {
				try {
					const { unlinkSync } = await import("node:fs");
					if (existsSync(BACKUP_CONFIG)) {
						unlinkSync(BACKUP_CONFIG);
					}
				} catch {}
				ctx.ui.notify(`Applied: ${getShaderDisplayName(result.shader)}`, "info");
			}
		},
	});
}
