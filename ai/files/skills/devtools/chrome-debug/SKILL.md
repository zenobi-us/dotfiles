---
name: chrome-debug
description: Browser debugging and automation via browser-debugger-cli. Debug web applications, control browsers, inspect DOM, execute JavaScript, capture screenshots, and monitor network/console activity.
---

# Browser Debugging and Automation with browser-debugger-cli

## Overview

Browser-debugger-cli (`devtool`) is a command-line tool for automating and debugging web applications via the Chrome DevTools Protocol (CDP). It provides:

- Live browser control and inspection
- DOM querying and manipulation (semantic output for token efficiency)
- JavaScript execution and evaluation
- Network monitoring and HAR export
- Console log capture and filtering
- Screenshot and accessibility testing
- Session management and cleanup

This skill documents how to use `devtool` for web application debugging, testing, and automation workflows.


## Quick Start

> [CRITICAL]
> 
> Always connect to an existing session. 
> If there's no active session. Stop and get help from a HUMAN.

### Check Session Status

```bash
devtool status                     # Basic status
devtool status --verbose           # Include Chrome diagnostics
devtool status --json              # JSON output
```

### Stop Session

```bash
devtool stop                       # Stop gracefully
devtool stop --kill-chrome         # Also kill Chrome process
```

### Cleanup

```bash
devtool cleanup                    # Remove stale files
devtool cleanup --force            # Force cleanup
devtool cleanup --aggressive       # Kill all Chrome processes
```

## Available Commands

### DOM Commands

Query, inspect, and interact with page elements:

```bash
# Query elements
devtool dom query "button"          # Find all buttons
devtool dom query ".error"          # By class
devtool dom query "#app"            # By ID
devtool dom query --json            # JSON output

# Get element details (semantic - 70-99% token reduction)
devtool dom get "button"            # [Button] "Submit" (focusable)
devtool dom get "#search"           # [Searchbox] "Search" (focusable)
devtool dom get 0                   # By cached index

# Get raw HTML
devtool dom get "button" --raw      # Full HTML element

# Fill inputs
devtool dom fill "#username" "admin"
devtool dom fill "input[type=password]" "secret"
devtool dom fill 0 "value"          # By cached index

# Click elements
devtool dom click "#login-btn"
devtool dom click "button" --index 2  # 2nd button
devtool dom click 0                 # By cached index

# Key presses
devtool dom pressKey "input" Enter
devtool dom pressKey "input" Tab
devtool dom pressKey "body" Escape
devtool dom pressKey "input" a --modifiers ctrl  # Ctrl+A

# Submit forms
devtool dom submit "#login-form"
devtool dom submit "#form" --wait-navigation

# Screenshots
devtool dom screenshot output.png
devtool dom screenshot page.jpg --format jpeg
devtool dom screenshot visible.png --no-full-page
devtool dom screenshot hq.jpg --format jpeg --quality 100
devtool dom screenshot out.png --scroll "#footer"  # Scroll to element first

# Evaluate JavaScript
devtool dom eval "document.title"
devtool dom eval "window.location.href"
devtool dom eval "document.querySelectorAll('a').length"
```

### Accessibility Commands

```bash
# View accessibility tree
devtool dom a11y tree               # First 50 nodes
devtool dom a11y tree --json        # Full tree as JSON

# Query by role/name
devtool dom a11y query role=button
devtool dom a11y query name="Submit"
devtool dom a11y query role=button,name="Submit"

# Describe element
devtool dom a11y describe "button[type=submit]"
devtool dom a11y describe "#login-form"
devtool dom a11y describe 0         # By cached index
```

### Network Commands

```bash
# HAR export
devtool network har                 # Default filename
devtool network har myfile.har      # Custom filename
devtool network har --json          # JSON metadata

# List network requests
devtool network list                # All requests
devtool network list --filter "status-code:>=400"  # Failed only
devtool network list --filter "domain:api.*"       # By domain
devtool network list --filter "method:POST"        # By method
devtool network list --preset errors               # Use preset
devtool network list --preset api                  # XHR/Fetch only
devtool network list --follow                      # Live streaming

# Get cookies
devtool network getCookies
devtool network getCookies --url https://api.example.com
devtool network getCookies --json | jq '.cookies[] | select(.httpOnly)'
```

### Console Commands

