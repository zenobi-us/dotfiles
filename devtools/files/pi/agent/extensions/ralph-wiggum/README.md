# Ralph Wiggum Extension

Long-running agent loops for iterative development. Best for long-running-tasks that are verifiable. Builds on Geoffrey Huntley's ralph-loop for Claude Code and adapts it for Pi.
This one is cool because:
- You can ask Pi and it will set up and run the loop all by itself in-session. If you prefer, it can also invoke another Pi via tmux
- You can have multiple parallel loops at once in the same repo (unlike OG ralph-wiggum)
- You can ask Pi to self-reflect at regular intervals so it doesn't mindlessly grind through wrong instructions (optional)

<img width="432" height="357" alt="Screenshot 2026-01-07 at 17 16 24" src="https://github.com/user-attachments/assets/68cdab11-76c6-4aed-9ea1-558cbb267ea6" />


## Recommended usage: just ask Pi
You ask Pi to set up a ralph-wiggum loop.
- Pi sets up `.ralph/<name>.md` with goals and a checklist (like a list of features to build, errors to check, or files to refactor)
- You let Pi know:
  1. What the task is and completion / tests to run
  2. How many items to process per iteration
  3. How often to commit
  4. (optionally) After how many items it should take a step back and self-reflect
- Pi runs `ralph_start`, beginning iteration 1.
  - It gets a prompt telling it to work on the task, update the task file, and call ralph_done when it finishes that iteration
  - When the iteration is done, it calls `ralph_done`, resending the same prompt*
- Pi runs until either:
  - All tasks are done (Pi sends `<promise>COMPLETE</promise>`)
  - Max iterations (default 50)
  - You hit `esc` (pausing the loop)
If you hit `esc`, you can run `/ralph-stop` to clear the loop. Alternatively, just tell Pi to continue to keep going.

## Commands

| Command | Description |
|---------|-------------|
| `/ralph start <name\|path>` | Start a new loop |
| `/ralph resume <name>` | Resume a paused loop |
| `/ralph stop` | Pause current loop |
| `/ralph-stop` | Stop active loop (idle only) |
| `/ralph status` | Show all loops |
| `/ralph list --archived` | Show archived loops |
| `/ralph archive <name>` | Move loop to archive |
| `/ralph clean [--all]` | Clean completed loops |
| `/ralph cancel <name>` | Delete a loop |
| `/ralph nuke [--yes]` | Delete all .ralph data |

### Options for start

| Option | Description |
|--------|-------------|
| `--max-iterations N` | Stop after N iterations (default 50) |
| `--items-per-iteration N` | Suggest N items per turn (prompt hint) |
| `--reflect-every N` | Reflect every N iterations |
| `--use-subagents` | Delegate each task to a separate subagent thread |
| `--subagent-agent NAME` | Name of subagent to use (default: 'default') |

## Agent Tool

The agent can self-start loops using `ralph_start`:

```
ralph_start({
  name: "refactor-auth",
  taskContent: "# Task\n\n## Checklist\n- [ ] Item 1",
  maxIterations: 50,
  itemsPerIteration: 3,
  reflectEvery: 10
})
```

## Subagent Mode

Delegate each checklist task to a separate subagent thread for isolated execution:

```bash
# Start with subagent delegation
/ralph start my-tasks --use-subagents

# Use a specific subagent
/ralph start security-review --use-subagents --subagent-agent security-auditor
```

Or via the tool:

```
ralph_start({
  name: "feature-tasks",
  taskContent: "# Features\n\n## Checklist\n- [ ] Add login\n- [ ] Add logout",
  useSubagents: true,
  subagentAgent: "default"
})
```

**How it works:**
1. Extracts uncompleted checklist items (`- [ ] Task name`)
2. Each task is delegated to a fresh subagent thread
3. Subagent completes the task and marks it done (`- [x] Task name`)
4. Main loop tracks progress and orchestrates execution
5. Loop completes when all checklist items are done

**Benefits:**
- Fresh context for each task (no context pollution)
- Automated task tracking and completion
- Retry logic for failed tasks
- Clear progress reporting

## Documentation

### Core Documentation
- [Main README](./README.md) - This file, overview and basic usage
- [Quick Reference](./QUICK_REFERENCE.md) - Quick command and usage reference

### Subagent Mode
- [Subagent Mode Guide](./SUBAGENT_MODE.md) - Detailed guide for using subagent delegation
- [Subagent Mode Example](./examples/subagent-mode-example.md) - Complete authentication system example
- [Architecture](./ARCHITECTURE.md) - System architecture and design diagrams

### Testing
- [Test Script](./test-subagent-mode.sh) - Shell script to test basic mechanics

## Credits

Based on Geoffrey Huntley's Ralph Wiggum approach for long-running agent tasks.
