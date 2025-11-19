# MCPorter TypeScript API - Implementation Guide

Quick reference for implementing mcporter in production.

## Quick Start (5 minutes)

### 1. Install

```bash
npm install mcporter
# Requires Node.js v20.19.0+ or v22.12.0+
```

### 2. Initialize Runtime

```typescript
import { createRuntime, createServerProxy } from 'mcporter';

// This auto-discovers servers from:
// - ~/.mcporter/mcporter.json (user config)
// - config/mcporter.json (project config)  
// - Cursor, Claude Desktop, VS Code imports
const runtime = await createRuntime();
```

### 3. Create Proxy & Call Tools

```typescript
// Get typed proxy for ergonomic access
const linear = createServerProxy(runtime, 'linear') as Record<
  string,
  (args: unknown) => Promise<CallResult>
>;

// Call tool - connection pooled automatically
const issues = await linear.listIssues({ assignee: 'me' });

// Results have helper methods
console.log(issues.text());      // Get as text
console.log(issues.json());      // Get as JSON
console.log(issues.markdown());  // Get as markdown
```

### 4. Clean Up

```typescript
// IMPORTANT: Close runtime to release resources
await runtime.close();
```

## Complete Example

```typescript
import { createRuntime, createServerProxy, type CallResult } from 'mcporter';

async function main() {
  // 1. Initialize (once per agent/service)
  const runtime = await createRuntime();

  try {
    // 2. Create proxies for servers you'll use
    const linear = createServerProxy(runtime, 'linear');
    const github = createServerProxy(runtime, 'github');

    // 3. Call tools (pooled connections)
    const issues = await linear.listIssues({ assignee: 'me' });
    const repos = await github.listRepositories({ owner: 'my-org' });

    // 4. Process results
    console.log('Issues:', issues.text());
    console.log('Repos:', repos.json());
  } finally {
    // 5. Clean up
    await runtime.close();
  }
}

main().catch(console.error);
```

## Configuration

### Minimal Config

Servers discovered automatically from editor configs. No action needed.

### Custom Server Config

Create `config/mcporter.json`:

```jsonc
{
  "mcpServers": {
    "my-custom-server": {
      "description": "My local server",
      "baseUrl": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "$env:MY_API_KEY"
      }
    },
    "my-stdio-server": {
      "description": "Local stdio MCP",
      "command": "bun",
      "args": ["run", "./my-server.ts"],
      "cwd": "./servers"
    }
  }
}
```

### Environment Variables

```bash
MCPORTER_CONFIG=/path/to/config.json    # Override config location
MCPORTER_LOG_LEVEL=debug                # Set log level
MCPORTER_OAUTH_TIMEOUT_MS=30000        # OAuth timeout
MCPORTER_LIST_TIMEOUT=30000            # List timeout
MCPORTER_CALL_TIMEOUT=30000            # Call timeout
```

## Typing Tools

### Manual Typing

```typescript
interface LinearAPI {
  listIssues(args: { assignee?: string }): Promise<CallResult>;
  createIssue(args: { title: string; team: string }): Promise<CallResult>;
  getIssue(args: { id: string }): Promise<CallResult>;
}

const runtime = await createRuntime();
const linear = createServerProxy(runtime, 'linear') as LinearAPI;

// Now type-checked!
const result = await linear.listIssues({ assignee: 'me' });
// const wrong = await linear.unknownTool({});  // ✗ Type error!
```

### Auto-Generate Types

Generate TypeScript types from any MCP server:

```bash
npx mcporter emit-ts linear --out ./types/linear.d.ts
npx mcporter emit-ts linear --mode client --out ./clients/linear.ts
```

## Pattern: Singleton Runtime

For applications making repeated calls:

