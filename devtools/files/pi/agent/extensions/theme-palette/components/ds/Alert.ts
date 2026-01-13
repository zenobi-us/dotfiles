/**
 * Alert Component - Flexible alert messages with icons
 *
 * Displays messages with icons in a horizontal layout. Supports 4 alert types with
 * automatic icon selection, theme-aware colors, and dynamic updates.
 *
 * **Layout Structure:**
 * ```
 * ┌─────────────────────────────────────┐
 * │ [icon]     message text here        │
 * │  (fixed    (fills remaining space)  │
 * │   w=10)                              │
 * └─────────────────────────────────────┘
 * ```
 *
 * **Features:**
 * - 4 Alert Types: success, warning, error, info
 * - Automatic Icon Selection: Default icons based on alert type
 * - Custom Icons: Override with your own icons
 * - Flexible Layout: Icon with fixed width (10 chars default), message fills remaining space
 * - Theme Integration: Uses theme colors automatically
 * - Dynamic Updates: Change content and type on the fly
 * - Customizable: Configure padding, background colors, and icon width
 *
 * **Alert Types:**
 * | Type      | Default Icon | Color   | Use Case                    |
 * |-----------|--------------|---------|----------------------------|
 * | success   | ✓           | green   | Confirmations, completions |
 * | warning   | ⚠           | yellow  | Cautions, important notes  |
 * | error     | ✗           | red     | Failures, critical issues  |
 * | info      | ℹ           | accent  | Notifications, tips        |
 *
 * **Design Notes:**
 * - Icon Width: Default 10 characters provides good alignment
 * - Message: Automatically wraps based on available width
 * - Colors: Chosen for accessibility and visual hierarchy
 * - Padding: Default 1 character provides breathing room
 * - Flex Integration: Works seamlessly with Flex fill mode
 *
 * @example
 * ```typescript
 * // Simple success alert
 * const alert = new Alert(theme, {
 *   message: "Operation completed successfully",
 *   type: "success"
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using helper function (recommended)
 * const alert = createAlert(theme, "Connection failed", "error");
 * ```
 *
 * @example
 * ```typescript
 * // Custom icon and styling
 * const alert = new Alert(theme, {
 *   message: "New features available!",
 *   type: "info",
 *   icon: "🎉",
 *   bgColor: "toolPendingBg",
 *   iconWidth: 8,
 *   padding: 2
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Dynamic updates
 * const alert = createAlert(theme, "Starting...", "info");
 * // Later...
 * alert.update("✓", "Completed successfully");
 * alert.setType("success");
 * ```
 *
 * @example
 * ```typescript
 * // In a Grid layout (status dashboard)
 * const grid = new Grid({ spacing: 2, minColumnWidth: 30 });
 * grid.addChild(createAlert(theme, "All systems operational", "success"));
 * grid.addChild(createAlert(theme, "High CPU usage", "warning"));
 * grid.addChild(createAlert(theme, "Service unavailable", "error"));
 * grid.addChild(createAlert(theme, "Maintenance scheduled", "info"));
 * ```
 */

import type { Component } from "@mariozechner/pi-tui";
import { Box, Text } from "@mariozechner/pi-tui";
import { Theme, type ThemeColor } from "@mariozechner/pi-coding-agent";
import { Flex } from "./Flex.js";
import { fixed } from "./Sized.js";

/**
 * Alert type affecting icon and color scheme
 */
export type AlertType = "success" | "warning" | "error" | "info";

/**
 * Configuration options for Alert component
 */
export interface AlertOptions {

	/** Background color key from theme (default: "userMessageBg") */
	bgColor?: string;

	/** 
	 * Padding around content in characters (default: 1)
	 * Creates breathing room around alert content
	 */
	padding?: number;
}

/**
 * Alert component with icon and message in horizontal layout
 *
 * **Internal Structure:**
 * - Box (container with padding and background)
 *   - Flex (fill mode, 2-char spacing)
 *     - Sized Icon Text (fixed width, default 10 chars)
 *     - Message Text (fills remaining space)
 *
 * **Constructor Signatures:**
 * ```typescript
 * // Options-based (recommended)
 * new Alert(theme: Theme, options: AlertOptions)
 *
 * // Legacy (simple cases)
 * new Alert(theme: Theme, icon: string, message: string, type?: AlertType)
 * ```
 */
