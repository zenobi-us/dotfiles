# Example: Centered Alert

This example shows how to center an Alert component using Flex alignment.

## Code

```typescript
import { Theme } from "@mariozechner/pi-coding-agent";
import { Flex } from "./components/ds/Flex.js";
import { Alert } from "./components/ds/Alert.js";

// Create a flex container with center alignment
const container = new Flex({ 
  mode: "wrap", 
  align: "center" 
});

// Create an alert
const alert = new Alert(
  theme,
  "success",
  "Operation completed successfully"
);

// Add alert to centered container
container.addChild(alert);

// Render (assuming 80 char width)
const lines = container.render(80);
```

## Visual Result

### Before (left-aligned, default):
```
┌────────────────────────────────────────────────────────────────────────────┐
│ ✓        Operation completed successfully                                  │
└────────────────────────────────────────────────────────────────────────────┘
```

### After (center-aligned):
```
┌────────────────────────────────────────────────────────────────────────────┐
│               ✓        Operation completed successfully                    │
└────────────────────────────────────────────────────────────────────────────┘
```

## Alternative: Directly in UISimulator

To center alerts in the UISimulator, you can modify the Grid to use Flex with center alignment:

```typescript
// In UISimulator.ts
private createAlertSection(): Container {
  const th = this.theme;
  const container = new Container();

  // ... header code ...

  const content = new Box(2, 1, (s) => th.bg("customMessageBg", s));

  // Use Flex with center alignment instead of Grid
  const flexLayout = new Flex({ 
    mode: "wrap", 
    spacing: 2, 
    align: "center"  // <-- Add this
  });

  // Add alerts
  const successAlert = new Alert(th, "success", "Operation completed");
  flexLayout.addChild(successAlert);

  // ... more alerts ...

  content.addChild(flexLayout);
  container.addChild(content);

  return container;
}
```

## Options for Different Alignments

### Left-aligned (default)
```typescript
const flex = new Flex({ mode: "wrap", align: "left" });
```

### Center-aligned
```typescript
const flex = new Flex({ mode: "wrap", align: "center" });
```

### Right-aligned
```typescript
const flex = new Flex({ mode: "wrap", align: "right" });
```

## Tips

1. **Wrap Mode**: Best for centering alerts as it respects natural content width
2. **Fill Mode**: Less useful for alerts as it forces content to fill the width
3. **Container Width**: Make sure the parent container provides appropriate width
4. **Multiple Alerts**: Each alert on its own row will be independently centered

## Complete Example with Multiple Alerts

```typescript
const alertContainer = new Flex({ 
  mode: "wrap", 
  align: "center",
  spacing: 1  // Vertical spacing between alerts
});

// Add multiple alerts
alertContainer.addChild(
  new Alert(theme, "success", "File saved")
);
alertContainer.addChild(
  new Alert(theme, "warning", "Low disk space")
);
alertContainer.addChild(
  new Alert(theme, "error", "Connection failed")
);

// All alerts will be centered, each on its own row
```

**Result:**
```
              ✓        File saved              
              ⚠        Low disk space          
              ✗        Connection failed       
```

## Dynamic Alignment

You can change alignment dynamically:

```typescript
const flex = new Flex({ mode: "wrap", align: "left" });

// ... add children ...

// Later, change to center
flex.setAlign("center");
flex.invalidate();  // Trigger re-render
```
