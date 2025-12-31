---
name: storage-taskwarrior
description: Manage Taskwarrior tasks scoped to the current git repository using its remote URL as a project identifier.
---

**Agent Purpose:** Manage Taskwarrior tasks using the current project's git repository remote URL as a project ID.

**Project ID Generation:** Automatically slugified from git remote URL
- Example: `git@github.com:zenobi-us/dotfiles.git` → `zenobi-us-dotfiles`
- Stored in Taskwarrior `project` attribute for easy filtering

## Core Capabilities

### 1. Automatic Project ID Resolution

The agent automatically:
1. Detects the git repository remote URL: `git config --get remote.origin.url`
2. Extracts owner and repo: `github.com:{owner}/{repo}.git` → `{owner}-{repo}`
3. Uses this as the `project` filter for all task commands
4. Allows manual override via environment variable: `TASK_PROJECT_ID`

### 2. Task Listing & Search

**List all tasks for this project:**
```bash
task project:$PROJECT_ID list
```

**Search tasks by tags:**
```bash
task project:$PROJECT_ID +tag list
```

**Filter by status:**
```bash
task project:$PROJECT_ID status:pending list
task project:$PROJECT_ID status:completed list
```

**Filter by priority:**
```bash
task project:$PROJECT_ID priority:H list
task project:$PROJECT_ID priority:L list
```

**Complex filtering:**
```bash
task project:$PROJECT_ID +bug priority:H status:pending list
```

### 3. Task CRUD Operations

**Add a new task:**
```bash
task project:$PROJECT_ID add "Task description" +tag priority:H
```

**Create task with full attributes:**
```bash
task project:$PROJECT_ID add "Implementation task" project:$PROJECT_ID +feature +backend priority:M
```

**Update existing task:**
```bash
task project:$PROJECT_ID 5 modify priority:H +urgent
task project:$PROJECT_ID 5 modify "New description" -old-tag +new-tag
```

**Delete task:**
```bash
task project:$PROJECT_ID 5 delete
```

**Mark task as done:**
```bash
task project:$PROJECT_ID 5 done
```

### 4. Task Analysis & Reporting

**View task statistics:**
```bash
task project:$PROJECT_ID stats
```

**Show task summary by status:**
```bash
task project:$PROJECT_ID summary
```

**List active tasks:**
```bash
task project:$PROJECT_ID active list
```



### 5. Export & Import

**Export tasks to JSON:**
```bash
task project:$PROJECT_ID export > backup.json
```

**Import tasks from JSON:**
```bash
task import backup.json
```

## Implementation Guidelines

When implementing commands that use this agent:

1. **Always extract project ID first:**
   - Run: `git config --get remote.origin.url | sed -E 's/.*[:/]([^/]+)\/([^/.]+)(\.git)?$/\1-\2/'`
   - Store in `$PROJECT_ID` variable
   - Allow override: `${TASK_PROJECT_ID:-$PROJECT_ID}`

2. **All task operations must include project filter:**
   - Use: `task project:$PROJECT_ID [filter] [command]`
   - Never run `task [command]` without project filter in automated scripts

3. **Handle edge cases:**
   - No tasks found: Return empty list gracefully
   - Invalid project ID: Validate format (alphanumeric + dash only)
   - Missing .task directory: Initialize with `task config report.next.labels ''`

4. **Provide human-readable output:**
   - Parse JSON export for programmatic use
   - Format list output with clear columns and highlighting
   - Show task counts in summaries

## Command Examples

### Search with Multiple Filters
```bash
# Find urgent bugs with high priority
task project:zenobi-us-dotfiles +bug priority:H list

# Find pending tasks with high priority
task project:zenobi-us-dotfiles status:pending priority:H +important list
```

### Batch Operations
```bash
# Mark all overdue tasks as waiting
task project:zenobi-us-dotfiles overdue modify +waiting

# Add same tag to multiple tasks
task project:zenobi-us-dotfiles 1,2,3 modify +reviewed
```

### Complex Filtering
```bash
# Find tasks matching pattern
task project:zenobi-us-dotfiles 'description~Bug' list

# Combine filters with AND/OR
task project:zenobi-us-dotfiles '(priority:H or status:pending)' list
```

## Integration Points

This agent works with:
- **Taskwarrior**: Primary task management backend
- **Git**: Automatic project ID from repository metadata
- **OpenCode Commands**: `/project:do:task` workflow integration
- **Bash/Scripts**: Export/import for CI/CD automation

## Reference

- Taskwarrior Documentation: https://taskwarrior.org
- Project filtering: `task help | grep project`
- Full filter syntax: `man taskfilter` or `task help usage`
