# Firefox DevTools Skill - Usage Guide

A comprehensive guide to using the Firefox DevTools skill for debugging web applications.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Setup](#basic-setup)
3. [Common Workflows](#common-workflows)
4. [Advanced Usage](#advanced-usage)
5. [Integration Examples](#integration-examples)
6. [Troubleshooting](#troubleshooting)

## Quick Start

### Minimal Setup (30 seconds)

```bash
# Launch Firefox with remote debugging enabled
firefox --remote-debugging-port 6000 &

# In your Node.js application
const { RDPClient } = require('firefox-rdp');
const client = new RDPClient({ host: 'localhost', port: 6000 });
await client.connect();
console.log('Connected to Firefox!');
```

### What You Get

- Remote access to Firefox browser internals
- Programmatic DOM inspection and manipulation
- JavaScript debugging with breakpoints
- Network request monitoring
- Console command execution
- Performance profiling

---

## Basic Setup

### Step 1: Enable Firefox Remote Debugging

#### Option A: Launch with CLI Flag
```bash
firefox --remote-debugging-port 6000
```

#### Option B: Configure Profile
```bash
# Create/use a debug profile
firefox -profile ~/.mozilla/firefox/debug-profile \
         --remote-debugging-port 6000
```

#### Option C: Environment Variables
```bash
export MOZ_REMOTE_DEBUG_PORT=6000
export MOZ_PROFILER_STARTUP=1
firefox
```

### Step 2: Verify Connection

```bash
# Check Firefox is listening
lsof -i :6000

# Test with curl (WebSocket upgrade request)
curl -i http://localhost:6000
```

### Step 3: Create RDP Client

**Node.js/TypeScript:**
```typescript
import { RDPClient } from 'firefox-rdp';

const client = new RDPClient({
  host: 'localhost',
  port: 6000
});

await client.connect();
const tabs = await client.listTabs();
console.log('Available tabs:', tabs);
await client.disconnect();
```

**Python:**
```python
import asyncio
from firefox_rdp import RDPClient

async def main():
    client = RDPClient(host='localhost', port=6000)
    await client.connect()
    tabs = await client.list_tabs()
    print(f"Available tabs: {tabs}")
    await client.disconnect()

asyncio.run(main())
```

---

## Common Workflows

### Workflow 1: Inspect DOM Elements

```typescript
const client = new RDPClient({ host: 'localhost', port: 6000 });
await client.connect();

// Get the first tab
const tabs = await client.listTabs();
const tab = tabs[0];

// Get inspector actor
const inspector = await tab.getActor('inspector');

// Inspect specific element
const bodyElement = await inspector.querySelector('body');
const attributes = await bodyElement.getAttributes();

console.log('Body attributes:', attributes);
// Output: { class: 'dark-mode', data-theme: 'night' }

await client.disconnect();
```

### Workflow 2: Execute Console Commands

```typescript
const client = new RDPClient({ host: 'localhost', port: 6000 });
await client.connect();

const tabs = await client.listTabs();
const tab = tabs[0];

// Get console actor
const console = await tab.getActor('console');

// Execute JavaScript
const result = await console.evaluateJS('document.title');
console.log('Page title:', result.value);

// Query DOM
const bodyClass = await console.evaluateJS(
  'document.body.className'
);
console.log('Body class:', bodyClass.value);

// Get performance data
const perfData = await console.evaluateJS('performance.now()');
console.log('Current time:', perfData.value);

await client.disconnect();
```

### Workflow 3: Debug JavaScript with Breakpoints

```typescript
const client = new RDPClient({ host: 'localhost', port: 6000 });
await client.connect();

const tabs = await client.listTabs();
const tab = tabs[0];

// Get debugger actor
const debugger = await tab.getActor('debugger');

// Set breakpoint at specific line
await debugger.setBreakpoint({
  location: {
    scriptId: 'app.js',
    line: 42,
    column: 0
  }
});

// Listen for pause events (breakpoint hit)
debugger.on('paused', (event) => {
  console.log('Debugger paused at:', event.frame);
  // Inspect variables, step through code, etc.
});

// Resume execution
await debugger.resume();

await client.disconnect();
```

### Workflow 4: Monitor Network Requests

```typescript
const client = new RDPClient({ host: 'localhost', port: 6000 });
await client.connect();

const tabs = await client.listTabs();
const tab = tabs[0];

// Get network monitor actor
const networkMonitor = await tab.getActor('networkMonitor');

// Listen for requests
networkMonitor.on('request', (request) => {
  console.log(`${request.method} ${request.url}`);
  console.log(`Headers:`, request.headers);
});

// Listen for responses
networkMonitor.on('response', (response) => {
  console.log(`Response: ${response.status} ${response.statusText}`);
  console.log(`Size: ${response.contentLength} bytes`);
});

await client.disconnect();
```

### Workflow 5: Performance Profiling

```typescript
const client = new RDPClient({ host: 'localhost', port: 6000 });
await client.connect();

const tabs = await client.listTabs();
const tab = tabs[0];

// Get performance actor
const performance = await tab.getActor('performance');

// Start profiling
await performance.startProfiling();

// Wait for application to perform work
setTimeout(async () => {
  // Stop profiling
  const profile = await performance.stopProfiling();
  
  console.log('Profile duration:', profile.duration, 'ms');
  console.log('Samples collected:', profile.samples.length);
  
  // Analyze top functions
  profile.samples
    .slice(0, 10)
    .forEach((sample) => {
      console.log(`  ${sample.functionName}: ${sample.time}ms`);
    });
  
  await client.disconnect();
}, 5000);
```

---

## Advanced Usage

### Multi-Tab Debugging

```typescript
const client = new RDPClient({ host: 'localhost', port: 6000 });
await client.connect();

// Get all tabs
const tabs = await client.listTabs();

// Create handlers for each tab
const debuggers = await Promise.all(
  tabs.map(async (tab) => ({
    tab,
    console: await tab.getActor('console'),
    inspector: await tab.getActor('inspector')
  }))
);

// Debug all tabs simultaneously
debuggers.forEach(({ tab, console: consoleActor }) => {
  console.log(`Tab: ${tab.title}`);
  consoleActor.evaluateJS('document.title')
    .then((result) => {
      console.log(`  Title: ${result.value}`);
    });
});

await client.disconnect();
```

### Custom Port Configuration

```typescript
// Use different ports for different scenarios
const ports = {
  development: 6000,
  testing: 6001,
  staging: 6002,
  ci: 6003
};

const environment = process.env.NODE_ENV || 'development';
const debugPort = ports[environment];

const client = new RDPClient({
  host: 'localhost',
  port: debugPort
});

await client.connect();
console.log(`Connected on port ${debugPort}`);
```

### Handling Long-Running Sessions

```typescript
const client = new RDPClient({ host: 'localhost', port: 6000 });
await client.connect();

try {
  // Implement heartbeat
  const heartbeat = setInterval(async () => {
    try {
      const tabs = await client.listTabs();
      console.log(`Heartbeat: ${tabs.length} tabs active`);
    } catch (error) {
      console.error('Heartbeat failed:', error);
      clearInterval(heartbeat);
    }
  }, 30000); // Every 30 seconds

  // Do your work
  const tabs = await client.listTabs();
  // ... debugging operations ...

  clearInterval(heartbeat);
} finally {
  await client.disconnect();
}
```

### Error Recovery and Retry Logic

```typescript
const client = new RDPClient({ host: 'localhost', port: 6000 });

async function connectWithRetry(maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await client.connect();
      console.log('Connected successfully');
      return;
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxAttempts) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error(`Failed to connect after ${maxAttempts} attempts`);
      }
    }
  }
}

await connectWithRetry();
```

---

## Integration Examples

### Integration: Webpack Dev Server

```javascript
// webpack.config.js
module.exports = {
  mode: 'development',
  devServer: {
    port: 3000,
    client: {
      logging: 'info',
      overlay: true
    },
    // Add custom headers for Firefox debugging
    headers: {
      'X-Debugger-Enabled': 'true',
      'X-Debug-Port': '6000'
    }
  },
  devtool: 'eval-source-map'
};
```

### Integration: Vite

```javascript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    headers: {
      'X-Debugger-Enabled': 'true',
      'X-Debug-Port': '6000'
    }
  }
});
```

### Integration: VS Code Debug Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Firefox Debug",
      "type": "firefox",
      "request": "attach",
      "url": "http://localhost:3000",
      "port": 6000,
      "pathMapping": {
        "/": "${workspaceFolder}/src/",
        "http://localhost:3000/": "${workspaceFolder}/src/"
      },
      "console": "integratedTerminal",
      "firefoxExecutable": "/usr/bin/firefox"
    }
  ]
}
```

### Integration: Docker Compose

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - '3000:3000'
      - '6000:6000'
    environment:
      MOZ_REMOTE_DEBUG_PORT: '6000'
      MOZ_PROFILER_STARTUP: '1'
      NODE_ENV: development

  firefox:
    image: firefox:latest
    ports:
      - '6000:6000'
    environment:
      MOZ_REMOTE_DEBUG_PORT: '6000'
    command: firefox --remote-debugging-port 6000
```

### Integration: Mise Configuration

```toml
[tools.firefox]
version = "latest"

[tools.firefox.env]
MOZ_REMOTE_DEBUG_PORT = "6000"
MOZ_PROFILER_STARTUP = "1"
```

### Integration: npm Scripts

```json
{
  "scripts": {
    "dev": "webpack serve & firefox --remote-debugging-port 6000",
    "debug": "node --inspect-brk ./scripts/debug.js",
    "test:debug": "jest --detectOpenHandles",
    "debug:watch": "nodemon --exec 'npm run debug' -- src/"
  }
}
```

---

## Troubleshooting

### Issue: Connection Refused

**Symptom**: `Error: ECONNREFUSED 127.0.0.1:6000`

**Solutions**:
```bash
# Check if Firefox is running
ps aux | grep firefox

# Verify port is listening
lsof -i :6000

# Start Firefox with debugging explicitly
firefox --remote-debugging-port 6000 &
```

### Issue: Port Already in Use

**Symptom**: `Error: listen EADDRINUSE :::6000`

**Solutions**:
```bash
# Find process using port 6000
lsof -i :6000

# Kill the process
kill -9 <PID>

# Use alternative port
firefox --remote-debugging-port 7000 &
client = new RDPClient({ port: 7000 });
```

### Issue: Debugger Not Responding

**Symptom**: Timeout or frozen state

**Solutions**:
```javascript
// Add explicit timeout
const client = new RDPClient({
  host: 'localhost',
  port: 6000,
  timeout: 5000
});

// Implement connection timeout
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Connection timeout')), 5000)
);

await Promise.race([
  client.connect(),
  timeoutPromise
]);
```

### Issue: Security/CORS Errors

**Symptom**: `Error: Origin not allowed`

**Solutions**:
```javascript
const client = new RDPClient({ host: 'localhost', port: 6000 });

// Set origin header
client.setOriginHeader('http://localhost:3000');

// Or configure Firefox preferences
// about:config → devtools.debugger.cors-enabled = true
```

### Issue: Memory Leak in Long Sessions

**Symptom**: Firefox memory usage increases continuously

**Solutions**:
```javascript
// Properly cleanup resources
const client = new RDPClient({ host: 'localhost', port: 6000 });

try {
  await client.connect();
  // Use client...
} finally {
  // Always disconnect
  await client.disconnect();
}

// Or use async context manager pattern
async function withClient(fn) {
  const client = new RDPClient({ host: 'localhost', port: 6000 });
  try {
    await client.connect();
    return await fn(client);
  } finally {
    await client.disconnect();
  }
}

await withClient(async (client) => {
  // Use client in scope
});
```

---

## Best Practices

### 1. Always Disconnect

```typescript
const client = new RDPClient(config);
try {
  await client.connect();
  // ... use client
} finally {
  await client.disconnect(); // Always clean up
}
```

### 2. Use Connection Pooling

```typescript
class RDPClientPool {
  constructor(size = 5) {
    this.size = size;
    this.clients = [];
  }

  async getClient() {
    if (this.clients.length < this.size) {
      const client = new RDPClient(config);
      await client.connect();
      this.clients.push(client);
      return client;
    }
    return this.clients[0]; // Reuse existing
  }
}
```

### 3. Handle Timeouts

```typescript
const client = new RDPClient({
  host: 'localhost',
  port: 6000,
  timeout: 5000
});

const result = await Promise.race([
  client.listTabs(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 5000)
  )
]);
```

### 4. Log Operations

```typescript
const client = new RDPClient(config);

client.on('connect', () => console.log('Connected'));
client.on('disconnect', () => console.log('Disconnected'));
client.on('error', (err) => console.error('Error:', err));
```

### 5. Security First

```typescript
// Development only
if (process.env.NODE_ENV === 'production') {
  throw new Error('Firefox debugging disabled in production');
}

// Validate origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080'
];

if (!allowedOrigins.includes(origin)) {
  throw new Error('Origin not allowed');
}
```

---

## Next Steps

- **Basic**: Try the Quick Start example
- **Intermediate**: Explore Common Workflows
- **Advanced**: Implement Multi-Tab Debugging
- **Production**: Read Security Notes in main SKILL.md
- **Integration**: Follow Integration Examples for your build tool

For more information, see [SKILL.md](./SKILL.md)
