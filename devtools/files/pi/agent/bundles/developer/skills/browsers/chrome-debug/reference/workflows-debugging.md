# Chrome Debug - Debugging Workflows

## Debug JavaScript Errors

Check console for errors and warnings:

```bash
# Check console for errors
mise x node@20 -- mcporter call chrome-devtools.list_console_messages --args '{"types":["error","warn"]}'

# Check network requests
mise x node@20 -- mcporter call chrome-devtools.list_network_requests --args '{"types":["fetch","xhr"]}'
```

## Console Message Filtering

Use `--args` with JSON object:

```bash
# All messages (no args needed)
mise x node@20 -- mcporter call chrome-devtools.list_console_messages

# Only errors
mise x node@20 -- mcporter call chrome-devtools.list_console_messages --args '{"types":["error"]}'

# Errors and warnings
mise x node@20 -- mcporter call chrome-devtools.list_console_messages --args '{"types":["error","warn"]}'

# With pagination
mise x node@20 -- mcporter call chrome-devtools.list_console_messages --args '{"pageSize":50,"pageIdx":0}'

# Include messages from last 3 navigations
mise x node@20 -- mcporter call chrome-devtools.list_console_messages --args '{"includePreservedMessages":true}'
```

## Network Request Filtering

Use `--args` with JSON object:

```bash
# All requests (no args needed)
mise x node@20 -- mcporter call chrome-devtools.list_network_requests

# Only fetch/XHR
mise x node@20 -- mcporter call chrome-devtools.list_network_requests --args '{"types":["fetch","xhr"]}'

# Only documents
mise x node@20 -- mcporter call chrome-devtools.list_network_requests --args '{"types":["document"]}'

# With pagination
mise x node@20 -- mcporter call chrome-devtools.list_network_requests --args '{"pageSize":100,"pageIdx":0}'
```

## Script Evaluation for Debugging

Use `--args` with JSON object containing function and optional args array:

```bash
# Simple function
mise x node@20 -- mcporter call chrome-devtools.evaluate_script --args '{"function":"() => { return document.title }"}'

# Get current URL
mise x node@20 -- mcporter call chrome-devtools.evaluate_script --args '{"function":"() => { return window.location.href }"}'

# Check element state
mise x node@20 -- mcporter call chrome-devtools.evaluate_script --args '{"function":"(el) => { return { innerText: el.innerText, className: el.className, disabled: el.disabled } }","args":[{"uid":"12"}]}'

# Async function
mise x node@20 -- mcporter call chrome-devtools.evaluate_script --args '{"function":"async () => { return await fetch('\''/api/data'\'').then(r => r.json()) }"}'

# Function with element argument
mise x node@20 -- mcporter call chrome-devtools.evaluate_script --args '{"function":"(el) => { return el.innerText }","args":[{"uid":"12"}]}'

# Function with multiple element arguments
mise x node@20 -- mcporter call chrome-devtools.evaluate_script --args '{"function":"(el1, el2) => { return el1.offsetTop - el2.offsetTop }","args":[{"uid":"10"},{"uid":"20"}]}'
```

## Debugging Workflow Example

Complete debugging workflow for investigating issues:

```bash
# 1. Select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'

# 2. Take initial screenshot
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./debug-initial.png"}'

# 3. Check console errors
echo "=== Console Errors ==="
mise x node@20 -- mcporter call chrome-devtools.list_console_messages --args '{"types":["error"]}'

# 4. Check network failures
echo "=== Failed Network Requests ==="
mise x node@20 -- mcporter call chrome-devtools.list_network_requests | jq '.[] | select(.status >= 400)'

# 5. Inspect page state
echo "=== Page State ==="
mise x node@20 -- mcporter call chrome-devtools.evaluate_script \
  --args '{"function":"() => { return { url: window.location.href, title: document.title, readyState: document.readyState } }"}'

# 6. Take snapshot to inspect elements
echo "=== DOM Snapshot ==="
mise x node@20 -- mcporter call chrome-devtools.take_snapshot

# 7. Take final screenshot
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./debug-final.png"}'
```

## Wait Strategies

Use `wait_for` to handle timing issues:

```bash
# Wait for text to appear
mise x node@20 -- mcporter call chrome-devtools.wait_for --args '{"text":"Success"}'

# Wait for navigation to complete
mise x node@20 -- mcporter call chrome-devtools.wait_for --args '{"navigation":true}'

# Wait with timeout (milliseconds)
mise x node@20 -- mcporter call chrome-devtools.wait_for --args '{"text":"Loading complete","timeout":5000}'
```
