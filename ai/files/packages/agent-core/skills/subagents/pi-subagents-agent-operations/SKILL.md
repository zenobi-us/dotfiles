---
name: pi-subagents-agent-operations
description: Runs pi-subagents workflows and creates/manages agent definitions, when users need /run /chain /parallel execution or custom agent setup, resulting in reliable delegation with correct paths frontmatter and runtime overrides.
---

# pi-subagents Agent Operations

## Overview
This skill provides a practical workflow for using **nicobailon/pi-subagents** to run subagents and create/manage agent definitions correctly.

Primary source: `nicobailon/pi-subagents` README.

## When to Use
Use this skill when the user asks to:
- Run delegated tasks with `/run`, `/chain`, `/parallel`
- Create or edit custom agent markdown files
- Manage agents/chains via tool actions (`list`, `create`, `update`, `delete`)
- Troubleshoot missing agents, scope collisions, async/background runs, or clarify TUI behavior

Do **not** use this skill for writing Pi extensions from scratch (use `creating-pi-extensions` instead).

## Quick Start
1. Install:
   - `pi install npm:pi-subagents`
2. Verify command surface:
   - `/run scout "scan repo"`
   - `/chain scout "analyze" -> planner "plan"`
   - `/parallel scout "frontend" -> reviewer "backend"`
   - `/agents`
3. If needed, inspect async state:
   - `subagent_status({ action: "list" })`

## Agent File Locations and Priority
Create `{name}.md` in one of:
- Builtin (read-only, lowest): `~/.pi/agent/extensions/subagent/agents/`
- User: `~/.pi/agent/agents/{name}.md`
- Project (highest): `.pi/agents/{name}.md` (searched up directory tree)

Discovery can be constrained with `agentScope: "user" | "project" | "both"` (`both` default).

## Correct Agent Frontmatter (Important)
Use `skill` (singular), not `skills`, in agent frontmatter.

```markdown
---
name: scout-custom
description: Fast codebase recon
model: anthropic/claude-sonnet-4-5
thinking: high
tools: read, grep, find, ls, bash
skill: safe-bash, codemapper
output: context.md
defaultReads: context.md
defaultProgress: true
maxSubagentDepth: 1
---

Your system prompt here.
```

## Run Patterns
### Single
- Tool form: `{ agent: "scout", task: "Analyze auth" }`
- Slash form: `/run scout "Analyze auth"`

### Chain
- Tool form:
  - `{ chain: [{agent:"scout", task:"..."}, {agent:"planner"}] }`
- Template variables in chain tasks:
  - `{task}`, `{previous}`, `{chain_dir}`
- Slash form:
  - `/chain scout "scan" -> planner "plan from previous"`

### Parallel
- Tool form:
  - `{ tasks: [{agent:"scout", task:"frontend"}, {agent:"reviewer", task:"backend"}] }`
  - Repeated run: `{ tasks: [{agent:"scout", task:"audit", count: 3}] }`
- Slash form:
  - `/parallel scout "frontend" -> reviewer "backend"`

### Background + Context
- Background: add `--bg` in slash commands, or `async: true` in tool calls
- Forked context: `context: "fork"` when child runs must branch from current session context

## Chain File Authoring
Chain files live at:
- `~/.pi/agent/agents/{name}.chain.md`
- `.pi/agents/{name}.chain.md`

Skeleton:
```markdown
---
name: scout-planner
description: Gather context then plan
---

## scout
output: context.md

Analyze code for {task}

## planner
reads: context.md

Create plan from {previous}
```

## Management Actions (Programmatic)
Use `subagent` management actions when user asks to create/edit/delete agents or chains without manual file editing:
- `action: "list"`
- `action: "get"`
- `action: "create"`
- `action: "update"`
- `action: "delete"`

Prefer project-scope agents/chains for repo-specific workflows.

## Common Failures and Fixes
- **Unknown agent**: Wrong path/name. Ensure `{name}.md` in `.pi/agents/` or `~/.pi/agent/agents/`.
- **Wrong agent selected**: Scope collision. Project overrides user/builtin with same name.
- **Skill not injected**: Frontmatter key typo (`skills` instead of `skill`).
- **No direct MCP tools**: Add `mcp:` entries in `tools` and install `pi-mcp-adapter`; restart after first server connect.
- **Parallel filesystem conflicts**: Use `worktree: true` for isolated git worktrees.
- **Need to inspect async run**: `subagent_status({ action: "list" })` then inspect by run id.

## Execution Checklist
- Confirm install state (`pi-subagents` present)
- Confirm target mode (single/chain/parallel)
- Confirm scope (project vs user)
- Use correct frontmatter keys (`skill`, `defaultReads`, `defaultProgress`)
- Decide foreground vs background (`--bg` / `async`)
- For parallel code edits, decide whether `worktree: true` is required
