/**
 * Responsive Group Component
 * 
 * Demonstrates design hierarchy with Box component:
 * - Subtle borders for definition (border-1)
 * - Elevated surface backgrounds (surface+1)
 * - Typography hierarchy with color contrast
 * - Consistent spacing on 4px grid
 */

import type { Component } from "@mariozechner/pi-tui";
import { Box, Container, Text } from "@mariozechner/pi-tui";
import { Grid } from "./ds/Grid.js";
import { Chip, type ChipData } from "./Chip.js";
import { Theme } from "@mariozechner/pi-coding-agent";
import type { SizedComponent } from "./ds/Flex.js";

export interface GroupData {
	/** Title of the group */
	title: string;
	/** Array of chip data */
	chips: ChipData[];
	/** Preferred width for this group (default: 50) */
	preferredWidth?: number;
}

export class Group extends Box implements Component, SizedComponent {
	private container: Container;
	private titleBox: Box;
	private titleText: Text;
	private contentBox: Box;
	private gridLayout: Grid;
	private chips: Chip[] = [];
	public readonly preferredWidth: number;

	constructor(
		private theme: Theme,
		private data: GroupData,
	) {
		// Outer box with subtle border and elevated background
		super(1, 0, (s) => theme.bg("userMessageBg", s));

		// Set preferred width for flex layout
		this.preferredWidth = data.preferredWidth ?? 50;

		// Create container for vertical layout (title + content)
		this.container = new Container();

		// Title box - slightly elevated with padding
		this.titleBox = new Box(1, 1);
		this.titleText = new Text("", 0, 0);
		this.titleBox.addChild(this.titleText);
		this.container.addChild(this.titleBox);

		// Content box - contains grid with chips
		this.contentBox = new Box(1, 1, (s) => theme.bg("customMessageBg", s));

		// Create grid for chip layout with responsive columns
		// Chips need about 40 characters minimum (swatch + name + desc)
		this.gridLayout = new Grid({
			spacing: 2,
			minColumnWidth: 40
		});
		this.contentBox.addChild(this.gridLayout);
		this.container.addChild(this.contentBox);

		// Add container to main box
		this.addChild(this.container);

		// Initial render
		this.updateDisplay();
	}

	private updateDisplay(): void {
		const th = this.theme;

		// Update title with accent color and medium weight
		const titleContent = th.bold(th.fg("accent", this.data.title));
		this.titleText.setText(titleContent);

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
