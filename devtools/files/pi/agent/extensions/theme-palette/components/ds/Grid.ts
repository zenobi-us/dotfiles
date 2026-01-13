/**
 * Grid Component - Equal-width horizontal layout
 *
 * Enforces equal-width columns for all children. Each child is forced into an equal
 * portion of the available width, regardless of content.
 *
 * **Use Cases:**
 * - Dashboard metrics (equal-width stat boxes)
 * - Table columns (uniform column layout)
 * - Card grids (evenly spaced cards)
 * - Navigation bars (equal menu items)
 *
 * **Behavior:**
 * - Width distribution: Equal widths (forced)
 * - Wrapping: No (falls back to vertical stacking when too narrow)
 * - Fill behavior: Always fills available width
 *
 * **Width Calculation Example:**
 * ```
 * Terminal width: 80 characters
 * Children: 3
 * Spacing: 2 chars
 *
 * Calculation:
 *   Available: 80 - (2 × 2) = 76
 *   Per column: 76 ÷ 3 = 25.33 → 25
 *
 * Result: [Col 1: 25]  [Col 2: 25]  [Col 3: 25]
 * ```
 *
 * **Performance:** O(n) where n = number of children
 * - Width calculation: O(1)
 * - Rendering: O(n)
 * - Height alignment: O(n)
 *
 * @example
 * ```typescript
 * // Dashboard with equal-width metrics
 * const metrics = new Grid({ spacing: 3 });
 * metrics.addChild(createMetric("Users", "1,234"));
 * metrics.addChild(createMetric("Active", "856"));
 * metrics.addChild(createMetric("Errors", "12"));
 *
 * // Output:
 * // ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
 * // │ Users        │   │ Active       │   │ Errors       │
 * // │ 1,234        │   │ 856          │   │ 12           │
 * // └──────────────┘   └──────────────┘   └──────────────┘
 * ```
 *
 * @example
 * ```typescript
 * // Weighted layout (sidebar + main = 1:3 ratio)
 * const layout = new Grid({ spacing: 2 });
 * layout.addChild(sidebar);      // Gets 1/4 of width
 * layout.addChild(main);         // Gets 1/4 of width
 * layout.addChild(main);         // Gets 1/4 of width
 * layout.addChild(main);         // Gets 1/4 of width
 * // Result: sidebar is 25%, main is 75% total
 * ```
 */

import type { Component } from '@mariozechner/pi-tui';
import { visibleWidth } from '@mariozechner/pi-tui';

export interface GridOptions {
	/** Spacing between columns (default: 2) */
	spacing?: number;
	/** Minimum width per column before falling back to vertical stacking (default: 10) */
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

	/**
	 * Render the grid with equal-width columns
	 *
	 * Algorithm:
	 * 1. Calculate total spacing needed between columns
	 * 2. Divide remaining width equally among all children
	 * 3. If resulting column width < minColumnWidth, fall back to vertical stacking
	 * 4. Render each child to its calculated width
	 * 5. Align all columns to the same height (pad shorter columns)
	 * 6. Combine columns horizontally with spacing
	 */
	render(width: number): string[] {
		if (this.children.length === 0) {
			return [];
		}

		// Calculate column width
		// Available width = total width - spacing between columns
		const totalSpacing = this.spacing * (this.children.length - 1);
		const availableWidth = width - totalSpacing;
		const columnWidth = Math.floor(availableWidth / this.children.length);

		// If columns would be too narrow, fall back to vertical stacking
		// This prevents unreadable layouts on narrow terminals
		if (columnWidth < this.minColumnWidth) {
			return this.renderVertical(width);
		}

		// Render each child to its column width
		const columns = this.children.map((child) => child.render(columnWidth));

		// Find max height - all columns will be padded to this height
		const maxHeight = Math.max(...columns.map((col) => col.length));

		// Combine columns horizontally
		const lines: string[] = [];
		const spacer = ' '.repeat(this.spacing);

		for (let row = 0; row < maxHeight; row++) {
			const rowParts: string[] = [];

			for (let col = 0; col < columns.length; col++) {
				const column = columns[col]!;
				const line = row < column.length ? column[row]! : '';

				// Pad line to column width to maintain alignment
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
	 *
	 * When terminal width is insufficient for minColumnWidth, Grid automatically
	 * switches to vertical stacking mode to maintain readability. This provides
	 * responsive behavior without wrapping.
	 *
	 * Example:
	 * ```
	 * Wide terminal (80 chars):  [Col1] [Col2] [Col3]
	 * Narrow terminal (30 chars):
	 *   [Col1]
	 *   [Col2]
	 *   [Col3]
	 * ```
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
