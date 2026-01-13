/**
 * Alert Component Demo
 * 
 * Demonstrates usage of the Alert component with different types and options.
 */

import { Theme } from "@mariozechner/pi-coding-agent";
import { Alert, createAlert } from "../components/Alert.js";

// Example theme (you would load your actual theme)
const theme = {} as Theme; // Load from your theme system

// Example 1: Basic alert with constructor options
const successAlert = new Alert(theme, {
	message: "Your changes have been saved successfully",
	type: "success",
});

// Example 2: Using the legacy constructor signature
const warningAlert = new Alert(theme, "⚠", "This action cannot be undone", "warning");

// Example 3: Using the helper function
const errorAlert = createAlert(theme, "Failed to connect to server", "error");

// Example 4: Info alert with custom icon
const infoAlert = new Alert(theme, {
	message: "New features are now available",
	type: "info",
	icon: "🎉",
});

// Example 5: Custom colors and dimensions
const customAlert = new Alert(theme, {
	message: "Processing your request...",
	type: "info",
	bgColor: "toolPendingBg",
	iconWidth: 8,
	padding: 2,
});

// Render alerts
console.log("Success Alert:");
console.log(successAlert.render(60).join("\n"));

console.log("\nWarning Alert:");
console.log(warningAlert.render(60).join("\n"));

console.log("\nError Alert:");
console.log(errorAlert.render(60).join("\n"));

console.log("\nInfo Alert:");
console.log(infoAlert.render(60).join("\n"));

console.log("\nCustom Alert:");
console.log(customAlert.render(60).join("\n"));

// Example 6: Updating alert content dynamically
console.log("\n--- Updating Alert ---");
successAlert.update("✓", "All files synced successfully");
console.log(successAlert.render(60).join("\n"));

// Example 7: Changing alert type
console.log("\n--- Changing Alert Type ---");
const dynamicAlert = createAlert(theme, "Starting process...", "info");
console.log("Initially (info):");
console.log(dynamicAlert.render(60).join("\n"));

dynamicAlert.setType("success");
dynamicAlert.update("✓", "Process completed successfully");
console.log("\nAfter success:");
console.log(dynamicAlert.render(60).join("\n"));

// Example 8: Using in a grid layout
import { Grid } from "../components/Grid.js";

const grid = new Grid({ spacing: 2, minColumnWidth: 30 });
grid.addChild(createAlert(theme, "Connected", "success"));
grid.addChild(createAlert(theme, "Low memory", "warning"));
grid.addChild(createAlert(theme, "Disconnected", "error"));

console.log("\n--- Alerts in Grid ---");
console.log(grid.render(100).join("\n"));
