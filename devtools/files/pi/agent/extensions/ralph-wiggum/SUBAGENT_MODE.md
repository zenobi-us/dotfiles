# Ralph Wiggum - Subagent Mode

## Overview

Subagent mode allows Ralph loops to delegate each checklist task to a separate subagent thread, providing isolated execution context for each task.

## Prerequisites

You must have the `subagent` tool available (either built-in or via the subagent extension).

## How It Works

### 1. Task Extraction
When you start a Ralph loop in subagent mode, it:
- Parses the task file for uncompleted checklist items (`- [ ] Task name`)
- Extracts all uncompleted tasks into a list
- Processes them one at a time

### 2. Task Delegation
For each task, the main loop:
- Presents the current task with delegation instructions
- Provides a ready-to-use `subagent` tool call template
- Waits for you (the agent) to execute the subagent call
- Expects you to call `ralph_done` after the subagent completes

### 3. Progress Tracking
- Each completed task is recorded in the loop state
- Progress is shown in the UI widget
- Task file is updated by the subagent (marking `- [x] Task name`)
- Loop continues until all tasks are complete

## Usage

### Via Command

```bash
/ralph start my-tasks --use-subagents --subagent-agent default
```

### Via Tool

```typescript
ralph_start({
  name: "feature-tasks",
  taskContent: `# Features

## Checklist
- [ ] Implement user authentication
- [ ] Add password reset flow
- [ ] Create user profile page
- [ ] Add email verification`,
  useSubagents: true,
  subagentAgent: "default"
})
```

## Workflow Example

1. **Loop starts**: Shows task 1/4 with subagent delegation instructions

2. **Agent executes**:
   ```json
   subagent({
     "agent": "default",
     "task": "Context: Ralph loop 'feature-tasks'...",
     "agentScope": "user"
   })
   ```

3. **Subagent completes**: Updates task file, marks task complete

4. **Agent calls**: `ralph_done()`

5. **Loop continues**: Shows task 2/4, repeat

6. **All complete**: Loop outputs `<promise>COMPLETE</promise>`

## Task File Format

Your task file must have a checklist section:

```markdown
# Feature Development

## Goals
- Implement authentication system
- Add user management

## Checklist
- [ ] Implement user authentication
- [ ] Add password reset flow
- [ ] Create user profile page
- [ ] Add email verification

## Notes
Track progress and decisions here.
```

## Benefits

### Isolation
Each subagent gets a fresh context window, preventing:
- Context pollution from previous tasks
- Accumulated mistakes carrying forward
- Token waste from irrelevant history

### Clean Separation
- Each task is self-contained
- Failures don't cascade to other tasks
- Easy to retry individual tasks

### Automatic Tracking
- Loop orchestrates execution
- Progress is automatically recorded
- Task completion is verified

## When to Use

**Use subagent mode when:**
- Tasks are independent (no shared state)
- Each task is substantial (worth a separate context)
- Task list is well-defined upfront
- You want clean separation between tasks

**Don't use subagent mode when:**
- Tasks need shared context
- Tasks are trivial (overhead not worth it)
- Tasks are interdependent
- Task list is dynamic/exploratory

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `useSubagents` | Enable subagent delegation | `false` |
| `subagentAgent` | Name of subagent to use | `"default"` |

## Advanced: Custom Subagents

You can create specialized subagents for specific task types:

```bash
# Security-focused tasks
/ralph start security-audit --use-subagents --subagent-agent security-auditor

# Frontend tasks
/ralph start ui-components --use-subagents --subagent-agent frontend-developer

# Testing tasks
/ralph start test-suite --use-subagents --subagent-agent test-automator
```

## Limitations

1. **Requires subagent tool**: Must have the subagent extension or tool available
2. **Manual delegation**: Agent must manually call the subagent tool (not automatic)
3. **No automatic retry**: If subagent fails, you must handle it manually
4. **Linear execution**: Tasks are processed one at a time (no parallelization yet)

## Future Enhancements

Potential improvements for future versions:
- Automatic subagent invocation (no manual tool calls)
- Parallel task execution
- Automatic retry with exponential backoff
- Task dependencies and ordering
- Dynamic task generation based on results
