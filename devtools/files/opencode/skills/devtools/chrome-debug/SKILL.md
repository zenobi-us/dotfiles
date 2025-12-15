---
name: chrome-debug
description: Use when debugging web applications in chrome via the remote debugging protocol. Provides capabilities for inspecting DOM, executing JS, taking screenshots, and automating browser interactions.
---

# Chrome DevTools MCPorts Integration

## Overview

Chrome DevTools MCP (Model Context Protocol) server enables remote browser automation and debugging through mcporter. This skill documents the integration pattern, startup requirements, and common workflows for debugging web applications via Claude with live browser interaction.

**Core principle:** Chrome DevTools MCP requires Chrome to be running with remote debugging enabled on port 9222 before mcporter can connect.

## When to Use

- Setting up browser automation capabilities in mcporter
- Debugging JavaScript/DOM issues with Claude assistance
- Creating interactive workflows that inspect/manipulate web pages
- Adding Chrome DevTools to existing mcporter configurations
- Troubleshooting mcporter → Chrome connection failures

## Prerequisites [CRITICAL]

```bash
mcporter call chrome-devtools.getVersion
```

Should return Chrome version info (JSON). If it fails, Chrome isn't listening on port 9222.

## Configuration Pattern

Add to `mcporter.json` in the `mcpServers` object (root level, alongside `basicmemory`, `atlassian`, etc.):

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "type": "local",
      "command": [
        "mise",
        "x",
        "node@22",
        "--",
        "chrome-devtools-mcp",
        "--browser-url=http://127.0.0.1:9222"
      ]
    }
  }
}
```

**Key elements:**

- **Location:** Root level within `mcpServers` object (NOT nested)
- **type:** `"local"` - Runs locally via command
- **mise x node@22** - Ensures Node 22 available
- **chrome-devtools-mcp** - MCP server command
- **--browser-url=<http://127.0.0.1:9222>** - Chrome's debugging port (only change if Chrome started with different port)

**Installation note:** `chrome-devtools-mcp` must be globally installed or in NODE_PATH:

```bash
npm install -g chrome-devtools-mcp
```

If missing, mcporter will fail with "Command not found" - install before restarting mcporter.

## Startup Sequence

1. **Launch Chrome with debugging:**

   ```bash
   google-chrome --remote-debugging-port=9222 &
   ```

2. **Start mcporter:**

   ```bash
   mcporter
   ```

3. **Verify in Claude/OpenCode:**
   - Chrome DevTools MCP should appear in available tools
   - Test with: "List open browser tabs"

**If Chrome DevTools doesn't appear:**

- Check Chrome is running: `lsof -i :9222`
- Verify mcporter config syntax (JSON validation)
- Restart mcporter after Chrome starts
- Check mcporter logs for connection errors

## Available Tools

- chrome-devtools.getVersion [no args]
- chrome-devtools.getTabs [targetId]
- chrome-devtools.navigateToUrl [url]
- chrome-devtools.takeScreenshot [targetId]
- chrome-devtools.clickElement [targetId, selector]
- chrome-devtools.fillFormField [targetId, selector, value]
- chrome-devtools.getPageContent [targetId]
- chrome-devtools.evaluateScript [targetId, script]
- chrome-devtools.getConsoleOutput [targetId]

## Quick Reference

| Task | mcporter Call |
|------|---------------|
| Check Chrome listening | `mcporter call chrome-devtools.getVersion` |
| List browser tabs | `mcporter call chrome-devtools.getTabs --targetId=<id>` |
| Take screenshot | `mcporter call chrome-devtools.takeScreenshot --targetId=<id>` |
| Click element | `mcporter call chrome-devtools.clickElement --targetId=<id> --selector='#login'` |
| Fill form field | `mcporter call chrome-devtools.fillFormField --targetId=<id> --selector='#email' --value='test@example.com'` |
| Get page content | `mcporter call chrome-devtools.getPageContent --targetId=<id>` |
| Navigate to URL | `mcporter call chrome-devtools.navigateToUrl --targetId=<id> --url='http://localhost:3000'` |
| Run JavaScript | `mcporter call chrome-devtools.evaluateScript --targetId=<id> --script='document.title'` |
| Read console | `mcporter call chrome-devtools.getConsoleOutput --targetId=<id>` |

## Common Workflows

### 1. Inspect Web Application State

```
You: "Navigate to http://localhost:3000 and take a screenshot"
Claude uses Chrome DevTools MCP → Takes screenshot → Returns visual state
```

### 2. Debug JavaScript Errors

```
You: "Open DevTools console and read the error messages"
Claude uses Chrome DevTools MCP → Reads console → Explains errors
```

### 3. Automated Testing/Validation

```
You: "Fill the form with test data and submit it"
Claude uses Chrome DevTools MCP → Automates interaction → Reports results
```

### 4. DOM Inspection

```
You: "Find the login button and tell me its HTML"
Claude uses Chrome DevTools MCP → Inspects element → Returns HTML/attributes
```

## Troubleshooting

### "Failed to connect to Chrome"

**Cause:** Chrome not running or not listening on port 9222
**Fix:**

```bash
# Kill any existing Chrome processes
killall chrome
# Launch with debugging enabled
google-chrome --remote-debugging-port=9222 &
# Verify with curl (should return JSON)
curl http://127.0.0.1:9222/json/version
```

### "mcporter can't find chrome-devtools-mcp command"

**Cause:** `chrome-devtools-mcp` not installed globally or in PATH
**Fix:**

```bash
# Install globally
npm install -g chrome-devtools-mcp
# Verify installation
which chrome-devtools-mcp
# Then restart mcporter
```

### "Port 9222 already in use"

**Cause:** Another process (often existing Chrome) using the debugging port
**Fix:**

```bash
# Find what's using 9222
lsof -i :9222
# Kill that process, then restart Chrome with debugging
kill -9 <PID>
google-chrome --remote-debugging-port=9222 &
```

### "Browser DevTools MCP doesn't appear in mcporter after config"

**Cause:** Config syntax error, mcporter not reloaded, or Chrome not running
**Fix (in order):**

1. **Validate JSON syntax:**

   ```bash
   jq . mcporter.json > /dev/null
   # Silent exit = valid JSON. Error output = syntax problem
   ```

   Or with bun:

   ```bash
   bun run -e "import('./mcporter.json')"
   ```

2. **Verify Chrome is still running:**

   ```bash
   curl http://127.0.0.1:9222/json/version
   # Should return JSON with Chrome version
   ```

3. **Check mcporter logs for errors:**

   ```bash
   mcporter --debug
   # Logs print to terminal (stdout). Look for "chrome-devtools" connection attempts
   # or "Failed to load" messages
   ```

4. **Restart mcporter:**

   ```bash
   # Kill any running mcporter
   pkill mcporter
   # Start fresh
   mcporter
   ```

5. **If chrome-devtools-mcp still missing:**

   ```bash
   npm install -g chrome-devtools-mcp
   # Restart mcporter again
   ```

**Expected outcome:** After valid config and Chrome running, Chrome DevTools MCP should appear in Claude/OpenCode tool list immediately.

## Common Mistakes

**❌ Forgetting to launch Chrome first**
Starting mcporter without Chrome listening on 9222 = immediate connection failure. Chrome MUST be running BEFORE you start mcporter.

**✅ Always:** Launch Chrome first, then mcporter. Verify with `curl http://127.0.0.1:9222/json/version` before touching mcporter.json.

