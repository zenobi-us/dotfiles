# Chrome Debug - Navigation Workflows

## Navigation Parameters

Use `--args` with JSON object:

```bash
# Navigate to URL
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"url","url":"http://localhost:3000/page"}'

# Navigate back in history
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"back"}'

# Navigate forward in history
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"forward"}'

# Reload current page
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"reload"}'

# Reload ignoring cache
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"reload","ignoreCache":true}'

# Navigation with timeout (milliseconds)
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"url","url":"http://example.com","timeout":5000}'
```

## Page Management

```bash
# List all open pages/tabs
mise x node@20 -- mcporter call chrome-devtools.list_pages

# Select a specific page to work with
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'

# Create new page/tab
mise x node@20 -- mcporter call chrome-devtools.new_page

# Close a page/tab
mise x node@20 -- mcporter call chrome-devtools.close_page --args '{"pageIdx":1}'
```

## Viewport Management

```bash
# Resize viewport
mise x node@20 -- mcporter call chrome-devtools.resize_page --args '{"width":1920,"height":1080}'

# Mobile viewport
mise x node@20 -- mcporter call chrome-devtools.resize_page --args '{"width":375,"height":667}'

# Tablet viewport
mise x node@20 -- mcporter call chrome-devtools.resize_page --args '{"width":768,"height":1024}'
```

## Navigation Workflow Example

Complete navigation workflow with verification:

```bash
# 1. List and select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'

# 2. Navigate to URL
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --args '{"type":"url","url":"http://localhost:3000/dashboard"}'

# 3. Wait for page to load
mise x node@20 -- mcporter call chrome-devtools.wait_for --args '{"text":"Dashboard"}'

# 4. Verify URL
CURRENT_URL=$(mise x node@20 -- mcporter call chrome-devtools.evaluate_script \
  --args '{"function":"() => { return window.location.href }"}')
echo "Current URL: $CURRENT_URL"

# 5. Take screenshot of loaded page
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --args '{"filePath":"./dashboard.png"}'
```

## Multi-Page Workflow

Working with multiple tabs:

```bash
# Open multiple pages
mise x node@20 -- mcporter call chrome-devtools.new_page
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --args '{"type":"url","url":"http://localhost:3000/page1"}'

mise x node@20 -- mcporter call chrome-devtools.new_page
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --args '{"type":"url","url":"http://localhost:3000/page2"}'

# List all pages to see their indices
mise x node@20 -- mcporter call chrome-devtools.list_pages

# Switch between pages
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./page1.png"}'

mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":1}'
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./page2.png"}'

# Close pages when done
mise x node@20 -- mcporter call chrome-devtools.close_page --args '{"pageIdx":1}'
```

## Navigation State Verification

```bash
# Check if navigation completed successfully
READY_STATE=$(mise x node@20 -- mcporter call chrome-devtools.evaluate_script \
  --args '{"function":"() => { return document.readyState }"}')

if echo "$READY_STATE" | grep -q "complete"; then
  echo "✓ Page loaded successfully"
else
  echo "⚠ Page still loading (state: $READY_STATE)"
fi
```

## Remember: UIDs Expire After Navigation

After any navigation, always take a new snapshot:

```bash
# Navigation invalidates all UIDs
mise x node@20 -- mcporter call chrome-devtools.navigate_page --args '{"type":"url","url":"..."}'

# MUST take new snapshot to get fresh UIDs
mise x node@20 -- mcporter call chrome-devtools.take_snapshot
```
