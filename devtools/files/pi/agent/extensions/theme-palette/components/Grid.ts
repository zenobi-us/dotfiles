/**
 * Grid Component
 *
 * Renders child components horizontally with equal-width columns.
 * Each child is forced into an equal portion of the available width.
 */

import type { Component } from '@mariozechner/pi-tui';
import { visibleWidth } from '@mariozechner/pi-tui';

export interface GridOptions {
	/** Spacing between columns (default: 2) */
	spacing?: number;
	/** Minimum width per column (default: 10) */
	minColumnWidth?: number;
}

export class Grid implements Component {
	private children: Component[] = [];
	private spacing: number;
	private minColumnWidth: number;

	constructor(options: GridOptions = {}) {
		this.spacing = options.spacing ?? 2;
		this.minColumnWidth = options.minColumnWidth ?? 10;
	}

	addChild(component: Component): void {
		this.children.push(component);
	}

	removeChild(component: Component): void {
		const index = this.children.indexOf(component);
		if (index >= 0) {
			this.children.splice(index, 1);
		}
	}

	clear(): void {
		this.children = [];
	}

	invalidate(): void {
		for (const child of this.children) {
			child.invalidate();
		}
	}

	render(width: number): string[] {
		if (this.children.length === 0) {
			return [];
		}

		// Calculate column width
		const totalSpacing = this.spacing * (this.children.length - 1);
		const availableWidth = width - totalSpacing;
		const columnWidth = Math.floor(availableWidth / this.children.length);

		// If columns would be too narrow, fall back to vertical stacking
		if (columnWidth < this.minColumnWidth) {
			return this.renderVertical(width);
		}

		// Render each child to its column width
		const columns = this.children.map((child) => child.render(columnWidth));

		// Find max height
		const maxHeight = Math.max(...columns.map((col) => col.length));

		// Combine columns horizontally
		const lines: string[] = [];
		const spacer = ' '.repeat(this.spacing);

		for (let row = 0; row < maxHeight; row++) {
			const rowParts: string[] = [];

			for (let col = 0; col < columns.length; col++) {
				const column = columns[col]!;
				const line = row < column.length ? column[row]! : '';

				// Pad line to column width
				const lineWidth = visibleWidth(line);
				const padding = ' '.repeat(Math.max(0, columnWidth - lineWidth));
				rowParts.push(line + padding);
			}

			lines.push(rowParts.join(spacer));
		}

		return lines;
	}

	/**
	 * Fallback to vertical stacking when width is too narrow
	 */
	private renderVertical(width: number): string[] {
		const lines: string[] = [];
		for (const child of this.children) {
			lines.push(...child.render(width));
		}
		return lines;
	}

	/**
	 * Get number of children
	 */
	getChildCount(): number {
		return this.children.length;
	}

	/**
	 * Get child at index
	 */
	getChild(index: number): Component | undefined {
		return this.children[index];
	}
}
