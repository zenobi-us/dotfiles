---
name: jira
description: Use when needing to search Jira issues, retrieve issue details, get pull request links, or manage issue workflows programmatically - provides complete workflows and examples for common Jira automation tasks using the atlassian CLI
---

# JIRA Skill

Master Jira automation and integration using the atlassian MCP server. This skill enables programmatic access to Jira issues, projects, and metadata.

 > [!CRITICAL]
> ⚠️ **IMPORTANT - Parameter Passing:**
>
> Use **function-call syntax** (NOT flag syntax). Parameters go inside the function call, not as flags:
>
> ```bash
> mcporter call 'atlassian.functionName(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123", fields: ["key", "summary"])'
> ```
>
> **Key Rules:**
>
> - Parameters are camelCase inside the function call
> - String values use double quotes: `"value"`
> - Array values use bracket notation: `["item1", "item2"]`
> - Object values use object notation: `{key: "value"}`
> - Environment variables are interpolated outside quotes: `"'$VAR'"`
> - NO `--flag` syntax, NO JSON string escaping needed

## Quick Setup

### Get Ticket Summary (One-Shot)

**The fastest way to get ticket information:**

```bash
mise x node@20 -- ./scripts/get_ticket_summary.sh TICKET-123
```

Returns human-readable summary with:
- Key, summary, type, status, priority, assignee
- Created/updated timestamps
- Full description
- Linked resources (PRs, etc.)
- Direct link to Jira

**JSON output for parsing:**

```bash
mise x node@20 -- ./scripts/get_ticket_summary.sh TICKET-123 --json
```

Returns structured JSON with `ticket` and `remoteLinks` objects.

### Get Current User Info

```bash
mise x node@20 -- ./scripts/get_current_user.sh
```

Returns: `accountId`, `displayName`, `email`

**Or get specific fields:**

```bash
mise x node@20 -- ./scripts/get_current_user.sh --account-id
mise x node@20 -- ./scripts/get_current_user.sh --email
mise x node@20 -- ./scripts/get_current_user.sh --display-name
```

### Get Cloud ID (Required for all operations)

```bash
export JIRA_CLOUD_ID=$(mise x node@20 -- ./scripts/get_cloud_id.sh)
export JIRA_URL=$(mise x node@20 -- ./scripts/get_cloud_id.sh --url)
```

This sets up environment variables for all subsequent mcporter calls.

## Core Operations

### Search Issues

```bash
mise x node@20 -- mcporter call 'atlassian.searchJiraIssuesUsingJql(cloudId: "'$JIRA_CLOUD_ID'", jql: "assignee = currentUser() AND status = Open")'
```

**With specific fields:**

```bash
mise x node@20 -- mcporter call 'atlassian.searchJiraIssuesUsingJql(cloudId: "'$JIRA_CLOUD_ID'", jql: "assignee = currentUser()", fields: ["key", "summary", "status", "assignee"])'
```

**With pagination:**

```bash
mise x node@20 -- mcporter call 'atlassian.searchJiraIssuesUsingJql(cloudId: "'$JIRA_CLOUD_ID'", jql: "assignee = currentUser()", maxResults: 50)'
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
mise x node@20 -- mcporter call 'atlassian.getJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123")'
```

**With specific fields:**

```bash
mise x node@20 -- mcporter call 'atlassian.getJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123", fields: ["key", "summary", "status", "assignee", "description"])'
```

**With expand for additional details:**

```bash
mise x node@20 -- mcporter call 'atlassian.getJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123", expand: ["changelog", "editmeta"])'
```

Returns: Full issue object with `key`, `fields` (summary, status, assignee, description, etc)

### Get Issue Transitions

```bash
mise x node@20 -- mcporter call 'atlassian.getTransitionsForJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123")'
```

Returns: List of available transitions with IDs and names for workflow state changes

### Transition Issue to New Status

```bash
mise x node@20 -- mcporter call 'atlassian.transitionJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123", transition: {id: "11"})'
```

**With field updates:**

```bash
mise x node@20 -- mcporter call 'atlassian.transitionJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123", transition: {id: "11"}, fields: {assignee: {id: "USER_ID"}})'
```

### Get Project Metadata

```bash
mise x node@20 -- mcporter call 'atlassian.getJiraProjectIssueTypesMetadata(cloudId: "'$JIRA_CLOUD_ID'", projectIdOrKey: "PROJ")'
```

### Edit Jira Issue Fields

> TODO: Add example for updating fields on an issue

### Add Comment to Issue

```bash
mise x node@20 -- mcporter call 'atlassian.addCommentToJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123", commentBody: "Your comment here")'
```

**With GitHub permalink:**

```bash
mise x node@20 -- mcporter call 'atlassian.addCommentToJiraIssue(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123", commentBody: "See implementation details:\n\nhttps://github.com/owner/repo/blob/commit-hash/path/to/file.ts#L123")'
```

Returns: Comment object with `id`, `body`, `author`, `created`, `updated`

### Create New Issue

> TODO: Add example for creating a new issue

### Get Issue Type Metadata

