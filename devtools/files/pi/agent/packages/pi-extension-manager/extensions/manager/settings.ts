import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { stringifyError } from "./format.js";
import { findProjectPiDir, userPiDir } from "./paths.js";
import {
	LIST_ROWS,
	MANAGER_ID,
	MANAGER_INNER_ROWS,
	POPUP_FRAME_ROWS,
	POPUP_HEIGHT_RATIO,
	QUICK_SETTINGS_INNER_ROWS,
	QUICK_SETTINGS_ROWS,
	VSTACK_MODAL_LOCK_SYMBOL,
	type ConfigValue,
	type Inventory,
	type InventoryItem,
	type ManagerState,
	type PopupLayout,
	type Scope,
	type SettingsFile,
	type SettingsSchema,
	type VstackModalLock,
} from "./types.js";

export function asRecord(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

export function getOrCreateRecord(parent: Record<string, unknown>, key: string): Record<string, unknown> {
	const current = asRecord(parent[key]);
	if (current) return current;
	const created: Record<string, unknown> = {};
	parent[key] = created;
	return created;
}

export function readJsonObject(path: string): { json: Record<string, unknown>; exists: boolean; error?: string } {
	if (!existsSync(path)) return { json: {}, exists: false };
	try {
		const text = readFileSync(path, "utf8");
		if (!text.trim()) return { json: {}, exists: true };
		const parsed = JSON.parse(text);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { json: {}, exists: true, error: "settings root is not an object" };
		return { json: parsed as Record<string, unknown>, exists: true };
	} catch (error) {
		return { json: {}, exists: true, error: stringifyError(error) };
	}
}

function isProjectTrusted(ctx: ExtensionContext): boolean {
	try {
		return (ctx as ExtensionContext & { isProjectTrusted?: () => boolean }).isProjectTrusted?.() === true;
	} catch {
		return false;
	}
}

export function loadSettingsFiles(ctx: ExtensionContext): SettingsFile[] {
	const projectBase = findProjectPiDir(ctx.cwd);
	const userBase = userPiDir();
	const user = readJsonObject(join(userBase, "settings.json"));
	const projectTrusted = isProjectTrusted(ctx);
	const project = projectTrusted ? readJsonObject(join(projectBase, "settings.json")) : { json: {}, exists: false };
	return [
		{ scope: "user", baseDir: userBase, path: join(userBase, "settings.json"), json: user.json, exists: user.exists },
		{ scope: "project", baseDir: projectBase, path: join(projectBase, "settings.json"), json: project.json, exists: project.exists, projectTrusted },
	];
}

export function writeSettingsFile(file: SettingsFile): void {
	mkdirSync(dirname(file.path), { recursive: true });
	writeFileSync(file.path, `${JSON.stringify(file.json, null, 2)}\n`, "utf8");
	file.exists = true;
}

export function managerStateFrom(json: Record<string, unknown>): ManagerState {
	const vstack = asRecord(json.vstack) ?? {};
	const manager = asRecord(vstack.extensionManager) ?? {};
	const config = asRecord(manager.config) ?? {};
	const normalizedConfig: Record<string, Record<string, unknown>> = {};
	for (const [id, value] of Object.entries(config)) {
		const record = asRecord(value);
		if (record) normalizedConfig[id] = { ...record };
	}
	return {
		disabledItems: Array.isArray(manager.disabledItems) ? manager.disabledItems.filter((v): v is string => typeof v === "string") : [],
		config: normalizedConfig,
	};
}

function deepMergeConfig(
	base: Record<string, Record<string, unknown>>,
	override: Record<string, Record<string, unknown>>,
): Record<string, Record<string, unknown>> {
	const out: Record<string, Record<string, unknown>> = {};
	for (const [id, values] of Object.entries(base)) out[id] = { ...values };
	for (const [id, values] of Object.entries(override)) out[id] = { ...(out[id] ?? {}), ...values };
	return out;
}

export function mergedManagerState(files: SettingsFile[]): ManagerState {
	const user = managerStateFrom(files.find((f) => f.scope === "user")?.json ?? {});
	const project = managerStateFrom(files.find((f) => f.scope === "project")?.json ?? {});
	return {
		disabledItems: [...new Set([...user.disabledItems, ...project.disabledItems])],
		config: deepMergeConfig(user.config, project.config),
	};
}

export function updateManagerState(file: SettingsFile, updater: (state: ManagerState) => void): void {
	const vstack = getOrCreateRecord(file.json, "vstack");
	const manager = getOrCreateRecord(vstack, "extensionManager");
	const current = managerStateFrom(file.json);
	updater(current);
	manager.disabledItems = current.disabledItems;
	delete manager.disabledProviders;
	manager.config = current.config;
	writeSettingsFile(file);
}

export function findSettingsFile(files: SettingsFile[], scope: Scope): SettingsFile {
	return files.find((file) => file.scope === scope) ?? files[0]!;
}

function projectSettingsWritable(files: SettingsFile[]): boolean {
	return files.some((file) => file.scope === "project" && file.exists && file.projectTrusted !== false);
}

export function defaultWriteScope(item: InventoryItem | undefined, files: SettingsFile[], managerState: ManagerState): Scope {
	if (item?.scope === "project" && projectSettingsWritable(files)) return "project";
	if (item?.scope === "user") return "user";
	const configured = managerState.config[MANAGER_ID]?.defaultSaveScope;
	if (configured === "user") return "user";
	if (configured === "project" && projectSettingsWritable(files)) return "project";
	return projectSettingsWritable(files) ? "project" : "user";
}

export function getConfigValue(inventory: Inventory, extensionId: string, schema: SettingsSchema): ConfigValue {
	const project = managerStateFrom(inventory.settingsFiles.find((file) => file.scope === "project")?.json ?? {});
	const user = managerStateFrom(inventory.settingsFiles.find((file) => file.scope === "user")?.json ?? {});
	if (Object.prototype.hasOwnProperty.call(project.config[extensionId] ?? {}, schema.key)) {
		return { explicit: true, scope: "project", value: project.config[extensionId]![schema.key] };
	}
	if (Object.prototype.hasOwnProperty.call(user.config[extensionId] ?? {}, schema.key)) {
		return { explicit: true, scope: "user", value: user.config[extensionId]![schema.key] };
	}
	return { explicit: false, scope: "default", value: schema.default };
}

export function setConfigValue(inventory: Inventory, item: InventoryItem, schema: SettingsSchema, value: unknown): void {
	const scope = defaultWriteScope(item, inventory.settingsFiles, inventory.managerState);
	const file = findSettingsFile(inventory.settingsFiles, scope);
	const extensionId = item.packageName ?? item.displayName;
	updateManagerState(file, (state) => {
		state.config[extensionId] = { ...(state.config[extensionId] ?? {}), [schema.key]: value };
	});
}

function deleteConfigKeysFromFile(file: SettingsFile, extensionId: string, keys: Set<string>): number {
	const vstack = asRecord(file.json.vstack);
	const manager = asRecord(vstack?.extensionManager);
	const config = asRecord(manager?.config);
	const record = asRecord(config?.[extensionId]);
	if (!manager || !config || !record) return 0;
	let deleted = 0;
	for (const key of keys) {
		if (!Object.prototype.hasOwnProperty.call(record, key)) continue;
		delete record[key];
		deleted += 1;
	}
	if (deleted === 0) return 0;
	if (Object.keys(record).length === 0) delete config[extensionId];
	if (Object.keys(config).length === 0) delete manager.config;
	writeSettingsFile(file);
	return deleted;
}

export function resetConfigKeys(inventory: Inventory, extensionId: string, keys: Iterable<string>): number {
	const keySet = new Set(keys);
	if (keySet.size === 0) return 0;
	let deleted = 0;
	for (const file of inventory.settingsFiles.filter((candidate) => candidate.scope === "user" || candidate.scope === "project")) {
		deleted += deleteConfigKeysFromFile(file, extensionId, keySet);
	}
	return deleted;
}

export function acquireVstackModalLock(): () => void {
	const host = globalThis as unknown as Record<PropertyKey, unknown>;
	const existing = host[VSTACK_MODAL_LOCK_SYMBOL] as VstackModalLock | undefined;
	const lock = existing && typeof existing.depth === "number" ? existing : { depth: 0 };
	host[VSTACK_MODAL_LOCK_SYMBOL] = lock;
	lock.depth += 1;
	let released = false;
	return () => {
		if (released) return;
		released = true;
		lock.depth = Math.max(0, lock.depth - 1);
	};
}

function responsiveInnerRows(terminalRows: number, preferred: number, minimum = 12): number {
	const available = Math.max(minimum + POPUP_FRAME_ROWS, Math.floor(Math.max(1, terminalRows) * POPUP_HEIGHT_RATIO));
	return Math.max(minimum, Math.min(preferred, available - POPUP_FRAME_ROWS));
}

export function managerLayout(terminalRows: number): PopupLayout {
	const innerRows = responsiveInnerRows(terminalRows, MANAGER_INNER_ROWS, 14);
	const bodyRows = Math.max(4, innerRows - 10);
	return {
		bodyRows,
		innerRows,
		listRows: Math.max(3, Math.min(LIST_ROWS, bodyRows - 6)),
	};
}

export function quickSettingsLayout(terminalRows: number): PopupLayout {
	const innerRows = responsiveInnerRows(terminalRows, QUICK_SETTINGS_INNER_ROWS, 12);
	const bodyRows = Math.max(4, innerRows - 8);
	return {
		bodyRows,
		innerRows,
		listRows: Math.max(3, Math.min(QUICK_SETTINGS_ROWS, bodyRows)),
	};
}
