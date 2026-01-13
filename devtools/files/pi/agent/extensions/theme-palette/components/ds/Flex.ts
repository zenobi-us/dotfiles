/**
 * Flex Component - Flow layout with intrinsic sizing
 *
 * Renders children based on their intrinsic width with two distinct modes:
 * - **Fill Mode**: Children evenly fill the row, respecting minimum widths
 * - **Wrap Mode**: Children render at preferred width and wrap to next line
 *
 * **Use Cases:**
 * - Tags (variable-width tags that wrap)
 * - Buttons (action buttons with different labels)
 * - Badges (status badges of varying sizes)
 * - Breadcrumbs (navigation items that flow)
 * - Chip lists (collections of chips)
 *
 * **Behavior Comparison with Grid:**
 * | Feature | Grid | Flex |
 * |---------|------|------|
 * | Width distribution | Equal widths (forced) | Intrinsic widths (flow) |
 * | Width control | Enforced | Preferred (via sized()) |
 * | Wrapping | No (vertical fallback) | Yes (wrap mode) |
 * | Fill behavior | Always fills | Optional (fill mode) |
 *
 * **Fill Mode Example:**
 * ```
 * Terminal width: 80 characters
 * Children with minimums: 10, 20, 15
 * Spacing: 2 chars × 2 = 4
 * Available: 80 - 4 = 76
 * Extra space: 76 - 45 = 31
 * Per child: 31 ÷ 3 = 10.33 → 10
 *
 * Result:
 *   [Col 1: 20]  [Col 2: 30]  [Col 3: 25]
 *    (10+10)     (20+10)      (15+10)
 * ```
 *
 * **Wrap Mode Example:**
 * ```
 * Terminal width: 40 characters
 * Children: "Short"(7), "Medium text"(13), "Long"(6), "Extra long text here"(22)
 *
 * Layout:
 *   Row 1: Short(7) + spacing(2) + Medium text(13) + spacing(2) + Long(6) = 30 ✓
 *   Row 2: Extra long text here(22) = 22 ✓
 *
 * Result:
 *   Short  Medium text  Long
 *   Extra long text here
 * ```
 *
 * **Performance:** O(n) where n = number of children
 * - Width calculation: O(n)
 * - Rendering: O(n)
 * - Height alignment: O(n)
 *
 * @example
 * ```typescript
 * // Fill mode with minimum widths
 * const flex = new Flex({ mode: "fill" });
 * flex.addChild(sized(box1, 10));  // Minimum 10 chars
 * flex.addChild(sized(box2, 20));  // Minimum 20 chars
 * flex.addChild(sized(box3, 15));  // Minimum 15 chars
 * // Each gets at least minimum, extra space distributed evenly
 * ```
 *
 * @example
 * ```typescript
 * // Fill mode with fixed-width icon and flexible message
 * const flex = new Flex({ mode: "fill" });
 * flex.addChild(fixed(iconText, 10));  // Exactly 10 chars, no growth
 * flex.addChild(messageText);          // Fills remaining space
 * // Icon stays at 10 chars, message gets all extra space
 * ```
 *
 * @example
 * ```typescript
 * // Center-aligned buttons
 * const flex = new Flex({ mode: "wrap", spacing: 2, align: "center" });
 * flex.addChild(sized(new Text("OK"), 10));
 * flex.addChild(sized(new Text("Cancel"), 10));
 * // Buttons are centered within the available width
 * ```
 *
 * @example
 * ```typescript
 * // Right-aligned status indicators
 * const flex = new Flex({ mode: "wrap", spacing: 1, align: "right" });
 * flex.addChild(new Text("✓ Ready"));
 * flex.addChild(new Text("● Online"));
 * // Status indicators aligned to the right
 * ```
 *
 * @example
 * ```typescript
 * // Wrap mode for tags
 * const tags = new Flex({ mode: "wrap", spacing: 1 });
 * const tagList = ["React", "TypeScript", "Node.js", "Python", "Docker"];
 * for (const tag of tagList) {
 *   tags.addChild(sized(new Text(`[${tag}]`), tag.length + 2));
 * }
 * // Output (wraps based on terminal width):
 * // [React] [TypeScript] [Node.js] [Python]
 * // [Docker]
 * ```
 *
 * @example
 * ```typescript
 * // Responsive cards that wrap on narrow terminals
 * const flex = new Flex({ mode: "wrap", spacing: 2 });
 * const cards = [card1, card2, card3, card4];
 * for (const card of cards) {
 *   flex.addChild(sized(card, 30)); // Preferred 30 chars
 * }
 * // Wide: [card1] [card2] [card3] [card4]
 * // Narrow:
 * //   [card1] [card2]
 * //   [card3] [card4]
 * ```
 */

