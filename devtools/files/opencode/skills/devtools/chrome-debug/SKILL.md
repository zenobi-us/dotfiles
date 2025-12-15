---
name: chrome-debug
description: Use when debugging web applications in chrome via the remote debugging protocol. Provides capabilities for inspecting DOM, executing JS, taking screenshots, and automating browser interactions.
---

# Chrome Debugging and Browser Manipulation via Remote Debugging Prodocol

## Overview

Chrome DevTools Protocol (CDP) enables remote browser automation and debugging.

This skill documents the integration pattern, startup requirements, and common workflows for debugging web applications via Agent with live browser interaction.

- Live browser debugging alongside Agent conversations
- Automated form filling and interaction testing
- Visual feedback on application behavior
- Immediate error diagnostics from console logs
- Screenshot-based validation workflows

## Prerequisites [CRITICAL]

```bash
mcporter call chrome-devtools.getVersion
```

This command must return Chrome version info. If it fails, get a human to help.

## Available Tools

- chrome-devtools.getVersion [no args]
- chrome-devtools.getTabs [targetId]
- chrome-devtools.navigateToUrl [url]
- chrome-devtools.takeScreenshot [targetId]
- chrome-devtools.clickElement [targetId, selector]
- chrome-devtools.fillFormField [targetId, selector, value]
- chrome-devtools.getPageContent [targetId]
- chrome-devtools.evaluateScript [targetId, script]
- chrome-devtools.getConsoleOutput [targetId]

## Quick Reference

| Task | mcporter Call |
|------|---------------|
| Check Chrome listening | `mcporter call chrome-devtools.getVersion` |
| List browser tabs | `mcporter call chrome-devtools.getTabs --targetId=<id>` |
| Take screenshot | `mcporter call chrome-devtools.takeScreenshot --targetId=<id>` |
| Click element | `mcporter call chrome-devtools.clickElement --targetId=<id> --selector='#login'` |
| Fill form field | `mcporter call chrome-devtools.fillFormField --targetId=<id> --selector='#email' --value='test@example.com'` |
| Get page content | `mcporter call chrome-devtools.getPageContent --targetId=<id>` |
| Navigate to URL | `mcporter call chrome-devtools.navigateToUrl --targetId=<id> --url='http://localhost:3000'` |
| Run JavaScript | `mcporter call chrome-devtools.evaluateScript --targetId=<id> --script='document.title'` |
| Read console | `mcporter call chrome-devtools.getConsoleOutput --targetId=<id>` |

## Common Workflows

### 1. Inspect Web Application State

```
You: "Navigate to http://localhost:3000 and take a screenshot"
Agent uses Chrome DevTools Protocol → Takes screenshot → Returns visual state
```

### 2. Debug JavaScript Errors

```
You: "Open DevTools console and read the error messages"
Agent uses Chrome DevTools Protocol → Reads console → Explains errors
```

### 3. Automated Testing/Validation

```
You: "Fill the form with test data and submit it"
Agent uses Chrome DevTools Protocol → Automates interaction → Reports results
```

### 4. DOM Inspection

```
You: "Find the login button and tell me its HTML"
Agent uses Chrome DevTools Protocol → Inspects element → Returns HTML/attributes
```

## Detailed Examples

### Example 1: Hover Detection & Measurement

Hover an element and measure its dimensions after CSS transitions complete:

```bash
# Get target ID
TARGET_ID=$(mcporter call chrome-devtools.getTabs | jq -r '.[0].id')

# Hover the element and measure its computed dimensions
mcporter call chrome-devtools.evaluateScript \
  --targetId="$TARGET_ID" \
  --script='
    const el = document.querySelector(".tooltip-trigger");
    const bounds = el.getBoundingClientRect();
    
    // Simulate hover
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    
    // Wait for transition and measure
    setTimeout(() => {
      const tooltip = document.querySelector(".tooltip");
      const tooltipBounds = tooltip.getBoundingClientRect();
      console.log(JSON.stringify({
        trigger: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        tooltip: { x: tooltipBounds.x, y: tooltipBounds.y, width: tooltipBounds.width, height: tooltipBounds.height }
      }));
    }, 300);
  '
```

### Example 2: Performance Measurement & Storage

Execute JavaScript to measure page performance metrics and store results:

```bash
TARGET_ID=$(mcporter call chrome-devtools.getTabs | jq -r '.[0].id')

# Measure performance metrics
METRICS=$(mcporter call chrome-devtools.evaluateScript \
  --targetId="$TARGET_ID" \
  --script='
    const perf = performance.getEntriesByType("navigation")[0];
    {
      pageLoadTime: perf.loadEventEnd - perf.fetchStart,
      domInteractive: perf.domInteractive - perf.fetchStart,
      domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
      firstPaint: performance.getEntriesByName("first-paint")[0]?.startTime || null,
      memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : null
    }
  ')

# Store results
echo "$METRICS" | jq '.' > ./perf-metrics-$(date +%s).json
```

### Example 3: Screenshot Capture & Storage Workflow

Navigate, interact, and capture sequential screenshots:

```bash
TARGET_ID=$(mcporter call chrome-devtools.getTabs | jq -r '.[0].id')
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCREENSHOT_DIR="./screenshots/$TIMESTAMP"
mkdir -p "$SCREENSHOT_DIR"

# Take initial state screenshot
mcporter call chrome-devtools.takeScreenshot --targetId="$TARGET_ID" > "$SCREENSHOT_DIR/01-initial.png"

# Navigate and take screenshot
mcporter call chrome-devtools.navigateToUrl \
  --targetId="$TARGET_ID" \
  --url='http://localhost:3000/page'

# Wait for load and capture
sleep 2
mcporter call chrome-devtools.takeScreenshot --targetId="$TARGET_ID" > "$SCREENSHOT_DIR/02-after-nav.png"

# Interact and capture
mcporter call chrome-devtools.clickElement \
  --targetId="$TARGET_ID" \
  --selector='.expand-button'

sleep 1
mcporter call chrome-devtools.takeScreenshot --targetId="$TARGET_ID" > "$SCREENSHOT_DIR/03-after-click.png"

# Generate summary
echo "Screenshots saved to: $SCREENSHOT_DIR"
ls -lh "$SCREENSHOT_DIR"
```

## Real-World Impact

Integrating Chrome DevTools Protocol into mcporter enables:

- Live browser debugging alongside Agent conversations
- Automated form filling and interaction testing
- Visual feedback on application behavior
- Immediate error diagnostics from console logs
- Screenshot-based validation workflows

Without this integration, debugging web applications requires context-switching between browser and Agent.
