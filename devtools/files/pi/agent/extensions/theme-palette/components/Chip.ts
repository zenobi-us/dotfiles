/**
 * Chip Component
 * 
 * Demonstrates color hierarchy with proper contrast:
 * - Primary text for color names (text)
 * - Secondary text for descriptions (dim -> subtle-1)
 * - Muted text for metadata (muted-1)
 * - Subtle background on hover states
 */

import { Theme } from "@mariozechner/pi-coding-agent";
import type { Component } from "@mariozechner/pi-tui";
import { Box, Text, Container } from "@mariozechner/pi-tui";

export interface ChipData {
	/** The color name (e.g., "accent", "border") */
	name: string;
	/** Description of the color's purpose */
	description: string;
}

export class Chip extends Box implements Component {
	private container: Container;
	private swatchBox: Box;
	private contentBox: Box;
	private nameText: Text;
	private descText: Text;

	constructor(
		private theme: Theme,
		private data: ChipData,
	) {
		// Chip container with subtle background and border
		super(1, 1, (s) => theme.bg("overlay-1", s));

		// Main container for layout
		this.container = new Container();

		// Swatch box - colored square showing the actual color
		this.swatchBox = new Box(0, 0);
		
		// Content box for name and description
		this.contentBox = new Box(1, 0);
		this.nameText = new Text("", 0, 0);
		this.descText = new Text("", 0, 0);
		
		this.contentBox.addChild(this.nameText);
		this.contentBox.addChild(this.descText);

		// Add to container
		this.container.addChild(this.swatchBox);
		this.container.addChild(this.contentBox);
		this.addChild(this.container);

		// Initial render
		this.updateDisplay();
	}

	private updateDisplay(): void {
		const th = this.theme;

		// Check if this is a background color (ends with "Bg")
		const isBgColor = this.data.name.endsWith("Bg");

		// For background colors, show with bg() instead of fg()
		const swatch = isBgColor
			? th.bg(this.data.name as any, "    ")  // 4 spaces for bg colors
			: th.fg(this.data.name as any, "████");   // 4 blocks for fg colors

		// Color name in primary text weight
		const name = th.fg("text", this.data.name.padEnd(22));
		
		// Description in muted secondary text - demonstrates hierarchy
		const desc = th.fg("dim", this.data.description);

		this.nameText.setText(`${swatch} ${name}`);
		this.descText.setText(`     ${desc}`);
	}

	override invalidate(): void {
		super.invalidate();
		this.updateDisplay();
	}

	/**
	 * Update the chip data
	 */
	setData(data: ChipData): void {
		this.data = data;
		this.updateDisplay();
		this.invalidate();
	}

	/**
	 * Get the current chip data
	 */
	getData(): ChipData {
		return this.data;
	}
}
