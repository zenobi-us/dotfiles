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

### 1) `Socket connect failed` or `surf tab.list` fails
Run `surf doctor` first — it does not require a working browser connection. It checks the socket path, native messaging manifest, `allowed_origins`, and wrapper path, then prints targeted next steps.

```bash
surf doctor
surf doctor --browser all
surf doctor --json
```

Read the `Attempted socket:` line first. The CLI and native host must agree on the same socket path (default `/tmp/surf.sock` on macOS/Linux/WSL2, `//./pipe/surf` on Windows). If `SURF_SOCKET` is set, set the same value for both the browser-launched native host and the shell running `surf`.

Fix sequence:
1. `surf extension-path` and re-check loaded extension path
2. Re-run `surf install <extension-id>`
3. Restart Chrome
4. Retry `surf tab.list`

**WSL2 with Windows Chrome:** run `surf install <extension-id>` from inside WSL2 — Surf detects WSL2 and writes a Windows-side native messaging manifest plus a wrapper that launches the WSL2 host with `wsl.exe`. Use `--target linux` only when the browser is a Linux build running inside WSLg. If the extension reports `Access to the specified native messaging host is forbidden`, rerun `surf install <extension-id>` from the same WSL distro and confirm the extension ID was copied from `chrome://extensions`.

**macOS checklist:**
- Confirm the manifest exists: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/surf.browser.host.json`.
- Confirm its `allowed_origins` entry matches the extension ID shown on `chrome://extensions`.
- Reinstall with `surf install <extension-id>` after any fresh extension build or ID change.
- Fully restart Chrome, then reload the Surf extension.
- Open the extension service worker console on `chrome://extensions` and check for native messaging/socket errors.

### 2) Commands fail on restricted pages
Some browser/system pages block normal automation.

Fix:
- Navigate to a standard HTTPS page and retry.
- Verify with: `surf go "https://example.com" && surf read --compact`

### 3) AI provider commands fail (`chatgpt`, `gemini`, `perplexity`, `grok`, `aistudio`, `kimi`, `oracle`)
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

### 6) Two agents fight over the same tab
Cause: no `SURF_SESSION` set, so both agents share Chrome's focused tab.

Fix:
```bash
export SURF_SESSION="$(basename "$PWD" | sed 's/[^A-Za-z0-9._-]/-/g')"
surf session.ensure "$SURF_SESSION" about:blank
```

Give each agent a distinct session name. Check `surf session.list --refresh` to see all bindings, and `surf session.info <name> --refresh` if a specific session seems stuck.

## Verification checklist

- `surf --help` works
- `surf tab.list` returns at least one tab/window
- `surf go "https://example.com"` succeeds
- `surf read --compact` returns page model
- `surf screenshot --output /tmp/surf-check.png` creates file