```typescript
// Create module-level singleton
let globalRuntime: Runtime | null = null;

export async function getRuntime(): Promise<Runtime> {
  if (!globalRuntime) {
    globalRuntime = await createRuntime();
    // Clean up on exit
    process.on('exit', () => globalRuntime?.close());
  }
  return globalRuntime;
}

// Usage everywhere
const runtime = await getRuntime();
const linear = createServerProxy(runtime, 'linear');
const result = await linear.listIssues({ assignee: 'me' });
```

## Pattern: Agent Tool Hook

Integrating with agents:

```typescript
import { createRuntime } from 'mcporter';

interface ToolCall {
  serverName: string;
  toolName: string;
  args: Record<string, unknown>;
}

export async function runAgentToolCall(call: ToolCall) {
  const runtime = await getRuntime(); // Reuses singleton
  const result = await runtime.callTool(
    call.serverName,
    call.toolName,
    { args: call.args }
  );

  return {
    text: typeof result === 'object' && 'text' in result ? (result as any).text() : String(result),
    json: typeof result === 'object' && 'json' in result ? (result as any).json() : result,
    raw: result,
  };
}
```

## Pattern: Error Recovery

```typescript
async function robustCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  backoffBase: number = 100
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const wait = backoffBase * Math.pow(2, attempt);
      console.warn(`Retry in ${wait}ms:`, error);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw new Error('Should not reach');
}

// Usage
const result = await robustCall(
  () => linear.listIssues({ assignee: 'me' }),
  3  // Try 3 times
);
```

## Pattern: Parallel Calls (Same Server)

When calling multiple tools on same server, they share the pooled connection:

```typescript
const runtime = await createRuntime();
const linear = createServerProxy(runtime, 'linear');

// All these reuse the SAME connection
const [issues, docs, automations] = await Promise.all([
  linear.listIssues({ assignee: 'me' }),
  linear.listDocuments(),
  linear.listAutomations(),
]);

await runtime.close();
```

## Pattern: Multi-Server Composition

```typescript
const runtime = await createRuntime();

// Different servers - different pooled connections
const linear = createServerProxy(runtime, 'linear');
const github = createServerProxy(runtime, 'github');
const vercel = createServerProxy(runtime, 'vercel');

// Compose across servers
const issues = await linear.searchDocumentation({ query: 'API' });
const repos = await github.searchRepositories({ query: 'typescript' });
const deployments = await vercel.getDeployments();

// All using pooled connections efficiently
await runtime.close();
```

## Debugging

### Enable Logging

```typescript
const runtime = await createRuntime({
  logger: {
    debug: (msg) => console.log('[DEBUG]', msg),
    info: (msg) => console.log('[INFO]', msg),
    warn: (msg) => console.warn('[WARN]', msg),
    error: (msg) => console.error('[ERROR]', msg),
  },
});
```

### Check Available Servers

```bash
npx mcporter list
npx mcporter list --json
```

### List Tools for Server

```bash
npx mcporter list linear
npx mcporter list linear --all-parameters
```

### Get Tool Signature

```bash
npx mcporter list linear.list_issues
npx mcporter list linear.create_issue
```

### Test Tool Call

```bash
npx mcporter call linear.list_issues assignee:me
npx mcporter call 'linear.list_issues(assignee: "me")'
```

### Debug Connection Issues

```bash
# Enable daemon logging
mcporter daemon start --log

# Check daemon status
mcporter daemon status

# Monitor specific server
mcporter daemon start --log-servers linear

# Stop daemon
mcporter daemon stop
```

## Performance Tuning

### Connection Pooling Settings

Currently not configurable via API - mcporter manages automatically.
Only connection management: `runtime.close()` when done.

### Result Caching

Results NOT automatically cached - cache manually if needed:

```typescript
const cache = new Map<string, CallResult>();

async function cachedCall(
  key: string,
  fn: () => Promise<CallResult>,
  ttlMs: number = 60000
): Promise<CallResult> {
  const cached = cache.get(key);
  if (cached) return cached;

  const result = await fn();
  cache.set(key, result);

  setTimeout(() => cache.delete(key), ttlMs);
  return result;
}

// Usage
const issues = await cachedCall(
  'my-issues',
  () => linear.listIssues({ assignee: 'me' }),
  300000  // 5 minutes
);
```

