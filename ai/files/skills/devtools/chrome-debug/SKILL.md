---
name: chrome-debug
description: Use when debugging web applications in chrome via the remote debugging protocol. Provides capabilities for inspecting DOM, executing JS, taking screenshots, and automating browser interactions.
---

# Chrome Debugging and Browser Manipulation via Remote Debugging Protocol

## Overview

Chrome DevTools Protocol (CDP) enables remote browser automation and debugging.

This skill documents the integration pattern, startup requirements, and common workflows for debugging web applications via Agent with live browser interaction.

- Live browser debugging alongside Agent conversations
- Automated form filling and interaction testing
- Visual feedback on application behavior
- Immediate error diagnostics from console logs
- Screenshot-based validation workflows

## Prerequisites [CRITICAL]

Before using Chrome DevTools, ensure:

1. Chrome/Chromium is running with remote debugging enabled
2. The browser is listening on port 9222 (default)
3. Test connection with:

```bash
mise x node@20 -- mcporter call chrome-devtools.list_pages
```

This should return a list of open pages/tabs. If it fails:
- Check Chrome is running with `--remote-debugging-port=9222`
- Check no other process is using port 9222
- Get a human to help with browser setup

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

> [!NOTE]
> You can get a list like this with : 
> ```bash
>  mcporter list chrome-devtools --json | jq -r '.tools[] | [.name, .description] | @tsv' | column -t -s $'\t'
> ```

## Core Concepts

### Page Selection Model
- Chrome DevTools works with **multiple pages/tabs**
- Use `list_pages` to see all open pages (returns array with indices)
- Use `select_page --page-idx N` to select a page for subsequent operations
- Once selected, all commands operate on that page until you select another

### UID-Based Element Model
- **Critical**: You CANNOT interact with elements using CSS selectors directly
- Must first call `take_snapshot` to get accessibility tree with UIDs
- UIDs are temporary identifiers for elements (like "5", "12", "42")
- Use UIDs with: `click`, `fill`, `hover`, `drag`, `take_screenshot` (element-specific)
- UIDs are **invalidated on navigation** - take new snapshot after nav

### Function-Based Script Evaluation
- `evaluate_script` requires a **function declaration**, not plain code
- Correct: `--function "() => { return document.title }"`
- Wrong: `--script "document.title"`
- Can pass element arguments via `--args [{"uid": "12"}]`
- Return values must be JSON-serializable

### Navigation State Reset
- Console messages are cleared on page navigation
- Network requests are cleared on page navigation
- Use `--include-preserved-messages true` to see messages across last 3 navigations

## Quick Reference

| Task | mcporter Call |
|------|---------------|
| List open pages/tabs | `mise x node@20 -- mcporter call chrome-devtools.list_pages` |
| Select page to work with | `mise x node@20 -- mcporter call chrome-devtools.select_page --page-idx 0` |
| Take DOM snapshot (get UIDs) | `mise x node@20 -- mcporter call chrome-devtools.take_snapshot` |
| Take screenshot | `mise x node@20 -- mcporter call chrome-devtools.take_screenshot --file-path "./screen.png"` |
| Take full-page screenshot | `mise x node@20 -- mcporter call chrome-devtools.take_screenshot --full-page true --file-path "./full.png"` |
| Screenshot specific element | `mise x node@20 -- mcporter call chrome-devtools.take_screenshot --uid "12" --file-path "./element.png"` |
| Navigate to URL | `mise x node@20 -- mcporter call chrome-devtools.navigate_page --type url --url "http://localhost:3000"` |
| Navigate back | `mise x node@20 -- mcporter call chrome-devtools.navigate_page --type back` |
| Reload page | `mise x node@20 -- mcporter call chrome-devtools.navigate_page --type reload` |
| Click element | `mise x node@20 -- mcporter call chrome-devtools.click --uid "12"` |
| Double-click element | `mise x node@20 -- mcporter call chrome-devtools.click --uid "12" --dbl-click true` |
| Fill input field | `mise x node@20 -- mcporter call chrome-devtools.fill --uid "5" --value "test@example.com"` |
| Hover element | `mise x node@20 -- mcporter call chrome-devtools.hover --uid "8"` |
| Press key | `mise x node@20 -- mcporter call chrome-devtools.press_key --key "Enter"` |
| Run JavaScript | `mise x node@20 -- mcporter call chrome-devtools.evaluate_script --function "() => { return document.title }"` |
| Run JS with element arg | `mise x node@20 -- mcporter call chrome-devtools.evaluate_script --function "(el) => { return el.innerText }" --args '[{"uid": "12"}]'` |
| List console messages | `mise x node@20 -- mcporter call chrome-devtools.list_console_messages` |
| List only errors | `mise x node@20 -- mcporter call chrome-devtools.list_console_messages --types '["error"]'` |
| List network requests | `mise x node@20 -- mcporter call chrome-devtools.list_network_requests` |
| Filter network by type | `mise x node@20 -- mcporter call chrome-devtools.list_network_requests --types '["fetch", "xhr"]'` |
| Open new page | `mise x node@20 -- mcporter call chrome-devtools.new_page` |
| Close page | `mise x node@20 -- mcporter call chrome-devtools.close_page --page-idx 1` |
| Wait for text | `mise x node@20 -- mcporter call chrome-devtools.wait_for --text "Success"` |
| Emulate network | `mise x node@20 -- mcporter call chrome-devtools.emulate --network-conditions "Slow 3G"` |
| CPU throttling | `mise x node@20 -- mcporter call chrome-devtools.emulate --cpu-throttling-rate 4` |

