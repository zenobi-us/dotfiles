---
name: executing-tasks-from-any-source
description: Execute tasks from both GitHub issues and Basic Memory artifacts using unified workflow - supports intelligent source detection and dual-channel status management
---

# Executing Tasks From Any Source

## Overview

The `/project:do:task` workflow supports both **GitHub issues** and **Basic Memory artifacts** through intelligent source detection. This skill explains the dual-source execution pattern.

**Core principle:** Detect input format → Fetch from appropriate source → Execute unified workflow → Update both channels.

## When to Use This Skill

- Executing tasks from GitHub issues (traditional issue-based workflow)
- Executing tasks from Basic Memory artifacts (Johnny Decimal format: `5.1.1-task-*`)
- Switching between task sources within the same project
- Building tools/agents that need to support both task sources

## Quick Reference: Source Detection

| Input Format | Example | Source | Worktree Name |
|---|---|---|---|
| Issue number | `123` or `#123` | GitHub API | `feature/123-auth-implementation` |
| Johnny Decimal | `5.1.1-task-auth` | Basic Memory | `feature/5.1.1-task-auth` |

**Detection logic:**
```bash
if [[ $ARGUMENTS =~ ^#?[0-9]+$ ]]; then
  # GitHub issue - pure digits with optional #
  ISSUE_NUM=$(echo $ARGUMENTS | tr -d '#')
  SOURCE="github"
elif [[ $ARGUMENTS =~ ^[0-9]+(\.[0-9]+)+.* ]]; then
  # Basic Memory artifact - Johnny Decimal format
  ARTIFACT_ID=$ARGUMENTS
  SOURCE="basicmemory"
else
  echo "Error: Invalid task format. Use GitHub issue (#123) or Johnny Decimal artifact (5.1.1-task-name)"
  exit 1
fi
```

## GitHub Issue Execution Path

### Step 1: Fetch Issue Details

```bash
# Fetch issue using GitHub CLI
gh issue view $ISSUE_NUM --json title,body,author,labels,assignees,linkedIssues

# Extract components:
# - Title: Issue headline
# - Body: Full description with acceptance criteria
# - Author: Original creator
# - Labels: Topic tags (feature, bug, etc)
# - Assignees: Current assignee
# - LinkedIssues: Related/parent issues
```

### Step 2: Worktree Creation

Pass to `using-git-worktrees` skill:
```
feature_identifier: "{ISSUE_NUM}-{slug}"
Example: "123-add-user-authentication"
```

### Step 3: Status Updates (In-Progress)

```bash
# Add in-progress label
gh issue edit $ISSUE_NUM --add-label "in-progress"

# Add comment
gh issue comment $ISSUE_NUM -b "Implementation started. Tracking in worktree."

# Remove ready/todo labels
gh issue edit $ISSUE_NUM --remove-label "ready,todo"
```

### Step 4: Status Updates (Completed)

```bash
# Update labels
gh issue edit $ISSUE_NUM --remove-label "in-progress"
gh issue edit $ISSUE_NUM --add-label "completed"

# Add completion comment with PR link
gh issue comment $ISSUE_NUM -b "Completed in PR #{PR_NUMBER}. See changes above."
```

## Basic Memory Artifact Execution Path

### Artifact Structure

Tasks in Basic Memory use this structure:

```markdown
---
title: "5.1.1-task-user-authentication"
folder: "5-tasks"
entity_type: "task"
entity_metadata:
  tags: ["authentication", "user-system"]
  status: "pending"
  priority: "high"
  epic_id: "2.1.1-epic-auth-system"
  dependencies: []
---

# Task: Implement User Authentication

## Description
Detailed task description...

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Dependencies
- depends_on [[2.1.0-epic-auth-system]]
```

### Step 1: Fetch Artifact Details

```bash
# Use basicmemory_read_note with Johnny Decimal lookup
# Tool extracts: title, content, frontmatter (status, epic_id, dependencies)
# from 5-tasks folder matching the artifact ID

# Frontmatter fields parsed:
# - status: "pending" | "in-progress" | "completed"
# - epic_id: Parent epic reference (e.g., "2.1.1-epic-auth")
# - priority: "high" | "medium" | "low"
# - dependencies: List of related artifacts
```

### Step 2: Worktree Creation

Pass to `using-git-worktrees` skill:
```
feature_identifier: "{JOHNNY_DECIMAL}-{slug}"
Example: "5.1.1-task-user-authentication"
```

### Step 3: Status Updates (In-Progress)

```bash
# Use basicmemory_edit_note to update frontmatter
basicmemory_edit_note(
  identifier: "5.1.1-task-auth",
  operation: "find_replace",
  find_text: "status: pending",
  content: "status: in-progress"
)

# Add implementation note
basicmemory_edit_note(
  identifier: "5.1.1-task-auth",
  operation: "append",
  content: "\n## Implementation Log\n- Started implementation in worktree\n"
)
```

### Step 4: Status Updates (Completed)