### Schema Caching

Schemas cached automatically in `~/.mcporter/.schema-cache/`.
Clear if needed:

```bash
rm -rf ~/.mcporter/.schema-cache/
```

## Testing

### Mock Runtime for Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createServerProxy } from 'mcporter';

describe('my agent', () => {
  it('calls linear', async () => {
    // Create mock runtime
    const mockRuntime = {
      callTool: vi.fn().mockResolvedValue({
        text: () => 'Issue #1',
        json: () => ({ id: '1', title: 'Test' }),
      }),
      listTools: vi.fn(),
      close: vi.fn(),
    };

    const linear = createServerProxy(mockRuntime as any, 'linear');
    const result = await linear.listIssues({ assignee: 'me' });

    expect(result.text()).toBe('Issue #1');
    expect(mockRuntime.callTool).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
describe('linear integration', () => {
  let runtime: Runtime;

  beforeAll(async () => {
    runtime = await createRuntime();
  });

  afterAll(async () => {
    await runtime.close();
  });

  it('lists issues', async () => {
    const linear = createServerProxy(runtime, 'linear');
    const result = await linear.listIssues({});
    expect(result.text()).toBeDefined();
  });
});
```

## Security Considerations

### OAuth Tokens

Tokens cached in `~/.mcporter/<server>/`:
```
~/.mcporter/linear/token.json
~/.mcporter/vercel/token.json
```

- ✅ Auto-refreshed before expiration
- ✅ File permissions: 0600 (user-read-write only)
- ⚠️ Store in git-ignored directory
- ⚠️ Don't commit token files

### Environment Variables

```jsonc
{
  "mcpServers": {
    "my-server": {
      "headers": {
        "Authorization": "$env:MY_API_KEY",  // ✅ Use env vars
        "X-Secret": "hardcoded-secret"       // ❌ Never hardcode!
      }
    }
  }
}
```

### Config File Permissions

```bash
chmod 600 config/mcporter.json
chmod 600 ~/.mcporter/mcporter.json
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "No config found" | No mcporter config | Create `config/mcporter.json` or use inline server |
| "Connection refused" | Server not running | Start server or check config |
| "HTTP 401" | Auth issue | Run `mcporter auth <server>` |
| "Tool not found" | Wrong tool name | Run `mcporter list <server>` to see names |
| "Timeout" | Slow server | Increase timeout: `MCPORTER_CALL_TIMEOUT=60000` |
| Node version error | Node too old | Requires v20.19+ or v22.12+, run `nvm install 22` |

## Migration from CLI

### Before (CLI in scripts)

```bash
# Spawns new process each time
npx mcporter call linear.list_issues assignee:me
npx mcporter call linear.list_issues state:CLOSED
npx mcporter call linear.search_documentation query:"API"
```

### After (TypeScript API)

```typescript
const runtime = await createRuntime();
const linear = createServerProxy(runtime, 'linear');

// All reuse same connection, 8-15x faster
const open = await linear.listIssues({ assignee: 'me' });
const closed = await linear.listIssues({ state: 'CLOSED' });
const docs = await linear.searchDocumentation({ query: 'API' });

await runtime.close();
```

## Resources

- **Docs**: https://github.com/steipete/mcporter#readme
- **GitHub**: https://github.com/steipete/mcporter
- **NPM**: https://www.npmjs.com/package/mcporter
- **MCP Spec**: https://modelcontextprotocol.io/

## Next Steps

1. ✅ Install: `npm install mcporter`
2. ✅ Create config: `config/mcporter.json` (optional)
3. ✅ Initialize: `const runtime = await createRuntime()`
4. ✅ Type tools: Define interfaces or generate types
5. ✅ Call tools: `await proxy.toolName(args)`
6. ✅ Clean up: `await runtime.close()`
7. ✅ Deploy: No breaking changes - just works!
