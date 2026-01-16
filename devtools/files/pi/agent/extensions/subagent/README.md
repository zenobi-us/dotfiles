# Subagent Extension

Delegate tasks to specialized subagents with isolated context windows.

## Features

- **Isolated context**: Each subagent runs in a separate `pi` process with its own conversation history
- **Three execution modes**: Single agent, parallel execution, and chained workflows
- **Streaming output**: Live progress with tool calls and text as they happen
- **Parallel streaming**: All parallel tasks stream updates simultaneously
- **Markdown rendering**: Final output rendered with proper formatting (expanded view)
- **Usage tracking**: Shows turns, tokens, cost, and context usage per agent
- **Abort support**: Ctrl+C propagates to kill subagent processes
- **Dynamic discovery**: Agents discovered from user, project, and builtin directories

## Architecture

```
subagent/
├── index.ts             # Extension entry point, tool & command registration
├── subagent.ts          # Core subprocess execution logic
├── agents.ts            # Agent discovery and configuration parsing
├── formatting.ts        # Token/usage display formatting
├── commands/            # Management subcommands
│   ├── index.ts         # Command exports
│   ├── list.ts          # /subagent list
│   ├── add.ts           # /subagent add
│   ├── edit.ts          # /subagent edit
│   ├── paths.ts         # /subagent paths
│   └── help.ts          # /subagent help
├── agents/              # Built-in agent definitions
│   ├── scout.md         # Fast recon, returns compressed context
│   ├── planner.md       # Creates implementation plans
│   ├── reviewer.md      # Code review specialist
│   └── worker.md        # General-purpose with full capabilities
└── prompts/             # Workflow templates (registered as commands)
    ├── implement.md         # scout → planner → worker
    ├── scout-and-plan.md    # scout → planner (no implementation)
    └── implement-and-review.md  # worker → reviewer → worker
```

## Installation

The extension is symlinked from the dotfiles repository:

```bash
# Extension files are in ~/.config/pi/agent/extensions/subagent/
# Agents are discovered from:
#   - ~/.pi/agent/agents/          (user-level, global)
#   - .pi/agents/                   (project-level, searched upward to git root)
#   - <extension>/agents/           (built-in)
```

## Security Model

This extension executes a separate `pi` subprocess with a delegated system prompt and tool/model configuration.

Agents are discovered from:
- `<extension>/agents/*.md` - Built-in agents (bundled with extension)
- `~/.pi/agent/agents/*.md` - User-level agents (always loaded)
- `.pi/agents/*.md` - Project-level agents (searched upward from cwd to git root)

**Warning**: Project-local agents can instruct the model to read files, run bash commands, etc. Only use agents from repositories you trust.

## Tools

### `subagent`

The main tool for delegating tasks to agents.

**Modes:**
| Mode | Parameters | Description |
|------|------------|-------------|
| Single | `{ agent, task, cwd? }` | One agent, one task |
| Parallel | `{ tasks: [{agent, task, cwd?}, ...] }` | Multiple agents run concurrently (max 8, 4 concurrent) |
| Chain | `{ chain: [{agent, task, cwd?}, ...] }` | Sequential with `{previous}` placeholder for passing output |

**Examples:**
```
Use scout to find all authentication code
```

```
Run 2 scouts in parallel: one to find models, one to find providers
```

```
Use a chain: first have scout find the read tool, then have planner suggest improvements
```

### `list-agents`

Simple tool to list available agents for the LLM to discover what's available.

## Commands

### `/subagent list [--verbose]`

List available agents with optional detailed information.

```
/subagent list
/subagent list --verbose
```

### `/subagent add <name> [--template basic|scout|worker]`

Create a new agent definition from a template.

```
/subagent add my-agent
/subagent add my-scout --template scout
/subagent add analyzer --template worker
```

**Templates:**
- `basic` - Minimal template with name, description, and system prompt
- `scout` - Fast reconnaissance with read/grep/find/bash tools (Haiku model)
- `worker` - Full-capability template with all default tools (Sonnet model)

**Agent Naming:**
- Must contain only lowercase letters, numbers, hyphens, and underscores
- Must start with a letter
- Must end with a letter or number

Agents are always created in `~/.pi/agent/agents/` (user-level, available globally).

### `/subagent edit <name>`

Display the file path of an existing agent for editing.

```
/subagent edit scout
/subagent edit my-agent
```

### `/subagent paths`

Show directories searched for agent definitions.

```
/subagent paths
```

## Workflow Prompts

Workflow prompts are registered as commands automatically from the `prompts/` directory.

| Command | Flow | Description |
|---------|------|-------------|
| `/implement <query>` | scout → planner → worker | Full implementation workflow |
| `/scout-and-plan <query>` | scout → planner | Discovery and planning only |
| `/implement-and-review <query>` | worker → reviewer → worker | Implementation with code review cycle |

**Argument substitution:**
- `$@` or `$ARGUMENTS` - All arguments
- `$1`, `$2`, etc. - Individual arguments
- `${@:N}` - First N arguments

## Agent Definitions

Agents are markdown files with YAML frontmatter:

```markdown
---
name: my-agent
description: What this agent does
tools: read, grep, find, ls
model: claude-haiku-4-5
---

System prompt for the agent goes here.

You are a specialized agent that...
```

**Frontmatter fields:**
- `name` - Agent identifier (defaults to filename without `.md`)
- `description` - Brief description (defaults to first line of body)
- `tools` - Comma-separated list of allowed tools (omit for all defaults)
- `model` - Model to use (defaults to session default)

## Built-in Agents

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| `scout` | Haiku | read, grep, find, ls, bash | Fast codebase reconnaissance |
| `planner` | Sonnet | read, grep, find, ls | Creates implementation plans |
| `reviewer` | Sonnet | read, grep, find, ls, bash | Code review and quality analysis |
| `worker` | Sonnet | (all defaults) | General-purpose implementation |

## Output Display

**Collapsed view** (default):
- Status icon (✓/✗/⏳) and agent name
- Last 10 items (tool calls and text snippets)
- Usage stats: `3 turns ↑input ↓output RcacheRead WcacheWrite $cost ctx:contextTokens model`
- Press `Ctrl+O` to expand

**Expanded view**:
- Full task text
- All tool calls with formatted arguments
- Final output rendered as Markdown
- Per-step usage for chain/parallel modes

**Tool call formatting** (mimics built-in tool display):
- `$ command` for bash
- `read ~/path:1-10` for read with line ranges
- `write ~/path (N lines)` for write

## Error Handling

- **Exit code != 0**: Tool returns error with stderr/output
- **stopReason "error"**: LLM error propagated with message
- **stopReason "aborted"**: User abort (Ctrl+C) kills subprocess
- **Chain mode**: Stops at first failing step, reports which step failed

## Limitations

- Parallel mode limited to 8 tasks, 4 concurrent
- Output truncated to last 10 items in collapsed view
- Agents discovered fresh on each invocation (allows editing mid-session)
- No inter-agent communication except through chain's `{previous}` placeholder
