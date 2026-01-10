# Research: Subagent Extension Structure

## Summary

The subagent extension is a tool for delegating tasks to specialized AI agents with isolated contexts. It currently has a tool interface but no slash commands for managing agent definitions. This research documents the current structure and patterns for implementing slash commands.

## Current Structure

### Directory Layout
```
devtools/files/pi/agent/extensions/subagent/
├── index.ts              # Main extension entry point
├── agents.ts             # Agent discovery logic
├── agents/               # Sample agent definitions (markdown)
│   ├── scout.md
│   ├── planner.md
│   ├── reviewer.md
│   └── worker.md
└── prompts/              # Workflow presets
    ├── implement.md
    ├── scout-and-plan.md
    └── implement-and-review.md
```

### Agent Definitions

Agents are markdown files with YAML frontmatter:

```markdown
---
name: my-agent
description: What this agent does
tools: read, grep, find, ls
model: claude-haiku-4-5
---

System prompt for the agent goes here.
```

**Agent Locations:**
- `~/.pi/agent/agents/*.md` - User-level (always loaded)
- `.pi/agents/*.md` - Project-level (opt-in with `agentScope: "project"` or `"both"`)

### Agent Discovery

From `agents.ts`, the extension discovers agents by:
1. Scanning `~/.pi/agent/agents/` directory
2. Optionally scanning `.pi/agents/` (project-local, requires agentScope setting)
3. Parsing YAML frontmatter from markdown files
4. Building `AgentConfig` objects with name, description, tools, model

### Current Tool Interface

The extension registers one tool: `pi_subagent` with parameters:
- **Single mode**: `{ agent, task }`
- **Parallel mode**: `{ tasks: [...] }`
- **Chain mode**: `{ chain: [...] }`

No slash commands currently exist.

## Slash Command Pattern (from ralph-wiggum)

### Registration Pattern

```typescript
pi.registerCommand("command-name", {
  description: "Command description",
  handler: async (args, ctx) => {
    // Parse args
    const [subcommand] = args.trim().split(/\s+/);
    
    // Route to subcommand handlers
    const handler = commands[subcommand];
    if (handler) {
      handler(args.slice(subcommand.length).trim(), ctx);
    } else {
      ctx.ui.notify(HELP, "info");
    }
  },
});
```

### Subcommand Router Pattern

```typescript
const commands: Record<string, (args: string, ctx: any) => void> = {
  start: (args, ctx) => { /* implementation */ },
  stop: (args, ctx) => { /* implementation */ },
  list: (args, ctx) => { /* implementation */ },
  // ... more subcommands
};
```

### Context Available

- `ctx.cwd` - Current working directory
- `ctx.ui.notify(message, type)` - Show notifications
- `ctx.isIdle()` - Check if agent is busy
- `ctx.hasUI` - Check if UI is available

## Key Findings

1. **No existing slash commands** - The subagent extension only has tool interface
2. **Agent discovery is automatic** - Scans directories on each invocation
3. **Two agent scopes** - User-level (always) and project-level (opt-in)
4. **Markdown-based definitions** - YAML frontmatter + markdown content
5. **Ralph-wiggum provides pattern** - Good reference for command registration

## References

- `/devtools/files/pi/agent/extensions/subagent/README.md` - Extension documentation
- `/devtools/files/pi/agent/extensions/subagent/index.ts` - Main implementation
- `/devtools/files/pi/agent/extensions/subagent/agents.ts` - Agent discovery
- `/devtools/files/pi/agent/extensions/ralph-wiggum/index.ts:557-650` - Command registration pattern

## Confidence Level

**9/10** - Clear understanding of structure and patterns. Implementation is straightforward following ralph-wiggum example.
