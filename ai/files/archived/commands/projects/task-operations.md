# Taskwarrior Integration Helper

**Internal helper command:** Provides reusable functions for task management operations

This is a reference implementation showing how to integrate the Task Manager Agent into OpenCode workflows.

## Project ID Resolution Function

```bash
function get-project-id() {
  # Try environment override first
  if [[ -n "$TASK_PROJECT_ID" ]]; then
    echo "$TASK_PROJECT_ID"
    return 0
  fi
  
  # Extract from git remote URL
  local remote_url
  remote_url=$(git config --get remote.origin.url 2>/dev/null)
  
  if [[ -z "$remote_url" ]]; then
    echo "Error: Not in a git repository" >&2
    return 1
  fi
  
  # Convert: git@github.com:owner/repo.git → owner-repo
  # Also handles: https://github.com/owner/repo.git
  local project_id
  project_id=$(echo "$remote_url" | sed -E 's/.*[:/]([^/]+)\/([^/.]+)(\.git)?$/\1-\2/')
  
  if [[ -z "$project_id" ]]; then
    echo "Error: Could not parse git remote URL: $remote_url" >&2
    return 1
  fi
  
  echo "$project_id"
  return 0
}
```

## Task Query Functions

### List All Tasks

```bash
function task-list() {
  local project_id filter
  project_id=$(get-project-id) || return 1
  filter="${1:-}"
  
  if [[ -n "$filter" ]]; then
    task project:"$project_id" "$filter" list
  else
    task project:"$project_id" list
  fi
}
```

### Search Tasks

```bash
function task-search() {
  local project_id pattern
  project_id=$(get-project-id) || return 1
  pattern="${1:?Search pattern required}"
  
  task project:"$project_id" "description~$pattern" list
}
```

### Get Task Info

```bash
function task-info() {
  local project_id task_id
  project_id=$(get-project-id) || return 1
  task_id="${1:?Task ID required}"
  
  task project:"$project_id" "$task_id" information
}
```

### List Active Tasks

```bash
function task-active() {
  local project_id
  project_id=$(get-project-id) || return 1
  
  task project:"$project_id" active list
}
```

### List Overdue Tasks

```bash
function task-overdue() {
  local project_id
  project_id=$(get-project-id) || return 1
  
  task project:"$project_id" overdue list
}
```

## Task Modification Functions

### Add Task

```bash
function task-add() {
  local project_id description attributes
  project_id=$(get-project-id) || return 1
  description="${1:?Task description required}"
  shift
  attributes=("$@")
  
  # Add project attribute if not already specified
  local has_project=false
  for attr in "${attributes[@]}"; do
    if [[ "$attr" == project:* ]]; then
      has_project=true
      break
    fi
  done
  
  if [[ "$has_project" == false ]]; then
    attributes+=("project:$project_id")
  fi
  
  task add "$description" "${attributes[@]}"
}
```

### Update Task

```bash
function task-update() {
  local project_id task_id changes
  project_id=$(get-project-id) || return 1
  task_id="${1:?Task ID required}"
  shift
  changes=("$@")
  
  if [[ ${#changes[@]} -eq 0 ]]; then
    echo "Error: No changes specified" >&2
    return 1
  fi
  
  task project:"$project_id" "$task_id" modify "${changes[@]}"
}
```

### Complete Task

```bash
function task-complete() {
  local project_id task_id
  project_id=$(get-project-id) || return 1
  task_id="${1:?Task ID required}"
  
  task project:"$project_id" "$task_id" done
}
```

### Delete Task

```bash
function task-delete() {
  local project_id task_id
  project_id=$(get-project-id) || return 1
  task_id="${1:?Task ID required}"
  
  task project:"$project_id" "$task_id" delete
}
```

## Advanced Query Functions

### Filter Tasks

```bash
function task-filter() {
  local project_id filter
  project_id=$(get-project-id) || return 1
  filter="${1:?Filter expression required}"
  
  # Combine project filter with user filter
  task project:"$project_id" "$filter" list
}
```

### Get Statistics

```bash
function task-stats() {
  local project_id
  project_id=$(get-project-id) || return 1
  
  task project:"$project_id" stats
}
```

### Get Summary

```bash
function task-summary() {
  local project_id
  project_id=$(get-project-id) || return 1
  
  task project:"$project_id" summary
}
```

### Export Tasks

```bash
function task-export() {
  local project_id format
  project_id=$(get-project-id) || return 1
  format="${1:-json}"
  
  if [[ "$format" == "json" ]]; then
    task project:"$project_id" export
  else
    echo "Unsupported format: $format" >&2
    return 1
  fi
}
```

## Usage Examples

### In OpenCode Commands

```bash
#!/bin/bash
source /path/to/task-operations.md

# Query examples
task-list                                    # List all tasks
task-list "priority:H status:pending"        # High priority pending
task-active                                  # Show active tasks
task-overdue                                 # Show overdue tasks

# Add task
task-add "Implement feature" +feature priority:M due:next-week

# Update task
task-update 5 priority:H

# Complete task
task-complete 5

# Search
task-search "api endpoint"

# Get info
task-info 5
```

### In Shell Scripts

```bash
#!/bin/bash

# Load functions
source task-operations.md

# Daily standup report
echo "=== Active Tasks ==="
task-active

echo ""
echo "=== Overdue Tasks ==="
task-overdue

echo ""
echo "=== Statistics ==="
task-stats
```

### Project-Specific Workflows

```bash
#!/bin/bash
source task-operations.md

# Find and display all bugs
echo "=== High Priority Bugs ==="
task-filter "+bug priority:H"

# Mark review tasks as done
task-update 1,2,3 +reviewed

# Create sprint tasks
task-add "Sprint planning" +sprint due:friday priority:H
task-add "Code review" +sprint due:friday priority:M
task-add "Deployment" +sprint due:friday priority:H
```

## Integration with CI/CD

Export tasks for reporting:

```bash
#!/bin/bash
source task-operations.md

# Generate task report
task-export json | jq -r '.[] | 
  select(.status=="pending") | 
  "\(.description) (Priority: \(.priority // "N/A"), Due: \(.due // "No due date"))"'
```

## Error Handling

All functions include proper error handling:
- Check for required parameters
- Validate project ID resolution
- Return appropriate exit codes
- Display helpful error messages

## Customization

Extend this helper with project-specific functions:

```bash
# Custom filter for your project
function my-project-urgent() {
  task-filter '+bug priority:H status:pending'
}

# Batch operations
function my-project-review() {
  task-filter 'status:waiting' | while read -r task_id; do
    task-update "$task_id" +reviewed
  done
}
```

## Performance Notes

- Project filtering is efficient in Taskwarrior
- Large task databases benefit from archiving completed tasks
- Export to JSON recommended for programmatic processing
- Use specific filters to reduce memory usage

## Related Documentation

- Task Manager Agent: `/agent/task-manager.md`
- Manage Tasks Command: `/command/project/manage.tasks.md`
- Taskwarrior Official: https://taskwarrior.org/docs/
