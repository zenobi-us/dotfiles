/**
 * Theme Palette Extension - UI Simulator View
 * 
 * Shows the theme palette in action with realistic UI element simulations.
 * Demonstrates how colors are actually used in interfaces.
 * 
 * Commands:
 *   /theme-simulator - Toggle UI simulator view
 * 
 * Keyboard Shortcuts:
 *   Ctrl+Shift+U - Toggle UI simulator view
 * 
 * Usage:
 *   pi -e ~/.pi/agent/extensions/theme-palette/index-simulator.ts
 */

import type { ExtensionAPI, ExtensionContext, Theme } from "@mariozechner/pi-coding-agent";
import type { TUI } from "@mariozechner/pi-tui";
import { Container, Box, Text } from "@mariozechner/pi-tui";
import { UISimulator } from "./components/UISimulator.js";
import { Palette } from "./components/Palette.js";
import type { PaletteData } from "./components/Palette.js";
import { Flex } from "./components/Flex.js";

// Simplified palette data for side-by-side view
const COMPACT_PALETTE_DATA: PaletteData = {
	title: "🎨 Color Tokens",
	groups: [
		{
			title: "Text Hierarchy",
			preferredWidth: 40,
			chips: [
				{ name: "text", description: "Primary" },
				{ name: "muted", description: "Secondary" },
				{ name: "dim", description: "Tertiary" },
			],
		},
		{
			title: "Interactive",
			preferredWidth: 40,
			chips: [
				{ name: "accent", description: "Primary action" },
				{ name: "success", description: "Positive" },
				{ name: "warning", description: "Caution" },
				{ name: "error", description: "Negative" },
			],
		},
		{
			title: "Surfaces",
			preferredWidth: 40,
			chips: [
				{ name: "userMessageBg", description: "User" },
				{ name: "customMessageBg", description: "System" },
				{ name: "toolPendingBg", description: "Tool" },
			],
		},
		{
			title: "Syntax",
			preferredWidth: 40,
			chips: [
				{ name: "syntaxKeyword", description: "Keywords" },
				{ name: "syntaxFunction", description: "Functions" },
				{ name: "syntaxString", description: "Strings" },
				{ name: "syntaxComment", description: "Comments" },
			],
		},
	],
};

export default function (pi: ExtensionAPI) {
	let isVisible = false;
	let currentCtx: ExtensionContext | null = null;
	let viewMode: 'simulator' | 'both' = 'simulator';

	function showSimulator(ctx: ExtensionContext) {
		if (!ctx.hasUI) return;

		ctx.ui.setWidget("theme-simulator", (tui: TUI, theme: Theme) => {
			if (viewMode === 'simulator') {
				// Just show the UI simulator
				return new UISimulator(theme);
			} else {
				// Show both side by side
				const container = new Container();
				
				// Header
				const header = new Box(1, 1, (s) => theme.bg("surface+1" as any, s));
				const headerText = new Text(
					theme.bold(theme.fg("accent" as any, "🎨 Theme Palette · UI Simulator")),
					0, 0
				);
				header.addChild(headerText);
				container.addChild(header);

				// Two-column layout
				const flex = new Flex({ mode: 'fill', spacing: 2 });
				
				// Left: Compact palette
				const paletteBox = new Box(2, 1, (s) => theme.bg("base" as any, s));
				const palette = new Palette(theme, COMPACT_PALETTE_DATA);
				paletteBox.addChild(palette);
				flex.addChild(paletteBox);
				
				// Right: UI Simulator
				const simulatorBox = new Box(2, 1, (s) => theme.bg("base" as any, s));
				const simulator = new UISimulator(theme);
				simulatorBox.addChild(simulator);
				flex.addChild(simulatorBox);
				
				container.addChild(flex);
				
				return container;
			}
		});
	}

	function hideSimulator(ctx: ExtensionContext) {
		if (!ctx.hasUI) return;
		ctx.ui.setWidget("theme-simulator", undefined);
	}

	// Auto-show on session start if previously visible
	pi.on("session_start", async (_event, ctx) => {
		currentCtx = ctx;
		if (isVisible && ctx.hasUI) {
			showSimulator(ctx);
		}
	});

	// Cleanup on shutdown
	pi.on("session_shutdown", async () => {
		if (currentCtx) {
			hideSimulator(currentCtx);
		}
		isVisible = false;
		currentCtx = null;
	});

	// Toggle command
	pi.registerCommand("theme-simulator", {
		description: "Toggle UI simulator display",
		handler: async (args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("UI simulator requires UI mode", "warning");
				return;
			}

			currentCtx = ctx;

			// Check for mode argument
			if (args.length > 0) {
				const mode = args[0]?.toLowerCase();
				if (mode === 'both' || mode === 'split') {
					viewMode = 'both';
					ctx.ui.notify("Showing palette + simulator", "info");
				} else if (mode === 'simulator' || mode === 'ui') {
					viewMode = 'simulator';
					ctx.ui.notify("Showing simulator only", "info");
				} else {
					ctx.ui.notify("Usage: /theme-simulator [both|simulator]", "warning");
					return;
				}
			}

			isVisible = !isVisible;

			if (isVisible) {
				showSimulator(ctx);
			} else {
				hideSimulator(ctx);
			}
		},
	});

	// Keyboard shortcut: Ctrl+Shift+U for UI simulator
	pi.registerShortcut("ctrl+shift+u", {
		description: "Toggle UI simulator",
		handler: async (ctx) => {
			if (!ctx.hasUI) return;

			currentCtx = ctx;
			isVisible = !isVisible;

			if (isVisible) {
				showSimulator(ctx);
				const mode = viewMode === 'both' ? 'palette + simulator' : 'simulator';
				ctx.ui.notify(`UI simulator enabled (${mode})`, "info");
			} else {
				hideSimulator(ctx);
				ctx.ui.notify("UI simulator disabled", "info");
			}
		},
	});

	// Command to toggle view mode
	pi.registerCommand("theme-simulator-mode", {
		description: "Switch between simulator modes (both|simulator)",
		handler: async (args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("UI simulator requires UI mode", "warning");
				return;
			}

			const mode = args[0]?.toLowerCase();
			if (mode === 'both' || mode === 'split') {
				viewMode = 'both';
				ctx.ui.notify("Mode: palette + simulator", "info");
			} else if (mode === 'simulator' || mode === 'ui') {
				viewMode = 'simulator';
				ctx.ui.notify("Mode: simulator only", "info");
			} else {
				ctx.ui.notify("Current mode: " + viewMode, "info");
				ctx.ui.notify("Usage: /theme-simulator-mode [both|simulator]", "info");
				return;
			}

			// Refresh display if visible
			if (isVisible && currentCtx) {
				hideSimulator(currentCtx);
				showSimulator(currentCtx);
			}
		},
	});
}