import type { Component } from '@mariozechner/pi-tui';
import { visibleWidth } from '@mariozechner/pi-tui';

export type FlexMode = 'fill' | 'wrap';
export type FlexAlign = 'left' | 'center' | 'right';

export interface FlexOptions {
	/** 
	 * Layout mode: "fill" (default) or "wrap"
	 * - fill: Children distribute space evenly across the row
	 * - wrap: Children flow naturally and wrap to next line when needed
	 */
	mode?: FlexMode;
	
	/** 
	 * Spacing between children in characters (default: 2) 
	 * The gap between adjacent children in the layout
	 */
	spacing?: number;
	
	/** 
	 * Horizontal alignment of children within available width (default: "left")
	 * - left: Content aligned to the left edge
	 * - center: Content centered within available width
	 * - right: Content aligned to the right edge
	 * 
	 * Note: In wrap mode, each row is independently aligned.
	 * In fill mode, the entire row is aligned as a unit.
	 */
	align?: FlexAlign;
}

/**
 * Interface for components that can declare their preferred width.
 *
 * Used by the sized() helper to communicate preferred width to Flex layout.
 * In fill mode, preferredWidth acts as a minimum width (unless fixedWidth is true).
 * In wrap mode, preferredWidth determines when to wrap to the next line.
 */
export interface SizedComponent extends Component {
	/** Preferred width for this component */
	preferredWidth?: number;
	/** If true, component gets exactly preferredWidth and no extra space in fill mode */
	fixedWidth?: boolean;
}

export class Flex implements Component {
	private children: Component[] = [];
	private mode: FlexMode;
	private spacing: number;
	private align: FlexAlign;

	constructor(options: FlexOptions = {}) {
		this.mode = options.mode ?? 'fill';
		this.spacing = options.spacing ?? 2;
		this.align = options.align ?? 'left';
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
	 *
	 * Like Grid but respects preferredWidth as minimum. Extra space is distributed
	 * evenly among flexible children. Fixed-width children get exactly their preferredWidth.
	 *
	 * Algorithm:
	 * 1. Extract preferredWidth and fixedWidth flags from sized components
	 * 2. Calculate total space needed by fixed children
	 * 3. Distribute remaining space among flexible children
	 * 4. If space doesn't fit, fall back to equal distribution
	 * 5. Render each child at calculated width
	 * 6. Combine columns horizontally with spacing
	 *
	 * Best Practice: Use fixed() for icons/labels, sized() for flexible columns:
	 * ```typescript
	 * // Icon with fixed width, message fills remaining space
	 * flex.addChild(fixed(icon, 10));
	 * flex.addChild(message);
	 * ```
	 */
	private renderFill(width: number): string[] {
		// Calculate intrinsic widths and identify fixed vs flexible children
		const childInfo = this.children.map((child) => {
			const isFixed = 'fixedWidth' in child && (child as SizedComponent).fixedWidth === true;
			const preferredWidth = 'preferredWidth' in child ? ((child as SizedComponent).preferredWidth ?? 0) : 0;
			return { isFixed, preferredWidth };
		});

		const totalSpacing = this.spacing * (this.children.length - 1);
		const availableWidth = width - totalSpacing;

		// Calculate space used by fixed children
		const fixedSpace = childInfo
			.filter(info => info.isFixed)
			.reduce((sum, info) => sum + info.preferredWidth, 0);
		
		// Count flexible children
		const flexibleCount = childInfo.filter(info => !info.isFixed).length;
		
		// Calculate remaining space for flexible children
		const remainingSpace = availableWidth - fixedSpace;

		// Calculate column widths
		let columnWidths: number[];
		
		if (flexibleCount > 0 && remainingSpace > 0) {
			// Distribute remaining space among flexible children
			const flexibleMinimums = childInfo
				.filter(info => !info.isFixed)
				.reduce((sum, info) => sum + info.preferredWidth, 0);
			
			if (flexibleMinimums <= remainingSpace) {
				// All flexible minimums fit, distribute extra space
				const extraSpace = remainingSpace - flexibleMinimums;
				const extraPerFlexible = Math.floor(extraSpace / flexibleCount);
				
				columnWidths = childInfo.map(info => {
					if (info.isFixed) {
						return info.preferredWidth;
					} else {
						return info.preferredWidth + extraPerFlexible;
					}
				});
			} else {
				// Not enough space for flexible minimums, distribute evenly
				const widthPerFlexible = Math.floor(remainingSpace / flexibleCount);
				
				columnWidths = childInfo.map(info => {
					if (info.isFixed) {
						return info.preferredWidth;
					} else {
						return widthPerFlexible;
					}
				});
			}
		} else {
			// No flexible children or no remaining space
			// Use equal distribution as fallback
			const equalWidth = Math.floor(availableWidth / this.children.length);
			columnWidths = this.children.map(() => equalWidth);
		}

		// Render children at calculated widths
		const columns = this.children.map((child, i) => child.render(columnWidths[i]!));

		return this.combineColumns(columns, columnWidths, width);
	}

	/**
	 * Wrap mode: Children render at preferredWidth and wrap to next line
	 *
	 * Children flow naturally at their preferred width. When a child doesn't fit
	 * in the current row, it wraps to the next line.
	 *
	 * Algorithm:
	 * 1. For each child, get preferredWidth (or measure if not specified)
	 * 2. Check if child fits in current row (width + spacing)
	 * 3. If fits: Add to current row
	 * 4. If doesn't fit: Flush current row, start new row with this child
	 * 5. After all children, flush the last row
	 *
	 * Natural Flow Example:
	 * ```
	 * Terminal: 40 chars wide
	 * Children: [Short(7)] [Medium(13)] [Long(16)] [Extra(10)]
	 *
	 * Row 1: Short(7) + 2 + Medium(13) + 2 + Long(16) = 40 ✓ (exact fit)
	 * Row 2: Extra(10) = 10 ✓
	 *
	 * Result:
	 *   Short  Medium  Long
	 *   Extra
	 * ```
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
					lines.push(...this.combineRow(currentRow, width));
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
			lines.push(...this.combineRow(currentRow, width));
		}

		return lines;
	}

	/**
	 * Measure a component's natural width by rendering it wide
	 *
	 * Used when a component doesn't have preferredWidth specified.
	 * Renders the component at maximum width and measures the longest line.
	 *
	 * Note: This is a fallback. For best performance and predictability,
	 * always use sized() to declare preferred widths explicitly.
	 */
	private measureWidth(component: Component, maxWidth: number): number {
		const lines = component.render(maxWidth);
		if (lines.length === 0) return 0;

		// Find max visible width
		return Math.max(...lines.map((line) => visibleWidth(line)));
	}

	/**
	 * Combine columns horizontally with consistent spacing
	 *
	 * Aligns all columns to the same height by padding shorter columns.
	 * Each column is padded to its calculated width to maintain alignment.
	 *
	 * Used by fill mode to create Grid-like horizontal alignment.
	 *
	 * @param columns - Array of rendered column content
	 * @param columnWidths - Width allocated to each column
	 * @param containerWidth - Total available width for alignment
	 */
	private combineColumns(columns: string[][], columnWidths: number[], containerWidth?: number): string[] {
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

			let rowLine = rowParts.join(spacer);
			
			// Apply alignment if container width is provided
			if (containerWidth !== undefined) {
				rowLine = this.applyAlignment(rowLine, containerWidth);
			}

			lines.push(rowLine);
		}

		return lines;
	}

