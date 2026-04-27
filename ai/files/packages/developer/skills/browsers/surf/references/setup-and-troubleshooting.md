# Surf Setup and Troubleshooting

## Install and wire up

```bash
# Install CLI
npm install -g surf-cli

# Find extension path
surf extension-path

# In Chrome:
# chrome://extensions -> Developer mode -> Load unpacked -> <extension-path>

# Install native host (use your extension ID from chrome://extensions)
surf install <extension-id>

# Restart Chrome, then verify:
surf tab.list
```

## Common failures

### 1) `surf tab.list` fails
Likely causes:
- Extension not loaded
- Native host not installed
- Chrome not restarted after install

Fix sequence:
1. `surf extension-path` and re-check loaded extension path
2. Re-run `surf install <extension-id>`
3. Restart Chrome
4. Retry `surf tab.list`

### 2) Commands fail on restricted pages
Some browser/system pages block normal automation.

Fix:
- Navigate to a standard HTTPS page and retry.
- Verify with: `surf go "https://example.com" && surf read --compact`

### 3) AI provider commands fail (`chatgpt`, `gemini`, `perplexity`, `grok`, `aistudio`)
Likely causes:
- Not logged into provider in Chrome
- Provider UI changed
- Timeout too short for model/provider

Fix sequence:
1. Open provider site manually in Chrome and ensure active login
2. Retry command with longer timeout, e.g. `--timeout 600`
3. For Grok specifically, run:

```bash
surf grok --validate
surf grok --validate --save-models
```

### 4) Element interaction is flaky
Likely causes:
- stale refs after navigation/DOM changes
- race condition with page load

Fix:
```bash
surf read --compact
surf wait.load
surf wait.network
# then retry click/type with fresh refs or semantic locators
```

### 5) Multi-step runs are brittle
Fix: move to `surf do` and optionally validate first.

```bash
surf do 'go "https://example.com" | click e5 | screenshot --output /tmp/x.png' --dry-run
surf do 'go "https://example.com" | click e5 | screenshot --output /tmp/x.png'
```

## Verification checklist

- `surf --help` works
- `surf tab.list` returns at least one tab/window
- `surf go "https://example.com"` succeeds
- `surf read --compact` returns page model
- `surf screenshot --output /tmp/surf-check.png` creates file
