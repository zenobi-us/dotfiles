# Research: Command Specifications Design

## Summary

Detailed specifications for three slash commands to manage agents in the subagent extension: list, add, and edit.

## `/subagent list` Command

### Purpose
Display available agents with filtering options by scope (user/project/both).

### Syntax
```
/subagent list [--scope user|project|both] [--verbose]
```

### Options
- `--scope <value>` - Filter by agent scope (default: `both`)
  - `user` - Only user-level agents from `~/.pi/agent/agents/`
  - `project` - Only project-level agents from `.pi/agents/`
  - `both` - All agents (project agents override user agents with same name)
- `--verbose` or `-v` - Show detailed information including tools, model, and file paths

### Output Format

**Standard output:**
```
Available agents (5):

User agents:
  • scout - Fast codebase recon
  • planner - Creates implementation plans  
  • reviewer - Code review
  • worker - General-purpose (full capabilities)

Project agents:
  • custom-agent - Project-specific helper
```

**Verbose output:**
```
Available agents (5):

User agents (~/. pi/agent/agents/):
  • scout
    Description: Fast codebase recon
    Model: claude-haiku-4-5
    Tools: read, grep, find, ls, bash
    File: ~/.pi/agent/agents/scout.md

  • planner
    Description: Creates implementation plans
    Model: claude-sonnet-4-5
    Tools: read, grep, find, ls
    File: ~/.pi/agent/agents/planner.md
    
[...]

Project agents (.pi/agents/):
  • custom-agent
    Description: Project-specific helper
    Model: claude-sonnet-4-5
    Tools: read, write, bash
    File: .pi/agents/custom-agent.md
```

**Empty result:**
```
No agents found for scope: user
```

### Implementation Notes
- Use `discoverAgents(ctx.cwd, scope)` from agents.ts
- Group by source (user/project)
- Sort alphabetically within each group
- Use `ctx.ui.notify()` for output

## `/subagent add` Command

### Purpose
Interactively create a new agent definition.

### Syntax
```
/subagent add <name> [--scope user|project] [--template basic|scout|worker]
```

### Arguments
- `<name>` - Agent name (required, alphanumeric with hyphens/underscores)

### Options
- `--scope <value>` - Where to create agent (default: `user`)
  - `user` - Create in `~/.pi/agent/agents/`
  - `project` - Create in `.pi/agents/` (creates directory if needed)
- `--template <value>` - Use template (default: `basic`)
  - `basic` - Minimal template (name, description, system prompt)
  - `scout` - Fast recon template with read/grep/find/bash tools
  - `worker` - Full-capability template with all default tools

### Behavior
1. Validate agent name (alphanumeric, hyphens, underscores only)
2. Check if agent already exists in target scope
3. Create template content with:
   - YAML frontmatter (name, description, tools, model)
   - Basic system prompt placeholder
4. Write file to appropriate directory
5. Open file in default editor (if available) or show path
6. Confirm creation

### Template Examples

**basic template:**
```markdown
---
name: my-agent
description: Brief description of what this agent does
model: claude-sonnet-4-5
tools: read, grep, find, ls
---

You are a specialized AI agent for [purpose].

Your responsibilities:
- [Task 1]
- [Task 2]

Guidelines:
- [Guideline 1]
- [Guideline 2]
```

**scout template:**
```markdown
---
name: my-scout
description: Fast reconnaissance for [domain]
model: claude-haiku-4-5
tools: read, grep, find, ls, bash
---

You are a fast reconnaissance agent specializing in [domain].

Your goal is to quickly gather relevant context and return compressed findings.

Focus on:
- Finding key files and patterns
- Extracting important information
- Providing concise summaries

Keep responses brief and actionable.
```

**worker template:**
```markdown
---
name: my-worker
description: General-purpose agent for [domain]
model: claude-sonnet-4-5
---

You are a capable AI agent with full tool access for [domain].

Your responsibilities:
- [Task 1]
- [Task 2]
- [Task 3]

You have access to all default tools for reading, writing, executing commands, and more.
```

### Output
```
Creating agent: my-agent
Scope: user
Location: ~/.pi/agent/agents/my-agent.md

✓ Agent created successfully!

Next steps:
  1. Edit ~/.pi/agent/agents/my-agent.md to customize the system prompt
  2. Test with: /subagent test my-agent "simple task"
  3. Use with: Use my-agent to [task description]
```

