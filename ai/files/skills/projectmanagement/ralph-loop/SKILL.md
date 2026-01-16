---
name: ralph-loop
description: Use when performing ralph wiggum style long-running development loops with pacing control.
---

# Ralph Wiggum - Long-Running Development Loops

Long-running iterative development loops with pacing control.

## When to Use

- Complex tasks requiring multiple iterations
- Tasks with many discrete steps that build on each other
- Work that benefits from periodic reflection

Do NOT use for simple one-shot tasks or quick fixes.

## Agent Tool

Call `ralph_start` to begin a loop on yourself:

```
ralph_start({
  name: "loop-name",
  taskContent: "# Task\n\n## Goals\n- Goal 1\n\n## Checklist\n- [ ] Item 1\n- [ ] Item 2",
  maxIterations: 50,        // Default: 50
  itemsPerIteration: 3,     // Optional: suggest N items per turn
  reflectEvery: 10,         // Optional: reflect every N iterations
  useSubagents: true,       // Optional: delegate each task to subagent
  subagentAgent: "default"  // Optional: subagent name (default: 'default')
})
```

## Loop Behavior

1. Task content is saved to `.ralph/<name>.md`
2. Each iteration: work on task, update file
3. Call `ralph_done` tool to proceed to next iteration
4. When complete: output `<promise>COMPLETE</promise>`
5. Loop ends on completion or max iterations (default 50)

## User Commands

- `/ralph start <name|path>` - Start a new loop
- `/ralph resume <name>` - Resume loop
- `/ralph stop` - Pause loop (when agent idle)
- `/ralph-stop` - Stop active loop (idle only)
- `/ralph status` - Show loops
- `/ralph list --archived` - Show archived loops
- `/ralph archive <name>` - Move loop to archive
- `/ralph clean [--all]` - Clean completed loops
- `/ralph cancel <name>` - Delete loop
- `/ralph nuke [--yes]` - Delete all .ralph data

During streaming: press ESC to interrupt, send a normal message to resume, and run `/ralph-stop` when idle to end the loop.

## Task File Format

```markdown
# Task Title

Brief description.

## Goals
- Goal 1
- Goal 2

## Checklist
- [ ] Item 1
- [ ] Item 2
- [x] Completed item

## Notes
(Update with progress, decisions, blockers)
```

## Subagent Mode

Delegate each checklist task to a separate subagent thread:

```bash
/ralph start my-tasks --use-subagents --subagent-agent default
```

**How it works:**
- Extracts uncompleted checklist items (`- [ ] Task`)
- Each task is delegated to a fresh subagent thread (1 task = 1 subagent)
- Subagent completes task and marks it done (`- [x] Task`)
- Main loop orchestrates and tracks progress
- Automatic retry logic for failures (2 attempts)

**Benefits:**
- Fresh context per task (no pollution)
- Isolated execution (failures don't cascade)
- Clear task tracking and progress reporting
- Suitable for independent, discrete tasks

**When to use:**
- Tasks are independent (no shared state)
- Each task is substantial enough for separate execution
- You want clean separation between tasks
- Task list is well-defined upfront

## Best Practices

1. **Clear checklist**: Break work into discrete items
2. **Update as you go**: Mark items complete, add notes
3. **Reflect when stuck**: Use reflection to reassess approach (normal mode)
4. **Complete properly**: Only output completion marker when truly done
5. **Subagent mode**: Use for independent tasks with clear boundaries
