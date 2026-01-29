---
id: 1af8e04c
title: ACLI (Atlassian CLI) Capabilities Research
created_at: 2026-01-29T11:30:00+10:30
updated_at: 2026-01-29T11:30:00+10:30
status: completed
epic_id: jiraf2a6
phase_id: null
related_task_id: null
---

# ACLI (Atlassian CLI) Capabilities Research

## Research Questions

1. What commands does ACLI provide for Jira operations?
2. How does the command structure compare to mcporter?
3. What authentication methods are supported?
4. What output formats are available?
5. What are the key benefits over the MCP-based approach?

## Summary

ACLI is Atlassian's official CLI for interacting with Jira Cloud. It provides a comprehensive, well-structured command hierarchy for all major Jira operations. The tool is simpler than the mcporter+MCP approach, with native flag-based syntax and built-in JSON/CSV output.

**Key Finding:** ACLI uses "workitem" terminology instead of "issue" - this is a significant naming difference from Jira's API.

## Findings

### Installation & Version

```bash
# Installed via mise
which acli  # /home/zenobius/.local/bin/acli
acli version  # 1.3.13-stable
```

### Command Structure

ACLI organizes Jira commands hierarchically:

```
acli jira
├── auth        # Authentication management
│   ├── login   # Authenticate (OAuth or API token)
│   ├── logout  # Sign out
│   ├── status  # Check auth status
│   └── switch  # Switch accounts
├── board       # Kanban/Scrum boards
├── dashboard   # Dashboards
├── field       # Custom fields
├── filter      # Saved filters
├── project     # Project management
│   ├── archive
│   ├── create
│   ├── delete
│   ├── list
│   ├── restore
│   ├── update
│   └── view
├── sprint      # Sprint management
└── workitem    # Issue operations (NOTE: uses "workitem" not "issue")
    ├── archive
    ├── assign
    ├── attachment
    ├── clone
    ├── comment (create/delete/list/update)
    ├── create
    ├── create-bulk
    ├── delete
    ├── edit
    ├── link (create/delete/list/type)
    ├── search
    ├── transition
    ├── unarchive
    ├── view
    └── watcher
```

### Authentication

**OAuth (Recommended):**
```bash
acli jira auth login --web
```

**API Token:**
```bash
echo <token> | acli jira auth login --site "mysite.atlassian.net" --email "user@atlassian.com" --token
```

**Check Status:**
```bash
acli jira auth status
# Output:
# ✓ Authenticated
#   Site: reckon.atlassian.net
#   Email: zeno.jiricek@reckon.com
#   Authentication Type: oauth_global
```

### Core Operations

#### View Issue
```bash
# Basic view
acli jira workitem view KEY-123

# JSON output
acli jira workitem view KEY-123 --json

# Specific fields
acli jira workitem view KEY-123 --fields "summary,description,status"

# Open in browser
acli jira workitem view KEY-123 --web
```

Default fields: `key,issuetype,summary,status,assignee,description`

#### Search Issues
```bash
# JQL search
acli jira workitem search --jql "project = TEAM"

# With pagination
acli jira workitem search --jql "project = TEAM" --paginate

# Count only
acli jira workitem search --jql "project = TEAM" --count

# Specific fields as CSV
acli jira workitem search --jql "project = TEAM" --fields "key,summary,assignee" --csv

# JSON output with limit
acli jira workitem search --jql "project = TEAM" --limit 50 --json

# Using saved filter
acli jira workitem search --filter 10001
```

#### Create Issue
```bash
# Basic create
acli jira workitem create --summary "New Task" --project "TEAM" --type "Task"

# With description and assignee
acli jira workitem create \
  --summary "Bug Report" \
  --project "PROJ" \
  --type "Bug" \
  --assignee "user@atlassian.com" \
  --label "bug,cli"

# From JSON file
acli jira workitem create --from-json "workitem.json"

# Interactive with editor
acli jira workitem create --editor
```

#### Edit Issue
```bash
# Edit by key
acli jira workitem edit --key "KEY-123" --summary "New Summary"

# Bulk edit via JQL
acli jira workitem edit --jql "project = TEAM" --assignee "user@atlassian.com"

# Edit from JSON file
acli jira workitem edit --from-json "workitem.json"

# Generate JSON template for editing
acli jira workitem edit --generate-json
```

#### Transition Issue
```bash
# Simple transition by status name
acli jira workitem transition --key "KEY-123" --status "Done"

# Bulk transition
acli jira workitem transition --jql "project = TEAM" --status "In Progress"

# Skip confirmation
acli jira workitem transition --key "KEY-123" --status "Done" --yes
```

**Key Advantage:** Uses status NAME directly, not transition ID like mcporter.

#### Add Comment
```bash
# Simple comment
acli jira workitem comment create --key "KEY-123" --body "This is a comment"

# From file
acli jira workitem comment create --key "KEY-123" --body-file "comment.txt"

# Using editor
acli jira workitem comment create --key "KEY-123" --editor

# Bulk comment via JQL
acli jira workitem comment create --jql "project = TEAM" --body "Closing sprint"
```

#### Issue Links
```bash
# List links
acli jira workitem link list KEY-123

# Create link
acli jira workitem link create --key "KEY-123" --target "KEY-456" --type "Blocks"

# List available link types
acli jira workitem link type
```

### Output Formats

| Flag | Format | Use Case |
|------|--------|----------|
| (none) | Human-readable | Interactive use |
| `--json` | JSON | Programmatic parsing |
| `--csv` | CSV | Spreadsheet/data export |
| `--web` | Browser | Visual inspection |

### Project Operations

```bash
# List projects
acli jira project list

# View project details
acli jira project view PROJ

# Create project
acli jira project create --key "NEW" --name "New Project" --type "software"
```

### Key Advantages Over mcporter

1. **Simpler Syntax:** Native CLI flags vs function-call syntax
2. **Status by Name:** Transitions use status name, not numeric ID
3. **Built-in Output Formats:** `--json`, `--csv`, `--web` flags
4. **Bulk Operations:** Most commands support JQL for bulk operations
5. **No Cloud ID Required:** Authentication is session-based
6. **Editor Integration:** `--editor` flag opens text editor for input
7. **Confirmation Prompts:** Dangerous operations prompt by default

## References

- [ACLI Jira Commands](https://developer.atlassian.com/cloud/acli/reference/commands/jira/) - Score: 9/10 (Official documentation)
- [ACLI Workitem Commands](https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem/) - Score: 9/10 (Comprehensive API)
- [Atlassian Blog: Introducing ACLI](https://www.atlassian.com/blog/jira/atlassian-command-line-interface) - Score: 8/10 (Overview and rationale)