## Common Workflows

> **Note**: These are high-level conceptual workflows. Actual implementation requires:
> 1. Page selection via `select_page`
> 2. Snapshot via `take_snapshot` before any element interaction
> 3. UID-based element references (not CSS selectors)

### Required Setup Steps

Before any workflow, ensure:
```bash
# List and select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --page-idx 0
```

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

## Working with Elements (UID Workflow)

**Critical**: Element interaction requires UIDs from snapshots. CSS selectors DO NOT work directly.

### Step-by-Step Element Interaction

```bash
# Step 1: Take snapshot to get element UIDs
SNAPSHOT=$(mise x node@20 -- mcporter call chrome-devtools.take_snapshot)
echo "$SNAPSHOT"
```

Example snapshot output:
```
Document
  main
    form uid=10
      label uid=11 "Email"
      input uid=12 type="email"
      label uid=13 "Password"
      input uid=14 type="password"
      button uid=15 "Login"
```

```bash
# Step 2: Use UIDs to interact with elements
mise x node@20 -- mcporter call chrome-devtools.fill --uid "12" --value "user@example.com"
mise x node@20 -- mcporter call chrome-devtools.fill --uid "14" --value "password123"
mise x node@20 -- mcporter call chrome-devtools.click --uid "15"
```

### After Navigation

UIDs become invalid after navigation. Always take a fresh snapshot:

```bash
# Navigation happened
mise x node@20 -- mcporter call chrome-devtools.navigate_page --type url --url "..."

# OLD UIDs are now invalid - take new snapshot
mise x node@20 -- mcporter call chrome-devtools.take_snapshot
```

## Detailed Examples

### Example 1: Hover Detection & Measurement

Hover an element and measure its dimensions after CSS transitions:

```bash
# Select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --page-idx 0

# Take snapshot to find tooltip trigger element
SNAPSHOT=$(mise x node@20 -- mcporter call chrome-devtools.take_snapshot)
echo "$SNAPSHOT"  # Review to find tooltip-trigger UID (assume uid=20)

# Hover the element
mise x node@20 -- mcporter call chrome-devtools.hover --uid "20"

# Wait for CSS transition
sleep 0.5

# Measure dimensions with evaluate_script
mise x node@20 -- mcporter call chrome-devtools.evaluate_script \
  --function '(el) => { 
    const bounds = el.getBoundingClientRect(); 
    const tooltip = document.querySelector(".tooltip");
    const tooltipBounds = tooltip ? tooltip.getBoundingClientRect() : null;
    return { 
      trigger: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
      tooltip: tooltipBounds ? { x: tooltipBounds.x, y: tooltipBounds.y, width: tooltipBounds.width, height: tooltipBounds.height } : null
    };
  }' \
  --args '[{"uid": "20"}]'
```

### Example 2: Performance Measurement & Storage

Execute JavaScript to measure page performance metrics and store results:

```bash
# Select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --page-idx 0

# Navigate to page to test
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --type url --url "http://localhost:3000"

# Wait for page load
sleep 2

# Measure performance metrics
METRICS=$(mise x node@20 -- mcporter call chrome-devtools.evaluate_script \
  --function '() => { 
    const perf = performance.getEntriesByType("navigation")[0]; 
    const paint = performance.getEntriesByName("first-contentful-paint")[0];
    return { 
      pageLoadTime: perf.loadEventEnd - perf.fetchStart, 
      domInteractive: perf.domInteractive - perf.fetchStart, 
      domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
      firstContentfulPaint: paint ? paint.startTime : null,
      transferSize: perf.transferSize,
      domainLookup: perf.domainLookupEnd - perf.domainLookupStart
    };
  }')

# Store results
echo "$METRICS" | jq '.' > ./perf-metrics-$(date +%s).json
echo "Performance metrics saved to ./perf-metrics-$(date +%s).json"
```

