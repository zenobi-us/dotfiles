import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { piSettingsPaths, resolveSettingsRelativePath } from "./paths.js";
import { DEFAULT_SHORTCUT, PACKAGE_ID, type Scope, type SortMode, type VstackConfig } from "./types.js";

function asRecord(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

export function readVstackConfig(cwd?: string): VstackConfig {
	const merged: VstackConfig = {};
	for (const path of piSettingsPaths(cwd)) {
		if (!existsSync(path)) continue;
		try {
			const parsed = JSON.parse(readFileSync(path, "utf8"));
			const config = asRecord(asRecord(asRecord(parsed?.vstack)?.extensionManager)?.config)?.[PACKAGE_ID];
			if (config && typeof config === "object" && !Array.isArray(config)) Object.assign(merged, config);
		} catch {
			// Ignore malformed optional settings.
		}
	}
	return merged;
}

export function settingBoolean(key: string, fallback: boolean, cwd?: string): boolean {
	const value = readVstackConfig(cwd)[key];
	return typeof value === "boolean" ? value : fallback;
}

export function settingString(key: string, fallback: string, cwd?: string): string {
	const value = readVstackConfig(cwd)[key];
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export function settingStringAllowEmpty(key: string, fallback: string, cwd?: string): string {
	const value = readVstackConfig(cwd)[key];
	return typeof value === "string" ? value.trim() : fallback;
}

export function settingNumber(key: string, fallback: number, cwd?: string): number {
	const value = readVstackConfig(cwd)[key];
	const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
	return Number.isFinite(parsed) ? parsed : fallback;
}

export function settingScope(cwd?: string): Scope {
	return settingString("defaultScope", "current", cwd).toLowerCase() === "all" ? "all" : "current";
}

export function settingSort(cwd?: string): SortMode {
	const value = settingString("defaultSort", "threaded", cwd).toLowerCase();
	return value === "recent" || value === "relevance" ? value : "threaded";
}

export function configuredShortcut(cwd?: string): string | undefined {
	const shortcut = settingStringAllowEmpty("shortcutKey", DEFAULT_SHORTCUT, cwd).trim().toLowerCase();
	if (!shortcut || shortcut === "none" || shortcut === "off" || shortcut === "false") return undefined;
	if (shortcut === "alt+shift+r" || shortcut === "ctrl+shift+r") return DEFAULT_SHORTCUT;
	return shortcut;
}

export function configuredSessionDir(cwd: string): string | undefined {
	const envDir = process.env.PI_CODING_AGENT_SESSION_DIR?.trim();
	if (envDir) return resolveSettingsRelativePath(envDir, join(resolve(cwd), ".pi", "settings.json"));
	let configured: string | undefined;
	for (const settingsPath of piSettingsPaths(cwd)) {
		if (!existsSync(settingsPath)) continue;
		try {
			const parsed = JSON.parse(readFileSync(settingsPath, "utf8"));
			if (typeof parsed?.sessionDir === "string" && parsed.sessionDir.trim()) {
				configured = resolveSettingsRelativePath(parsed.sessionDir, settingsPath);
			}
		} catch {
			// Ignore malformed optional settings.
		}
	}
	return configured;
}
