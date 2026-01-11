/**
 * Sized Component
 *
 * Wraps a component and declares a preferred width for Flex layout.
 */

import type { Component } from '@mariozechner/pi-tui';
import type { SizedComponent } from './Flex.js';

export class Sized implements SizedComponent {
	public readonly preferredWidth: number;

	constructor(
		private component: Component,
		preferredWidth: number
	) {
		this.preferredWidth = preferredWidth;
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
 */
export function sized(component: Component, width: number): SizedComponent {
	return new Sized(component, width);
}
