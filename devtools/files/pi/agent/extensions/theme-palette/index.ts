/**
 * Theme Palette Extension v3 - Responsive Layout
 * 
 * Displays all available theme colors using a responsive layout system.
 * Groups wrap and flow based on available terminal width.
 * Chips within groups are arranged in responsive columns.
 * 
 * Commands:
 *   /theme-palette - Toggle palette visibility
 * 
 * Keyboard Shortcuts:
 *   Ctrl+Shift+T - Toggle palette visibility
 * 
 * Usage:
 *   pi -e ~/.pi/agent/extensions/theme-palette/index-responsive.ts
 */

import type { ExtensionAPI, ExtensionContext, Theme } from "@mariozechner/pi-coding-agent";
import type { TUI } from "@mariozechner/pi-tui";
import { Palette } from "./components/Palette.js";
import type { PaletteData } from "./components/Palette.js";

// Color definitions with categories
const THEME_PALETTE_DATA: PaletteData = {
	title: "🎨 Theme Palette (Responsive)",
	groups: [
		{
			title: "UI Colors",
			preferredWidth: 45,
			chips: [
				{ name: "accent", description: "Primary accent color" },
				{ name: "border", description: "Default border color" },
				{ name: "borderAccent", description: "Accent border color" },
				{ name: "borderMuted", description: "Muted border color" },
				{ name: "text", description: "Primary text color" },
				{ name: "muted", description: "Muted text color" },
				{ name: "dim", description: "Dimmed text color" },
			],
		},
		{
			title: "Semantic Colors",
			preferredWidth: 45,
			chips: [
				{ name: "success", description: "Success/positive state" },
				{ name: "error", description: "Error/negative state" },
				{ name: "warning", description: "Warning/caution state" },
			],
		},
		{
			title: "Message Colors",
			preferredWidth: 50,
			chips: [
				{ name: "thinkingText", description: "AI thinking text" },
				{ name: "userMessageText", description: "User message text" },
				{ name: "customMessageText", description: "Custom message text" },
				{ name: "customMessageLabel", description: "Custom message label" },
			],
		},
		{
			title: "Tool Colors",
			preferredWidth: 50,
			chips: [
				{ name: "toolTitle", description: "Tool call title" },
				{ name: "toolOutput", description: "Tool output text" },
				{ name: "toolDiffAdded", description: "Added lines in diff" },
				{ name: "toolDiffRemoved", description: "Removed lines in diff" },
				{ name: "toolDiffContext", description: "Context lines in diff" },
			],
		},
		{
			title: "Markdown Colors",
			preferredWidth: 50,
			chips: [
				{ name: "mdHeading", description: "Markdown headings" },
				{ name: "mdLink", description: "Markdown link text" },
				{ name: "mdLinkUrl", description: "Markdown link URL" },
				{ name: "mdCode", description: "Inline code" },
				{ name: "mdCodeBlock", description: "Code block text" },
				{ name: "mdCodeBlockBorder", description: "Code block border" },
				{ name: "mdQuote", description: "Quote text" },
				{ name: "mdQuoteBorder", description: "Quote border" },
				{ name: "mdHr", description: "Horizontal rule" },
				{ name: "mdListBullet", description: "List bullet" },
			],
		},
		{
			title: "Syntax Colors",
			preferredWidth: 50,
			chips: [
				{ name: "syntaxComment", description: "Code comments" },
				{ name: "syntaxKeyword", description: "Language keywords" },
				{ name: "syntaxFunction", description: "Function names" },
				{ name: "syntaxVariable", description: "Variable names" },
				{ name: "syntaxString", description: "String literals" },
				{ name: "syntaxNumber", description: "Number literals" },
				{ name: "syntaxType", description: "Type names" },
				{ name: "syntaxOperator", description: "Operators" },
				{ name: "syntaxPunctuation", description: "Punctuation" },
			],
		},
		{
			title: "Thinking Level Colors",
			preferredWidth: 50,
			chips: [
				{ name: "thinkingOff", description: "Thinking: off" },
				{ name: "thinkingMinimal", description: "Thinking: minimal" },
				{ name: "thinkingLow", description: "Thinking: low" },
				{ name: "thinkingMedium", description: "Thinking: medium" },
				{ name: "thinkingHigh", description: "Thinking: high" },
				{ name: "thinkingXhigh", description: "Thinking: extra high" },
			],
		},
		{
			title: "Background Colors",
			preferredWidth: 50,
			chips: [
				{ name: "selectedBg", description: "Selected item background" },
				{ name: "userMessageBg", description: "User message background" },
				{ name: "customMessageBg", description: "Custom message background" },
				{ name: "toolPendingBg", description: "Tool pending background" },
				{ name: "toolSuccessBg", description: "Tool success background" },
				{ name: "toolErrorBg", description: "Tool error background" },
			],
		},
		{
			title: "Special Colors",
			preferredWidth: 45,
			chips: [
				{ name: "bashMode", description: "Bash mode indicator" },
			],
		},
	],
};

export default function (pi: ExtensionAPI) {
	let isVisible = false;
	let currentCtx: ExtensionContext | null = null;

	function showPalette(ctx: ExtensionContext) {
		if (!ctx.hasUI) return;

		ctx.ui.setWidget("theme-palette-responsive", (tui: TUI, theme: Theme) => {
			return new Palette(theme, THEME_PALETTE_DATA);
		});
	}

	function hidePalette(ctx: ExtensionContext) {
		if (!ctx.hasUI) return;
		ctx.ui.setWidget("theme-palette-responsive", undefined);
	}

	// Auto-show on session start if previously visible
	pi.on("session_start", async (_event, ctx) => {
		currentCtx = ctx;
		if (isVisible && ctx.hasUI) {
			showPalette(ctx);
		}
	});

	// Cleanup on shutdown
	pi.on("session_shutdown", async () => {
		if (currentCtx) {
			hidePalette(currentCtx);
		}
		isVisible = false;
		currentCtx = null;
	});

	// Toggle command
	pi.registerCommand("theme-palette", {
		description: "Toggle responsive theme palette display",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("Theme palette requires UI mode", "warning");
				return;
			}

			currentCtx = ctx;
			isVisible = !isVisible;

			if (isVisible) {
				showPalette(ctx);
				ctx.ui.notify("Responsive theme palette enabled", "info");
			} else {
				hidePalette(ctx);
				ctx.ui.notify("Responsive theme palette disabled", "info");
			}
		},
	});

	// Keyboard shortcut: Ctrl+Shift+T for theme palette
	pi.registerShortcut("ctrl+shift+t", {
		description: "Toggle responsive theme palette",
		handler: async (ctx) => {
			if (!ctx.hasUI) return;

			currentCtx = ctx;
			isVisible = !isVisible;

			if (isVisible) {
				showPalette(ctx);
				ctx.ui.notify("Responsive theme palette enabled", "info");
			} else {
				hidePalette(ctx);
				ctx.ui.notify("Responsive theme palette disabled", "info");
			}
		},
	});
}