```bash
# Smart summary (current page only)
devtool console                     # Errors/warnings deduplicated
devtool console --json              # JSON with summary stats
devtool console --last 50           # Last 50 messages

# Message history (all navigations)
devtool console --history           # All page loads
devtool console --history --list    # Full history chronologically

# Chronological list
devtool console --list              # All messages in order
devtool console --list --last 100   # Last 100 messages

# Live streaming
devtool console --follow            # Stream in real-time (like tail -f)

# Get message details
devtool details console 0           # Full details for first message
```

### Monitoring Commands

```bash
# Quick snapshot
devtool peek                        # Last 10 items
devtool peek --last 50              # More items
devtool peek --json

# Live updates
devtool tail                        # Live updates
devtool tail --interval 2000        # Custom interval (ms)

# Get details
devtool details network <requestId>  # Full request/response
devtool details console <index>      # Console message details
```

### CDP Commands

Direct access to Chrome DevTools Protocol:

```bash
# List all domains
devtool cdp --list                  # All 53 domains

# List methods in a domain
devtool cdp Network --list          # All methods
devtool cdp DOM --list

# Search by keyword
devtool cdp --search cookie         # Find cookie-related methods
devtool cdp --search screenshot

# Get method details and schema
devtool cdp Network.getCookies --describe
devtool cdp Page.captureScreenshot --describe

# Execute CDP methods
devtool cdp Network.getCookies
devtool cdp DOM.getDocument
devtool cdp Runtime.evaluate --params '{"expression":"document.title","returnByValue":true}'

# Pipe with jq
devtool cdp Network.getCookies | jq '.cookies[] | select(.httpOnly)'
```

## Common Workflows

### 1. Web Scraping

```bash
devtool https://example.com
devtool dom eval "Array.from(document.querySelectorAll('a')).map(a => ({text: a.textContent.trim(), href: a.href}))"
devtool stop
```

### 2. Form Automation (Login)

```bash
devtool https://app.example.com/login
devtool dom fill "#username" "admin"
devtool dom fill "#password" "secret"
devtool dom click "#login-btn"  # Automatically waits for navigation
devtool dom eval "window.location.href"  # Verify logged in
devtool stop
```

### 3. Search and Extract Results

```bash
devtool https://example.com
devtool dom fill "#search" "query"
devtool dom pressKey "#search" Enter  # Automatically waits for stability
devtool dom query ".result-item" --json | jq '.count'
devtool stop
```

### 4. Finding Failed Network Requests

```bash
devtool https://example.com
devtool network list --filter "status-code:>=400"
# or using jq
devtool network list --json | jq '.data[] | select(.status >= 400)'
devtool stop
```

### 5. Checking Security Headers

```bash
devtool https://example.com
devtool network headers --header content-security-policy
devtool network headers --header strict-transport-security
devtool stop
```

### 6. Taking Screenshots for Visual Comparison

```bash
devtool https://example.com
devtool dom screenshot desktop-1920x1080.png

# Mobile viewport
devtool cdp Emulation.setDeviceMetricsOverride --params '{"width":375,"height":812,"deviceScaleFactor":3,"mobile":true}'
devtool dom screenshot mobile-iphone.png
devtool stop
```

### 7. Accessibility Testing

```bash
devtool https://example.com

# Find unlabeled buttons
devtool dom a11y query role=button --json | jq '.nodes[] | select(.name == null or .name == "")'

# Verify form labels
devtool dom a11y query role=textbox --json | jq '.nodes[] | {id: .nodeId, label: .name}'

# Check heading structure
devtool dom a11y query role=heading --json | jq '.nodes[] | {level: .properties.level, name: .name}'

devtool stop
```

### 8. Console Error Detection

```bash
devtool https://example.com
# Check for errors after page load
devtool console                     # Smart summary
devtool console --json | jq '.data.console[] | select(.type == "error")'
devtool stop
```

### 9. Waiting for Elements (Polling)

```bash
while ! devtool dom query "#loaded" --json | jq -e '.count > 0'; do
  sleep 0.5
done
echo "Element appeared"
```

### 10. HAR Export for Performance Analysis

```bash
devtool https://example.com --headless
# Browse around...
devtool network har session.har
# Now analyze in Chrome DevTools or online HAR viewer
devtool stop
```

## Discovery Workflow (Self-Learning Pattern)

The tool is self-documenting for agents:

