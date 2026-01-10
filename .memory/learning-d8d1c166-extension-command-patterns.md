# Learning: Pi Extension Command Patterns

## Key Insights

### Command Registration Pattern
Pi extensions register commands using `pi.registerCommand()`:

```typescript
pi.registerCommand("command-name", {
  description: "Brief description",
  handler: async (args, ctx) => {
    // Handle command
  },
});
```

### Command Router Pattern

For commands with subcommands, use a router pattern:

```typescript
const commands: Record<string, (args: string, ctx: any) => void> = {
  subcommand1: handleSubcommand1,
  subcommand2: handleSubcommand2,
};

pi.registerCommand("parent-command", {
  description: "Main command description",
  handler: async (args, ctx) => {
    const [cmd] = args.trim().split(/\s+/);
    const handler = commands[cmd];
    if (handler) {
      handler(args.slice(cmd.length).trim(), ctx);
    } else {
      ctx.ui.notify(HELP_TEXT, "info");
    }
  },
});
```

### Key Benefits of This Pattern:
1. **Clean separation** - Each subcommand in its own function
2. **Easy to extend** - Add new commands by adding to router object
3. **Consistent help** - Single help text shown for unknown commands
4. **Type safety** - Command handlers have consistent signature

## Agent Discovery Pattern

The subagent extension uses a clean discovery mechanism:

```typescript
export function discoverAgents(cwd: string, scope: AgentScope): AgentDiscoveryResult {
  // 1. Determine directories to scan
  // 2. Load agents from each directory
  // 3. Handle scope precedence (project overrides user for "both")
  // 4. Return deduplicated agent list
}
```

Key points:
- Scans directories fresh on each invocation (allows live editing)
- Project agents override user agents with same name when scope is "both"
- Discovers by scanning .md files with YAML frontmatter
- Returns both agents list and project directory path

## Agent File Format Pattern

Agents are markdown files with YAML frontmatter:
```markdown
---
name: agent-name
description: Brief description
model: claude-sonnet-4-5
tools: read, grep, find, ls
---

System prompt goes here...
```

Key points:
- File name: `<agent-name>.md`
- Required fields: `name`, `description`
- Optional fields: `model`, `tools` (comma-separated)
- Body is the system prompt

## Command Router Pattern

From ralph-wiggum, learned the clean pattern for multi-subcommand slash commands:

```typescript
// 1. Define command handlers
const commands: Record<string, (args: string, ctx: any) => void> = {
  subcommand1: handleSubcommand1,
  subcommand2: handleSubcommand2,
};

// 2. Register main command with router
pi.registerCommand("mycommand", {
  description: "Brief description",
  handler: async (args, ctx) => {
    const [cmd] = args.trim().split(/\s+/);
    const handler = commands[cmd];
    if (handler) {
      handler(args.slice(cmd.length).trim(), ctx);
    } else {
      ctx.ui.notify(HELP_TEXT, "info");
    }
  },
});
```

This pattern:
- Routes subcommands cleanly
- Provides help text when no/invalid subcommand
- Allows each subcommand to have its own argument parsing

## Learning 2: Agent Discovery is File-System Based

The agent discovery mechanism scans directories for `.md` files and parses YAML frontmatter:
- User agents: `~/.pi/agent/agents/*.md`
- Project agents: `.pi/agents/*.md` (walked up from cwd)
- No caching - agents discovered fresh on each invocation
- Allows editing agents mid-session

This means:
- Commands can use `discoverAgents()` to get live agent list
- No need to maintain separate index or registry
- Changes to agent files take effect immediately on next invocation

## Learning 2: Agent File Format

Agents are markdown files with YAML frontmatter:

```markdown
---
name: agent-name
description: Brief description
model: claude-sonnet-4-5
tools: read, grep, find, ls
---

System prompt content here.
```

**Required fields:**
- `name` - Agent identifier
- `description` - Brief description

