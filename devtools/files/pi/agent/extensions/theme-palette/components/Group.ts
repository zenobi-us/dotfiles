/**
 * Responsive Group Component
 * 
 * A titled group of chips using Grid layout for responsive columns.
 * Chips automatically flow into columns based on available width.
 */

import type { Component } from "@mariozechner/pi-tui";
import { Box, Container, Text } from "@mariozechner/pi-tui";
import { Grid } from "./Grid.js";
import { Sized, sized } from "./Sized.js";
import { Chip, type ChipData } from "./Chip.js";
import { Theme } from "@mariozechner/pi-coding-agent";

export interface GroupData {
	/** Title of the group */
	title: string;
	/** Array of chip data */
	chips: ChipData[];
	/** Preferred width for this group (default: 50) */
	preferredWidth?: number;
}

export class Group extends Box implements Component {
	private container: Container;
	private titleText: Text;
	private gridLayout: Grid;
	private chips: Chip[] = [];
	public readonly preferredWidth: number;

	constructor(
		private theme: Theme,
		private data: GroupData,
	) {
		super();

		// Set preferred width for flex layout
		this.preferredWidth = data.preferredWidth ?? 50;

		// Create container for vertical layout (title + grid)
		this.container = new Container();

		// Create title
		this.titleText = new Text("", 0, 1); // 1 line padding
		this.container.addChild(this.titleText);

		// Create grid for chip layout with responsive columns
		// Chips need about 40 characters minimum (swatch + name + desc)
		this.gridLayout = new Grid({
			spacing: 2,
			minColumnWidth: 40
		});
		this.container.addChild(this.gridLayout);

		// Add container to box
		this.addChild(this.container);

		// Initial render
		this.updateDisplay();
	}

	private updateDisplay(): void {
		const th = this.theme;

		// Update title with accent color
		this.titleText.setText(th.fg("accent", this.data.title));

		// Clear existing chips from grid
		this.gridLayout.clear();
		this.chips = [];

		// Add new chips to grid
		for (const chipData of this.data.chips) {
			const chip = new Chip(this.theme, chipData);
			this.chips.push(chip);
			this.gridLayout.addChild(chip);
		}
	}

	override invalidate(): void {
		super.invalidate();
		this.gridLayout.invalidate();
	}

	/**
	 * Update the group data
	 */
	setData(data: GroupData): void {
		this.data = data;
		this.updateDisplay();
		this.invalidate();
	}

	/**
	 * Get the current group data
	 */
	getData(): GroupData {
		return this.data;
	}

	/**
	 * Add a chip to the group
	 */
	addChip(chipData: ChipData): void {
		this.data.chips.push(chipData);
		const chip = new Chip(this.theme, chipData);
		this.chips.push(chip);
		this.gridLayout.addChild(chip);
		this.invalidate();
	}

	/**
	 * Remove a chip by index
	 */
	removeChip(index: number): void {
		const chip = this.chips[index];
		if (!chip) return;

		this.gridLayout.removeChild(chip);
		this.chips.splice(index, 1);
		this.data.chips.splice(index, 1);
		this.invalidate();
	}

	/**
	 * Clear all chips
	 */
	clearChips(): void {
		this.gridLayout.clear();
		this.chips = [];
		this.data.chips = [];
		this.invalidate();
	}

	/**
	 * Set the minimum column width for the grid
	 */
	setMinColumnWidth(width: number): void {
		// This would require exposing the property on Grid
		// For now, we'd need to recreate the grid
		this.invalidate();
	}
}
