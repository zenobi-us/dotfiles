---
name: chrome-debug
description: Use when debugging web applications in chrome via the remote debugging protocol. Provides capabilities for inspecting DOM, executing JS, taking screenshots, and automating browser interactions.
---

# Chrome Debugging and Browser Manipulation via Remote Debugging Protocol

## Overview

Chrome DevTools Protocol (CDP) enables remote browser automation and debugging through mcporter.

**Key capabilities:**
- Live browser debugging alongside Agent conversations
- Automated form filling and interaction testing
- Visual feedback via screenshots
- Console log and network request inspection
- JavaScript execution in page context

## Prerequisites [CRITICAL]

Before using Chrome DevTools, ensure:

1. Chrome/Chromium is running with remote debugging enabled
2. The browser is listening on port 9222 (default)
3. Test connection with:

```bash
mise x node@20 -- mcporter call chrome-devtools.list_pages
```

If this fails:
- Start Chrome: `google-chrome --remote-debugging-port=9222`
- Check no other process is using port 9222
- Get a human to help with browser setup

## Available Tools

| Tool | Purpose |
|------|---------|
| `list_pages` | List all open pages/tabs |
| `select_page` | Select a specific page/tab to work with |
| `new_page` | Create a new browser page/tab |
| `close_page` | Close a browser page/tab |
| `navigate_page` | Navigate to a URL, back, forward, or reload |
| `take_snapshot` | Take a DOM snapshot for inspection (returns UIDs) |
| `take_screenshot` | Capture a screenshot of the current page |
| `click` | Click an element on the page |
| `fill` | Fill input fields with text |
| `hover` | Hover over an element |
| `press_key` | Press keyboard keys (Enter, Tab, Escape, etc.) |
| `evaluate_script` | Execute JavaScript code in the page context |
| `wait_for` | Wait for elements, navigation, or conditions |
| `list_console_messages` | Get all console messages (logs, errors, warnings) |
| `list_network_requests` | Get all network requests made by the page |
| `emulate` | Emulate device settings (network, CPU throttling) |
| `resize_page` | Resize the browser viewport |
| `performance_start_trace` | Start performance tracing |
| `performance_stop_trace` | Stop performance tracing and get results |

> [!TIP]
> Get full tool list: `mcporter list chrome-devtools --json | jq -r '.tools[] | [.name, .description] | @tsv' | column -t -s $'\t'`

## Core Concepts

### 1. Page Selection Model
- Chrome DevTools works with **multiple pages/tabs**
- Use `list_pages` to see all open pages
- Use `select_page` to choose which page to work with
- All subsequent commands operate on the selected page

### 2. UID-Based Element Model [CRITICAL]
- **You CANNOT interact with elements using CSS selectors directly**
- Must first call `take_snapshot` to get accessibility tree with UIDs
- UIDs are temporary identifiers for elements (e.g., "5", "12", "42")
- UIDs are **invalidated on navigation** - take new snapshot after nav

### 3. JSON Arguments Required
- All mcporter commands require `--args` with JSON object
- Property names are **camelCase** (e.g., `filePath`, `fullPage`, `pageIdx`)
- Never use individual flags like `--file-path` or `--full-page`

### 4. Function-Based Script Evaluation
- `evaluate_script` requires a **function declaration**, not plain code
- Return values must be JSON-serializable
- Can pass element arguments via `args` array with UIDs

## Quick Reference


**Essential commands in bash-friendly format:**

```bash
# List and select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'

# Take snapshot to get UIDs
mise x node@20 -- mcporter call chrome-devtools.take_snapshot

# Take screenshot
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./screen.png"}'

# Take full-page screenshot
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./full.png","fullPage":true}'

# Navigate to URL
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"url","url":"http://localhost:3000"}'

# Navigate back/forward/reload
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"back"}'
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"reload"}'

# Click element (requires UID from snapshot)
mise x node@20 -- mcporter call chrome-devtools.click --args '{"uid":"12"}'

# Fill input field
mise x node@20 -- mcporter call chrome-devtools.fill --args '{"uid":"5","value":"test@example.com"}'

# Hover element
mise x node@20 -- mcporter call chrome-devtools.hover --args '{"uid":"8"}'

# Press key
mise x node@20 -- mcporter call chrome-devtools.press_key --args '{"key":"Enter"}'

# Run JavaScript
mise x node@20 -- mcporter call chrome-devtools.evaluate_script --args '{"function":"() => { return document.title }"}'

# Run JS with element argument
mise x node@20 -- mcporter call chrome-devtools.evaluate_script --args '{"function":"(el) => { return el.innerText }","args":[{"uid":"12"}]}'

# List console messages
mise x node@20 -- mcporter call chrome-devtools.list_console_messages

# List only errors
mise x node@20 -- mcporter call chrome-devtools.list_console_messages --args '{"types":["error"]}'

# List network requests
mise x node@20 -- mcporter call chrome-devtools.list_network_requests

# Filter network by type
mise x node@20 -- mcporter call chrome-devtools.list_network_requests --args '{"types":["fetch","xhr"]}'

# Wait for text to appear
mise x node@20 -- mcporter call chrome-devtools.wait_for --args '{"text":"Success"}'

# Emulate network conditions
mise x node@20 -- mcporter call chrome-devtools.emulate --args '{"networkConditions":"Slow 3G"}'
```