### Example 3: Screenshot Capture & Storage Workflow

Navigate, interact with elements, and capture sequential screenshots:

```bash
# Setup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCREENSHOT_DIR="./screenshots/$TIMESTAMP"
mkdir -p "$SCREENSHOT_DIR"

# Select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --page-idx 0

# Take initial state screenshot
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --file-path "$SCREENSHOT_DIR/01-initial.png"

# Navigate to target page
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --type url --url "http://localhost:3000/dashboard"

# Wait for navigation to complete
mise x node@20 -- mcporter call chrome-devtools.wait_for --text "Dashboard"

# Capture after navigation
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --file-path "$SCREENSHOT_DIR/02-after-nav.png"

# Get snapshot to find interactive element (e.g., expand button)
SNAPSHOT=$(mise x node@20 -- mcporter call chrome-devtools.take_snapshot)
echo "$SNAPSHOT" | grep -i "expand"  # Find the expand button UID

# Assuming expand button is uid=25
mise x node@20 -- mcporter call chrome-devtools.click --uid "25"

# Wait for expansion animation
sleep 1

# Capture after interaction
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --file-path "$SCREENSHOT_DIR/03-after-click.png"

# Take full-page screenshot showing entire content
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --full-page true \
  --file-path "$SCREENSHOT_DIR/04-full-page.png"

# Generate summary
echo "=== Screenshot Workflow Complete ==="
echo "Screenshots saved to: $SCREENSHOT_DIR"
ls -lh "$SCREENSHOT_DIR"
```

### Example 4: Complete Form Fill & Submission Flow

Demonstrates full workflow from navigation to form submission with error checking:

```bash
# Setup: Select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --page-idx 0

# Navigate to login page
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --type url --url "http://localhost:3000/login"

# Wait for form to load
mise x node@20 -- mcporter call chrome-devtools.wait_for --text "Login"

# Take snapshot to identify form field UIDs
SNAPSHOT=$(mise x node@20 -- mcporter call chrome-devtools.take_snapshot)
echo "$SNAPSHOT"

# Expected output shows:
# form uid=8
#   input uid=9 type="email" placeholder="Email"
#   input uid=10 type="password" placeholder="Password"
#   button uid=11 "Sign In"

# Fill email field
mise x node@20 -- mcporter call chrome-devtools.fill \
  --uid "9" \
  --value "test@example.com"

# Fill password field
mise x node@20 -- mcporter call chrome-devtools.fill \
  --uid "10" \
  --value "SecurePass123!"

# Take screenshot before submission
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --file-path "./before-submit.png"

# Submit form by clicking button
mise x node@20 -- mcporter call chrome-devtools.click --uid "11"

# Wait for either success message or error
sleep 2

# Check console for any errors
CONSOLE=$(mise x node@20 -- mcporter call chrome-devtools.list_console_messages \
  --types '["error", "warn"]')
echo "$CONSOLE"

# Check network requests for API calls
NETWORK=$(mise x node@20 -- mcporter call chrome-devtools.list_network_requests \
  --types '["fetch", "xhr"]')
echo "$NETWORK"

# Take screenshot of result
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --file-path "./after-submit.png"

# Verify login by checking URL or page content
CURRENT_URL=$(mise x node@20 -- mcporter call chrome-devtools.evaluate_script \
  --function "() => { return window.location.href }")
echo "Current URL: $CURRENT_URL"

# If login successful, URL should change to dashboard
if echo "$CURRENT_URL" | grep -q "dashboard"; then
  echo "✓ Login successful!"
else
  echo "✗ Login failed - still on login page"
fi
```

## Parameter Reference

### Navigation Parameters

```bash
# Navigate to URL
--type url --url "http://localhost:3000/page"

# Navigate back in history
--type back

# Navigate forward in history
--type forward

# Reload current page
--type reload

# Reload ignoring cache
--type reload --ignore-cache true

# Navigation with timeout (milliseconds)
--type url --url "http://example.com" --timeout 5000
```

### Screenshot Parameters

```bash
# PNG (default)
--format png --file-path "./screen.png"

# JPEG with quality
--format jpeg --quality 90 --file-path "./screen.jpg"

# WebP with quality
--format webp --quality 85 --file-path "./screen.webp"

# Full page screenshot
--full-page true --file-path "./full.png"

# Screenshot specific element
--uid "12" --file-path "./element.png"
```

