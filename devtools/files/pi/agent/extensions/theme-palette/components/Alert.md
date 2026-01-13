# Alert Component

A flexible alert component that displays messages with icons in a horizontal layout.

## Features

- **4 Alert Types**: success, warning, error, info
- **Automatic Icon Selection**: Default icons based on alert type
- **Custom Icons**: Override with your own icons
- **Flexible Layout**: Icon with fixed width (10 chars default), message fills remaining space
- **Theme Integration**: Uses theme colors automatically
- **Dynamic Updates**: Change content and type on the fly
- **Customizable**: Configure padding, background colors, and icon width

## Layout

```
┌─────────────────────────────────────┐
│ [icon]     message text here        │
│  (w=10)    (flexible width)         │
└─────────────────────────────────────┘
```

## Quick Start

### Basic Usage

```typescript
import { Alert } from "./components/Alert.js";

// Simple success alert
const alert = new Alert(theme, {
  message: "Operation completed successfully",
  type: "success"
});

const lines = alert.render(80);
console.log(lines.join("\n"));
```

### Using Helper Function

```typescript
import { createAlert } from "./components/Alert.js";

const alert = createAlert(theme, "Connection failed", "error");
```

### Legacy Constructor

```typescript
const alert = new Alert(theme, "⚠", "Warning message", "warning");
```

## Alert Types

| Type      | Default Icon | Color   | Use Case                    |
|-----------|--------------|---------|----------------------------|
| `success` | ✓           | green   | Confirmations, completions |
| `warning` | ⚠           | yellow  | Cautions, important notes  |
| `error`   | ✗           | red     | Failures, critical issues  |
| `info`    | ℹ           | accent  | Notifications, tips        |

## Options

```typescript
interface AlertOptions {
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
```

## Examples

### Custom Icon

```typescript
const alert = new Alert(theme, {
  message: "New features available!",
  type: "info",
  icon: "🎉"
});
```

### Custom Styling

```typescript
const alert = new Alert(theme, {
  message: "Processing...",
  type: "info",
  bgColor: "toolPendingBg",
  iconWidth: 8,
  padding: 2
});
```

### Dynamic Updates

```typescript
const alert = createAlert(theme, "Starting...", "info");

// Later...
alert.update("✓", "Completed successfully");
alert.setType("success");
```

### In a Grid Layout

```typescript
import { Grid } from "./Grid.js";
import { createAlert } from "./Alert.js";

const grid = new Grid({ spacing: 2, minColumnWidth: 30 });

grid.addChild(createAlert(theme, "All systems operational", "success"));
grid.addChild(createAlert(theme, "High CPU usage", "warning"));
grid.addChild(createAlert(theme, "Service unavailable", "error"));
grid.addChild(createAlert(theme, "Maintenance scheduled", "info"));

const lines = grid.render(120);
```

## API Reference

### Constructor Signatures

```typescript
// Options-based (recommended)
constructor(theme: Theme, options: AlertOptions)

// Legacy (simple cases)
constructor(theme: Theme, icon: string, message: string, type?: AlertType)
```

### Methods

#### `render(width: number): string[]`
Renders the alert to an array of strings.

#### `invalidate(): void`
Invalidates the component, forcing a re-render.

#### `update(icon: string, message: string): void`
Updates the alert icon and message.

#### `setType(type: AlertType): void`
Changes the alert type, affecting colors and default icon.

#### `getType(): AlertType`
Returns the current alert type.

#### `getMessage(): string`
Returns the current message.

#### `getIcon(): string`
Returns the current icon.

## Integration

### With UISimulator

The Alert component is used in the UISimulator to showcase alert styles:

```typescript
const alertContainer = new Container();

alertContainer.addChild(createAlert(theme, "Operation completed", "success"));
alertContainer.addChild(createAlert(theme, "Cannot be undone", "warning"));
alertContainer.addChild(createAlert(theme, "Connection failed", "error"));
alertContainer.addChild(createAlert(theme, "Updates available", "info"));
```

### With Flex Layout

```typescript
import { Flex } from "./Flex.js";

const flex = new Flex({ mode: "wrap", spacing: 2 });

flex.addChild(createAlert(theme, "Connected", "success"));
flex.addChild(createAlert(theme, "Low disk space", "warning"));
```

## Design Notes

- **Icon Width**: Default 10 characters provides good alignment
- **Message**: Automatically wraps based on available width
- **Colors**: Chosen for accessibility and visual hierarchy
- **Padding**: Default 1 character provides breathing room
- **Flex Integration**: Works seamlessly with Flex fill mode

## See Also

- [Flex Component](./Flex.ts) - Layout system used internally
- [Grid Component](./Grid.ts) - Alternative layout for multiple alerts
- [Box Component](https://github.com/mariozechner/pi-tui) - Base container
- [Alert Demo](../examples/alert-demo.ts) - Complete usage examples
