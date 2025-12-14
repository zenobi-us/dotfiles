# Firefox DevTools Integration Skill

## Purpose
This skill enables seamless integration of Firefox Remote Debugging Protocol (RDP) for development workflows, similar to Chrome DevTools integration. It configures Firefox to accept remote debugging connections and provides tooling to interact with browser instances programmatically.

## Prerequisites
- Firefox 55+ (RDP support)
- Port 6000 available (or custom port)
- Remote debugging enabled
- Development environment setup

## Core Concepts

### Firefox Remote Debugging Protocol (RDP)
Unlike Chrome's Chrome DevTools Protocol (CDP), Firefox uses its own RDP over WebSocket connections on port 6000 by default.

**Key differences from Chrome:**
- **Transport**: WebSocket instead of WebSocket (similar, but different protocol implementation)
- **Default Port**: 6000 (vs Chrome's 9222)
- **Connection Type**: Target-agnostic (works with tabs, workers, extensions)
- **Authentication**: Optional origin header validation
- **Tools Available**: Inspector, Debugger, Console, Network, Performance, Storage

### Configuration Modes

#### 1. Standard Remote Debugging
Enable Firefox to accept remote debugging connections:
```bash
firefox --remote-debugging-port 6000
```

#### 2. Profile-Based Configuration
Create a Firefox profile with debugging pre-enabled:
```bash
firefox -profile /path/to/profile -remote-debugging-port 6000
```

#### 3. Environment Variable Setup
```bash
export MOZ_PROFILER_STARTUP=1
export MOZ_REMOTE_DEBUG_PORT=6000
firefox
```

## Implementation Steps

### Step 1: Enable Remote Debugging
```javascript
// Via about:config in Firefox
devtools.debugger.remote-enabled = true
devtools.chrome.enabled = true
devtools.debugger.prompt-connection = false
```

### Step 2: Connect DevTools Client
```javascript
// Node.js example using RDP client
const { RDPClient } = require('firefox-rdp');

const client = new RDPClient({
  host: 'localhost',
  port: 6000
});

client.connect()
  .then(() => console.log('Connected to Firefox'))
  .catch(err => console.error('Connection failed:', err));
```

### Step 3: Programmatic Debugging
Access browser capabilities through RDP:
- **Inspector**: DOM manipulation and inspection
- **Debugger**: JavaScript breakpoints and stepping
- **Console**: Execute scripts and view logs
- **Network**: Monitor and intercept requests
- **Performance**: Profile runtime performance
- **Storage**: Access cookies, localStorage, sessionStorage

## Integration Points

### 1. Mise Configuration
```toml
[tools.firefox-debug]
version = "latest"
env = { MOZ_REMOTE_DEBUG_PORT = "6000" }
```

### 2. Comtrya Provisioning
```yaml
action: shell
description: "Enable Firefox Remote Debugging"
command: |
  firefox-preferences \
    --set devtools.debugger.remote-enabled=true \
    --set devtools.chrome.enabled=true \
    --set devtools.debugger.prompt-connection=false
```

### 3. MCPort Configuration
Similar to chrome-devtools-mcporter, create Firefox equivalents:
```json
{
  "firefox-debug": {
    "binary": "firefox",
    "args": ["--remote-debugging-port", "6000"],
    "port": 6000,
    "protocol": "rdp"
  }
}
```

## Common Tasks

### Inspect DOM Elements
```javascript
const { Inspector } = await client.getActor('inspector');
const nodeActor = await inspector.querySelector('body');
const attributes = await nodeActor.getAttributes();
```

### Set JavaScript Breakpoint
```javascript
const { Debugger } = await client.getActor('debugger');
const script = await debugger.getScript({ url: 'file.js' });
await debugger.setBreakpoint({ location: { scriptId: script.id, line: 10 } });
```

### Execute Console Commands
```javascript
const { Console } = await client.getActor('console');
const result = await console.evaluateJS('window.location.href');
console.log(result.value);
```

### Monitor Network Requests
```javascript
const { NetworkMonitor } = await client.getActor('networkMonitor');
networkMonitor.on('request', (req) => {
  console.log(`${req.method} ${req.url}`);
});
```

## Tools and Libraries

### RDP Clients
- `firefox-rdp` - Raw RDP protocol client
- `webext-run` - Run and debug WebExtensions
- `firefox-launcher` - Programmatic Firefox launching

### Integration Tools
- `firefox-devtools-adapter` - Bridge between CDP and RDP
- `debug-protocol-converter` - Convert between Chrome CDP and Firefox RDP

### Development Tools
- Firefox DevTools itself (can connect to remote instances)
- Visual Studio Code extensions (Debugger for Firefox)
- WebStorm/IntelliJ built-in Firefox debugging

## Troubleshooting

### Connection Refused
**Cause**: Firefox not listening on RDP port
**Solution**:
```bash
# Verify Firefox is running with debugging enabled
ps aux | grep firefox.*6000
# Or explicitly launch with port
firefox --remote-debugging-port 6000 &
```

### Port Already in Use
**Solution**: Use custom port
```bash
firefox --remote-debugging-port 7000 &
# Then connect to localhost:7000
```

### Debugger Not Responding
**Solution**: Ensure prerequisites are met
```bash
# Check about:config settings
about:config → devtools.debugger.remote-enabled = true
# Restart Firefox and reconnect
```

### Authentication/Origin Errors
**Solution**: Configure CORS for RDP
```javascript
client.setOriginHeader('http://localhost:3000');
```

## Examples

### Full Debugging Session
```javascript
const { RDPClient } = require('firefox-rdp');

async function debugFirefox() {
  const client = new RDPClient({ host: 'localhost', port: 6000 });
  
  try {
    await client.connect();
    const tabs = await client.listTabs();
    const tab = tabs[0];
    
    const inspector = await tab.getActor('inspector');
    const console = await tab.getActor('console');
    
    // Inspect element
    const body = await inspector.querySelector('body');
    console.log('Body classes:', await body.getAttributes());
    
    // Execute console command
    const result = await console.evaluateJS('document.title');
    console.log('Page title:', result.value);
    
  } finally {
    await client.disconnect();
  }
}

debugFirefox().catch(console.error);
```

### Integration with Build Tools
```javascript
// webpack.config.js
module.exports = {
  devServer: {
    before(app) {
      app.use((req, res, next) => {
        res.setHeader('X-Debugger-Enabled', 'true');
        next();
      });
    }
  },
  // Connect to Firefox RDP for debugging
  devtool: 'eval-source-map'
};
```

## Performance Considerations

1. **RDP Overhead**: Remote debugging adds minimal overhead but disable in production
2. **Port Binding**: Use high-numbered ports (>6000) to avoid conflicts
3. **Connection Pooling**: Reuse RDP connections across multiple operations
4. **Memory**: Firefox with debugging enabled uses ~10-15% more memory

## Security Notes

- **Local Development Only**: Only enable RDP on localhost in development
- **Network Isolation**: Don't expose RDP port to untrusted networks
- **Session Management**: Disconnect clients when finished
- **Credential Storage**: Never log debugging credentials

## References

- [Mozilla Remote Debugging Protocol](https://wiki.mozilla.org/Remote_Debugging_Protocol)
- [Firefox WebDriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/)
- [DevTools Server](https://developer.mozilla.org/en-US/docs/Tools/Debugger)

## Related Skills

- `devtools/chrome-devtools-mcporter` - Chrome equivalent
- `superpowers/systematic-debugging` - General debugging methodology
- `experts/quality-security/debugger` - Debugging expert guidance
- `superpowers/frontend-developer` - Frontend development context

## Skill Metadata

- **Category**: DevTools Integration
- **Complexity**: Intermediate
- **Domain**: Browser Debugging, Development Tools
- **Platforms**: Linux, macOS, Windows
- **Languages**: JavaScript, TypeScript, Python (via RDP client)
- **Last Updated**: 2025-12-14
