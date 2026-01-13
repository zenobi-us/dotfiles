/**
 * Sized Component - Declares preferred width for Flex layout
 *
 * Wraps a component and declares its preferred width. This is how components
 * communicate their sizing needs to the Flex layout system.
 *
 * **How it works:**
 * - In Flex fill mode: preferredWidth acts as minimum width
 * - In Flex wrap mode: preferredWidth determines when to wrap
 * - Component is still rendered at the width provided by parent
 *
 * **Usage Pattern:**
 * Always use the `sized()` helper function for brevity:
 * ```typescript
 * // Preferred: Helper function
 * flex.addChild(sized(new Text("Hello"), 10));
 *
 * // Also works: Direct class
 * flex.addChild(new Sized(new Text("Hello"), 10));
 * ```
 *
 * **Best Practices:**
 * 1. Always declare preferredWidth for Flex children
 * 2. Include padding/borders in width calculation
 * 3. Use consistent sizing for similar components
 * 4. Consider content + decorations when sizing
 *
 * @example
 * ```typescript
 * // Tags with bracket decorations
 * const tags = new Flex({ mode: "wrap" });
 * for (const tag of ["React", "TypeScript"]) {
 *   tags.addChild(sized(
 *     new Text(`[${tag}]`),
 *     tag.length + 2  // +2 for brackets
 *   ));
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Buttons with minimum widths
 * const buttons = new Flex({ mode: "fill" });
 * buttons.addChild(sized(new Text("OK"), 8));      // Min 8 chars
 * buttons.addChild(sized(new Text("Cancel"), 10)); // Min 10 chars
 * buttons.addChild(sized(new Text("Help"), 8));    // Min 8 chars
 * // Extra space distributed evenly
 * ```
 */

import type { Component } from '@mariozechner/pi-tui';
import type { SizedComponent } from './Flex.js';

export class Sized implements SizedComponent {
	/**
	 * Preferred width for this component.
	 *
	 * - In Flex fill mode: Acts as minimum width before extra space distribution (unless fixedWidth is true)
	 * - In Flex wrap mode: Used to determine when to wrap to next line
	 * - Does not override the width provided to render() method
	 */
	public readonly preferredWidth: number;
	
	/**
	 * If true, component gets exactly preferredWidth in fill mode.
	 * If false/undefined, component can receive extra space distribution.
	 */
	public readonly fixedWidth?: boolean;

	constructor(
		private component: Component,
		preferredWidth: number,
		fixedWidth?: boolean
	) {
		this.preferredWidth = preferredWidth;
		this.fixedWidth = fixedWidth;
	}

	render(width: number): string[] {
		return this.component.render(width);
	}

	handleInput?(data: string): void {
		if (this.component.handleInput) {
			this.component.handleInput(data);
		}
	}

	invalidate(): void {
		this.component.invalidate();
	}

	/**
	 * Get the wrapped component
	 */
	getComponent(): Component {
		return this.component;
	}
}

/**
 * Helper function to create a sized component
 *
 * Convenient shorthand for wrapping components with preferred width.
 * This is the recommended way to declare component widths in Flex layouts.
 *
 * @param component - The component to wrap
 * @param width - Preferred width in characters
 * @returns A SizedComponent that declares its preferred width
 *
 * @example
 * ```typescript
 * // Tag with explicit width
 * const tag = sized(new Text("[React]"), 7);
 *
 * // Button with minimum width
 * const button = sized(new Text("Submit"), 12);
 *
 * // Card with preferred width
 * const card = sized(createCard(), 30);
 * ```
 *
 * **Width Calculation Tips:**
 * ```typescript
 * // Text only
 * sized(new Text("Hello"), 5);
 *
 * // Text with decorations
 * sized(new Text("[Tag]"), text.length + 2);  // +2 for brackets
 *
 * // Box with padding
 * const box = new Box({ padding: 1 });
 * sized(box, contentWidth + 2);  // +2 for padding
 *
 * // With border
 * const box = new Box({ border: true });
 * sized(box, contentWidth + 2);  // +2 for border
 * ```
 */
export function sized(component: Component, width: number): SizedComponent {
	return new Sized(component, width);
}

/**
 * Helper function to create a fixed-width component
 *
 * Creates a component that gets exactly the specified width in Flex fill mode.
 * Unlike sized(), fixed components do not receive extra space distribution.
 *
 * **Use Cases:**
 * - Icons with consistent spacing (e.g., alert icons)
 * - Labels with fixed alignment (e.g., form field labels)
 * - Status indicators with predictable width
 * - Any UI element that should not grow
 *
 * @param component - The component to wrap
 * @param width - Fixed width in characters (exact, not minimum)
 * @returns A SizedComponent with fixedWidth flag set
 *
 * @example
 * ```typescript
 * // Alert with fixed-width icon
 * const flex = new Flex({ mode: "fill" });
 * flex.addChild(fixed(new Text("⚠"), 10));  // Icon stays at 10 chars
 * flex.addChild(new Text("Warning message")); // Message fills remaining space
 * ```
 *
 * @example
 * ```typescript
 * // Form field with fixed label
 * const flex = new Flex({ mode: "fill" });
 * flex.addChild(fixed(new Text("Username:"), 12));  // Label at 12 chars
 * flex.addChild(inputField);                         // Input fills remaining
 * ```
 *
 * @example
 * ```typescript
 * // Status dashboard with fixed indicators
 * const flex = new Flex({ mode: "fill" });
 * flex.addChild(fixed(new Text("✓"), 5));  // Status icon
 * flex.addChild(new Text("Service name")); // Name fills space
 * flex.addChild(fixed(new Text("OK"), 8)); // Status text
 * ```
 */
export function fixed(component: Component, width: number): SizedComponent {
	return new Sized(component, width, true);
}
