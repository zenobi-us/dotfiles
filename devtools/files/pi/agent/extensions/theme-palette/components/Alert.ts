/**
 * Alert Component
 * 
 * Displays an alert message with an icon using horizontal layout.
 * 
 * Layout: [icon (width=10) | message (width=*)]
 * 
 * Usage:
 *   const alert = new Alert(theme, "✓", "Operation completed", "success");
 *   const lines = alert.render(80);
 */

import type { Component } from "@mariozechner/pi-tui";
import { Box, Text } from "@mariozechner/pi-tui";
import { Theme } from "@mariozechner/pi-coding-agent";
import { Flex } from "./Flex.js";
import { sized } from "./Sized.js";

export type AlertType = "success" | "warning" | "error" | "info";

export interface AlertOptions {
	/** Icon to display (default: auto-selected based on type) */
	icon?: string;
	/** Alert message */
	message: string;
	/** Alert type affecting colors (default: "info") */
	type?: AlertType;
	/** Background color key (default: "userMessageBg") */
	bgColor?: string;
	/** Width of icon column (default: 10) */
	iconWidth?: number;
	/** Add padding (default: 1) */
	padding?: number;
}

/**
 * Alert component with icon and message in horizontal layout
 */
export class Alert implements Component {
	private container: Box;
	private flex: Flex;
	private iconText: Text;
	private messageText: Text;
	
	private theme: Theme;
	private options: Required<AlertOptions>;

	constructor(theme: Theme, options: AlertOptions);
	constructor(theme: Theme, icon: string, message: string, type?: AlertType);
	constructor(
		theme: Theme,
		optionsOrIcon: AlertOptions | string,
		message?: string,
		type?: AlertType
	) {
		this.theme = theme;

		// Handle both constructor signatures
		if (typeof optionsOrIcon === "string") {
			// Legacy signature: (theme, icon, message, type)
			this.options = {
				icon: optionsOrIcon,
				message: message!,
				type: type ?? "info",
				bgColor: "userMessageBg",
				iconWidth: 10,
				padding: 1,
			};
		} else {
			// Options signature
			const opts = optionsOrIcon;
			this.options = {
				icon: opts.icon ?? this.getDefaultIcon(opts.type ?? "info"),
				message: opts.message,
				type: opts.type ?? "info",
				bgColor: opts.bgColor ?? "userMessageBg",
				iconWidth: opts.iconWidth ?? 10,
				padding: opts.padding ?? 1,
			};
		}

		// Build the component
		this.container = new Box(this.options.padding, this.options.padding, (s) =>
			theme.bg(this.options.bgColor as any, s)
		);

		this.flex = new Flex({ mode: "fill", spacing: 2 });

		// Icon text (fixed width)
		const iconColor = this.getIconColor(this.options.type);
		this.iconText = new Text(theme.fg(iconColor as any, this.options.icon), 0, 0);

		// Message text (flexible width)
		const textColor = this.getTextColor(this.options.type);
		this.messageText = new Text(theme.fg(textColor as any, this.options.message), 0, 0);

		// Add to flex with sizing
		this.flex.addChild(sized(this.iconText, this.options.iconWidth));
		this.flex.addChild(this.messageText);

		this.container.addChild(this.flex);
	}

	/**
	 * Get default icon for alert type
	 */
	private getDefaultIcon(type: AlertType): string {
		switch (type) {
			case "success":
				return "✓";
			case "warning":
				return "⚠";
			case "error":
				return "✗";
			case "info":
			default:
				return "ℹ";
		}
	}

	/**
	 * Get icon color based on alert type
	 */
	private getIconColor(type: AlertType): string {
		switch (type) {
			case "success":
				return "success";
			case "warning":
				return "warning";
			case "error":
				return "error";
			case "info":
			default:
				return "accent";
		}
	}

	/**
	 * Get text color based on alert type
	 */
	private getTextColor(type: AlertType): string {
		// All use standard text color for readability
		return "text";
	}

	/**
	 * Update alert content
	 */
	update(icon: string, message: string): void {
		this.options.icon = icon;
		this.options.message = message;
		this.rebuild();
	}

	/**
	 * Update alert type (affects colors and default icon)
	 */
	setType(type: AlertType): void {
		this.options.type = type;
		if (!this.options.icon) {
			this.options.icon = this.getDefaultIcon(type);
		}
		this.rebuild();
	}

	/**
	 * Rebuild the component with current options
	 */
	private rebuild(): void {
		// Clear flex
		this.flex.clear();

		// Recreate icon text
		const iconColor = this.getIconColor(this.options.type);
		this.iconText = new Text(this.theme.fg(iconColor as any, this.options.icon), 0, 0);

		// Recreate message text
		const textColor = this.getTextColor(this.options.type);
		this.messageText = new Text(this.theme.fg(textColor as any, this.options.message), 0, 0);

		// Re-add to flex
		this.flex.addChild(sized(this.iconText, this.options.iconWidth));
		this.flex.addChild(this.messageText);

		this.invalidate();
	}

	render(width: number): string[] {
		return this.container.render(width);
	}

	invalidate(): void {
		this.container.invalidate();
	}

	/**
	 * Get current alert type
	 */
	getType(): AlertType {
		return this.options.type;
	}

	/**
	 * Get current message
	 */
	getMessage(): string {
		return this.options.message;
	}

	/**
	 * Get current icon
	 */
	getIcon(): string {
		return this.options.icon;
	}
}

/**
 * Helper function to create an alert
 */
export function createAlert(
	theme: Theme,
	message: string,
	type: AlertType = "info",
	options?: Partial<AlertOptions>
): Alert {
	return new Alert(theme, {
		message,
		type,
		...options,
	});
}