export class Alert implements Component {
	private container: Box;
	private flex: Flex;
	private icon: string;

	/**
	 * Create an Alert component
	 *
	 * @param theme - Theme instance for colors
	 * @param type - Alert type (success, warning, error, info)
	 * @param message - Alert message text
	 * @param options - Configuration options (merged with defaults)
	 *
	 * @example
	 * ```typescript
	 * // Recommended: Options object
	 * const alert = new Alert(
	 *   theme,
	 *   "success",
	 *   "Data saved successfully",
	 *   {
	 *     bgColor: "userMessageBg",
	 *     iconWidth: 10,
	 *     padding: 1
	 *   }
	 * );
	 * ```
	 */
	constructor(
		private theme: Theme,


		/** 
		 * Alert type affecting colors and default icon (default: "info")
		 * - success: green theme
		 * - warning: yellow theme
		 * - error: red theme
		 * - info: accent theme
		 */
		public type: AlertType,

		/** Alert message (supports multi-line wrapping) */
		public message: string,

		/**
		 * Configuration options for alert appearance
		 * - bgColor: Background color key from theme
		 * - padding: Padding around content in characters
		 */
		public options: Required<AlertOptions> = {
			bgColor: "userMessageBg",
			padding: 1,
		}
	) {

		// Merge options with defaults
		// Ensures all required properties are present
		this.options = Alert.createOptions(options)
		this.icon = Alert.getDefaultIcon(type);


		// Flex layout in fill mode
		// Icon gets fixed width, message fills remaining space
		this.flex = new Flex({ mode: "fill", spacing: 2 });

		// Build the component hierarchy
		// Box provides padding and background color
		this.container = new Box(this.options.padding, this.options.padding, (s) =>
			this.theme.bg(this.options.bgColor as any, s)
		);


		this.container.addChild(this.flex);

		this.rebuild()
	}

	/**
	 * Create default alert options with proper merging
	 *
	 * Merges partial options with defaults, ensuring all required properties exist.
	 * Used internally by constructor and helper functions.
	 *
	 * @param someOptions - Partial options to merge with defaults
	 * @returns Complete options object with all required properties
	 */
	public static createOptions(someOptions?: Partial<AlertOptions>): Required<AlertOptions> {
		return {
			bgColor: someOptions?.bgColor || "userMessageBg",
			padding: someOptions?.padding || 1,
		};
	}

	/**
	 * Get default icon for alert type
	 *
	 * Automatic icon selection based on semantic meaning.
	 *
	 * @param type - Alert type
	 * @returns Unicode icon character
	 */
	private static getDefaultIcon(type: AlertType): string {
		switch (type) {
			case "success":
				return "✓";
			case "warning":
				return "⚠";
			case "error":
				return "✗";
			case "info":
			default:
				return "i"
		}
	}

