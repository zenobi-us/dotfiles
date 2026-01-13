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
import { Flex } from "./components/ds/Flex.js";

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
			return new UISimulator(theme);
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
			isVisible = !isVisible;

			if (isVisible) {
				showSimulator(ctx);
			} else {
				hideSimulator(ctx);
			}
		},
	});
}
