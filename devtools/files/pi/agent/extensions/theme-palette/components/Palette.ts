/**
 * Responsive Palette Component
 * 
 * Demonstrates design hierarchy using Box and Flex components from @mariozechner/pi-tui
 * Showcases border weights, depth, spacing, and color contrast hierarchy
 */
import type { Component } from "@mariozechner/pi-tui";
import { Box, Text, Container } from "@mariozechner/pi-tui";
import { Flex } from "./ds/Flex.js";
import { Group, type GroupData } from "./Group.js";
import { Theme } from "@mariozechner/pi-coding-agent";

export interface PaletteData {
	/** Optional title for the entire palette */
	title?: string;
	/** Array of group data */
	groups: GroupData[];
}

export class Palette extends Container implements Component {
	private headerBox: Box;
	private contentBox: Box;
	private flexLayout: Flex;
	private titleText: Text;
	private subtitleText: Text;
	private groups: Group[] = [];

	constructor(
		private theme: Theme,
		private data: PaletteData,
	) {
		super();

		const th = this.theme;

		// Header Box - elevated surface with subtle depth
		this.headerBox = new Box(2, 1, (s) => th.bg("userMessageBg", s));

		// Title with primary accent color
		const titleContent = th.bold(th.fg("accent", this.data.title || "Theme Palette"));
		this.titleText = new Text(titleContent, 0, 0);

		// Subtitle with muted text showing hierarchy
		const subtitleContent = th.fg("dim", "Design system color tokens with hierarchical contrast");
		this.subtitleText = new Text(subtitleContent, 0, 0);

		// Header container
		const headerContent = new Container();
		headerContent.addChild(this.titleText);
		headerContent.addChild(this.subtitleText);
		this.headerBox.addChild(headerContent);

		// Content Box - base surface with border separation
		this.contentBox = new Box(2, 1, (s) => th.bg("customMessageBg", s));

		// Create flex container with wrap mode for responsive layout
		this.flexLayout = new Flex({ mode: 'wrap', spacing: 2 });

		// Initial render
		this.updateDisplay();

		// Add flex container to content box
		this.contentBox.addChild(this.flexLayout);

		// Add boxes to main container
		this.addChild(this.headerBox);
		this.addChild(this.contentBox);
	}

	private updateDisplay(): void {
		const th = this.theme;

		// Clear existing groups
		this.flexLayout.clear();
		this.groups = [];

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
		const group = this.groups[index];
		if (!group) return;
		this.flexLayout.removeChild(group);
		this.groups.splice(index, 1);
		this.data.groups.splice(index, 1);
		this.invalidate();
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