	/**
	 * Get icon color based on alert type
	 *
	 * Maps alert types to theme color keys for icon foreground:
	 * - success → green theme
	 * - warning → yellow theme
	 * - error → red theme
	 * - info → accent theme
	 *
	 * Colors are chosen for accessibility and visual hierarchy.
	 *
	 * @param type - Alert type
	 * @returns Theme color key
	 */
	private static getIconColor(type: AlertType): ThemeColor {
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
	 *
	 * All alert types use standard text color for message content to maintain
	 * readability. The icon color provides the visual distinction.
	 *
	 * @param type - Alert type
	 * @returns Theme color key (always "text")
	 */
	private static getTextColor(type: AlertType): ThemeColor {
		// All use standard text color for readability
		return "text";
	}

	/**
	 * Update alert content dynamically
	 *
	 * Changes the icon and message without recreating the Alert instance.
	 * Useful for updating status messages in long-running operations.
	 *
	 * @param icon - New icon character
	 * @param message - New message text
	 *
	 * @example
	 * ```typescript
	 * const alert = createAlert(theme, "Connecting...", "info");
	 * // Later...
	 * alert.update("✓", "Connected successfully");
	 * ```
	 */
	update(icon: string, message: string): void {
		this.icon = icon;
		this.message = message;
		this.rebuild();
	}

	/**
	 * Change alert type dynamically
	 *
	 * Updates the alert type, which affects colors and (if no custom icon)
	 * the icon character. Useful for status transitions.
	 *
	 * @param type - New alert type
	 *
	 * @example
	 * ```typescript
	 * const alert = createAlert(theme, "Processing...", "info");
	 * // Operation completed
	 * alert.setType("success");
	 * alert.update("✓", "Processing complete");
	 * ```
	 */
	setType(type: AlertType): void {
		this.type = type;
		if (!this.icon) {
			this.icon = Alert.getDefaultIcon(type);
		}
		this.rebuild();
	}

	/**
	 * Rebuild the component with current options
	 *
	 * Internal method called after updates to reconstruct the component tree.
	 * Clears the Flex container, recreates Text components with current colors,
	 * and re-adds them with proper sizing.
	 */
	private rebuild(): void {
		// Clear flex
		this.flex.clear();

		// Create icon with center alignment
		const iconFlex = new Flex({ align: "center" });
		const iconText = new Text(this.theme.fg(Alert.getIconColor(this.type), this.icon), 0, 0);
		iconFlex.addChild(iconText);

		// Create message with left alignment
		const messageFlex = new Flex({ align: "left" });
		const messageText = new Text(this.theme.fg(Alert.getTextColor(this.type), this.message), 0, 0);
		messageFlex.addChild(messageText);

		this.flex.addChild(fixed(iconFlex, 5));
		this.flex.addChild(messageFlex);

		this.invalidate();
	}

	/**
	 * Render the alert to an array of strings
	 *
	 * @param width - Available width in characters
	 * @returns Array of strings representing each line
	 *
	 * The alert automatically wraps message text based on available width.
	 * Layout: [icon (fixed)] [spacing] [message (flexible)]
	 */
	render(width: number): string[] {
		return this.container.render(width);
	}

	/**
	 * Invalidate the component, forcing a re-render
	 *
	 * Called automatically by update methods. Can be called manually
	 * if theme or other external state changes.
	 */
	invalidate(): void {
		this.container.invalidate();
	}

	/**
	 * Get current alert type
	 *
	 * @returns Current alert type (success, warning, error, info)
	 */
	getType(): AlertType {
		return this.type;
	}

	/**
	 * Get current message text
	 *
	 * @returns Current message string
	 */
	getMessage(): string {
		return this.message;
	}

	/**
	 * Get current icon character
	 *
	 * @returns Current icon string (may be default or custom)
	 */
	getIcon(): string {
		return this.icon;
	}
}

/**
 * Helper function to create an alert (recommended)
 *
 * Convenient shorthand for creating alerts with sensible defaults.
 * Cleaner syntax than using the constructor directly.
 *
 * @param theme - Theme instance for colors
 * @param message - Alert message text
 * @param type - Alert type (default: "info")
 * @param options - Additional options to customize the alert
 * @returns New Alert instance
 *
 * @example
 * ```typescript
 * // Simple alerts
 * const success = createAlert(theme, "Operation completed", "success");
 * const warning = createAlert(theme, "Cannot be undone", "warning");
 * const error = createAlert(theme, "Connection failed", "error");
 * const info = createAlert(theme, "Updates available", "info");
 * ```
 *
 * @example
 * ```typescript
 * // With custom icon
 * const alert = createAlert(
 *   theme,
 *   "New features available!",
 *   "info",
 *   { icon: "🎉" }
 * );
 * ```
 *
 * @example
 * ```typescript
 * // With custom styling
 * const alert = createAlert(
 *   theme,
 *   "Processing...",
 *   "info",
 *   {
 *     bgColor: "toolPendingBg",
 *     iconWidth: 8,
 *     padding: 2
 *   }
 * );
 * ```
 *
 * @example
 * ```typescript
 * // In a Flex layout
 * const flex = new Flex({ mode: "wrap", spacing: 2 });
 * flex.addChild(createAlert(theme, "Connected", "success"));
 * flex.addChild(createAlert(theme, "Low disk space", "warning"));
 * ```
 */
export function createAlert(
	theme: Theme,
	message: string,
	type: AlertType = "info",
	options?: Partial<AlertOptions>
): Alert {
	return new Alert(theme,
		type,
		message,
		Alert.createOptions(options),
	);
}
