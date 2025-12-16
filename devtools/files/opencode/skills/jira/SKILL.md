---
name: jira
description: Use when needing to search Jira issues, retrieve issue details, get pull request links, or manage issue workflows programmatically - provides complete workflows and examples for common Jira automation tasks using the atlassian CLI
---

# JIRA Skill

Master Jira automation and integration using the atlassian CLI tool. This skill enables programmatic access to Jira issues, projects, and metadata.

> [!NOTE]
> ⚠️ **IMPORTANT:**
> All usage of atlassian commands requires `mise x node@20 -- mcporter ...` to invoke the underlying tools via the MCP protocol.

## Quick Setup

### Get Current User Info

```bash
./scripts/get_current_user.sh
```

Returns: `accountId`, `displayName`, `email`

**Or get specific fields:**

```bash
./scripts/get_current_user.sh --account-id
./scripts/get_current_user.sh --email
./scripts/get_current_user.sh --display-name
```

### Get Cloud ID (Required for all operations)

```bash
export JIRA_CLOUD_ID=$(./scripts/get_cloud_id.sh)
export JIRA_URL=$(./scripts/get_cloud_id.sh --url)
```

## Core Operations

### Search Issues

```bash
mcporter call atlassian.searchJiraIssuesUsingJql \
  --cloud-id "$JIRA_CLOUD_ID" \
  --jql "assignee = currentUser() AND status = Open"
```

Returns: `issues[]` array with `key`, `fields.summary`, `fields.status.name`

**Common JQL:**

- `assignee = currentUser()` - Issues assigned to you
- `status = Open` - Filter by status
- `project = PROJ` - Specific project
- `updated >= -7d` - Updated in last 7 days
- `issuetype = Bug` - Specific issue type

### Get Issue Details

```bash
mcporter call atlassian.getJiraIssue \
  --cloud-id "$JIRA_CLOUD_ID" \
  --issue-id-or-key "PROJ-123"
```

Returns: Full issue object with `key`, `fields` (summary, status, assignee, description, etc)

### Get Issue Transitions

```bash
mcporter call atlassian.getTransitionsForJiraIssue \
  --cloud-id "$JIRA_CLOUD_ID" \
  --issue-id-or-key "PROJ-123"
```

Returns: List of available transitions with IDs

### Get Project Metadata

```bash
mcporter call atlassian.getJiraProjectIssueTypesMetadata \
  --cloud-id "$JIRA_CLOUD_ID" \
  --project-id-or-key "PROJ"
```

### Get Issue Type Metadata

```bash
mcporter call atlassian.getJiraIssueTypeMetaWithFields \
  --cloud-id "$JIRA_CLOUD_ID" \
  --project-id-or-key "PROJ" \
  --issue-type-id "10001"
```

### Get Related Links (PRs, Confluence, etc)

```bash
mcporter call atlassian.getJiraIssueRemoteIssueLinks \
  --cloud-id "$JIRA_CLOUD_ID" \
  --issue-id-or-key "PROJ-123"
```

Returns: `remoteIssueLinks[]` array with linked resources

**Filter for GitHub PRs:**

```bash
mcporter call atlassian.getJiraIssueRemoteIssueLinks \
  --cloud-id "$JIRA_CLOUD_ID" \
  --issue-id-or-key "PROJ-123" | \
  jq '.[]? | select(.type.name == "GitHub" or (.globalId | contains("github"))) | .object.url'
```

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| **`--cloud-id` required but not provided** | Always fetch with `getAccessibleAtlassianResources` first, then pass `--cloud-id` explicitly or use env variable |
| **Search returns 0 results** | Verify query syntax. Try `status = Open` instead of `status = "To Do"`. Test queries in Jira UI first. |
| **PR link not found in `remoteIssueLinks`** | Not all PRs auto-link. Check if "Link" was created in GitHub/Jira. |
| **Transition fails with "Cannot transition"** | Wrong transition ID. Always run `getTransitionsForJiraIssue` first to see valid transitions for current status. |
| **Command fails with parameter error** | mcporter CLI has constraints on parameter types (arrays, numbers). Use commands without optional parameters like `--max-results` or `--fields`. |

## Tips

- **Store cloud ID in env variable** once per session: `export JIRA_CLOUD_ID="..."`
- **Always use `getTransitionsForJiraIssue` before transitioning** - transition IDs vary by project workflow
- **Use `jq` for JSON parsing** in shell scripts
- See `examples/` directory for full workflow examples
