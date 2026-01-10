# Task: Add Tests and Documentation

## Status
⏳ PENDING

## Objective
Add comprehensive tests and documentation for the new subagent management commands.

## Prerequisites
- All three commands (list, add, edit) implemented
- Commands tested manually

## Steps

### Documentation
1. [ ] Update `devtools/files/pi/agent/extensions/subagent/README.md`
   - Add "Management Commands" section
   - Document each command with examples
   - Add to table of contents
2. [ ] Add inline code comments
3. [ ] Update any extension overview documentation

### Testing (if test framework exists)
1. [ ] Test `/subagent list` with various scopes
2. [ ] Test `/subagent add` with various templates
3. [ ] Test `/subagent edit` with existing/non-existing agents
4. [ ] Test error handling (invalid names, missing agents, etc.)
5. [ ] Test edge cases (empty directories, permission issues)

## Implementation Details

### README.md Updates

Add section:

```markdown
## Management Commands

### List Agents

List available agents with optional filtering:

\`\`\`
/subagent list [--scope user|project|both] [--verbose]
\`\`\`

Examples:
\`\`\`
/subagent list
/subagent list --scope user
/subagent list --verbose
\`\`\`

### Add Agent

Create a new agent definition:

\`\`\`
/subagent add <name> [--scope user|project] [--template basic|scout|worker]
\`\`\`

Examples:
\`\`\`
/subagent add my-agent
/subagent add my-scout --template scout --scope project
/subagent add analyzer --template worker
\`\`\`

Templates:
- `basic` - Minimal template with name, description, and system prompt
- `scout` - Fast reconnaissance template with read/grep/find/bash tools
- `worker` - Full-capability template with all default tools

### Edit Agent

Edit an existing agent definition:

\`\`\`
/subagent edit <name> [--scope user|project|both]
\`\`\`

Examples:
\`\`\`
/subagent edit scout
/subagent edit my-agent --scope project
\`\`\`

Opens the agent file in your default editor ($EDITOR or $VISUAL).
```

### Code Comments

Add JSDoc comments:
```typescript
/**
 * Handle /subagent list command
 * Lists available agents with optional scope filtering
 * @param args - Command arguments (--scope, --verbose flags)
 * @param ctx - Extension context
 */
function handleList(args: string, ctx: any): void {
  // ...
}

/**
 * Handle /subagent add command
 * Creates a new agent definition from template
 * @param args - Command arguments (name, --scope, --template flags)
 * @param ctx - Extension context
 */
function handleAdd(args: string, ctx: any): void {
  // ...
}

/**
 * Handle /subagent edit command
 * Opens existing agent definition in editor
 * @param args - Command arguments (name, --scope flag)
 * @param ctx - Extension context
 */
function handleEdit(args: string, ctx: any): void {
  // ...
}
```

## Expected Outcome
- Users have clear documentation for all management commands
- Code is well-commented for maintainability
- Tests ensure commands work as expected

## Verification
- [ ] README.md updated with management commands section
- [ ] Examples provided for each command
- [ ] Code has JSDoc comments for public functions
- [ ] Manual testing checklist completed
- [ ] (Optional) Automated tests pass if framework exists

## Files to Modify
- `devtools/files/pi/agent/extensions/subagent/README.md`
  - Add management commands section
  - Add examples
  - Update table of contents
- `devtools/files/pi/agent/extensions/subagent/index.ts`
  - Add JSDoc comments
  - Ensure consistent error messages

## Manual Testing Checklist
- [ ] List all agents (both scopes)
- [ ] List user agents only
- [ ] List project agents only
- [ ] List with verbose flag
- [ ] Add basic agent
- [ ] Add scout template agent
- [ ] Add worker template agent
- [ ] Add agent to project scope
- [ ] Try to add duplicate agent (should error)
- [ ] Try to add agent with invalid name (should error)
- [ ] Edit existing agent
- [ ] Try to edit non-existing agent (should error with list)
- [ ] Edit with specific scope
- [ ] Verify changes persist

## References
- Current README: `devtools/files/pi/agent/extensions/subagent/README.md`
- Ralph-wiggum README: `devtools/files/pi/agent/extensions/ralph-wiggum/README.md` (for documentation style)
