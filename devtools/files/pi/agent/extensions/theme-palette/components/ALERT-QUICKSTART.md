# Alert Component - Quick Start

## Overview

The Alert component provides a clean, horizontal layout for displaying messages with icons:

```
┌─────────────────────────────────┐
│ ✓          Operation completed   │
│ (icon)     (message)             │
└─────────────────────────────────┘
```

## Instant Usage

```typescript
import { Alert, createAlert } from "./components/Alert.js";

// Quick creation
const alert = createAlert(theme, "Success!", "success");
alert.render(60);
```

## Four Alert Types

```typescript
// ✓ Success (green)
createAlert(theme, "Operation completed", "success");

// ⚠ Warning (yellow)
createAlert(theme, "Cannot be undone", "warning");

// ✗ Error (red)
createAlert(theme, "Connection failed", "error");

// ℹ Info (accent)
createAlert(theme, "Updates available", "info");
```

## Options

```typescript
new Alert(theme, {
  message: "Your message here",
  type: "success",           // success | warning | error | info
  icon: "🎉",               // Optional: override default icon
  bgColor: "userMessageBg",  // Optional: custom background
  iconWidth: 10,             // Optional: icon column width
  padding: 1                 // Optional: internal padding
});
```

## Dynamic Updates

```typescript
const alert = createAlert(theme, "Loading...", "info");

// Later...
alert.update("✓", "Complete!");
alert.setType("success");
```

## In Layouts

### Grid Layout (horizontal)
```typescript
import { Grid } from "./Grid.js";

const grid = new Grid({ spacing: 2, minColumnWidth: 30 });
grid.addChild(createAlert(theme, "Connected", "success"));
grid.addChild(createAlert(theme, "Low memory", "warning"));
grid.addChild(createAlert(theme, "Error", "error"));
```

### Flex Layout (wrapping)
```typescript
import { Flex } from "./Flex.js";

const flex = new Flex({ mode: "wrap", spacing: 2 });
flex.addChild(createAlert(theme, "Message 1", "info"));
flex.addChild(createAlert(theme, "Message 2", "success"));
```

## Complete Examples

See [alert-demo.ts](../examples/alert-demo.ts) for comprehensive examples.

See [Alert.md](./Alert.md) for full API documentation.
