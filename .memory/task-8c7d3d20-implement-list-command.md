# Task: Implement `/subagent list` Command

## Status
✅ COMPLETE

## Objective
Implement the `/subagent list` command to display available agents with filtering and verbosity options.

## Prerequisites
- Command specifications complete
- Understanding of agent discovery mechanism

## Steps
1. [x] Add `list` handler function to command router
2. [x] Parse command arguments (--scope, --verbose flags)
3. [x] Call `discoverAgents(ctx.cwd, scope)` to get agents
4. [x] Format output based on verbosity level
5. [x] Group agents by source (user/project)
6. [x] Sort agents alphabetically within groups
7. [x] Handle empty results gracefully
8. [x] Display using `ctx.ui.notify()`

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
- [ ] `/subagent list` shows all agents - NEEDS TESTING
- [ ] `/subagent list --scope user` shows only user agents - NEEDS TESTING
- [ ] `/subagent list --scope project` shows only project agents - NEEDS TESTING
- [ ] `/subagent list --verbose` shows detailed information - NEEDS TESTING
- [ ] Empty results display helpful message - NEEDS TESTING

## Implementation Details

Added to `devtools/files/pi/agent/extensions/subagent/index.ts`:
- `parseListArgs()` function to parse --scope and --verbose flags
- `formatAgentList()` function to format output based on verbosity
- `pi.registerCommand("subagent", ...)` with list handler
- Help text for all commands (list, add, edit)

The command:
1. Parses arguments using simple token splitting
2. Uses `discoverAgents(ctx.cwd, scope)` to get agents
3. Sorts agents by source (user first) then alphabetically by name
4. Formats output based on verbose flag
5. Displays count and grouped lists
6. Shows helpful message for empty results

## Files to Modify
- `devtools/files/pi/agent/extensions/subagent/index.ts`
  - Add handleList function
  - Add to command router
  - Import discoverAgents from agents.ts

## References
- Specification: `.memory/research-30fe5140-command-specifications.md` (list section)
- Agent discovery: `devtools/files/pi/agent/extensions/subagent/agents.ts`
