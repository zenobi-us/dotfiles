# Learning: Subagent Extension Architecture

**Created:** 2026-01-16  
**Source:** Review of `devtools/files/pi/agent/extensions/subagent/`  
**Epic:** N/A (Documentation improvement)

## Summary

Comprehensive documentation of the Pi subagent extension architecture, patterns, and module organization for future reference and maintenance.

## Extension Architecture Overview

The subagent extension enables delegating tasks to specialized AI agents with isolated context windows. It runs each subagent as a separate `pi` subprocess.

### Module Structure

```
subagent/
├── index.ts         (~520 lines) - Tool registration, command dispatch, rendering
├── subagent.ts      (~160 lines) - Core subprocess execution and streaming
├── agents.ts        (~180 lines) - Agent discovery, parsing, search paths
├── formatting.ts    (~80 lines)  - Token formatting, tool call display
├── commands/        (~360 lines) - Management subcommands
│   ├── index.ts     - Command exports
│   ├── list.ts      - /subagent list
│   ├── add.ts       - /subagent add (with templates)
│   ├── edit.ts      - /subagent edit
│   ├── paths.ts     - /subagent paths
│   └── help.ts      - /subagent help
├── agents/          - Built-in agent definitions (markdown)
└── prompts/         - Workflow templates (registered as commands)
```

### Data Flow

```
User Request → index.ts (subagent tool) → agents.ts (discovery)
                    ↓
              subagent.ts (runSingleAgent)
                    ↓
              spawn("pi") subprocess with:
                --mode json
                -p (non-interactive)
                --no-session
                --model, --tools, --append-system-prompt
                    ↓
              Stream stdout JSON lines → parse → update UI
```

## Key Patterns

### 1. Agent Discovery System

**Search path hierarchy** (priority order):
1. Built-in: `<extension>/agents/*.md`
2. User: `~/.pi/agent/agents/*.md`
3. Project: `.pi/agents/*.md` (searched upward to git root)

**Key insight**: Project agents override user agents with the same name.

```typescript
// agents.ts - getAgentSearchPaths()
const searchPaths = [
  createSearchPath(PredicatableAgentPaths.Builtin),
  createSearchPath(PredicatableAgentPaths.User),
  // Project paths searched upward to git root
];
```

### 2. Agent Configuration Format

Agents are markdown files with YAML frontmatter:

```markdown
---
name: scout
description: Fast codebase recon
tools: read, grep, find, ls, bash
model: claude-haiku-4-5
---

System prompt content here...
```

**Frontmatter fields:**
- `name` - Agent identifier (defaults to filename without `.md`)
- `description` - Brief description (defaults to first line of body)
- `tools` - Comma-separated tool list (omit for all defaults)
- `model` - Model override (defaults to session default)

### 3. Execution Modes

| Mode | Parameters | Use Case |
|------|------------|----------|
| Single | `{ agent, task, cwd? }` | One agent, one task |
| Parallel | `{ tasks: [...] }` | Max 8 tasks, 4 concurrent |
| Chain | `{ chain: [...] }` | Sequential with `{previous}` placeholder |

**Chain mode example:**
```typescript
{
  chain: [
    { agent: "scout", task: "Find auth code" },
    { agent: "planner", task: "Plan improvements based on: {previous}" },
    { agent: "worker", task: "Implement plan: {previous}" }
  ]
}
```

### 4. Subprocess Communication

`subagent.ts` spawns `pi` with `--mode json` and parses NDJSON:

```typescript
// Key event types
{ type: "message_end", message: Message }  // Assistant response complete
{ type: "tool_result_end", message: Message }  // Tool result available
```

**Usage stats accumulated**:
- `input`, `output` - Token counts
- `cacheRead`, `cacheWrite` - Cache usage
- `cost` - Total cost
- `contextTokens` - Context window usage
- `turns` - Number of turns

### 5. Workflow Prompts

Prompts in `prompts/` are auto-registered as commands:

```markdown
---
description: Full implementation workflow
---
Use the subagent tool with chain parameter:
1. First, use "scout" to find code for: $@
2. Then, use "planner" to create plan using {previous}
3. Finally, use "worker" to implement {previous}
```

**Argument substitution:**
- `$@` or `$ARGUMENTS` - All arguments
- `$1`, `$2`, etc. - Individual arguments
- `${@:N}` - First N arguments

### 6. Result Rendering

Three display states:
1. **Collapsed**: Status icon, agent name, last 10 items, usage stats
2. **Expanded**: Full task, all tool calls, markdown output
3. **Streaming**: Live updates with running/done counts

**Tool call formatting** (mimics built-in display):
```typescript
formatToolCall("bash", { command: "ls -la" })  // → "$ ls -la"
formatToolCall("read", { path: "~/file.ts", offset: 10, limit: 20 })  // → "read ~/file.ts:10-30"
```

## Built-in Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `scout` | Haiku | Fast codebase reconnaissance, returns compressed context |
| `planner` | Sonnet | Creates implementation plans (read-only) |
| `reviewer` | Sonnet | Code review, quality/security analysis |
| `worker` | Sonnet | General-purpose implementation |

## Command Patterns

Commands follow a consistent pattern:

```typescript
// commands/list.ts
export function handleList(args: string, ctx: CommandContext) {
  const discovery = discoverAgents(ctx.cwd);
  if (agents.size === 0) {
    ctx.ui.notify(Messages.NoAgents(), "info");
    return;
  }
  ctx.ui.notify(renderAgentList(agents), "info");
}
```

**Pattern elements:**
1. Parse args from string
2. Use `ctx.cwd` for directory context
3. Use `ctx.ui.notify()` for output
4. Centralize messages in `Messages` object

## Error Handling

| Scenario | Handling |
|----------|----------|
| Exit code != 0 | Return error with stderr |
| stopReason "error" | Propagate LLM error message |
| stopReason "aborted" | User Ctrl+C kills subprocess |
| Chain failure | Stop at first error, report step |

## Concurrency Control

```typescript
const MAX_PARALLEL_TASKS = 8;
const MAX_CONCURRENCY = 4;

// Custom concurrency limiter
async function mapWithConcurrencyLimit<TIn, TOut>(
  items: TIn[],
  concurrency: number,
  fn: (item: TIn, index: number) => Promise<TOut>
): Promise<TOut[]>
```

## Best Practices Extracted

1. **Isolation**: Each subagent has its own context window - no cross-contamination
2. **Temp files**: System prompts written to temp files, cleaned up after execution
3. **Signal propagation**: Abort signals propagate SIGTERM → SIGKILL with timeout
4. **Fresh discovery**: Agents discovered on each invocation (allows editing mid-session)
5. **Mode separation**: Tool logic in `subagent.ts`, rendering in `index.ts`, discovery in `agents.ts`

## Future Considerations

- Agent aliases in frontmatter
- Inter-agent messaging beyond `{previous}`
- Agent-specific environment variables
- Delete command for removing agents
- Dry-run mode for debugging

## References

- `devtools/files/pi/agent/extensions/subagent/README.md` - User documentation
- `devtools/files/pi/agent/extensions/subagent/REFACTORING.md` - Code structure documentation
- `learning-76e583ca-pi-extensions-guide.md` - General Pi extensions guide
- `learning-d8d1c166-extension-command-patterns.md` - Command registration patterns
