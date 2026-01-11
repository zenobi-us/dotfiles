/**
 * Palette Component
 * 
 * Top-level component containing multiple groups.
 * Uses Box as root with Container for vertical layout of groups.
 */

import type { Component } from "@mariozechner/pi-tui";
import { Box, Container, Text } from "@mariozechner/pi-tui";
import { Group, type GroupData } from "./Group.js";
import { Theme } from "@mariozechner/pi-coding-agent";

export interface PaletteData {
	/** Optional title for the entire palette */
	title?: string;
	/** Array of group data */
	groups: GroupData[];
}

export class Palette extends Box implements Component {
	private container: Container;
	private titleText?: Text;
	private groups: Group[] = [];

	constructor(
		private theme: Theme,
		private data: PaletteData,
	) {
		super();

		// Create container for content
		this.container = new Container();
		this.addChild(this.container);

		// Set border color function

		// Initial render
		this.updateDisplay();
	}

	private updateDisplay(): void {
		const th = this.theme;

		// Clear existing children from container
		this.container.clear();
		this.groups = [];

		// Add title if provided
		if (this.data.title) {
			this.titleText = new Text(th.bold(th.fg("accent", this.data.title)), 1, 0);
			this.container.addChild(this.titleText);
		}

		// Add groups
		for (const groupData of this.data.groups) {
			const group = new Group(this.theme, groupData);
			this.groups.push(group);
			this.container.addChild(group);

			// Add spacing between groups
			this.container.addChild(new Text("", 0, 1));
		}
	}

	override invalidate(): void {
		super.invalidate();
		this.updateDisplay();
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
		this.container.addChild(group);
		// Add spacing
		this.container.addChild(new Text("", 0, 1));
		this.invalidate();
	}

	/**
	 * Remove a group by index
	 */
	removeGroup(index: number): void {
		if (index >= 0 && index < this.groups.length) {
			const group = this.groups[index];
			this.container.removeChild(group);
			this.groups.splice(index, 1);
			this.data.groups.splice(index, 1);
			this.invalidate();
		}
	}

	/**
	 * Clear all groups
	 */
	clearGroups(): void {
		this.container.clear();
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
}