```bash
# Update status to completed
basicmemory_edit_note(
  identifier: "5.1.1-task-auth",
  operation: "find_replace",
  find_text: "status: in-progress",
  content: "status: completed"
)

# Add PR link to artifact
basicmemory_edit_note(
  identifier: "5.1.1-task-auth",
  operation: "append",
  content: "\n- Completed in PR: https://github.com/repo/pulls/123\n"
)
```

## Unified Workflow Steps (Apply to Both Sources)

Once task is fetched from its source, the remaining workflow is identical:

1. **Deep Technical Analysis** (Step 2)
   - Extract user story
   - Map acceptance criteria
   - Determine technical scope
   - Check dependencies
   - Consider edge cases

2. **System Impact Assessment** (Step 3)
   - Frontend changes needed?
   - Backend changes needed?
   - Database migrations?
   - Testing strategy?

3. **Human Validation Check** (Step 4)
   - Stop and ask if architectural decisions needed
   - Stop and ask if security/performance critical
   - Wait for explicit approval

4. **Implementation** (Steps 6-12)
   - Design test strategy
   - Plan implementation approach
   - Execute core implementation
   - Run comprehensive tests
   - Update documentation
   - Quality validation

5. **Completion** (Steps 13-15)
   - Update task status (source-specific)
   - Create pull request linking to task
   - Monitor code review
   - After merge: update parent issue/epic

## Common Patterns

### Pattern 1: Check task dependencies before starting

**GitHub:**
```bash
# Get linked issues that are blockers
gh issue view $ISSUE_NUM --json linkedIssues --jq '.linkedIssues[] | select(.url | contains("blocked"))'
```

**Basic Memory:**
```bash
# Read the artifact to find depends_on relations
basicmemory_read_note("5.1.1-task-auth")
# Check frontmatter: dependencies: [...] or look for "depends_on [[...]]" in content
```

### Pattern 2: Get parent context

**GitHub:**
```bash
# Find linked parent issue (PRD/Feature)
gh issue view $ISSUE_NUM --json linkedIssues \
  | jq '.linkedIssues[] | select(.title | contains("Feature") or contains("PRD"))'
```

**Basic Memory:**
```bash
# Fetch parent epic using epic_id from frontmatter
basicmemory_read_note("2.1.1-epic-auth-system")
```

### Pattern 3: Update related items after completion

**GitHub:**
```bash
# Update parent issue with progress
gh issue comment $PARENT_ISSUE_NUM -b "Completed task #{ISSUE_NUM}"

# Link completed task to parent
gh issue edit $ISSUE_NUM --add-label "merged"
```

**Basic Memory:**
```bash
# Update parent epic
basicmemory_edit_note(
  identifier: "2.1.1-epic-auth",
  operation: "append",
  content: "\n- Completed: [[5.1.1-task-user-authentication]]\n"
)
```

## Error Handling

### Invalid Task Format

```bash
if [[ ! $ARGUMENTS =~ ^(#?[0-9]+|[0-9]+(\.[0-9]+)+.*)$ ]]; then
  echo "❌ Invalid task format"
  echo "GitHub issue: 123 or #123"
  echo "Basic Memory: 5.1.1-task-name"
  exit 1
fi
```

### GitHub Issue Not Found

```bash
if ! gh issue view $ISSUE_NUM 2>/dev/null; then
  echo "❌ GitHub issue #$ISSUE_NUM not found"
  echo "Check the issue number and try again"
  exit 1
fi
```

### Basic Memory Artifact Not Found

```bash
if ! basicmemory_read_note($ARTIFACT_ID) 2>/dev/null; then
  echo "❌ Basic Memory artifact $ARTIFACT_ID not found in 5-tasks/"
  echo "Check the artifact ID matches Johnny Decimal format: N.N.N-task-*"
  exit 1
fi
```

## Integration Points

**Called by:**
- `/project:do:task` workflow (main entry point)
- Agent task execution systems
- Task queuing systems

**Pairs with:**
- `using-git-worktrees` - Creates isolated workspace
- `executing-plans` - For comprehensive implementation
- `subagent-driven-development` - For delegated work
- `finishing-a-development-branch` - For cleanup after completion

## Best Practices

1. **Always verify task exists** before starting workflow
2. **Check dependencies** before implementing
3. **Use consistent worktree naming** - helps with resumption
4. **Update status in source** before creating worktree
5. **Document completion** in both PR comment and task artifact
6. **Keep frontmatter clean** - avoid manual formatting in Basic Memory
7. **Link related tasks** - use relations/dependencies properly

## Red Flags

**Never:**
- Start implementation without fetching task details first
- Ignore dependency warnings
- Proceed with failing tests without asking
- Forget to update task status when switching sources
- Mix GitHub and Basic Memory references inconsistently

**Always:**
- Detect source format before proceeding
- Fetch complete task context
- Verify dependencies before starting
- Update task status at start and completion
- Link PR to task in both channels
