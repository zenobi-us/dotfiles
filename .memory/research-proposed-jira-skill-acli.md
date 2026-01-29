---
id: proposed01
title: Proposed ACLI-based Jira Skill
created_at: 2026-01-29T11:40:00+10:30
updated_at: 2026-01-29T11:40:00+10:30
status: draft
epic_id: jiraf2a6
---

# Proposed ACLI-based Jira Skill

This is a draft of the updated Jira skill using ACLI instead of mcporter.

---

```markdown
---
name: jira
description: Use when searching Jira issues, viewing issue details, managing transitions, or automating Jira workflows - provides complete examples using the Atlassian CLI (acli) for all common Jira operations
---

# Jira Skill

Master Jira automation using the Atlassian CLI (acli). Provides programmatic access to issues, projects, comments, and workflows.

> [!NOTE]
> ACLI uses "workitem" terminology instead of "issue" throughout its commands.
> `acli jira workitem view KEY-123` = View issue KEY-123

## Quick Setup

### Authentication (One-Time)

```bash
# OAuth via browser (recommended)
acli jira auth login --web

# Or via API token
echo $JIRA_TOKEN | acli jira auth login --site "yoursite.atlassian.net" --email "you@example.com" --token
```

### Check Auth Status

```bash
acli jira auth status
```

## Core Operations

### View Issue

```bash
# Basic view
acli jira workitem view KEY-123

# JSON output for parsing
acli jira workitem view KEY-123 --json

# Specific fields
acli jira workitem view KEY-123 --fields "summary,description,status,assignee"

# Open in browser
acli jira workitem view KEY-123 --web
```

**Default fields:** `key,issuetype,summary,status,assignee,description`

**Field selection:**
- `*all` - All fields
- `*navigable` - Navigable fields only
- `-description` - Exclude description
- `summary,comment` - Only these fields

### Search Issues

```bash
# Basic JQL search
acli jira workitem search --jql "project = TEAM"

# With pagination (fetch all)
acli jira workitem search --jql "project = TEAM" --paginate

# Specific fields as JSON
acli jira workitem search --jql "assignee = currentUser()" --fields "key,summary,status" --json

# Export as CSV
acli jira workitem search --jql "project = TEAM" --fields "key,summary,priority" --csv

# Count only
acli jira workitem search --jql "project = TEAM AND status = Open" --count

# Using saved filter
acli jira workitem search --filter 10001
```

**Common JQL:**
- `assignee = currentUser()` - My issues
- `project = PROJ` - Specific project
- `status = "In Progress"` - By status
- `updated >= -7d` - Recent updates
- `issuetype = Bug` - By type

### Create Issue

```bash
# Minimal create
acli jira workitem create --project "TEAM" --type "Task" --summary "New Task"

# Full create
acli jira workitem create \
  --project "TEAM" \
  --type "Bug" \
  --summary "Login fails on Safari" \
  --description "Users report login issues on Safari 17" \
  --assignee "@me" \
  --label "bug,frontend"

# From JSON file
acli jira workitem create --from-json "issue.json"

# Generate JSON template
acli jira workitem create --generate-json

# Using editor for description
acli jira workitem create --project "TEAM" --type "Story" --editor
```

### Edit Issue

```bash
# Update summary
acli jira workitem edit --key "KEY-123" --summary "Updated Title"

# Update assignee
acli jira workitem edit --key "KEY-123" --assignee "user@example.com"

# Self-assign
acli jira workitem edit --key "KEY-123" --assignee "@me"

# Remove assignee
acli jira workitem edit --key "KEY-123" --remove-assignee

# Update labels
acli jira workitem edit --key "KEY-123" --labels "urgent,frontend"

# Bulk edit via JQL
acli jira workitem edit --jql "project = TEAM AND status = Open" --assignee "@me" --yes
```

### Transition Issue (Change Status)

```bash
# Transition by status name
acli jira workitem transition --key "KEY-123" --status "In Progress"
acli jira workitem transition --key "KEY-123" --status "Done"

# Skip confirmation
acli jira workitem transition --key "KEY-123" --status "Done" --yes

