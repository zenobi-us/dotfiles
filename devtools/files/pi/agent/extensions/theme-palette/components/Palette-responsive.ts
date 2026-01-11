/**
 * Responsive Palette Component
 * 
 * Top-level component using Flex layout for responsive group arrangement.
 * Groups wrap to the next row when width is constrained.
 */

import type { Component } from "@mariozechner/pi-tui";
import { Box, Text } from "@mariozechner/pi-tui";
import { Flex } from "./Flex.js";
import { Group, type GroupData } from "./Group-responsive.js";
import { Theme } from "@mariozechner/pi-coding-agent";

export interface PaletteData {
	/** Optional title for the entire palette */
	title?: string;
	/** Array of group data */
	groups: GroupData[];
}

export class ResponsivePalette extends Box implements Component {
	private flexLayout: Flex;
	private titleText?: Text;
	private groups: Group[] = [];

	constructor(
		private theme: Theme,
		private data: PaletteData,
	) {
		super();

		// Create flex container with wrap mode for responsive layout
		this.flexLayout = new Flex({ mode: 'wrap', spacing: 2 });
		
		// Initial render
		this.updateDisplay();
		
		// Add flex container to box
		this.addChild(this.flexLayout);
	}

	private updateDisplay(): void {
		const th = this.theme;

		// Clear existing groups
		this.flexLayout.clear();
		this.groups = [];

		// Add title if provided (spans full width)
		if (this.data.title) {
			this.titleText = new Text(th.bold(th.fg("accent", this.data.title)), 1, 1);
			this.flexLayout.addChild(this.titleText);
		}

		// Add groups - they will wrap automatically based on available width
		for (const groupData of this.data.groups) {
			const group = new Group(this.theme, groupData);
			this.groups.push(group);
			this.flexLayout.addChild(group);
		}
	}

	override invalidate(): void {
		super.invalidate();
		this.flexLayout.invalidate();
	}

	/**
	 * Update the palette data
	 */
	setData(data: PaletteData): void {
		this.data = data;
		this.updateDisplay();
		this.invalidate();
	}

	/**
	 * Get the current palette data
	 */
	getData(): PaletteData {
		return this.data;
	}

	/**
	 * Add a group to the palette
	 */
	addGroup(groupData: GroupData): void {
		this.data.groups.push(groupData);
		const group = new Group(this.theme, groupData);
		this.groups.push(group);
		this.flexLayout.addChild(group);
		this.invalidate();
	}

	/**
	 * Remove a group by index
	 */
	removeGroup(index: number): void {
		if (index >= 0 && index < this.groups.length) {
			const group = this.groups[index];
			this.flexLayout.removeChild(group);
			this.groups.splice(index, 1);
			this.data.groups.splice(index, 1);
			this.invalidate();
		}
	}

	/**
	 * Clear all groups
	 */
	clearGroups(): void {
		this.flexLayout.clear();
		this.groups = [];
		this.data.groups = [];
		if (this.data.title) {
			// Re-add title
			this.updateDisplay();
		}
		this.invalidate();
	}

	/**
	 * Get a specific group by index
	 */
	getGroup(index: number): Group | undefined {
		return this.groups[index];
	}

	/**
	 * Get all groups
	 */
	getGroups(): Group[] {
		return [...this.groups];
	}

	/**
	 * Set the flex layout mode
	 */
	setLayoutMode(mode: 'wrap' | 'fill'): void {
		this.flexLayout.setMode(mode);
		this.invalidate();
	}

	/**
	 * Get the current flex layout mode
	 */
	getLayoutMode(): 'wrap' | 'fill' {
		return this.flexLayout.getMode();
	}
}
