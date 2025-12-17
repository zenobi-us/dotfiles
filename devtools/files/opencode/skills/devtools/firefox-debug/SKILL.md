---
name: firefox-debug
description: |
  Integrate Firefox Remote Debugging Protocol (RDP) for development workflows via mcporter.
---
# Firefox DevTools Integration Skill

## Purpose

This skill enables seamless integration of Firefox Remote Debugging Protocol (RDP) for development workflows through mcporter. It configures Firefox to accept remote debugging connections and provides tooling for Agent-driven browser interaction and debugging.

## Prerequisites [CRITICAL]

```bash
mise x node@20 -- mcporter call 'firefox-devtools.getVersion'
```

Should return Firefox version info (JSON). If it fails, Firefox isn't listening on port 6000.

## Core Concepts

### Firefox Remote Debugging Protocol (RDP)

Firefox uses RDP over WebSocket connections on port 6000 by default, exposed through mcporter for Agent interaction.

**Key capabilities:**

- **Inspector**: DOM manipulation and inspection
- **Debugger**: JavaScript breakpoints and stepping
- **Console**: Execute scripts and view logs
- **Network**: Monitor and intercept requests
- **Performance**: Profile runtime performance
- **Storage**: Access cookies, localStorage, sessionStorage

## Available Tools

- firefox-devtools.getVersion [no args]
- firefox-devtools.getTabs [no args]
- firefox-devtools.navigateToUrl [url]
- firefox-devtools.takeScreenshot [tabId]
- firefox-devtools.clickElement [tabId, selector]
- firefox-devtools.fillFormField [tabId, selector, value]
- firefox-devtools.getPageContent [tabId]
- firefox-devtools.evaluateScript [tabId, script]
- firefox-devtools.getConsoleOutput [tabId]
- firefox-devtools.getStorage [tabId, storageType]

## Common Workflows

### 1. Inspect Web Application State

```
You: "Navigate to http://localhost:3000 and take a screenshot"
Agent uses Firefox Remote Debugging Protocol → Takes screenshot → Returns visual state
```

### 2. Debug JavaScript Errors

```
You: "Open DevTools console and read the error messages"
Agent uses Firefox Remote Debugging Protocol → Reads console → Explains errors
```

### 3. Automated Testing/Validation

```
You: "Fill the form with test data and submit it"
Agent uses Firefox Remote Debugging Protocol → Automates interaction → Reports results
```

### 4. DOM Inspection & Storage Access

```
You: "Check localStorage for the auth token"
Agent uses Firefox Remote Debugging Protocol → Inspects storage → Returns values
```

## Quick Reference

| Task | mcporter Call |
|------|---------------|
| Check Firefox listening | `mise x node@20 -- mcporter call 'firefox-devtools.getVersion'` |
| List browser tabs | `mise x node@20 -- mcporter call 'firefox-devtools.getTabs'` |
| Take screenshot | `mise x node@20 -- mcporter call 'firefox-devtools.takeScreenshot(tabId: "<id>")'` |
| Click element | `mise x node@20 -- mcporter call 'firefox-devtools.clickElement(tabId: "<id>", selector: "#login")'` |
| Fill form field | `mise x node@20 -- mcporter call 'firefox-devtools.fillFormField(tabId: "<id>", selector: "#email", value: "test@example.com")'` |
| Get page content | `mise x node@20 -- mcporter call 'firefox-devtools.getPageContent(tabId: "<id>")'` |
| Navigate to URL | `mise x node@20 -- mcporter call 'firefox-devtools.navigateToUrl(tabId: "<id>", url: "http://localhost:3000")'` |
| Run JavaScript | `mise x node@20 -- mcporter call 'firefox-devtools.evaluateScript(tabId: "<id>", script: "document.title")'` |
| Read console | `mise x node@20 -- mcporter call 'firefox-devtools.getConsoleOutput(tabId: "<id>")'` |
| Access storage | `mise x node@20 -- mcporter call 'firefox-devtools.getStorage(tabId: "<id>", storageType: "localStorage")'` |

## Detailed Examples

### Example 1: Form Testing with Storage Verification

Fill a form, submit, and verify localStorage was updated:

```bash
TAB_ID=$(mise x node@20 -- mcporter call 'firefox-devtools.getTabs' | jq -r '.[0].id')

# Navigate to form page
mise x node@20 -- mcporter call 'firefox-devtools.navigateToUrl(tabId: "'$TAB_ID'", url: "http://localhost:3000/form")'

sleep 2

# Fill and submit form
mise x node@20 -- mcporter call 'firefox-devtools.fillFormField(tabId: "'$TAB_ID'", selector: "#email", value: "test@example.com")'

mise x node@20 -- mcporter call 'firefox-devtools.fillFormField(tabId: "'$TAB_ID'", selector: "#password", value: "testpass123")'

mise x node@20 -- mcporter call 'firefox-devtools.clickElement(tabId: "'$TAB_ID'", selector: "#submit")'

sleep 1

# Check localStorage for auth token
STORAGE=$(mise x node@20 -- mcporter call 'firefox-devtools.getStorage(tabId: "'$TAB_ID'", storageType: "localStorage")')

echo "$STORAGE" | jq '.auth_token'
```