**❌ Changing --browser-url to different port**
The default Chrome debugging port is 9222. Only change this if you explicitly launched Chrome with a different port (e.g., `--remote-debugging-port=9223`). If you change the port in --browser-url but Chrome is on 9222, connection fails.

**✅ Check:** Always verify your Chrome launch command matches the --browser-url setting.

**❌ Mixing Chrome instances**
Running system Chrome + Chromium + Chrome Canary on same port = unpredictable behavior, connection timeouts, or wrong window accessed.

**✅ Use:** One dedicated Chrome instance for mcporter debugging. Kill others first.

**❌ mcporter.json in wrong location**
File must be at `/mnt/Store/Projects/Mine/Github/Dotfiles/devtools/files/mcporter/mcporter.json` (the standard location mcporter reads from).

**✅ Check:** Verify mcporter finds your config with `mcporter --config-path` or check mcporter docs.

**❌ Assuming mcporter auto-detects Chrome**
mcporter requires explicit chrome-devtools entry with correct --browser-url. It won't magically connect.

**✅ Always:** Add complete chrome-devtools block to mcpServers object in mcporter.json

## File References

- **mcporter config:** `/mnt/Store/Projects/Mine/Github/Dotfiles/devtools/files/mcporter/mcporter.json`
- **Related skill:** `devtools/mise` (for Node/tool management)

## Real-World Impact

Integrating Chrome DevTools MCP into mcporter enables:

- Live browser debugging alongside Claude conversations
- Automated form filling and interaction testing
- Visual feedback on application behavior
- Immediate error diagnostics from console logs
- Screenshot-based validation workflows

Without this integration, debugging web applications requires context-switching between browser and Claude.
