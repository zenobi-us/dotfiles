# Task: Implement `/subagent list` Command

## Status
⏳ PENDING

## Objective
Implement the `/subagent list` command to display available agents with filtering and verbosity options.

## Prerequisites
- Command specifications complete
- Understanding of agent discovery mechanism

## Steps
1. [ ] Add `list` handler function to command router
2. [ ] Parse command arguments (--scope, --verbose flags)
3. [ ] Call `discoverAgents(ctx.cwd, scope)` to get agents
4. [ ] Format output based on verbosity level
5. [ ] Group agents by source (user/project)
6. [ ] Sort agents alphabetically within groups
7. [ ] Handle empty results gracefully
8. [ ] Display using `ctx.ui.notify()`

## Implementation Details

### Function Signature
```typescript
function handleList(args: string, ctx: any): void
```

### Argument Parsing
Parse flags:
- `--scope user|project|both` (default: both)
- `--verbose` or `-v`

### Output Logic
- Standard: Show grouped list with names and descriptions
- Verbose: Show names, descriptions, models, tools, file paths
- Empty: Show message for scope with no agents

## Expected Outcome
Users can list all available agents with optional filtering by scope and verbosity control.

## Verification
- [ ] `/subagent list` shows all agents
- [ ] `/subagent list --scope user` shows only user agents
- [ ] `/subagent list --scope project` shows only project agents
- [ ] `/subagent list --verbose` shows detailed information
- [ ] Empty results display helpful message

## Files to Modify
- `devtools/files/pi/agent/extensions/subagent/index.ts`
  - Add handleList function
  - Add to command router
  - Import discoverAgents from agents.ts

## References
- Specification: `.memory/research-30fe5140-command-specifications.md` (list section)
- Agent discovery: `devtools/files/pi/agent/extensions/subagent/agents.ts`