### Example 2: JavaScript Measurement & Hover Interaction

Measure element properties and simulate hover state:

```bash
TAB_ID=$(mise x node@20 -- mcporter call 'firefox-devtools.getTabs' | jq -r '.[0].id')

# Navigate to page with interactive elements
mise x node@20 -- mcporter call 'firefox-devtools.navigateToUrl(tabId: "'$TAB_ID'", url: "http://localhost:3000/interactive")'

sleep 2

# Measure element dimensions and trigger hover
MEASUREMENTS=$(mise x node@20 -- mcporter call 'firefox-devtools.evaluateScript(tabId: "'$TAB_ID'", script: "const el = document.querySelector(\".interactive-button\"); const bounds = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent(\"mouseenter\", { bubbles: true })); setTimeout(() => { const computed = window.getComputedStyle(el); console.log(JSON.stringify({ bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }, backgroundColor: computed.backgroundColor, transform: computed.transform, opacity: computed.opacity })); }, 300);")')

echo "$MEASUREMENTS" | jq '.'
```

### Example 3: Performance Testing with Sequential Screenshots

Measure page load performance and capture visual progression:

```bash
TAB_ID=$(mise x node@20 -- mcporter call 'firefox-devtools.getTabs' | jq -r '.[0].id')
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCREENSHOT_DIR="./firefox-screenshots/$TIMESTAMP"
mkdir -p "$SCREENSHOT_DIR"

# Clear and start fresh
mise x node@20 -- mcporter call 'firefox-devtools.evaluateScript(tabId: "'$TAB_ID'", script: "performance.mark(\"test-start\");")'

# Navigate and capture
mise x node@20 -- mcporter call 'firefox-devtools.navigateToUrl(tabId: "'$TAB_ID'", url: "http://localhost:3000/dashboard")'

# Screenshot at different stages
sleep 1
mise x node@20 -- mcporter call 'firefox-devtools.takeScreenshot(tabId: "'$TAB_ID'")' > "$SCREENSHOT_DIR/01-load-complete.png"

sleep 2
mise x node@20 -- mcporter call 'firefox-devtools.takeScreenshot(tabId: "'$TAB_ID'")' > "$SCREENSHOT_DIR/02-render-complete.png"

# Measure performance metrics
PERF=$(mise x node@20 -- mcporter call 'firefox-devtools.evaluateScript(tabId: "'$TAB_ID'", script: "const perf = performance.getEntriesByType(\"navigation\")[0]; { pageLoadTime: perf.loadEventEnd - perf.fetchStart, domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart, firstPaint: performance.getEntriesByName(\"first-paint\")[0]?.startTime || null }")')

echo "$PERF" | jq '.' > "$SCREENSHOT_DIR/perf-metrics.json"
echo "Test complete. Results in: $SCREENSHOT_DIR"
```

## Troubleshooting

### Connection Refused

```bash
# Verify Firefox is running with debugging enabled
ps aux | grep firefox.*6000
# Or explicitly launch with port
firefox --remote-debugging-port 6000 &
```

### Port Already in Use

```bash
# Use custom port
firefox --remote-debugging-port 7000 &
# Then update mcporter config or pass port parameter
```

### Performance Considerations

1. **RDP Overhead**: Remote debugging adds minimal overhead
2. **Port Binding**: Use high-numbered ports (>6000) to avoid conflicts
3. **Memory**: Firefox with debugging enabled uses ~10-15% more memory

## Real-World Impact

Integrating Firefox Remote Debugging Protocol into mcporter enables:

- Live browser debugging alongside Agent conversations
- Automated form testing and validation
- Visual feedback on application behavior
- Performance metrics collection and analysis
- Storage inspection for authentication and session debugging

Without this integration, debugging Firefox applications requires context-switching between browser and Agent.

## References

- [Mozilla Remote Debugging Protocol](https://wiki.mozilla.org/Remote_Debugging_Protocol)
- [Firefox WebDriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/)
- [DevTools Server](https://developer.mozilla.org/en-US/docs/Tools/Debugger)

## Related Skills

- `devtools/chrome-debug` - Chrome equivalent
- `superpowers/systematic-debugging` - General debugging methodology
- `experts/quality-security/debugger` - Debugging expert guidance
- `superpowers/frontend-developer` - Frontend development context

## Skill Metadata

- **Category**: DevTools Integration
- **Complexity**: Intermediate
- **Domain**: Browser Debugging, Development Tools
- **Platforms**: Linux, macOS, Windows
- **Last Updated**: 2025-12-15
