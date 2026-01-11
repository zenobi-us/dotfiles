/**
 * Chip Component
 * 
 * Displays a color name and description without borders.
 * Uses Box component but with no border color or background styling.
 */

import { Theme } from "@mariozechner/pi-coding-agent";
import type { Component } from "@mariozechner/pi-tui";
import { Box, Text } from "@mariozechner/pi-tui";

export interface ChipData {
	/** The color name (e.g., "accent", "border") */
	name: string;
	/** Description of the color's purpose */
	description: string;
}

export class Chip extends Box implements Component {
	private nameText: Text;
	private descText: Text;

	constructor(
		private theme: Theme,
		private data: ChipData,
	) {
		super(0, 0);

		// Create text components
		this.nameText = new Text("", 0, 0);
		this.descText = new Text("", 0, 0);

		// Add to box
		this.addChild(this.nameText);
		this.addChild(this.descText);

		// Initial render
		this.updateDisplay();
	}

	private updateDisplay(): void {
		const th = this.theme;

		// Check if this is a background color (ends with "Bg")
		const isBgColor = this.data.name.endsWith("Bg");

		// For background colors, show with bg() instead of fg()
		const swatch = isBgColor
			? th.bg(this.data.name as any, "  ")  // 4 spaces for bg colors
			: th.fg(this.data.name as any, "██");   // 2 blocks for fg colors

		const name = th.fg("text", this.data.name.padEnd(20));
		const desc = th.fg("dim", this.data.description);

		this.nameText.setText(`${swatch} ${name}`);
		this.descText.setText(`   ${desc}`);
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
