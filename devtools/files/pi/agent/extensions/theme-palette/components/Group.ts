/**
 * Group Component
 * 
 * A titled group of chips with a border.
 * Uses Box (with auto border) and Container for chip layout.
 */

import type { Component } from "@mariozechner/pi-tui";
import { Box, Container, Text } from "@mariozechner/pi-tui";
import { Chip, type ChipData } from "./Chip.js";
import { Theme } from "@mariozechner/pi-coding-agent";

export interface GroupData {
	/** Title of the group */
	title: string;
	/** Array of chip data */
	chips: ChipData[];
}

export class Group extends Box implements Component {
	private container: Container;
	private titleText: Text;
	private chips: Chip[] = [];

	constructor(
		private theme: Theme,
		private data: GroupData,
	) {
		super();

		// Create container for vertical layout
		this.container = new Container();

		// Create title
		this.titleText = new Text("", 0, 1); // 1 line padding
		this.container.addChild(this.titleText);

		// Add container to box
		this.addChild(this.container);

		// Set border color function for automatic border rendering

		// Initial render
		this.updateDisplay();
	}

	private updateDisplay(): void {
		const th = this.theme;

		// Update title with accent color
		this.titleText.setText(th.fg("accent", `══ ${this.data.title} ══`));

		// Clear existing chips
		for (const chip of this.chips) {
			this.container.removeChild(chip);
		}
		this.chips = [];

		// Add new chips
		for (const chipData of this.data.chips) {
			const chip = new Chip(this.theme, chipData);
			this.chips.push(chip);
			this.container.addChild(chip);
		}
	}

	override invalidate(): void {
		super.invalidate();
		this.updateDisplay();
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
		this.container.addChild(chip);
		this.invalidate();
	}

	/**
	 * Remove a chip by index
	 */
	removeChip(index: number): void {
		if (index >= 0 && index < this.chips.length) {
			const chip = this.chips[index];
			this.container.removeChild(chip);
			this.chips.splice(index, 1);
			this.data.chips.splice(index, 1);
			this.invalidate();
		}
	}

	/**
	 * Clear all chips
	 */
	clearChips(): void {
		for (const chip of this.chips) {
			this.container.removeChild(chip);
		}
		this.chips = [];
		this.data.chips = [];
		this.invalidate();
	}
}