# Bulk transition
acli jira workitem transition --jql "assignee = currentUser() AND status = Open" --status "In Progress" --yes
```

> **Note:** Unlike mcporter, ACLI uses status NAMES directly - no need to lookup transition IDs!

### Add Comment

```bash
# Simple comment
acli jira workitem comment create --key "KEY-123" --body "Work in progress"

# From file
acli jira workitem comment create --key "KEY-123" --body-file "comment.txt"

# Using editor
acli jira workitem comment create --key "KEY-123" --editor

# With GitHub permalink
acli jira workitem comment create --key "KEY-123" --body "Implementation: https://github.com/org/repo/blob/abc123/src/file.ts#L42"

# Bulk comment
acli jira workitem comment create --jql "project = TEAM AND sprint = 'Sprint 5'" --body "Sprint review complete"
```

### List Comments

```bash
acli jira workitem comment list KEY-123
acli jira workitem comment list KEY-123 --json
```

### Issue Links

```bash
# List links on an issue
acli jira workitem link list KEY-123

# Create link
acli jira workitem link create --key "KEY-123" --target "KEY-456" --type "Blocks"

# List available link types
acli jira workitem link type

# Delete link
acli jira workitem link delete --key "KEY-123" --target "KEY-456" --type "Blocks"
```

## Project Operations

```bash
# List all projects
acli jira project list

# View project details
acli jira project view TEAM

# List as JSON
acli jira project list --json
```

## Output Formats

| Flag | Format | Use Case |
|------|--------|----------|
| (none) | Table | Interactive terminal use |
| `--json` | JSON | Scripting, parsing with jq |
| `--csv` | CSV | Spreadsheet export |
| `--web` | Browser | Visual inspection |

### Parsing JSON Output

```bash
# Get issue key from search
acli jira workitem search --jql "assignee = currentUser()" --json | jq -r '.[].key'

# Get status of issue
acli jira workitem view KEY-123 --json | jq -r '.fields.status.name'

# Get all open issues as list
acli jira workitem search --jql "status = Open" --json | jq -r '.[].key' | tr '\n' ','
```

## Scripting Patterns

### Get Current User

```bash
# Email from auth
acli jira auth status 2>&1 | grep Email | awk '{print $2}'
```

### My Open Issues

```bash
acli jira workitem search --jql "assignee = currentUser() AND resolution = Unresolved" --fields "key,summary,status" --json
```

### Close All Done Issues

```bash
acli jira workitem transition --jql "assignee = currentUser() AND status = 'Done' AND resolution = Unresolved" --status "Closed" --yes
```

### Daily Standup Script

```bash
#!/bin/bash
echo "=== Yesterday ==="
acli jira workitem search --jql "assignee = currentUser() AND updated >= -1d AND status changed" --fields "key,summary,status"

echo "=== Today ==="
acli jira workitem search --jql "assignee = currentUser() AND status != Done" --fields "key,summary,status"
```

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| "Not authenticated" | Run `acli jira auth login --web` |
| "No work items found" | Check JQL syntax, verify project key |
| "Cannot transition" | Verify target status is valid for current workflow |
| "Field not editable" | Check field permissions in Jira |
| Status with spaces | Quote it: `--status "In Progress"` |

## Tips

- **Bulk operations:** Most commands accept `--jql` flag
- **Skip prompts:** Add `--yes` to dangerous operations
- **JSON for scripts:** Always use `--json` when parsing output
- **Self-assign:** Use `@me` for assignee
- **Editor mode:** Use `--editor` for long descriptions
- **CSV export:** Great for sharing with non-technical stakeholders
```

---

## Migration Notes for Skill Update

### Files to Update

1. **`/home/zenobius/.pi/agent/skills/jira/SKILL.md`** - Replace entirely with above

2. **Delete helper scripts** - The old skill has scripts in `./scripts/`:
   - `get_ticket_summary.sh` - Can be replaced with `acli jira workitem view`
   - `get_current_user.sh` - Can be replaced with `acli jira auth status`
   - `get_cloud_id.sh` - No longer needed

### Breaking Changes

1. **Scripts directory** - Old scripts won't work with ACLI
2. **Terminology** - "issue" → "workitem" in commands
3. **Environment variables** - `JIRA_CLOUD_ID` no longer needed

### Backward Compatibility

Consider keeping the old skill as `jira-mcporter` during transition period, or document both approaches.