```bash
mise x node@20 -- mcporter call 'atlassian.getJiraIssueTypeMetaWithFields(cloudId: "'$JIRA_CLOUD_ID'", projectIdOrKey: "PROJ", issueTypeId: "10001")'
```

### Get Related Links (PRs, Confluence, etc)

```bash
mise x node@20 -- mcporter call 'atlassian.getJiraIssueRemoteIssueLinks(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123")'
```

Returns: `remoteIssueLinks[]` array with linked resources

**Filter for GitHub PRs:**

```bash
mise x node@20 -- mcporter call 'atlassian.getJiraIssueRemoteIssueLinks(cloudId: "'$JIRA_CLOUD_ID'", issueIdOrKey: "PROJ-123")' | \
  jq '.[]? | select(.type.name == "GitHub" or (.globalId | contains("github"))) | .object.url'
```

## Helper Scripts

| Script | Purpose |
|--------|---------|
| `./scripts/get_ticket_summary.sh` | **One-shot ticket summary** - Get all ticket info in one call (human or JSON format) |
| `./scripts/get_current_user.sh` | Get authenticated user info (accountId, displayName, email) |
| `./scripts/get_cloud_id.sh` | Get Jira Cloud ID and URL |

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| **No cloud ID available** | Run `./scripts/get_cloud_id.sh` to fetch and export it |
| **Need current user info** | Use `./scripts/get_current_user.sh` to fetch accountId, displayName, email |
| **Search returns 0 results** | Verify JQL syntax. Try `status = Open` instead of `status = "To Do"`. Test queries in Jira UI first. |
| **PR link not found in `remoteIssueLinks`** | Not all PRs auto-link. Check if "Link" was created in GitHub/Jira. |
| **Transition fails with "Cannot transition"** | Wrong transition ID. Always run `getTransitionsForJiraIssue` first to see valid transitions for current status. |
| **"Invalid arguments" or command fails** | Use function-call syntax, NOT flag syntax. Parameters go inside `functionName(param: value)` not `--param value` |
| **Arrays not working** | Use bracket notation inside function call: `fields: ["key", "summary"]` NOT `--fields '["key","summary"]'` |
| **Objects not working** | Use object notation inside function call: `transition: {id: "11"}` NOT `--transition '{"id":"11"}'` |

## Discovering Function Parameters with Schema Introspection

The mcporter CLI can introspect the MCP server schema to discover correct parameters and their types.

### List All Available Tools

```bash
mise x node@20 -- mcporter list atlassian --json | jq -r ".tools[].name"
```

Returns:

```
atlassianUserInfo
getAccessibleAtlassianResources
getConfluenceSpaces
getConfluencePage
getPagesInConfluenceSpace
getConfluencePageFooterComments
getConfluencePageInlineComments
getConfluencePageDescendants
createConfluencePage
updateConfluencePage
createConfluenceFooterComment
createConfluenceInlineComment
searchConfluenceUsingCql
getJiraIssue
editJiraIssue
createJiraIssue
getTransitionsForJiraIssue
transitionJiraIssue
lookupJiraAccountId
searchJiraIssuesUsingJql
addCommentToJiraIssue
addWorklogToJiraIssue
getJiraIssueRemoteIssueLinks
getVisibleJiraProjects
getJiraProjectIssueTypesMetadata
getJiraIssueTypeMetaWithFields
search
fetch
```

### Inspect a Specific Tool Schema

```bash
mise x node@20 -- mcporter list atlassian --json | jq '.tools[] | select(.name == "addCommentToJiraIssue")'
```

This returns the full JSON schema including:

- `inputSchema.properties` - All available parameters with types and descriptions
- `inputSchema.required` - Which parameters are mandatory
- `options` - CLI-specific metadata for each parameter

**Filter for just required parameters:**

```bash
mise x node@20 -- mcporter list atlassian --json | \
  jq '.tools[] | select(.name == "addCommentToJiraIssue") | .inputSchema.required[]'
```

**Get parameter descriptions:**

```bash
mise x node@20 -- mcporter list atlassian --json | \
  jq '.tools[] | select(.name == "addCommentToJiraIssue") | .inputSchema.properties | to_entries[] | "\(.key): \(.value.description)"'
```

This introspection approach works for any tool - just change the tool name in the `select()` filter.

## Tips

- **Setup once per session:**

  ```bash
  export JIRA_CLOUD_ID=$(mise x node@20 -- ./scripts/get_cloud_id.sh)
  export JIRA_URL=$(mise x node@20 -- ./scripts/get_cloud_id.sh --url)
  ```

- **Function-call syntax is the mcporter standard** - use `mcporter call 'func(param: value)'` not flags
- **Always use `getTransitionsForJiraIssue` before transitioning** - transition IDs vary by project workflow
- **Interpolate env vars outside the quotes**: `mcporter call 'func(cloudId: "'$VAR'")'` works, but `mcporter call 'func(cloudId: "$VAR")'` does not
- **Use `jq` for JSON parsing** in shell scripts
- **Use schema introspection** when unsure about parameters - `mcporter list atlassian --json | jq` is your friend
- See `examples/` directory for full workflow examples
