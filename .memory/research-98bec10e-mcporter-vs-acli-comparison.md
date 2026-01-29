---
id: 98bec10e
title: mcporter vs ACLI Comparison
created_at: 2026-01-29T11:35:00+10:30
updated_at: 2026-01-29T11:35:00+10:30
status: completed
epic_id: jiraf2a6
phase_id: null
related_task_id: null
---

# mcporter (Atlassian MCP) vs ACLI Comparison

## Summary

| Aspect | mcporter + MCP | ACLI |
|--------|----------------|------|
| **Complexity** | High (MCP protocol, function-call syntax) | Low (standard CLI flags) |
| **Setup** | Requires cloud ID, MCP server running | OAuth login once |
| **Transitions** | Requires numeric transition ID | Uses status NAME directly |
| **Bulk Operations** | Manual looping required | Native JQL support in most commands |
| **Output** | JSON only | JSON, CSV, human-readable, browser |
| **Editor Support** | None | Built-in `--editor` flag |
| **Terminology** | Uses "issue" | Uses "workitem" |
| **Authentication** | Cloud ID per request | Session-based |

## Detailed Comparison

### Authentication

**mcporter (Old):**
```bash
# Must get cloud ID first
export JIRA_CLOUD_ID=$(mise x node@20 -- ./scripts/get_cloud_id.sh)

# Every command needs cloud ID
mise x node@20 -- mcporter call 'atlassian.getJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123")'
```

**ACLI (New):**
```bash
# One-time login (persisted)
acli jira auth login --web

# Commands just work
acli jira workitem view PROJ-123
```

### View Issue

**mcporter (Old):**
```bash
mise x node@20 -- mcporter call 'atlassian.getJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123", fields: ["key", "summary", "status", "assignee", "description"])'
```

**ACLI (New):**
```bash
acli jira workitem view PROJ-123 --fields "key,summary,status,assignee,description"

# Or with JSON output
acli jira workitem view PROJ-123 --json
```

### Search Issues

**mcporter (Old):**
```bash
mise x node@20 -- mcporter call 'atlassian.searchJiraIssuesUsingJql(cloudId: "'$JIRA_CLOUD_ID'", jql: "assignee = currentUser() AND status = Open", fields: ["key", "summary", "status"], maxResults: 50)'
```

**ACLI (New):**
```bash
acli jira workitem search --jql "assignee = currentUser() AND status = Open" --fields "key,summary,status" --limit 50
```

### Transition Issue

**mcporter (Old):**
```bash
# Step 1: Get available transitions
mise x node@20 -- mcporter call 'atlassian.getTransitionsForJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123")'

# Step 2: Use numeric transition ID
mise x node@20 -- mcporter call 'atlassian.transitionJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123", transition: {id: "11"})'
```

**ACLI (New):**
```bash
# Just use the status name!
acli jira workitem transition --key "PROJ-123" --status "Done"
```

### Add Comment

**mcporter (Old):**
```bash
mise x node@20 -- mcporter call 'atlassian.addCommentToJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123", commentBody: "Your comment here")'
```

**ACLI (New):**
```bash
acli jira workitem comment create --key "PROJ-123" --body "Your comment here"

# Or from file
acli jira workitem comment create --key "PROJ-123" --body-file "comment.txt"

# Or with editor
acli jira workitem comment create --key "PROJ-123" --editor
```

### Create Issue

**mcporter (Old):**
```bash
# Not documented in old skill - would need to discover via schema introspection
```

**ACLI (New):**
```bash
acli jira workitem create \
  --project "TEAM" \
  --type "Task" \
  --summary "New Task" \
  --description "Description here" \
  --assignee "@me"
```

### Edit Issue

**mcporter (Old):**
```bash
# Not documented in old skill
```

**ACLI (New):**
```bash
acli jira workitem edit --key "PROJ-123" --summary "Updated Summary"

# Bulk edit
acli jira workitem edit --jql "project = TEAM AND status = Open" --labels "needs-review"
```

### Get Remote Links (PRs, etc.)

**mcporter (Old):**
```bash
mise x node@20 -- mcporter call 'atlassian.getJiraIssueRemoteIssueLinks(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123")' | \
  jq '.[]? | select(.type.name == "GitHub" or (.globalId | contains("github"))) | .object.url'
```

**ACLI (New):**
```bash
acli jira workitem link list PROJ-123 --json
```

## Key Migration Benefits

### 1. Drastically Simpler Syntax
- No more function-call syntax with nested quotes
- No environment variable interpolation tricks
- Standard Unix flag patterns

### 2. No Cloud ID Management
- OAuth session persisted locally
- No need to fetch/export cloud ID before every operation

### 3. Status-Based Transitions
- Use human-readable status names ("Done", "In Progress")
- No need to lookup numeric transition IDs first

### 4. Built-in Bulk Operations
- Most commands accept `--jql` for bulk operations
- No scripting required for batch updates

### 5. Better Output Options
- Human-readable by default
- `--json` for parsing
- `--csv` for export
- `--web` to open in browser

### 6. Editor Integration
- `--editor` flag opens preferred text editor
- Great for long descriptions/comments

## Migration Risks

### 1. Terminology Change
- ACLI uses "workitem" instead of "issue"
- Skill documentation needs to explain this mapping

### 2. Field Names
- May differ slightly between mcporter and ACLI
- Need to verify common field names work

### 3. Remote Links
- Need to verify if ACLI's link commands can access GitHub PR links
- May need `link list` with filtering

### 4. Custom Fields
- ACLI supports custom fields but syntax may differ
- Need to test with project-specific fields

## Recommendation

**Proceed with migration.** The benefits significantly outweigh the risks:
- Simpler, more maintainable skill documentation
- Better user experience with intuitive commands
- Official Atlassian tooling with active development
- Reduced dependencies (no MCP server required)
