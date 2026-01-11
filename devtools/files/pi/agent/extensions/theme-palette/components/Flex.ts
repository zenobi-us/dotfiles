/**
 * Flex Component
 *
 * Flow layout that renders children based on their intrinsic width.
 * Children can wrap to the next line or fill available space.
 */

import type { Component } from '@mariozechner/pi-tui';
import { visibleWidth } from '@mariozechner/pi-tui';

export type FlexMode = 'fill' | 'wrap';

export interface FlexOptions {
	/** Layout mode: "fill" (default) or "wrap" */
	mode?: FlexMode;
	/** Spacing between children (default: 2) */
	spacing?: number;
}

/**
 * Interface for components that can declare their preferred width
 */
export interface SizedComponent extends Component {
	/** Preferred width for this component */
	preferredWidth?: number;
}

export class Flex implements Component {
	private children: Component[] = [];
	private mode: FlexMode;
	private spacing: number;

	constructor(options: FlexOptions = {}) {
		this.mode = options.mode ?? 'fill';
		this.spacing = options.spacing ?? 2;
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

		if (this.mode === 'fill') {
			return this.renderFill(width);
		} else {
			return this.renderWrap(width);
		}
	}

	/**
	 * Fill mode: Children evenly fill the row
	 * Like Grid but respects preferredWidth as minimum
	 */
	private renderFill(width: number): string[] {
		// Calculate intrinsic widths
		const intrinsicWidths = this.children.map((child) => {
			if ('preferredWidth' in child) {
				return (child as SizedComponent).preferredWidth ?? 0;
			}
			return 0;
		});

		const totalIntrinsic = intrinsicWidths.reduce((sum, w) => sum + w, 0);
		const totalSpacing = this.spacing * (this.children.length - 1);
		const availableWidth = width - totalSpacing;

		// If all children fit with intrinsic widths, distribute extra space
		let columnWidths: number[];
		if (totalIntrinsic <= availableWidth) {
			const extraSpace = availableWidth - totalIntrinsic;
			const extraPerChild = Math.floor(extraSpace / this.children.length);
			columnWidths = intrinsicWidths.map((w) => w + extraPerChild);
		} else {
			// Not enough space, use equal distribution
			const equalWidth = Math.floor(availableWidth / this.children.length);
			columnWidths = this.children.map(() => equalWidth);
		}

		// Render children at calculated widths
		const columns = this.children.map((child, i) => child.render(columnWidths[i]!));

		return this.combineColumns(columns, columnWidths);
	}

	/**
	 * Wrap mode: Children render at preferredWidth and wrap to next line
	 */
	private renderWrap(width: number): string[] {
		const lines: string[] = [];
		let currentRow: Array<{ component: Component; width: number; lines: string[] }> = [];
		let currentRowWidth = 0;

		for (const child of this.children) {
			// Get preferred width
			const preferredWidth =
				'preferredWidth' in child ? ((child as SizedComponent).preferredWidth ?? 0) : 0;

			// If no preferred width, measure by rendering
			const measuredWidth = preferredWidth > 0 ? preferredWidth : this.measureWidth(child, width);

			// Check if it fits in current row
			const spaceNeeded =
				currentRowWidth > 0 ? currentRowWidth + this.spacing + measuredWidth : measuredWidth;

			if (spaceNeeded <= width) {
				// Fits in current row
				const childLines = child.render(measuredWidth);
				currentRow.push({ component: child, width: measuredWidth, lines: childLines });
				currentRowWidth = spaceNeeded;
			} else {
				// Doesn't fit, flush current row and start new one
				if (currentRow.length > 0) {
					lines.push(...this.combineRow(currentRow));
					currentRow = [];
					currentRowWidth = 0;
				}

				// Add to new row
				const childLines = child.render(Math.min(measuredWidth, width));
				currentRow.push({ component: child, width: measuredWidth, lines: childLines });
				currentRowWidth = measuredWidth;
			}
		}

		// Flush last row
		if (currentRow.length > 0) {
			lines.push(...this.combineRow(currentRow));
		}

		return lines;
	}

	/**
	 * Measure a component's natural width by rendering it wide
	 */
	private measureWidth(component: Component, maxWidth: number): number {
		const lines = component.render(maxWidth);
		if (lines.length === 0) return 0;

		// Find max visible width
		return Math.max(...lines.map((line) => visibleWidth(line)));
	}

	/**
	 * Combine columns horizontally
	 */
	private combineColumns(columns: string[][], columnWidths: number[]): string[] {
		const maxHeight = Math.max(...columns.map((col) => col.length));
		const lines: string[] = [];
		const spacer = ' '.repeat(this.spacing);

		for (let row = 0; row < maxHeight; row++) {
			const rowParts: string[] = [];

			for (let col = 0; col < columns.length; col++) {
				const column = columns[col]!;
				const columnWidth = columnWidths[col]!;
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
	 * Combine a single row of components
	 */
	private combineRow(
		row: Array<{ component: Component; width: number; lines: string[] }>
	): string[] {
		if (row.length === 0) return [];

		const maxHeight = Math.max(...row.map((item) => item.lines.length));
		const lines: string[] = [];
		const spacer = ' '.repeat(this.spacing);

		for (let lineIdx = 0; lineIdx < maxHeight; lineIdx++) {
			const parts: string[] = [];

			for (const item of row) {
				const line = lineIdx < item.lines.length ? item.lines[lineIdx]! : '';
				const lineWidth = visibleWidth(line);
				const padding = ' '.repeat(Math.max(0, item.width - lineWidth));
				parts.push(line + padding);
			}

			lines.push(parts.join(spacer));
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

	/**
	 * Get current mode
	 */
	getMode(): FlexMode {
		return this.mode;
	}

	/**
	 * Set layout mode
	 */
	setMode(mode: FlexMode): void {
		this.mode = mode;
	}
}