## Common Workflows

### Basic Element Interaction

```bash
# 1. Select page and take snapshot
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'
SNAPSHOT=$(mise x node@20 -- mcporter call chrome-devtools.take_snapshot)
echo "$SNAPSHOT"

# 2. Find element UID in snapshot output
# Example: uid=12 input type="email"

# 3. Interact with element using its UID
mise x node@20 -- mcporter call chrome-devtools.fill --args '{"uid":"12","value":"user@example.com"}'
mise x node@20 -- mcporter call chrome-devtools.click --args '{"uid":"15"}'
```

### Screenshot Workflow

```bash
# Take viewport screenshot
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./screen.png"}'

# Take full-page screenshot
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./full.png","fullPage":true}'

# Screenshot specific element
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"uid":"20","filePath":"./button.png"}'
```

### Debug JavaScript Errors

```bash
# Check console for errors
mise x node@20 -- mcporter call chrome-devtools.list_console_messages --args '{"types":["error","warn"]}'

# Check network requests
mise x node@20 -- mcporter call chrome-devtools.list_network_requests --args '{"types":["fetch","xhr"]}'
```

### Run Performance Tests

```bash
# Execute JavaScript to get performance metrics
mise x node@20 -- mcporter call chrome-devtools.evaluate_script \
  --args '{"function":"() => { const perf = performance.getEntriesByType(\"navigation\")[0]; return { loadTime: perf.loadEventEnd - perf.fetchStart, domInteractive: perf.domInteractive - perf.fetchStart }; }"}'
```

## Important Reminders

### UID Workflow is Mandatory
```bash
# ❌ WRONG - CSS selectors don't work
mise x node@20 -- mcporter call chrome-devtools.click --selector "#login-button"

# ✅ CORRECT - Use UIDs from snapshot
mise x node@20 -- mcporter call chrome-devtools.take_snapshot  # Get UIDs first
mise x node@20 -- mcporter call chrome-devtools.click --args '{"uid":"12"}'
```

### UIDs Expire on Navigation
```bash
# After navigation, UIDs are invalid
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"url","url":"..."}'

# Take fresh snapshot to get new UIDs
mise x node@20 -- mcporter call chrome-devtools.take_snapshot
```

### Always Use --args with JSON
```bash
# ❌ WRONG - Individual flags don't work
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --file-path "./screen.png"

# ✅ CORRECT - Use --args with JSON
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./screen.png"}'
```

## Quick Troubleshooting

| Error | Solution |
|-------|----------|
| "Element not found" / "Invalid UID" | Take fresh snapshot: `take_snapshot` |
| "No page selected" | Select page: `select_page --args '{"pageIdx":0}'` |
| "Connection refused" | Start Chrome: `google-chrome --remote-debugging-port=9222` |
| Screenshot not created | Ensure directory exists and use `--args` format |
| UIDs not working | UIDs expired after navigation - take new snapshot |

## Additional Resources

**Lazy-load these references based on your needs:**

| Reference | When to Use |
|-----------|-------------|
| [Element Interaction](./reference/workflows-element-interaction.md) | When working with UIDs, clicking, hovering, or measuring elements |
| [Form Filling](./reference/workflows-form-filling.md) | When filling forms, submitting data, or handling keyboard input |
| [Screenshots](./reference/workflows-screenshots.md) | When capturing screenshots, visual testing, or documenting state |
| [Performance](./reference/workflows-performance.md) | When measuring page performance, network timing, or emulating conditions |
| [Debugging](./reference/workflows-debugging.md) | When investigating console errors, network failures, or script evaluation |
| [Navigation](./reference/workflows-navigation.md) | When navigating pages, managing tabs, or handling viewports |
| [Troubleshooting](./reference/troubleshooting.md) | When encountering errors or unexpected behavior |

> [!IMPORTANT]
> **Load references only when needed** - Don't read all files upfront. Read the specific reference that matches your current task.

## Real-World Impact

Integrating Chrome DevTools Protocol enables:
- Live browser debugging alongside Agent conversations
- Automated form filling and interaction testing
- Visual feedback on application behavior
- Immediate error diagnostics from console logs
- Screenshot-based validation workflows

Without this integration, debugging web applications requires constant context-switching between browser and Agent.