**Optional fields:**
- `tools` - Comma-separated tool list (inherits default if omitted)
- `model` - Model to use (defaults to extension setting)

The body after frontmatter becomes the system prompt.

## Learning 2: Two-Scope Agent System

**Context:** Pi supports both user-level and project-level agents with security model.

**Key Points:**
- **User scope** (`~/.pi/agent/agents/`): Always loaded, trusted
- **Project scope** (`.pi/agents/`): Repo-controlled, opt-in only
- Default behavior: Only load user agents
- Enable project agents with `agentScope: "project"` or `"both"`
- Project agents can override user agents (same name)
- Security model: project agents are repo-controlled prompts with tool access

**Lesson:** When implementing management commands, must respect security model:
- Default to user scope for safety
- Require explicit flag for project scope
- Warn users about project-local agents (repo-controlled prompts)

## Why This Matters
Project-local agents can execute arbitrary code via bash tool, so they require explicit opt-in and user trust in the repository.

## Command Registration Pattern

From ralph-wiggum extension, the standard pattern is:

```typescript
const commands: Record<string, (args: string, ctx: any) => void> = {
  subcommand1: handleSubcommand1,
  subcommand2: handleSubcommand2,
  // ...
};

pi.registerCommand("command-name", {
  description: "Command description",
  handler: async (args, ctx) => {
    const [cmd] = args.trim().split(/\s+/);
    const handler = commands[cmd];
    if (handler) {
      handler(args.slice(cmd.length).trim(), ctx);
    } else {
      ctx.ui.notify(HELP_TEXT, "info");
    }
  },
});
```

This pattern provides:
- Clean separation of subcommands
- Easy to add new subcommands
- Consistent help text fallback
- Simple routing logic

## Agent Discovery Pattern

The subagent extension uses a flexible agent discovery system:

1. **Frontmatter parsing** - Agents are markdown with YAML frontmatter
2. **Two-tier system** - User-level (always) and project-level (opt-in)
3. **Fresh discovery** - Agents discovered on each invocation (allows mid-session editing)
4. **Override behavior** - Project agents override user agents with same name when scope is "both"

This pattern allows:
- Personal agent library in user directory
- Project-specific agents in repository
- Security through explicit opt-in for project agents
- No caching issues - changes take effect immediately

## Best Practices Learned

### Command Structure
1. **Single command with subcommands** - Use command router pattern
2. **Consistent argument parsing** - Extract to helper functions
3. **Clear help text** - Always provide examples
4. **Graceful degradation** - Handle missing UI, editors, etc.

### Extension Development
1. **Leverage existing utilities** - Reuse discovery mechanisms
2. **Follow established patterns** - Study other extensions (ralph-wiggum)
3. **Context awareness** - Use ctx.cwd, ctx.ui, ctx.hasUI, ctx.isIdle()
4. **Error messages** - Always show actionable next steps

### Agent Management
- Agents are simple markdown files with YAML frontmatter
- Discovery is automatic on each invocation
- Two scopes (user/project) provide flexibility and safety
- Project agents override user agents with same name

## References

- Subagent extension research: `.memory/research-6e3d737d-subagent-extension-structure.md`
- Command specifications: `.memory/research-30fe5140-command-specifications.md`
- Ralph-wiggum command pattern: `devtools/files/pi/agent/extensions/ralph-wiggum/index.ts:557-650`
- Agent discovery mechanism: `devtools/files/pi/agent/extensions/subagent/agents.ts`

## Applicability

These patterns apply to:
- Adding slash commands to Pi extensions
- Managing user and project-level configurations
- Building interactive CLI tools within Pi
- Creating template-based content generators

## Future Considerations

- Add `/subagent test <name> <task>` to quickly test an agent
- Add `/subagent clone <source> <new-name>` to duplicate agents
- Add `/subagent delete <name>` with safety confirmation
- Support importing agents from URLs or repositories
- Add agent versioning or backup functionality
