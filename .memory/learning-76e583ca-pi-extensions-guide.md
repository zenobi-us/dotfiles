# Learning: Pi Extensions Guide

**Created:** 2026-01-11  
**Source:** https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md  
**Type:** Technical Documentation  
**Category:** Pi Coding Agent Extensions

## Summary

Comprehensive guide to creating extensions for the Pi coding agent. Extensions are TypeScript modules that extend pi's behavior through custom tools, event interception, user interaction, custom UI components, commands, and session persistence.

## Key Capabilities

Extensions provide the following capabilities:

1. **Custom Tools** - Register tools the LLM can call via `pi.registerTool()`
2. **Event Interception** - Block or modify tool calls, inject context, customize compaction
3. **User Interaction** - Prompt users via `ctx.ui` (select, confirm, input, notify)
4. **Custom UI Components** - Full TUI components with keyboard input via `ctx.ui.custom()`
5. **Custom Commands** - Register commands like `/mycommand` via `pi.registerCommand()`
6. **Session Persistence** - Store state that survives restarts via `pi.appendEntry()`
7. **Custom Rendering** - Control how tool calls/results and messages appear in TUI

## Extension Locations

Extensions are auto-discovered from:

| Location | Scope |
|----------|-------|
| `~/.pi/agent/extensions/*.ts` | Global (all projects) |
| `~/.pi/agent/extensions/*/index.ts` | Global (subdirectory) |
| `.pi/extensions/*.ts` | Project-local |
| `.pi/extensions/*/index.ts` | Project-local (subdirectory) |

Additional paths can be specified in `settings.json`:
```json
{
  "extensions": ["/path/to/extension.ts", "/path/to/extension/dir"]
}
```

## Extension Structure

### Basic Structure

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Subscribe to events
  pi.on("event_name", async (event, ctx) => {
    // Handle event
  });

  // Register tools, commands, shortcuts, flags
  pi.registerTool({ ... });
  pi.registerCommand("name", { ... });
  pi.registerShortcut("ctrl+x", { ... });
  pi.registerFlag("--my-flag", { ... });
}
```

### Extension Styles

1. **Single file** - Simplest, for small extensions:
   ```
   ~/.pi/agent/extensions/my-extension.ts
   ```

2. **Directory with index.ts** - For multi-file extensions:
   ```
   ~/.pi/agent/extensions/my-extension/
   ├── index.ts
   ├── tools.ts
   └── utils.ts
   ```

3. **Package with dependencies** - For extensions needing npm packages:
   ```
   ~/.pi/agent/extensions/my-extension/
   ├── package.json
   ├── node_modules/
   └── src/index.ts
   ```

## Available Imports

| Package | Purpose |
|---------|---------|
| `@mariozechner/pi-coding-agent` | Extension types (ExtensionAPI, ExtensionContext, events) |
| `@sinclair/typebox` | Schema definitions for tool parameters |
| `@mariozechner/pi-ai` | AI utilities (StringEnum for Google-compatible enums) |
| `@mariozechner/pi-tui` | TUI components for custom rendering |

## Event System

### Lifecycle Overview

```
pi starts
  └─► session_start
      └─► user prompt
          ├─► before_agent_start (inject message, modify system prompt)
          ├─► agent_start
          │   ├─► turn_start
          │   ├─► context (modify messages)
          │   ├─► tool_call (can block)
          │   ├─► tool_result (can modify)
          │   └─► turn_end
          └─► agent_end
