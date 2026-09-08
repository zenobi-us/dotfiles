/**
 * vstack Pi extension manager.
 *
 * Provides a Pi-styled package manager plus a separate settings editor. Pi does
 * not yet expose a public API for third-party extensions to inject native
 * built-in /settings tabs, so this extension exposes /extensions and the
 * /extensions settings subcommand.
 */

import type { ExtensionAPI, ExtensionCommandContext, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildInventory, npmCandidatesFromInventory } from "./manager/inventory.js";
export { npmCandidatesFromInventory };
import { recordProjectTrust } from "./manager/glyphs.js";
import { openManager } from "./manager/manager-ui.js";
import { openQuickSettings, quickSettingsCompletions } from "./manager/quick-settings-ui.js";
import { userPiDir } from "./manager/paths.js";
import {
	defaultWriteScope,
	findSettingsFile,
	loadSettingsFiles,
	mergedManagerState,
	readJsonObject,
	updateManagerState,
} from "./manager/settings.js";
import { kickNpmUpdateCheck } from "./manager/versions.js";
import { INSTALL_SYMBOL, MANAGER_ID, VSTACK_OPEN_QUICK_SETTINGS_SYMBOL } from "./manager/types.js";

export default function extensionManager(pi: ExtensionAPI): void {
	const guard = pi as unknown as Record<PropertyKey, unknown>;
	if (guard[INSTALL_SYMBOL]) return;
	guard[INSTALL_SYMBOL] = true;

	const loadConfig = mergedManagerState([
		{ baseDir: userPiDir(), exists: existsSync(join(userPiDir(), "settings.json")), json: readJsonObject(join(userPiDir(), "settings.json")).json, path: join(userPiDir(), "settings.json"), scope: "user" },
	]);

	if (loadConfig.config[MANAGER_ID]?.enabled === false) {
		const enableRecovery = async (ctx: ExtensionCommandContext) => {
			const files = loadSettingsFiles(ctx as ExtensionContext);
			const scope = defaultWriteScope(undefined, files, mergedManagerState(files));
			const file = findSettingsFile(files, scope);
			updateManagerState(file, (state) => {
				state.config[MANAGER_ID] = { ...(state.config[MANAGER_ID] ?? {}), enabled: true };
			});
			ctx.ui.notify("Extension manager enabled. Run /reload to restore the full UI.", "info");
		};
		pi.registerCommand("extensions", {
			description: "Extension manager recovery command.",
			handler: async (args, ctx) => {
				if (args.trim().toLowerCase() !== "enable") {
					ctx.ui.notify("Extension manager UI is disabled. Run /extensions:enable, then /reload, to restore it.", "warning");
					return;
				}
				await enableRecovery(ctx);
			},
		});
		pi.registerCommand("extensions:enable", {
			description: "Re-enable the extension manager UI",
			handler: async (_args, ctx) => enableRecovery(ctx),
		});
		return;
	}

	pi.registerCommand("extensions", {
		description: "Browse, update, toggle, and inspect Pi extension packages.",
		handler: async (args, ctx) => {
			const trimmed = args.trim();
			const lower = trimmed.toLowerCase();
			if (lower === "settings") {
				await openQuickSettings(pi, ctx);
				return;
			}
			if (lower.startsWith("settings ")) {
				await openQuickSettings(pi, ctx, trimmed.slice("settings ".length));
				return;
			}
			await openManager(pi, ctx);
		},
	});

	let activeCtx: ExtensionContext | undefined;
	pi.registerCommand("extensions:settings", {
		description: "Open the quick extension settings editor (optional package name jumps to that tab)",
		getArgumentCompletions: (prefix: string) => activeCtx ? quickSettingsCompletions(pi, activeCtx, prefix) : null,
		handler: async (args, ctx) => openQuickSettings(pi, ctx, args),
	});

	(globalThis as unknown as Record<PropertyKey, unknown>)[VSTACK_OPEN_QUICK_SETTINGS_SYMBOL] = async (ctx: ExtensionCommandContext | ExtensionContext, hint?: string) => openQuickSettings(pi, ctx, hint);

	const openManagerPopup = async (ctx: ExtensionContext) => {
		if (!ctx.hasUI) return;
		await openManager(pi, ctx);
	};
	const openSettingsPopup = async (ctx: ExtensionContext) => {
		if (!ctx.hasUI) return;
		await openQuickSettings(pi, ctx);
	};

	pi.registerShortcut("alt+shift+e" as any, {
		description: "Open the extension manager popup",
		handler: async (ctx) => openManagerPopup(ctx as ExtensionContext),
	});
	pi.registerShortcut("f11" as any, {
		description: "Open the extension manager popup",
		handler: async (ctx) => openManagerPopup(ctx as ExtensionContext),
	});

	pi.registerShortcut("alt+shift+s" as any, {
		description: "Open the extension manager settings popup",
		handler: async (ctx) => openSettingsPopup(ctx as ExtensionContext),
	});
	pi.registerShortcut("f12" as any, {
		description: "Open the extension manager settings popup",
		handler: async (ctx) => openSettingsPopup(ctx as ExtensionContext),
	});

	pi.on("session_start", (_event, ctx) => {
		recordProjectTrust(ctx);
		activeCtx = ctx;
		const inventory = buildInventory(pi, ctx);

		const hasUI = (ctx as { hasUI?: boolean }).hasUI;
		const configEnabled = inventory.managerState.config[MANAGER_ID]?.notifyOnUpdates;
		const notifyEnabled = configEnabled !== false;
		const pkgs = inventory.items.filter((item) => item.kind === "package" && item.state !== "shadowed");

		const npmCandidates = npmCandidatesFromInventory(inventory);
		if (npmCandidates.length > 0) {
			kickNpmUpdateCheck(npmCandidates, () => {});
		}

		if (hasUI && notifyEnabled) {
			const withUpdates = pkgs.filter((item) => item.updateAvailable);
			if (withUpdates.length > 0) {
				let message: string;
				if (withUpdates.length === 1) {
					const p = withUpdates[0];
					const cmd = p.updateCommand ?? "";
					message = `${p.packageName}: update available ${p.installedVersion ?? "?"} → ${p.latestVersion}${cmd ? `. Run: ${cmd}` : ""}`;
				} else {
					const names = withUpdates.slice(0, 3).map((p) => `${p.packageName} → ${p.latestVersion}`).join(", ");
					const suffix = withUpdates.length > 3 ? `, +${withUpdates.length - 3} more` : "";
					message = `${withUpdates.length} extension updates available: ${names}${suffix}. Run /extensions for update commands.`;
				}
				(ctx as ExtensionContext).ui?.notify(message, "warning");
			}
		}
	});
}
