/**
 * Theme Palette Extension - Visual explorer for Pi theme colors
 * 
 * Displays all available theme colors with visual swatches to help
 * extension developers understand the Pi theme system.
 * 
 * Commands:
 *   /theme-palette - Toggle palette visibility
 * 
 * Usage:
 *   pi -e ~/.pi/agent/extensions/theme-palette/index.ts
 */

import type { ExtensionAPI, ExtensionContext, Theme } from "@mariozechner/pi-coding-agent";
import type { TUI, Component } from "@mariozechner/pi-tui";

// Color definitions with categories
const THEME_COLORS = {
	ui: [
		{ name: "accent", description: "Primary accent color" },
		{ name: "border", description: "Default border color" },
		{ name: "borderAccent", description: "Accent border color" },
		{ name: "borderMuted", description: "Muted border color" },
		{ name: "text", description: "Primary text color" },
		{ name: "muted", description: "Muted text color" },
		{ name: "dim", description: "Dimmed text color" },
	],
	semantic: [
		{ name: "success", description: "Success/positive state" },
		{ name: "error", description: "Error/negative state" },
		{ name: "warning", description: "Warning/caution state" },
	],
	messages: [
		{ name: "thinkingText", description: "AI thinking text" },
		{ name: "userMessageText", description: "User message text" },
		{ name: "customMessageText", description: "Custom message text" },
		{ name: "customMessageLabel", description: "Custom message label" },
	],
	tools: [
		{ name: "toolTitle", description: "Tool call title" },
		{ name: "toolOutput", description: "Tool output text" },
		{ name: "toolDiffAdded", description: "Added lines in diff" },
		{ name: "toolDiffRemoved", description: "Removed lines in diff" },
		{ name: "toolDiffContext", description: "Context lines in diff" },
	],
	markdown: [
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
	syntax: [
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
	thinking: [
		{ name: "thinkingOff", description: "Thinking: off" },
		{ name: "thinkingMinimal", description: "Thinking: minimal" },
		{ name: "thinkingLow", description: "Thinking: low" },
		{ name: "thinkingMedium", description: "Thinking: medium" },
		{ name: "thinkingHigh", description: "Thinking: high" },
		{ name: "thinkingXhigh", description: "Thinking: extra high" },
	],
	backgrounds: [
		{ name: "selectedBg", description: "Selected item background" },
		{ name: "userMessageBg", description: "User message background" },
		{ name: "customMessageBg", description: "Custom message background" },
		{ name: "toolPendingBg", description: "Tool pending background" },
		{ name: "toolSuccessBg", description: "Tool success background" },
		{ name: "toolErrorBg", description: "Tool error background" },
	],
	special: [
		{ name: "bashMode", description: "Bash mode indicator" },
	],
} as const;

class ThemePaletteWidget implements Component {
	constructor(
		private tui: TUI,
		private theme: Theme,
	) {}

	render(width: number): string[] {
		const lines: string[] = [];
		const th = this.theme;

		// Header
		lines.push(th.fg("accent", "╭" + "─".repeat(width - 2) + "╮"));
		lines.push(
			th.fg("accent", "│") +
			" " + th.bold(th.fg("accent", "Theme Palette")) +
			" ".repeat(width - 17) +
			th.fg("accent", "│")
		);
		lines.push(th.fg("accent", "╰" + "─".repeat(width - 2) + "╯"));
		lines.push("");

		// UI Colors
		lines.push(th.fg("accent", "══ UI Colors ══"));
		for (const color of THEME_COLORS.ui) {
			const swatch = th.fg(color.name as any, "██");
			const name = th.fg("text", color.name.padEnd(20));
			const desc = th.fg("dim", color.description);
			lines.push(`  ${swatch} ${name} ${desc}`);
		}
		lines.push("");

		// Semantic Colors
		lines.push(th.fg("accent", "══ Semantic Colors ══"));
		for (const color of THEME_COLORS.semantic) {
			const swatch = th.fg(color.name as any, "██");
			const name = th.fg("text", color.name.padEnd(20));
			const desc = th.fg("dim", color.description);
			lines.push(`  ${swatch} ${name} ${desc}`);
		}
		lines.push("");

		// Message Colors
		lines.push(th.fg("accent", "══ Message Colors ══"));
		for (const color of THEME_COLORS.messages) {
			const swatch = th.fg(color.name as any, "██");
			const name = th.fg("text", color.name.padEnd(20));
			const desc = th.fg("dim", color.description);
			lines.push(`  ${swatch} ${name} ${desc}`);
		}
		lines.push("");

		// Tool Colors
		lines.push(th.fg("accent", "══ Tool Colors ══"));
		for (const color of THEME_COLORS.tools) {
			const swatch = th.fg(color.name as any, "██");
			const name = th.fg("text", color.name.padEnd(20));
			const desc = th.fg("dim", color.description);
			lines.push(`  ${swatch} ${name} ${desc}`);
		}
		lines.push("");

		// Markdown Colors
		lines.push(th.fg("accent", "══ Markdown Colors ══"));
		for (const color of THEME_COLORS.markdown) {
			const swatch = th.fg(color.name as any, "██");
			const name = th.fg("text", color.name.padEnd(20));
			const desc = th.fg("dim", color.description);
			lines.push(`  ${swatch} ${name} ${desc}`);
		}
		lines.push("");

		// Syntax Colors
		lines.push(th.fg("accent", "══ Syntax Colors ══"));
		for (const color of THEME_COLORS.syntax) {
			const swatch = th.fg(color.name as any, "██");
			const name = th.fg("text", color.name.padEnd(20));
			const desc = th.fg("dim", color.description);
			lines.push(`  ${swatch} ${name} ${desc}`);
		}
		lines.push("");

		// Thinking Level Colors
		lines.push(th.fg("accent", "══ Thinking Level Colors ══"));
		for (const color of THEME_COLORS.thinking) {
			const swatch = th.fg(color.name as any, "██");
			const name = th.fg("text", color.name.padEnd(20));
			const desc = th.fg("dim", color.description);
			lines.push(`  ${swatch} ${name} ${desc}`);
		}
		lines.push("");

		// Background Colors
		lines.push(th.fg("accent", "══ Background Colors ══"));
		for (const color of THEME_COLORS.backgrounds) {
			const swatch = th.bg(color.name as any, "    ");
			const name = th.fg("text", color.name.padEnd(20));
			const desc = th.fg("dim", color.description);
			lines.push(`  ${swatch} ${name} ${desc}`);
		}
		lines.push("");

		// Special Colors
		lines.push(th.fg("accent", "══ Special Colors ══"));
		for (const color of THEME_COLORS.special) {
			const swatch = th.fg(color.name as any, "██");
			const name = th.fg("text", color.name.padEnd(20));
			const desc = th.fg("dim", color.description);
			lines.push(`  ${swatch} ${name} ${desc}`);
		}

		return lines;
	}

	invalidate(): void {
		// No-op for static widget
	}

	dispose(): void {
		// No cleanup needed
	}
}

export default function (pi: ExtensionAPI) {
	let isVisible = false;
	let currentCtx: ExtensionContext | null = null;

	function showPalette(ctx: ExtensionContext) {
		if (!ctx.hasUI) return;

		ctx.ui.setWidget("theme-palette", (tui: TUI, theme: Theme) => {
			return new ThemePaletteWidget(tui, theme);
		});
	}

	function hidePalette(ctx: ExtensionContext) {
		if (!ctx.hasUI) return;
		ctx.ui.setWidget("theme-palette", undefined);
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
		description: "Toggle theme palette display",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("Theme palette requires UI mode", "warning");
				return;
			}

			currentCtx = ctx;
			isVisible = !isVisible;

			if (isVisible) {
				showPalette(ctx);
				ctx.ui.notify("Theme palette enabled", "info");
			} else {
				hidePalette(ctx);
				ctx.ui.notify("Theme palette disabled", "info");
			}
		},
	});

	// Keyboard shortcut: Ctrl+T for theme palette
	pi.registerShortcut("ctrl+shift+t", {
		description: "Toggle theme palette",
		handler: async (ctx) => {
			if (!ctx.hasUI) return;

			currentCtx = ctx;
			isVisible = !isVisible;

			if (isVisible) {
				showPalette(ctx);
				ctx.ui.notify("Theme palette enabled", "info");
			} else {
				hidePalette(ctx);
				ctx.ui.notify("Theme palette disabled", "info");
			}
		},
	});
}