### Error Handling
- Invalid name: "Agent name must contain only letters, numbers, hyphens, and underscores"
- Already exists: "Agent 'name' already exists at [path]. Use /subagent edit to modify it."
- Permission error: "Cannot create agent: [error message]"

## `/subagent edit` Command

### Purpose
Open an existing agent definition for editing.

### Syntax
```
/subagent edit <name> [--scope user|project|both]
```

### Arguments
- `<name>` - Agent name to edit (required)

### Options
- `--scope <value>` - Where to search for agent (default: `both`)
  - `user` - Only search `~/.pi/agent/agents/`
  - `project` - Only search `.pi/agents/`
  - `both` - Search both (prefers project if duplicate names)

### Behavior
1. Discover agents using specified scope
2. Find agent by name
3. Determine file path
4. Check if editor is available (`$EDITOR`, `$VISUAL`, or common defaults)
5. Open file in editor or display file path
6. Validate file after editing (frontmatter parsing)
7. Confirm changes

### Output

**Success:**
```
Opening agent: scout
Location: ~/.pi/agent/agents/scout.md

[Opens editor]

✓ Agent updated: scout

Changes will take effect on next invocation.
```

**Not found:**
```
Agent 'unknown' not found in scope: both

Available agents:
  • scout
  • planner
  • reviewer
  • worker

Use /subagent list for more details.
```

**Multiple matches (shouldn't happen with proper scope, but for safety):**
```
Multiple agents found with name 'agent-name':
  1. User: ~/.pi/agent/agents/agent-name.md
  2. Project: .pi/agents/agent-name.md

Please specify --scope to disambiguate.
```

### Validation
After editing, validate:
- YAML frontmatter is well-formed
- Required fields present (name, description)
- Name in frontmatter matches filename
- Tools list is valid (if specified)
- Model name is valid (if specified)

### Error Handling
- Agent not found: List available agents for reference
- Invalid YAML: Show parse error and file location
- No editor available: Display file path for manual editing
- Permission error: "Cannot edit agent: [error message]"

## Implementation Considerations

### Common Utilities

Create helper functions:

```typescript
function validateAgentName(name: string): { valid: boolean; error?: string } {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { 
      valid: false, 
      error: "Agent name must contain only letters, numbers, hyphens, and underscores" 
    };
  }
  return { valid: true };
}

function getAgentPath(name: string, scope: "user" | "project", cwd: string): string {
  if (scope === "user") {
    return path.join(os.homedir(), ".pi", "agent", "agents", `${name}.md`);
  } else {
    const projectDir = findNearestProjectAgentsDir(cwd) || path.join(cwd, ".pi", "agents");
    return path.join(projectDir, `${name}.md`);
  }
}

function openInEditor(filePath: string): Promise<void> {
  const editor = process.env.EDITOR || process.env.VISUAL || "vim";
  return new Promise((resolve, reject) => {
    const proc = spawn(editor, [filePath], { stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Editor exited with code ${code}`));
    });
  });
}
```

### Command Router

```typescript
const commands: Record<string, (args: string, ctx: any) => void> = {
  list: handleList,
  add: handleAdd,
  edit: handleEdit,
};

pi.registerCommand("subagent", {
  description: "Manage subagent definitions (list, add, edit)",
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

### Help Text

```typescript
const HELP_TEXT = `Subagent Management

Commands:
  /subagent list [--scope user|project|both] [--verbose]
      List available agents
      
  /subagent add <name> [--scope user|project] [--template basic|scout|worker]
      Create a new agent
      
  /subagent edit <name> [--scope user|project|both]
      Edit an existing agent

Examples:
  /subagent list --verbose
  /subagent add my-scout --template scout
  /subagent edit scout`;
```

## References

- Agent discovery: `/devtools/files/pi/agent/extensions/subagent/agents.ts`
- Command pattern: `/devtools/files/pi/agent/extensions/ralph-wiggum/index.ts:557-650`
- Extension API: Pi coding agent documentation

## Confidence Level

**9/10** - Specifications are clear and follow established patterns. Implementation is straightforward.
