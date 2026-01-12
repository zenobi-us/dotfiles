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

// Color definitions with categories - showcasing design hierarchy
const THEME_PALETTE_DATA: PaletteData = {
	title: "🎨 Rose Pine Moon · Design System",
	groups: [
		{
			title: "Contrast Hierarchy · Four Levels",
			preferredWidth: 50,
			chips: [
				{ name: "text", description: "Foreground · Primary content" },
				{ name: "muted", description: "Secondary · Supporting text" },
				{ name: "dim", description: "Muted · Subtle-1 recedes" },
				{ name: "border", description: "Faint · Overlay-1 defines" },
			],
		},
		{
			title: "Surface Elevation · Depth via Color",
			preferredWidth: 50,
			chips: [
				{ name: "userMessageBg", description: "Elevated · Surface+1 lifts" },
				{ name: "customMessageBg", description: "Recessed · Surface-1 depth" },
				{ name: "toolPendingBg", description: "Subtle · Overlay-1 separates" },
			],
		},
		{
			title: "Interactive Elements · Accent Hierarchy",
			preferredWidth: 50,
			chips: [
				{ name: "accent", description: "Primary · Iris for interaction" },
				{ name: "borderAccent", description: "Accent border · Iris-1 subtle" },
				{ name: "mdHeading", description: "Headings · Iris+1 prominent" },
				{ name: "customMessageLabel", description: "Labels · Iris+1 clarity" },
			],
		},
		{
			title: "Semantic Colors",
			preferredWidth: 45,
			chips: [
				{ name: "success", description: "Success · Foam positive" },
				{ name: "error", description: "Error · Love negative" },
				{ name: "warning", description: "Warning · Gold caution" },
			],
		},
		{
			title: "Message Colors · Lighter Shades",
			preferredWidth: 50,
			chips: [
				{ name: "thinkingText", description: "AI thinking · Love+1 bright" },
				{ name: "userMessageText", description: "User text · Rose+1 warm" },
				{ name: "customMessageText", description: "Custom text · Foam+1 soft" },
			],
		},
		{
			title: "Tool Output · Muted Hierarchy",
			preferredWidth: 50,
			chips: [
				{ name: "toolTitle", description: "Tool title · Pine+1 clear" },
				{ name: "toolOutput", description: "Output text · Text-1 muted" },
				{ name: "toolDiffAdded", description: "Diff added · Foam+1 lift" },
				{ name: "toolDiffRemoved", description: "Diff removed · Love+1 soft" },
				{ name: "toolDiffContext", description: "Diff context · Subtle-1 recede" },
			],
		},
		{
			title: "Markdown · Mixed Shades",
			preferredWidth: 50,
			chips: [
				{ name: "mdHeading", description: "Headings · Iris+1 prominent" },
				{ name: "mdLink", description: "Link text · Foam base" },
				{ name: "mdLinkUrl", description: "Link URL · Pine-1 subtle" },
				{ name: "mdCode", description: "Inline code · Rose+1 bright" },
				{ name: "mdCodeBlock", description: "Code block · Text-1 muted" },
				{ name: "mdCodeBlockBorder", description: "Block border · Overlay+1" },
				{ name: "mdQuote", description: "Quote text · Subtle-1 dim" },
				{ name: "mdQuoteBorder", description: "Quote border · Overlay-1" },
				{ name: "mdHr", description: "Horizontal rule · Overlay-1" },
				{ name: "mdListBullet", description: "List bullet · Foam-1 dark" },
			],
		},
		{
			title: "Syntax · Darker Variants Recede",
			preferredWidth: 50,
			chips: [
				{ name: "syntaxComment", description: "Comments · Muted-1 recede" },
				{ name: "syntaxKeyword", description: "Keywords · Pine base" },
				{ name: "syntaxFunction", description: "Functions · Foam+1 bright" },
				{ name: "syntaxVariable", description: "Variables · Text-1 muted" },
				{ name: "syntaxString", description: "Strings · Gold+1 warm" },
				{ name: "syntaxNumber", description: "Numbers · Rose base" },
				{ name: "syntaxType", description: "Types · Iris+1 clear" },
				{ name: "syntaxOperator", description: "Operators · Subtle-1 soft" },
				{ name: "syntaxPunctuation", description: "Punctuation · Muted-1 dim" },
			],
		},
		{
			title: "Thinking Levels · Progressive Intensity",
			preferredWidth: 50,
			chips: [
				{ name: "thinkingOff", description: "Off · Muted-1 darkest" },
				{ name: "thinkingMinimal", description: "Minimal · Pine-1 dark" },
				{ name: "thinkingLow", description: "Low · Foam-1 soft" },
				{ name: "thinkingMedium", description: "Medium · Iris base" },
				{ name: "thinkingHigh", description: "High · Rose+1 bright" },
				{ name: "thinkingXhigh", description: "Extra · Love base bold" },
			],
		},
		{
			title: "Borders · Subtle Definition",
			preferredWidth: 50,
			chips: [
				{ name: "border", description: "Default · Overlay-1 subtle" },
				{ name: "borderAccent", description: "Accent · Iris-1 refined" },
				{ name: "borderMuted", description: "Muted · Overlay-1 soft" },
				{ name: "mdCodeBlockBorder", description: "Code border · Overlay+1" },
				{ name: "mdQuoteBorder", description: "Quote border · Overlay-1" },
				{ name: "mdHr", description: "Rule · Overlay-1 faint" },
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
