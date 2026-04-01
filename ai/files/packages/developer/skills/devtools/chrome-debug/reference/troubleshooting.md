# Chrome Debug - Troubleshooting Guide

## Common Issues and Solutions

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
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'
```

### Error: "Function evaluation failed"

**Cause**: Invalid JavaScript syntax or incorrect parameter format.

**Solution**:
```bash
# Must use --args with function property
mise x node@20 -- mcporter call chrome-devtools.evaluate_script --args '{"function":"() => { return document.title }"}'

# Not: --function "() => { return document.title }"
```

### UIDs Change After Navigation

**Cause**: UIDs are regenerated on each navigation/reload.

**Solution**:
```bash
# After any navigation, take a new snapshot
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"url","url":"..."}'
mise x node@20 -- mcporter call chrome-devtools.take_snapshot  # Fresh UIDs
```

### Cannot Find Element in Snapshot

**Cause**: Element might be in shadow DOM, iframe, or not rendered yet.

**Solution**:
```bash
# Wait for element to appear
mise x node@20 -- mcporter call chrome-devtools.wait_for --args '{"text":"Expected Text"}'
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

**Cause**: Invalid file path, missing directory, or incorrect parameter format.

**Solution**:
```bash
# Ensure directory exists
mkdir -p ./screenshots

# Use --args with JSON format (correct)
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --args '{"filePath":"./screenshots/test.png"}'

# Wrong format (do NOT use):
# mise x node@20 -- mcporter call chrome-devtools.take_screenshot --file-path "./screenshots/test.png"
```

**Key**: Always use `--args '{"filePath":"..."}'` for screenshot commands, not individual flags.

### Always Use --args with JSON

**Wrong format:**
```bash
# ❌ Individual flags don't work
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --file-path "./screen.png"
mise x node@20 -- mcporter call chrome-devtools.click --uid "12"
```

**Correct format:**
```bash
# ✅ Use --args with JSON
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./screen.png"}'
mise x node@20 -- mcporter call chrome-devtools.click --args '{"uid":"12"}'
```

### Element Interaction Not Working

**Diagnostic steps:**

```bash
# 1. Verify page is selected
mise x node@20 -- mcporter call chrome-devtools.list_pages

# 2. Take fresh snapshot
SNAPSHOT=$(mise x node@20 -- mcporter call chrome-devtools.take_snapshot)
echo "$SNAPSHOT"

# 3. Verify element exists in snapshot
echo "$SNAPSHOT" | grep -i "search-term"

# 4. Use correct UID from snapshot
mise x node@20 -- mcporter call chrome-devtools.click --args '{"uid":"CORRECT_UID"}'

# 5. Check console for errors
mise x node@20 -- mcporter call chrome-devtools.list_console_messages --args '{"types":["error"]}'
```

### Network Request Not Showing

**Cause**: Network monitoring might not be enabled, or requests happened before monitoring started.

**Solution**:
```bash
# Network requests are captured automatically after page selection
# Ensure you select the page before navigating/interacting

mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'

# Then perform actions
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"url","url":"..."}'

# Check requests
mise x node@20 -- mcporter call chrome-devtools.list_network_requests
```

### Timeout Errors

**Cause**: Default timeout too short for slow operations.

**Solution**:
```bash
# Increase timeout for navigation
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --args '{"type":"url","url":"http://slow-site.com","timeout":30000}'

# Increase timeout for wait operations
mise x node@20 -- mcporter call chrome-devtools.wait_for \
  --args '{"text":"Slow Content","timeout":10000}'
```

## Quick Diagnostic Checklist

Run this to diagnose common issues:

```bash
echo "=== Chrome Debug Diagnostic ==="

echo "1. Testing connection..."
if mise x node@20 -- mcporter call chrome-devtools.list_pages > /dev/null 2>&1; then
  echo "✓ Connection OK"
else
  echo "✗ Cannot connect - start Chrome with: google-chrome --remote-debugging-port=9222"
  exit 1
fi

echo "2. Checking pages..."
PAGES=$(mise x node@20 -- mcporter call chrome-devtools.list_pages)
echo "$PAGES"

echo "3. Selecting first page..."
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'

echo "4. Testing snapshot..."
if mise x node@20 -- mcporter call chrome-devtools.take_snapshot > /dev/null 2>&1; then
  echo "✓ Snapshot working"
else
  echo "✗ Snapshot failed - check page selection"
fi

echo "5. Testing screenshot..."
if mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"/tmp/test-screenshot.png"}'; then
  echo "✓ Screenshot working"
  ls -lh /tmp/test-screenshot.png
else
  echo "✗ Screenshot failed"
fi

echo "=== Diagnostic Complete ==="
```
