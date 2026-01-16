# Ralph Wiggum Subagent Mode - Quick Reference

## TL;DR

Enable subagent mode to delegate each checklist task to a fresh subagent context:

```bash
/ralph start my-tasks --use-subagents
```

## Commands

| Command | Description |
|---------|-------------|
| `/ralph start <name> --use-subagents` | Start loop in subagent mode |
| `/ralph start <name> --use-subagents --subagent-agent <agent>` | Use specific subagent |
| `ralph_done()` | Complete current task, proceed to next |
| `/ralph stop` | Pause loop |
| `/ralph resume <name>` | Resume paused loop |
| `/ralph status` | Show all loops |

## Tool Usage

```typescript
// Start subagent loop
ralph_start({
  name: "my-tasks",
  taskContent: "# Tasks\n\n## Checklist\n- [ ] Task 1\n- [ ] Task 2",
  useSubagents: true,
  subagentAgent: "default"
})

// After each subagent completes
ralph_done()
```

## Task File Format

```markdown
# Task Title

## Goals
- Goal 1
- Goal 2

## Checklist
- [ ] Uncompleted task 1
- [ ] Uncompleted task 2
- [x] Completed task 3

## Notes
Progress notes here
```

## Typical Workflow

1. **Start**: `/ralph start tasks --use-subagents`
2. **See**: Task 1/N with subagent template
3. **Call**: `subagent({ agent: "default", task: "..." })`
4. **Verify**: Task marked `[x]` in file
5. **Continue**: `ralph_done()`
6. **Repeat**: Until all tasks complete
7. **Done**: `<promise>COMPLETE</promise>`

## Subagent Template

When Ralph presents a task, use this template:

```json
{
  "agent": "default",
  "task": "Context: Ralph loop 'loop-name'\n\nTask: Description\n\nInstructions:\n1. Complete task\n2. Mark done: - [x] Task\n3. Report result",
  "agentScope": "user"
}
```

## Progress Indicators

```
🔄 RALPH LOOP (Subagent Mode): my-tasks | Task 3/10

## Progress
Completed: 2/10 tasks
  ✓ Task 1: Setup database
  ✓ Task 2: Create models

## Current Task
Task 3/10: **Add validation**
```

## State File Location

```
.ralph/
  ├── my-tasks.md          # Task file
  └── my-tasks.state.json  # Loop state
```

## Flags & Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--use-subagents` | boolean | false | Enable subagent mode |
| `--subagent-agent` | string | "default" | Subagent to use |
| `--max-iterations` | number | 50 | Max iterations |
| `--items-per-iteration` | number | 0 | Items per turn (normal mode) |
| `--reflect-every` | number | 0 | Reflection interval (normal mode) |

## When to Use

### ✅ Use Subagent Mode When:
- Tasks are independent
- Each task is substantial
- You want clean isolation
- Fresh context per task beneficial

### ❌ Don't Use When:
- Tasks share context
- Tasks are trivial
- Tasks are interdependent
- You need continuous flow

## Common Patterns

### Pattern 1: Feature Development
```markdown
## Checklist
- [ ] Design API endpoints
- [ ] Implement authentication
- [ ] Add data validation
- [ ] Write tests
- [ ] Update documentation
```

### Pattern 2: Refactoring
```markdown
## Checklist
- [ ] Extract helper functions
- [ ] Simplify component logic
- [ ] Remove dead code
- [ ] Update tests
- [ ] Add type annotations
```

### Pattern 3: Bug Fixes
```markdown
## Checklist
- [ ] Fix login error handling
- [ ] Resolve race condition in sync
- [ ] Patch validation bypass
- [ ] Fix memory leak in cache
```

## Troubleshooting

### Task Not Marked Complete
**Problem**: Subagent didn't update task file
**Solution**: Manually mark task in file, then `ralph_done()`

### Loop Stuck
**Problem**: Waiting for ralph_done call
**Solution**: Call `ralph_done()` to continue

### Wrong Subagent
**Problem**: Need different subagent for task
**Solution**: Manually specify in subagent call: `agent: "other-agent"`

### Can't Resume
**Problem**: Loop state corrupted
**Solution**: Check `.ralph/<name>.state.json`, fix or delete

## Examples

### Simple Task List
```bash
# Create task file
cat > .ralph/cleanup.md << 'EOF'
# Code Cleanup

## Checklist
- [ ] Remove console.log statements
- [ ] Fix ESLint warnings
- [ ] Update dependencies
- [ ] Format code
EOF

# Start loop
/ralph start cleanup --use-subagents
```

### With Specialized Agents
```bash
/ralph start security --use-subagents --subagent-agent security-engineer
```

### Resume After Pause
```bash
# Pause
/ralph stop

# Later...
/ralph resume security
```

## Tips & Tricks

1. **Clear Task Descriptions**: Be specific in checklist items
2. **One Concern Per Task**: Keep tasks focused and independent
3. **Verify Progress**: Check task file after each completion
4. **Use Notes Section**: Document decisions and blockers
5. **Archive When Done**: Keep history with `/ralph archive <name>`

## Keyboard Shortcuts

- `ESC`: Pause assistant (then `/ralph-stop` when idle)

## Integration with Other Tools

### With Git
```bash
# Each task = one commit
- [ ] Add feature X  # Subagent commits "feat: add feature X"
- [ ] Add tests      # Subagent commits "test: add tests for X"
```

### With CI/CD
```markdown
## Checklist
- [ ] Update deployment config
- [ ] Add health check endpoint
- [ ] Configure monitoring
- [ ] Update runbook
```

### With Documentation
```markdown
## Checklist
- [ ] Update API docs
- [ ] Add usage examples
- [ ] Create migration guide
- [ ] Update changelog
```

## Advanced Usage

### Dynamic Subagent Selection

Parse agent from task description:
```markdown
- [ ] Secure endpoints [agent:security-engineer]
- [ ] Optimize queries [agent:database-optimizer]
- [ ] Write tests [agent:test-automator]
```

### Conditional Execution
```markdown
- [ ] Run only if feature X enabled
- [ ] Skip if database already migrated
```

### Task Dependencies
```markdown
- [ ] Setup database (prerequisite)
- [ ] Create migrations (requires database)
- [ ] Seed data (requires migrations)
```

## Monitoring

### Check Status
```bash
/ralph status
```

### View Progress
```bash
cat .ralph/my-tasks.md | grep "\[x\]"
```

### View State
```bash
cat .ralph/my-tasks.state.json | jq .
```

## Cleanup

```bash
# Archive completed loop
/ralph archive my-tasks

# Clean all completed loops
/ralph clean

# Remove task files too
/ralph clean --all

# Nuclear option
/ralph nuke --yes
```

## Resources

- [Subagent Mode Guide](./SUBAGENT_MODE.md)
- [Complete Example](./examples/subagent-mode-example.md)
- [Architecture](./ARCHITECTURE.md)
- [Main README](./README.md)