```bash
# 1. Discover what domains exist
devtool cdp --list

# 2. What methods are in a domain?
devtool cdp Network --list

# 3. Search for capability
devtool cdp --search cookie

# 4. Learn how to use it
devtool cdp Network.getCookies --describe

# 5. Execute
devtool cdp Network.getCookies
```

## Exit Codes

| Code | Category | Meaning | Retry? |
|------|----------|---------|--------|
| 0 | Success | Operation completed | N/A |
| 80-89 | User Input | Invalid input (URL, args) | No |
| 81 | Invalid Arguments | Bad command arguments | No |
| 82 | Permission Denied | Insufficient permissions | No |
| 83 | Resource Not Found | Element/session missing | No |
| 85 | Resource Busy | Resource locked/in use | Maybe |
| 86 | Daemon Already Running | Session active | No |
| 100-119 | Software | External/internal errors | Yes |
| 100 | Chrome Launch | Chrome failed to start | Yes |
| 101 | CDP Connection | WebSocket failed | Yes |
| 102 | CDP Timeout | Operation timed out | Yes |

### Agent Decision Logic

```bash
if devtool dom query "button"; then
  # Success (exit 0)
  continue
else
  case $? in
    83) echo "Element not found" ;;
    101) echo "Connection failed - retry" ;;
    86) devtool cleanup --force && devtool https://example.com ;;
  esac
fi
```

## Token Efficiency Tips

### Semantic DOM Output (Default)

By default, `devtool dom get` returns semantic information optimized for AI agents (70-99% token reduction):

```bash
devtool dom get "button"
# [Button] "Submit" (focusable)
# Instead of full HTML
```

### Screenshot Optimization

```bash
# Default: Auto-resizes to ~1568px max (Claude Vision optimal)
devtool dom screenshot output.png

# Tall pages (>3:1 ratio) fall back to viewport only with warning
# Use --no-resize only if you need full resolution (may be 300k+ tokens)
devtool dom screenshot output.png --no-resize

# Scroll to element, then capture viewport
devtool dom screenshot output.png --scroll "#footer"
```

### Caching with Indices

After querying elements, use cached indices for fast access:

```bash
devtool dom query "button"    # Results cached with indices 0, 1, 2...
devtool dom get 0             # Fast lookup
devtool dom fill 0 "value"    # Interact by index
```

## Best Practices

1. **Use discovery first**: Learn capabilities with `--list`, `--search`, `--describe`
2. **Prefer high-level commands**: Use `devtool dom` instead of `devtool cdp Runtime.evaluate` when possible
3. **Use JSON output for parsing**: Always add `--json` when piping to `jq`
4. **Automatic waiting**: `devtool dom click`, `fill`, `pressKey` automatically wait - no sleep needed
5. **Handle exit codes**: Check exit codes and retry only on 100-119 range
6. **Filter early**: Use `--filter` and `--preset` to reduce network data before processing
7. **Use headless mode**: For faster, lighter automation use `--headless`

## Common Issues and Solutions

| Problem | Solution |
|---------|----------|
| "Cannot connect to WebSocket" | Ensure correct --chrome-ws-url="$WS_URL" |
| "Daemon already running" | `devtool cleanup --force` |
| "Session not found" | `devtool <url>` to start session first |
| "Element not found" | `devtool dom query "*" --json` to debug selectors |
| Stale session | `devtool cleanup --aggressive` |
| Screenshot too large | Use default auto-resize, not `--no-resize` |
| Network data not captured | `devtool cdp Page.reload` to refresh |

## Session Files Location

All session data stored in `~/.devtool/`:

- `daemon.pid` - Daemon process ID
- `daemon.sock` - Unix socket
- `session.meta.json` - Active session metadata
- `session.json` - Final output after `devtool stop`
- `chrome-profile/` - Chrome user data directory

## See Also

- [browser-debugger-cli Wiki](https://github.com/szymdzum/browser-debugger-cli/wiki)
- [Commands Reference](https://github.com/szymdzum/browser-debugger-cli/wiki/Commands)
- [For AI Agents](https://github.com/szymdzum/browser-debugger-cli/wiki/For-AI-Agents)
- [Recipes](https://github.com/szymdzum/browser-debugger-cli/wiki/Recipes)
- [Quick Reference](https://github.com/szymdzum/browser-debugger-cli/wiki/Quick-Reference)