	/**
	 * Combine a single row of components for wrap mode
	 *
	 * Similar to combineColumns but works with a single row of wrapped items.
	 * Each item maintains its measured/preferred width with spacing between items.
	 *
	 * Used by wrap mode to create natural flowing lines.
	 *
	 * @param row - Array of components with their widths and rendered lines
	 * @param containerWidth - Total available width for alignment
	 */
	private combineRow(
		row: Array<{ component: Component; width: number; lines: string[] }>,
		containerWidth?: number
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

			let rowLine = parts.join(spacer);
			
			// Apply alignment if container width is provided
			if (containerWidth !== undefined) {
				rowLine = this.applyAlignment(rowLine, containerWidth);
			}

			lines.push(rowLine);
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
	 * Apply horizontal alignment to a line
	 *
	 * @param line - The line content to align
	 * @param containerWidth - Total available width
	 * @returns Aligned line with appropriate padding
	 */
	private applyAlignment(line: string, containerWidth: number): string {
		const lineWidth = visibleWidth(line);
		const availableSpace = containerWidth - lineWidth;

		if (availableSpace <= 0) {
			return line;
		}

		switch (this.align) {
			case 'left':
				// Left alignment (default) - no padding needed
				return line;
			case 'center':
				// Center alignment - pad equally on both sides
				const leftPad = Math.floor(availableSpace / 2);
				return ' '.repeat(leftPad) + line;
			case 'right':
				// Right alignment - pad on the left
				return ' '.repeat(availableSpace) + line;
			default:
				return line;
		}
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

	/**
	 * Get current alignment
	 */
	getAlign(): FlexAlign {
		return this.align;
	}

	/**
	 * Set horizontal alignment
	 */
	setAlign(align: FlexAlign): void {
		this.align = align;
	}
}
