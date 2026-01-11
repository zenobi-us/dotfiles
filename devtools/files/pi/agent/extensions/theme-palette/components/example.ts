/**
 * Example Usage of Palette Components
 * 
 * Demonstrates how to use Chip, Group, and Palette components
 * in various scenarios.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Palette, Group, Chip, type PaletteData } from "./index.js";

export default function (pi: ExtensionAPI) {
	
	// Example 1: Simple static palette
	pi.registerCommand("example-simple-palette", {
		description: "Show a simple color palette",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) return;

			ctx.ui.setWidget("example-palette", (tui, theme) => {
				return new Palette(theme, {
					title: "Simple Palette",
					groups: [
						{
							title: "Primary Colors",
							chips: [
								{ name: "accent", description: "Primary accent" },
								{ name: "text", description: "Main text" },
							],
						},
					],
				});
			});

			ctx.ui.notify("Simple palette shown", "info");
		},
	});

	// Example 2: Dynamic palette with updates
	pi.registerCommand("example-dynamic-palette", {
		description: "Show a palette that updates dynamically",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) return;

			let paletteData: PaletteData = {
				title: "Dynamic Palette",
				groups: [
					{
						title: "Initial Colors",
						chips: [
							{ name: "accent", description: "Accent color" },
						],
					},
				],
			};

			ctx.ui.setWidget("example-palette", (tui, theme) => {
				return new Palette(theme, paletteData);
			});

			// Simulate adding groups over time
			setTimeout(() => {
				paletteData.groups.push({
					title: "Added Later",
					chips: [
						{ name: "success", description: "Success state" },
						{ name: "error", description: "Error state" },
					],
				});
				// Force widget refresh
				ctx.ui.setWidget("example-palette", (tui, theme) => {
					return new Palette(theme, paletteData);
				});
			}, 2000);

			ctx.ui.notify("Dynamic palette shown - watch it update!", "info");
		},
	});

	// Example 3: Standalone group
	pi.registerCommand("example-group", {
		description: "Show a single group",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) return;

			ctx.ui.setWidget("example-group", (tui, theme) => {
				return new Group(theme, {
					title: "Semantic Colors",
					chips: [
						{ name: "success", description: "Success state" },
						{ name: "warning", description: "Warning state" },
						{ name: "error", description: "Error state" },
					],
				});
			});

			ctx.ui.notify("Group shown", "info");
		},
	});

	// Example 4: Multiple standalone chips
	pi.registerCommand("example-chips", {
		description: "Show multiple individual chips",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) return;

			const { Container } = await import("@mariozechner/pi-tui");

			ctx.ui.setWidget("example-chips", (tui, theme) => {
				const container = new Container();
				
				// Add individual chips
				const chips = [
					{ name: "accent", description: "Primary accent color" },
					{ name: "border", description: "Default border color" },
					{ name: "text", description: "Main text color" },
				];

				for (const chipData of chips) {
					container.addChild(new Chip(theme, chipData));
				}

				return container;
			});

			ctx.ui.notify("Individual chips shown", "info");
		},
	});

	// Example 5: Custom palette builder
	pi.registerCommand("example-palette-builder", {
		description: "Interactive palette builder",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) return;

			// Build palette from available theme colors
			const themeColors = [
				"accent", "border", "borderAccent", "borderMuted",
				"text", "muted", "dim",
				"success", "error", "warning",
				"thinkingText", "userMessageText", "customMessageText",
			];

			const groups = [];
			
			// Group by category
			groups.push({
				title: "Available Theme Colors",
				chips: themeColors.map(name => ({
					name,
					description: `Theme color: ${name}`,
				})),
			});

			const paletteData: PaletteData = {
				title: "Theme Color Explorer",
				groups,
			};

			ctx.ui.setWidget("example-palette", (tui, theme) => {
				return new Palette(theme, paletteData);
			});

			ctx.ui.notify("Palette builder shown", "info");
		},
	});

	// Example 6: Overlay with palette
	pi.registerCommand("example-palette-overlay", {
		description: "Show palette in an overlay",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) return;

			const { Container, Text: TUIText, matchesKey } = await import("@mariozechner/pi-tui");

			class PaletteOverlay {
				private palette: Palette;
				private container: typeof Container.prototype;
				private footer: typeof TUIText.prototype;

				constructor(
					private theme: any,
					private done: (result: undefined) => void
				) {
					this.palette = new Palette(theme, {
						title: "Overlay Palette",
						groups: [
							{
								title: "Colors",
								chips: [
									{ name: "accent", description: "Primary" },
									{ name: "success", description: "Success" },
									{ name: "error", description: "Error" },
								],
							},
						],
					});

					this.container = new Container();
					this.footer = new TUIText(
						theme.fg("dim", "Press ") + 
						theme.bold(theme.fg("accent", "ESC")) + 
						theme.fg("dim", " to close"),
						0,
						1
					);
				}

				handleInput(data: string): void {
					if (matchesKey(data, "escape")) {
						this.done(undefined);
					}
				}

				render(width: number): string[] {
					this.container.clear();
					this.container.addChild(this.palette);
					this.container.addChild(this.footer);
					return this.container.render(width);
				}

				invalidate(): void {
					this.palette.invalidate();
					this.container.invalidate();
				}
			}

			await ctx.ui.custom(
				(tui, theme, kb, done) => new PaletteOverlay(theme, done),
				{ overlay: true }
			);
		},
	});

	// Example 7: Programmatic palette manipulation
	pi.registerCommand("example-palette-api", {
		description: "Demonstrate palette API",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) return;

			ctx.ui.setWidget("example-palette", (tui, theme) => {
				const palette = new Palette(theme, {
					title: "API Demo",
					groups: [],
				});

				// Add groups programmatically
				palette.addGroup({
					title: "Group 1",
					chips: [
						{ name: "accent", description: "First chip" },
					],
				});

				palette.addGroup({
					title: "Group 2",
					chips: [
						{ name: "success", description: "Second chip" },
					],
				});

				// Modify a group
				const group = palette.getGroup(0);
				if (group) {
					group.addChip({ name: "border", description: "Added chip" });
				}

				// Get all data
				const data = palette.getData();
				console.log("Palette data:", data);

				return palette;
			});

			ctx.ui.notify("API demo - check console for data", "info");
		},
	});

	// Cleanup on shutdown
	pi.on("session_shutdown", async () => {
		// Widgets are automatically cleaned up
	});
}
