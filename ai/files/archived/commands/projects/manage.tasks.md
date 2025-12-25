# Manage Project Tasks

**Usage:** `/project:manage:tasks <subcommand> [filter/id] [options]`

This command provides unified task management for the current project using Taskwarrior, with automatic project filtering based on the git repository remote URL.

## Subcommands

### List Tasks
```
/project:manage:tasks list [filter]
```

List tasks for this project. Supports optional Taskwarrior filters.

**Examples:**
```
/project:manage:tasks list
/project:manage:tasks list +bug priority:H
/project:manage:tasks list status:completed
/project:manage:tasks list due.before:tomorrow
```

### Search Tasks
```
/project:manage:tasks search <pattern>
```

Search tasks by description or tags.

**Examples:**
```
/project:manage:tasks search api-endpoint
/project:manage:tasks search +feature
/project:manage:tasks search 'description~Bug'
```

### Filter & Count
```
/project:manage:tasks filter <filter>
```

Apply complex filters and show matching tasks.

**Examples:**
```
/project:manage:tasks filter +bug priority:H status:pending
/project:manage:tasks filter '(priority:H or due.before:eom)'
/project:manage:tasks filter due.before:today
```

### Add Task
```
/project:manage:tasks add <description> [attributes]
```

Create a new task in this project.

**Examples:**
```
/project:manage:tasks add "Implement API endpoint" +feature +backend priority:M
/project:manage:tasks add "Fix button styling" +bug priority:H due:tomorrow
/project:manage:tasks add "Code review" +review due:today
```

### Update Task
```
/project:manage:tasks update <id> <changes>
```

Modify an existing task.

**Examples:**
```
/project:manage:tasks update 5 priority:H
/project:manage:tasks update 5 "New description" +urgent -low-priority
/project:manage:tasks update 3 due:next-week
```

### Delete Task
```
/project:manage:tasks delete <id>
```

Remove a task. Requires confirmation in interactive mode.

**Examples:**
```
/project:manage:tasks delete 5
/project:manage:tasks delete 1,2,3
```

### Mark Complete
```
/project:manage:tasks complete <id>
```

Mark one or more tasks as done.

**Examples:**
```
/project:manage:tasks complete 5
/project:manage:tasks complete 1,2,3
```

### View Task Details
```
/project:manage:tasks info <id>
```

Show detailed information about a specific task.

**Examples:**
```
/project:manage:tasks info 5
/project:manage:tasks info 1,2,3
```

### Show Active
```
/project:manage:tasks active
```

List currently active tasks (started but not completed).

### Show Overdue
```
/project:manage:tasks overdue
```

List tasks past their due date.

### Show Next
```
/project:manage:tasks next
```

Show next/most urgent actionable tasks.

### Statistics
```
/project:manage:tasks stats
```

Display task database statistics for this project.

### Summary
```
/project:manage:tasks summary
```

Show project status summary (tasks by status).

### Burndown Chart
```
/project:manage:tasks burndown [daily|weekly|monthly]
```

Display graphical burndown chart.

**Examples:**
```
/project:manage:tasks burndown
/project:manage:tasks burndown weekly
/project:manage:tasks burndown monthly
```

### Export Tasks
```
/project:manage:tasks export [format]
```

Export tasks in JSON or other formats.

**Examples:**
```
/project:manage:tasks export
/project:manage:tasks export json
```

## Automatic Project ID

The command automatically:
1. Detects your git repository remote: `git config --get remote.origin.url`
2. Converts to project ID: `git@github.com:owner/repo.git` → `owner-repo`
3. Filters all operations to this project

You can override with `TASK_PROJECT_ID` environment variable:
```bash
TASK_PROJECT_ID=custom-project /project:manage:tasks list
```

## Common Workflows

### Daily Standup
```
/project:manage:tasks active
/project:manage:tasks next
/project:manage:tasks overdue
```

### Start Work on a Task
```
/project:manage:tasks list +ready status:pending
/project:manage:tasks update 5 start
```

### End of Day Review
```
/project:manage:tasks completed
/project:manage:tasks summary
```

### Sprint Planning
```
/project:manage:tasks filter status:pending
/project:manage:tasks filter 'due.before:eom and priority:H'
```

### Cleanup Completed Work
```
/project:manage:tasks completed
# Review, then:
/project:manage:tasks delete [completed-id]
```

## Filter Syntax

Taskwarrior supports powerful filtering:

**By Status:**
- `status:pending` - Not yet started
- `status:completed` - Finished tasks
- `status:waiting` - On hold

**By Priority:**
- `priority:H` - High priority
- `priority:M` - Medium priority
- `priority:L` - Low priority

**By Due Date:**
- `due:today` - Due today
- `due.before:tomorrow` - Due before tomorrow
- `due.after:eom` - Due after end of month
- `due.before:eow` - Due before end of week

**By Tag:**
- `+tag` - Has tag
- `-tag` - Does not have tag

**By Text:**
- `description~Pattern` - Description contains pattern
- `description~/regex/` - Description matches regex

**Complex Expressions:**
- `(priority:H or due.before:tomorrow)` - OR condition
- `status:pending and +bug` - AND condition
- `(+feature or +bug) and priority:H` - Nested conditions

## Task Attributes

When adding/updating tasks, you can set:

- `description` - Task name/description
- `project` - Project name (auto-set to git repo)
- `priority` - H, M, or L
- `due` - Due date (today, tomorrow, friday, eom, etc.)
- `tags` - Use `+tag` to add, `-tag` to remove
- `status` - pending, completed, waiting, deleted
- `recur` - Recurrence pattern (daily, weekly, monthly, etc.)

**Example full task:**
```
/project:manage:tasks add "Complex feature implementation" project:zenobius-dotfiles priority:H due:next-friday +feature +backend +important
```

## Tips & Tricks

**Mark multiple tasks done at once:**
```
/project:manage:tasks complete 1,2,3
/project:manage:tasks complete 1-5
```

**Quickly find and update all high-priority bugs:**
```
/project:manage:tasks filter +bug priority:H
/project:manage:tasks update +bug priority:H "New description" +urgent
```

**Track time on tasks:**
```
/project:manage:tasks update 5 start
# Work on task...
/project:manage:tasks update 5 stop
```

**See everything due this week:**
```
/project:manage:tasks filter due.before:eow
```
