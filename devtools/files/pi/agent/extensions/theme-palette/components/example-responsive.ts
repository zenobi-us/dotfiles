/**
 * Example: Responsive Theme Palette Layout
 * 
 * This example demonstrates how to use the Flex, Grid, and Sized components
 * to create a responsive layout for the theme palette.
 * 
 * Layout Structure:
 * 
 * ResponsivePalette (Box with Flex layout)
 * └── Flex { mode: 'wrap', spacing: 2 }
 *     ├── Text (Title - spans full width)
 *     ├── Group (preferredWidth: 45)
 *     │   └── Grid { minColumnWidth: 40, spacing: 2 }
 *     │       ├── Chip
 *     │       ├── Chip
 *     │       └── ...
 *     ├── Group (preferredWidth: 50)
 *     │   └── Grid { minColumnWidth: 40, spacing: 2 }
 *     │       └── ...
 *     └── ...
 * 
 * How it works:
 * 
 * 1. ResponsivePalette uses a Flex container with mode: 'wrap'
 *    - Groups flow horizontally and wrap to the next line when needed
 *    - Each group declares a preferredWidth
 * 
 * 2. Each Group uses a Grid layout for its chips
 *    - Chips are arranged in equal-width columns
 *    - Columns automatically adjust based on available width
 *    - If width is too narrow, falls back to vertical stacking
 * 
 * 3. Responsive behavior:
 *    - Wide terminal: Multiple groups side-by-side, chips in columns
 *    - Medium terminal: Fewer groups per row, chips in columns
 *    - Narrow terminal: Groups stack vertically, chips stack vertically
 * 
 * Key properties:
 * 
 * Flex:
 *   - mode: 'wrap' - Children wrap to next line when width is exceeded
 *   - mode: 'fill' - Children evenly fill the row
 *   - spacing: Space between children (default: 2)
 * 
 * Grid:
 *   - minColumnWidth: Minimum width per column (default: 10)
 *   - spacing: Space between columns (default: 2)
 *   - Falls back to vertical stacking if columns would be too narrow
 * 
 * Sized:
 *   - Wraps a component and declares preferredWidth for Flex layout
 *   - Used to hint at component's natural/desired width
 * 
 * Example usage in code:
 */

import { Theme } from "@mariozechner/pi-coding-agent";
import { Flex, Grid, Sized, sized } from "./components/index.js";
import { Box, Text } from "@mariozechner/pi-tui";

// Create a responsive layout manually
export function createExampleLayout(theme: Theme) {
	const root = new Box();
	const flex = new Flex({ mode: 'wrap', spacing: 2 });

	// Title
	const title = new Text(theme.fg("accent", "Example Responsive Layout"), 0, 1);
	flex.addChild(title);

	// Group 1
	const group1 = new Box();
	const grid1 = new Grid({ minColumnWidth: 30, spacing: 2 });
	
	// Add items to grid
	for (let i = 0; i < 6; i++) {
		const item = new Text(theme.fg("text", `Item ${i + 1}`));
		grid1.addChild(item);
	}
	
	group1.addChild(grid1);
	
	// Wrap group in Sized to declare preferred width
	flex.addChild(sized(group1, 40));

	// Group 2
	const group2 = new Box();
	const grid2 = new Grid({ minColumnWidth: 30, spacing: 2 });
	
	for (let i = 0; i < 4; i++) {
		const item = new Text(theme.fg("success", `Success ${i + 1}`));
		grid2.addChild(item);
	}
	
	group2.addChild(grid2);
	flex.addChild(sized(group2, 40));

	root.addChild(flex);
	return root;
}

/**
 * Alternative: Using ResponsivePalette directly
 */

import { ResponsivePalette } from "./components/Palette-responsive.js";

export function createPaletteExample(theme: Theme) {
	return new ResponsivePalette(theme, {
		title: "Example Palette",
		groups: [
			{
				title: "Colors",
				preferredWidth: 45,
				chips: [
					{ name: "accent", description: "Primary" },
					{ name: "success", description: "Success" },
				],
			},
			{
				title: "Text",
				preferredWidth: 45,
				chips: [
					{ name: "text", description: "Primary text" },
					{ name: "muted", description: "Muted text" },
				],
			},
		],
	});
}