```

### Key Events

- **session_start** - Fired on initial session load
- **before_agent_start** - Before agent loop, can inject messages or modify system prompt
- **tool_call** - Before tool executes, can block execution
- **tool_result** - After tool executes, can modify result
- **session_before_compact** - Before compaction, can cancel or provide custom summary
- **session_shutdown** - On exit, for cleanup

## ExtensionAPI Methods

### Tool Registration

```typescript
pi.registerTool({
  name: "my_tool",
  label: "My Tool",
  description: "What this tool does",
  parameters: Type.Object({
    action: StringEnum(["list", "add"] as const),
    text: Type.Optional(Type.String()),
  }),
  async execute(toolCallId, params, onUpdate, ctx, signal) {
    // Implementation
    return {
      content: [{ type: "text", text: "Done" }],
      details: { result: "..." },
    };
  },
  renderCall(args, theme) { /* Custom rendering */ },
  renderResult(result, options, theme) { /* Custom rendering */ },
});
```

### Important Tool Practices

1. **Use StringEnum for enums** - `Type.Union`/`Type.Literal` doesn't work with Google's API
2. **Truncate output** - Keep within 50KB and 2000 lines using `truncateHead()` or `truncateTail()`
3. **Handle cancellation** - Check `signal?.aborted`
4. **Stream progress** - Use `onUpdate()` for long operations

### Other Methods

- `pi.registerCommand(name, options)` - Register slash commands
- `pi.registerShortcut(shortcut, options)` - Register keyboard shortcuts
- `pi.registerFlag(name, options)` - Register CLI flags
- `pi.sendMessage(message, options)` - Inject custom messages
- `pi.sendUserMessage(content, options)` - Send user messages
- `pi.appendEntry(customType, data)` - Persist extension state
- `pi.registerMessageRenderer(customType, renderer)` - Custom message rendering
- `pi.exec(command, args, options)` - Execute shell commands
- `pi.getActiveTools() / setActiveTools(names)` - Manage active tools
- `pi.setModel(model)` - Change the current model
- `pi.getThinkingLevel() / setThinkingLevel(level)` - Manage thinking level

## ExtensionContext (ctx)

Every handler receives `ctx: ExtensionContext`:

### UI Methods (`ctx.ui`)

```typescript
// Dialogs
const choice = await ctx.ui.select("Pick one:", ["A", "B", "C"]);
const ok = await ctx.ui.confirm("Delete?", "This cannot be undone");
const name = await ctx.ui.input("Name:", "placeholder");
const text = await ctx.ui.editor("Edit:", "prefilled text");

// Notifications (non-blocking)
ctx.ui.notify("Done!", "info");  // "info" | "warning" | "error"

// Status and widgets
ctx.ui.setStatus("my-ext", "Processing...");
ctx.ui.setWidget("my-widget", ["Line 1", "Line 2"]);
ctx.ui.setFooter((tui, theme) => ({ ... }));

// Custom components
const result = await ctx.ui.custom<T>((tui, theme, keybindings, done) => {
  return new MyComponent();
});
```

### Other Context Properties

- `ctx.hasUI` - False in print/JSON/RPC modes
- `ctx.cwd` - Current working directory
- `ctx.sessionManager` - Read-only access to session state
- `ctx.modelRegistry / ctx.model` - Access to models and API keys
- `ctx.isIdle() / ctx.abort() / ctx.hasPendingMessages()` - Control flow helpers
- `ctx.shutdown()` - Request graceful shutdown

## ExtensionCommandContext

Command handlers receive `ExtensionCommandContext` with additional methods:

- `ctx.waitForIdle()` - Wait for agent to finish streaming
- `ctx.newSession(options)` - Create a new session
- `ctx.branch(entryId)` - Branch from a specific entry
- `ctx.navigateTree(targetId, options)` - Navigate session tree

## State Management

Extensions with state should store it in tool result `details` for proper branching support:

```typescript
export default function (pi: ExtensionAPI) {
  let items: string[] = [];

  // Reconstruct state from session
  pi.on("session_start", async (_event, ctx) => {
    items = [];
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type === "message" && entry.message.role === "toolResult") {
        if (entry.message.toolName === "my_tool") {
          items = entry.message.details?.items ?? [];
        }
      }
    }
  });

  pi.registerTool({
    name: "my_tool",
    async execute(toolCallId, params, onUpdate, ctx, signal) {
      items.push("new item");
      return {
        content: [{ type: "text", text: "Added" }],
        details: { items: [...items] },  // Store for reconstruction
      };
    },
  });
}
```

## Custom UI Components

For complex UI, use `ctx.ui.custom()` to replace the editor temporarily:

```typescript
const result = await ctx.ui.custom<boolean>((tui, theme, keybindings, done) => {
  const component = new MyComponent();
  component.onKey = (key) => {
    if (key === "return") done(true);
    if (key === "escape") done(false);
    return true;
  };
  return component;
});
```

See `tui.md` documentation for the full component API.

## Overriding Built-in Tools

Extensions can override built-in tools (`read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`) by registering with the same name:

```typescript
pi.registerTool({
  name: "read",  // Overrides built-in read
  // ... must match exact result shape including details type
});
```

Alternatively, use `--no-tools` to start without any built-in tools:
```bash
pi --no-tools -e ./my-extension.ts
```

## Remote Execution

Built-in tools support pluggable operations for delegating to remote systems:

```typescript
import { createReadTool, type ReadOperations } from "@mariozechner/pi-coding-agent";

