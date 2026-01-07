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
mise x node@20 -- mcporter call 'chrome-devtools.getVersion'
```

This command must return Chrome version info. If it fails, get a human to help.

## Available Tools

| Tool | Purpose |
|------|---------|
| `click` | Click an element on the page |
| `close_page` | Close a browser page/tab |
| `drag` | Drag and drop elements |
| `emulate` | Emulate device settings (viewport, user agent, etc.) |
| `evaluate_script` | Execute JavaScript code in the page context |
| `fill` | Fill input fields with text |
| `fill_form` | Fill and submit an entire form |
| `get_console_message` | Get a specific console message |
| `get_network_request` | Get details of a specific network request |
| `handle_dialog` | Handle browser dialogs (alert, confirm, prompt) |
| `hover` | Hover over an element to trigger hover states |
| `list_console_messages` | Get all console messages (logs, errors, warnings) |
| `list_network_requests` | Get all network requests made by the page |
| `list_pages` | List all open pages/tabs |
| `navigate_page` | Navigate to a URL |
| `new_page` | Create a new browser page/tab |
| `performance_analyze_insight` | Analyze performance metrics and provide insights |
| `performance_start_trace` | Start performance tracing |
| `performance_stop_trace` | Stop performance tracing and get results |
| `press_key` | Press keyboard keys (Enter, Tab, Escape, etc.) |
| `resize_page` | Resize the browser viewport |
| `select_page` | Select a specific page/tab to work with |
| `take_screenshot` | Capture a screenshot of the current page |
| `take_snapshot` | Take a DOM snapshot for inspection |
| `upload_file` | Upload files via file input fields |
| `wait_for` | Wait for elements, navigation, or conditions |

## Quick Reference

| Task | mcporter Call |
|------|---------------|
| Check Chrome listening | `mise x node@20 -- mcporter call 'chrome-devtools.getVersion'` |
| List browser tabs | `mise x node@20 -- mcporter call 'chrome-devtools.getTabs(targetId: "<id>")'` |
| Take screenshot | `mise x node@20 -- mcporter call 'chrome-devtools.takeScreenshot(targetId: "<id>")'` |
| Click element | `mise x node@20 -- mcporter call 'chrome-devtools.clickElement(targetId: "<id>", selector: "#login")'` |
| Fill form field | `mise x node@20 -- mcporter call 'chrome-devtools.fillFormField(targetId: "<id>", selector: "#email", value: "test@example.com")'` |
| Get page content | `mise x node@20 -- mcporter call 'chrome-devtools.getPageContent(targetId: "<id>")'` |
| Navigate to URL | `mise x node@20 -- mcporter call 'chrome-devtools.navigateToUrl(targetId: "<id>", url: "http://localhost:3000")'` |
| Run JavaScript | `mise x node@20 -- mcporter call 'chrome-devtools.evaluateScript(targetId: "<id>", script: "document.title")'` |
| Read console | `mise x node@20 -- mcporter call 'chrome-devtools.getConsoleOutput(targetId: "<id>")'` |

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
TARGET_ID=$(mise x node@20 -- mcporter call 'chrome-devtools.getTabs' | jq -r '.[0].id')

# Hover the element and measure its computed dimensions
mise x node@20 -- mcporter call 'chrome-devtools.evaluateScript(targetId: "'$TARGET_ID'", script: "const el = document.querySelector(\".tooltip-trigger\"); const bounds = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent(\"mouseover\", { bubbles: true })); setTimeout(() => { const tooltip = document.querySelector(\".tooltip\"); const tooltipBounds = tooltip.getBoundingClientRect(); console.log(JSON.stringify({ trigger: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }, tooltip: { x: tooltipBounds.x, y: tooltipBounds.y, width: tooltipBounds.width, height: tooltipBounds.height } })); }, 300);")'
```

### Example 2: Performance Measurement & Storage

Execute JavaScript to measure page performance metrics and store results:

```bash
TARGET_ID=$(mise x node@20 -- mcporter call 'chrome-devtools.getTabs' | jq -r '.[0].id')

# Measure performance metrics
METRICS=$(mise x node@20 -- mcporter call 'chrome-devtools.evaluateScript(targetId: "'$TARGET_ID'", script: "const perf = performance.getEntriesByType(\"navigation\")[0]; { pageLoadTime: perf.loadEventEnd - perf.fetchStart, domInteractive: perf.domInteractive - perf.fetchStart, domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart, firstPaint: performance.getEntriesByName(\"first-paint\")[0]?.startTime || null, memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : null }")')

# Store results
echo "$METRICS" | jq '.' > ./perf-metrics-$(date +%s).json
```

### Example 3: Screenshot Capture & Storage Workflow

Navigate, interact, and capture sequential screenshots:

```bash
TARGET_ID=$(mise x node@20 -- mcporter call 'chrome-devtools.getTabs' | jq -r '.[0].id')
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCREENSHOT_DIR="./screenshots/$TIMESTAMP"
mkdir -p "$SCREENSHOT_DIR"

# Take initial state screenshot
mise x node@20 -- mcporter call 'chrome-devtools.takeScreenshot(targetId: "'$TARGET_ID'")' > "$SCREENSHOT_DIR/01-initial.png"

# Navigate and take screenshot
mise x node@20 -- mcporter call 'chrome-devtools.navigateToUrl(targetId: "'$TARGET_ID'", url: "http://localhost:3000/page")'

# Wait for load and capture
sleep 2
mise x node@20 -- mcporter call 'chrome-devtools.takeScreenshot(targetId: "'$TARGET_ID'")' > "$SCREENSHOT_DIR/02-after-nav.png"

# Interact and capture
mise x node@20 -- mcporter call 'chrome-devtools.clickElement(targetId: "'$TARGET_ID'", selector: ".expand-button")'

sleep 1
mise x node@20 -- mcporter call 'chrome-devtools.takeScreenshot(targetId: "'$TARGET_ID'")' > "$SCREENSHOT_DIR/03-after-click.png"

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
