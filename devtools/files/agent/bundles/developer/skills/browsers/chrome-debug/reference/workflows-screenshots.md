# Chrome Debug - Screenshot Workflows

## Screenshot Capture & Storage Workflow

Navigate, interact with elements, and capture sequential screenshots:

```bash
# Setup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCREENSHOT_DIR="./screenshots/$TIMESTAMP"
mkdir -p "$SCREENSHOT_DIR"

# Select page
mise x node@20 -- mcporter call chrome-devtools.list_pages
mise x node@20 -- mcporter call chrome-devtools.select_page --args '{"pageIdx":0}'

# Take initial state screenshot
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --args "{\"filePath\":\"$SCREENSHOT_DIR/01-initial.png\"}"

# Navigate to target page
mise x node@20 -- mcporter call chrome-devtools.navigate_page \
  --args '{"type":"url","url":"http://localhost:3000/dashboard"}'

# Wait for navigation to complete
mise x node@20 -- mcporter call chrome-devtools.wait_for --args '{"text":"Dashboard"}'

# Capture after navigation
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --args "{\"filePath\":\"$SCREENSHOT_DIR/02-after-nav.png\"}"

# Get snapshot to find interactive element (e.g., expand button)
SNAPSHOT=$(mise x node@20 -- mcporter call chrome-devtools.take_snapshot)
echo "$SNAPSHOT" | grep -i "expand"  # Find the expand button UID

# Assuming expand button is uid=25
mise x node@20 -- mcporter call chrome-devtools.click --args '{"uid":"25"}'

# Wait for expansion animation
sleep 1

# Capture after interaction
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --args "{\"filePath\":\"$SCREENSHOT_DIR/03-after-click.png\"}"

# Take full-page screenshot showing entire content
mise x node@20 -- mcporter call chrome-devtools.take_screenshot \
  --args "{\"filePath\":\"$SCREENSHOT_DIR/04-full-page.png\",\"fullPage\":true}"

# Generate summary
echo "=== Screenshot Workflow Complete ==="
echo "Screenshots saved to: $SCREENSHOT_DIR"
ls -lh "$SCREENSHOT_DIR"
```

## Screenshot Parameters

Use `--args` with JSON object containing these properties:

```bash
# PNG (default)
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./screen.png"}'

# JPEG with quality
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./screen.jpg","format":"jpeg","quality":90}'

# WebP with quality
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./screen.webp","format":"webp","quality":85}'

# Full page screenshot
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"filePath":"./full.png","fullPage":true}'

# Screenshot specific element
mise x node@20 -- mcporter call chrome-devtools.take_screenshot --args '{"uid":"12","filePath":"./element.png"}'
```

**Available JSON properties:**
- `filePath` (string) - Output file path
- `format` (string) - "png" | "jpeg" | "webp" (default: "png")
- `quality` (number) - 0-100 for JPEG/WebP (ignored for PNG)
- `uid` (string) - Element UID from snapshot (omit for full page)
- `fullPage` (boolean) - true for full page (incompatible with uid)

## Common Issues

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