const remoteRead = createReadTool(cwd, {
  operations: {
    readFile: (path) => sshExec(remote, `cat ${path}`),
    access: (path) => sshExec(remote, `test -r ${path}`).then(() => {}),
  }
});
```

Operations interfaces: `ReadOperations`, `WriteOperations`, `EditOperations`, `BashOperations`, `LsOperations`, `GrepOperations`, `FindOperations`

## Output Truncation

Tools must truncate output to avoid overwhelming the LLM context. Built-in limit is 50KB and 2000 lines:

```typescript
import {
  truncateHead,
  truncateTail,
  formatSize,
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
} from "@mariozechner/pi-coding-agent";

async execute(toolCallId, params, onUpdate, ctx, signal) {
  const output = await runCommand();
  const truncation = truncateHead(output, {
    maxLines: DEFAULT_MAX_LINES,
    maxBytes: DEFAULT_MAX_BYTES,
  });

  let result = truncation.content;
  if (truncation.truncated) {
    const tempFile = writeTempFile(output);
    result += `\n\n[Output truncated: ${truncation.outputLines} of ${truncation.totalLines} lines`;
    result += ` (${formatSize(truncation.outputBytes)} of ${formatSize(truncation.totalBytes)}).`;
    result += ` Full output saved to: ${tempFile}]`;
  }

  return { content: [{ type: "text", text: result }] };
}
```

## Mode Behavior

| Mode | UI Methods | Notes |
|------|-----------|-------|
| Interactive | Full TUI | Normal operation |
| RPC | JSON protocol | Host handles UI |
| Print (`-p`) | No-op | Extensions run but can't prompt |

Always check `ctx.hasUI` before using UI methods in print mode.

## Example Use Cases

1. **Permission gates** - Confirm before dangerous operations (`rm -rf`, `sudo`)
2. **Git checkpointing** - Auto-stash at each turn, restore on branch
3. **Path protection** - Block writes to `.env`, `node_modules/`
4. **Custom compaction** - Summarize conversations your way
5. **Interactive tools** - Questions, wizards, custom dialogs
6. **Stateful tools** - Todo lists, connection pools
7. **External integrations** - File watchers, webhooks, CI triggers

## Testing Extensions

Test with the `--extension` or `-e` flag:

```bash
pi -e ./my-extension.ts
```

## Best Practices

1. **Error handling** - Extension errors are logged, agent continues
2. **State management** - Store state in tool `details` for branching support
3. **UI checks** - Check `ctx.hasUI` before using UI methods
4. **Truncation** - Always truncate large outputs
5. **Cancellation** - Check `signal?.aborted` in long operations
6. **Theme usage** - Use theme colors for consistent styling

## Related Documentation

- Full TUI component API: `tui.md`
- Compaction details: `compaction.md`
- Examples: `examples/extensions/` directory

## References

- **Source:** https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md
- **Examples location:** `examples/extensions/` in the pi-mono repository
- **Related docs:** 
  - `tui.md` - Complete TUI component patterns
  - `compaction.md` - Session compaction details