### Form Interaction Parameters

```bash
# Fill input/textarea
--uid "5" --value "text content"

# Select dropdown option
--uid "8" --value "option2"

# Click element
--uid "12"

# Double-click element
--uid "12" --dbl-click true
```

### Script Evaluation Parameters

```bash
# Simple function
--function "() => { return document.title }"

# Async function
--function "async () => { return await fetch('/api/data').then(r => r.json()) }"

# Function with element argument
--function "(el) => { return el.innerText }" --args '[{"uid": "12"}]'

# Function with multiple element arguments
--function "(el1, el2) => { return el1.offsetTop - el2.offsetTop }" --args '[{"uid": "10"}, {"uid": "20"}]'
```

### Console Message Filtering

```bash
# All messages
(no parameters)

# Only errors
--types '["error"]'

# Errors and warnings
--types '["error", "warn"]'

# With pagination
--page-size 50 --page-idx 0

# Include messages from last 3 navigations
--include-preserved-messages true
```

### Network Request Filtering

```bash
# All requests
(no parameters)

# Only fetch/XHR
--types '["fetch", "xhr"]'

# Only documents
--types '["document"]'

# With pagination
--page-size 100 --page-idx 0
```

### Emulation Parameters

```bash
# Network throttling
--network-conditions "Slow 3G"
--network-conditions "Fast 4G"
--network-conditions "Offline"
--network-conditions "No emulation"

# CPU throttling (1 = no throttle, 20 = max)
--cpu-throttling-rate 4

# Combined
--network-conditions "Slow 3G" --cpu-throttling-rate 4
```

### Keyboard Parameters

```bash
# Single key
--key "Enter"
--key "Escape"
--key "Tab"
--key "Backspace"

# With modifiers (check tool docs for modifier syntax)
--key "KeyA" --modifiers '["Control"]'
```

## Troubleshooting

### Error: "Element not found" or "Invalid UID"

**Cause**: Trying to interact with element without taking snapshot, or using stale UID.

**Solution**:
```bash
# Always take snapshot before interacting with elements
mise x node@20 -- mcporter call chrome-devtools.take_snapshot
# Then use the UIDs shown in the output
```

### Error: "No page selected"

**Cause**: Haven't selected a page to work with.

**Solution**:
```bash
# List pages to see available indices
mise x node@20 -- mcporter call chrome-devtools.list_pages
# Select the page you want
mise x node@20 -- mcporter call chrome-devtools.select_page --page-idx 0
```

### Error: "Function evaluation failed"

**Cause**: Invalid JavaScript syntax or trying to use `--script` parameter.

**Solution**:
```bash
# Wrong: --script "document.title"
# Right: --function "() => { return document.title }"

# Must be a function declaration, not plain code
```

### UIDs Change After Navigation

**Cause**: UIDs are regenerated on each navigation/reload.

**Solution**:
```bash
# After any navigation, take a new snapshot
mise x node@20 -- mcporter call chrome-devtools.navigate_page --type url --url "..."
mise x node@20 -- mcporter call chrome-devtools.take_snapshot  # Fresh UIDs
```

### Cannot Find Element in Snapshot

**Cause**: Element might be in shadow DOM, iframe, or not rendered yet.

**Solution**:
```bash
# Wait for element to appear
mise x node@20 -- mcporter call chrome-devtools.wait_for --text "Expected Text"
# Then take snapshot
mise x node@20 -- mcporter call chrome-devtools.take_snapshot
```

### Connection Refused / Cannot Connect

**Cause**: Chrome not running with remote debugging enabled.

**Solution**:
```bash
# Start Chrome with remote debugging:
google-chrome --remote-debugging-port=9222

# Or Chromium:
chromium --remote-debugging-port=9222

# Test connection:
mise x node@20 -- mcporter call chrome-devtools.list_pages
```

### Screenshot File Not Created

**Cause**: Invalid file path or missing directory.

**Solution**:
```bash
# Ensure directory exists
mkdir -p ./screenshots

# Use absolute or relative path with proper extension
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --file-path "./screenshots/test.png"
```

## Real-World Impact

Integrating Chrome DevTools Protocol into mcporter enables:

- Live browser debugging alongside Agent conversations
- Automated form filling and interaction testing
- Visual feedback on application behavior
- Immediate error diagnostics from console logs
- Screenshot-based validation workflows

Without this integration, debugging web applications requires context-switching between browser and Agent.
