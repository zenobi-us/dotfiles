---
name: jira
description: Use when needing to search Jira issues, retrieve issue details, get pull request links, or manage issue workflows programmatically - provides complete workflows and examples for common Jira automation tasks using the atlassian CLI
---

# JIRA Skill

Master Jira automation and integration using the atlassian CLI tool. This skill enables programmatic access to Jira issues, projects, and metadata.

## Getting Started

### 1. Get Account Info

Verify you're authenticated and retrieve your Atlassian account details.

```bash
atlassian atlassianUserInfo
```

**Output:** JSON object with `accountId`, `displayName`, `email`. Example:

```json
{
  "accountId": "557058:abc123def456",
  "displayName": "Your Name",
  "email": "you@example.com"
}
```

### 2. Get Cloud ID & Jira URL

All Jira operations require your cloud ID (site identifier). Store this for reuse.

```bash
atlassian getAccessibleAtlassianResources
```

**Output:** JSON array of available Atlassian sites. Example:

```json
[
  {
    "id": "9a2dd552-3337-4821-9e53-bf3bb51ea6e0",
    "url": "https://yourcompany.atlassian.net",
    "name": "Your Company",
    "scopes": ["read:jira-work", "write:jira-work"]
  }
]
```

**Store cloud ID and URL for reuse:**

```bash
export JIRA_CLOUD_ID=$(atlassian getAccessibleAtlassianResources | jq -r '.[0].id')
export JIRA_URL=$(atlassian getAccessibleAtlassianResources | jq -r '.[0].url')
echo "Cloud ID: $JIRA_CLOUD_ID"
echo "URL: $JIRA_URL"
```

**Output:** Lists available Atlassian sites. Example:

```json
{
  "resources": [
    {
      "cloudId": "c49e4a7e-0f6f-1234-abcd-1234567890ab",
      "displayName": "Your Company",
      "url": "https://yourcompany.atlassian.net"
    }
  ]
}
```

**Store for reuse:**

```bash
export JIRA_CLOUD_ID="c49e4a7e-0f6f-1234-abcd-1234567890ab"
export JIRA_URL="https://yourcompany.atlassian.net"
```

---

## Core Operations

### 3. Search Issues

Find Jira issues matching criteria using JQL (Jira Query Language).

```bash
atlassian searchJiraIssuesUsingJql \
  --cloud-id "$JIRA_CLOUD_ID" \
  --jql "assignee = currentUser() AND status = Open" \
  --max-results 50
```

**Output:** JSON with `issues[]` array. Example:

```json
{
  "issues": [
    {
      "key": "PROJ-123",
      "fields": {
        "summary": "Bug in payment flow",
        "status": { "name": "Open" },
        "assignee": { "displayName": "Your Name" }
      }
    }
  ],
  "isLast": true
}
```

**Common JQL syntax:**

- `assignee = currentUser()` - Issues assigned to you
- `status = Open` or `status = "To Do"` - Filter by status
- `project = PROJ` - Specific project
- `updated >= -7d` - Updated in last 7 days
- `issuetype = Bug` - Specific issue type
- `AND`, `OR` - Combine conditions

**Pagination:** Use `--max-results N` to limit results per request. Check `isLast` field to know if more results exist.

---

### 4. Get Issue Details

Retrieve full details of a specific issue, including description, comments, and custom fields.

```bash
atlassian getJiraIssue \
  --cloud-id "$JIRA_CLOUD_ID" \
  --issue-id-or-key "PROJ-123"
```

**Output:** Nested JSON with `fields` object. Example:

```json
{
  "key": "PROJ-123",
  "fields": {
    "summary": "Bug in payment flow",
    "description": "Users report...",
    "status": { "name": "Open" },
    "assignee": { "displayName": "Your Name", "accountId": "..." },
    "customfields": { ... }
  }
}
```

**Optimize payload (only fetch needed fields):**

```bash
atlassian getJiraIssue \
  --cloud-id "$JIRA_CLOUD_ID" \
  --issue-id-or-key "PROJ-123" \
  --fields "summary,status,assignee,description"
```

**Useful fields:**

- `summary` - Issue title
- `status` - Current status
- `assignee` - Who it's assigned to
- `created`, `updated` - Timestamps
- `customfields` - Project-specific fields
- `issuelinks` - Related issues

---

### 5. Resolve Issue Metadata

Get available issue types, required fields, and valid transitions before creating or updating issues.

**Get issue types in a project:**

```bash
atlassian getJiraProjectIssueTypesMetadata \
  --cloud-id "$JIRA_CLOUD_ID" \
  --project-id-or-key "PROJ"
```

**Get field requirements for issue type:**

```bash
atlassian getJiraIssueTypeMetaWithFields \
  --cloud-id "$JIRA_CLOUD_ID" \
  --project-id-or-key "PROJ" \
  --issue-type-id "10001"
```

**Get available transitions (for workflow moves):**

```bash
atlassian getTransitionsForJiraIssue \
  --cloud-id "$JIRA_CLOUD_ID" \
  --issue-id-or-key "PROJ-123"
```

**Output:** List of transitions with IDs. Use transition ID (not name) for `transitionJiraIssue`.

---

### 6. Get Related Tickets & Links

Retrieve linked issues, pull requests, Confluence pages, and other external references.

```bash
atlassian getJiraIssueRemoteIssueLinks \
  --cloud-id "$JIRA_CLOUD_ID" \
  --issue-id-or-key "PROJ-123"
```

**Output:** JSON array in `remoteIssueLinks`. Example:

```json
{
  "remoteIssueLinks": [
    {
      "id": "10000",
      "globalId": "github.com/yourorg/repo/pulls/456",
      "type": { "name": "GitHub" },
      "object": {
        "url": "https://github.com/yourorg/repo/pull/456",
        "title": "Fix payment bug",
        "summary": "PR #456"
      }
    },
    {
      "globalId": "confluence:page:12345",
      "type": { "name": "Confluence" },
      "object": { "url": "...", "title": "Spec" }
    }
  ]
}
```

**Filter for pull requests:**

```bash
atlassian getJiraIssueRemoteIssueLinks \
  --cloud-id "$JIRA_CLOUD_ID" \
  --issue-id-or-key "PROJ-123" | \
  jq -r '.[]? | select(.type.name == "GitHub" or (.globalId | contains("github"))) | .object.url'
```

**About the GitHub filter:**

- `type.name == "GitHub"` - Direct type match (primary indicator)
- `globalId | contains("github")` - Fallback for edge cases where type isn't set but globalId contains github URL/reference
- Use both with `or` to catch all PR variants
- The `.[]?` operator silently returns nothing if the array is empty
- If no PRs are found, the command returns nothing (no error)

---

## Workflow: Find My Open Issues with PR Links

This workflow finds all issues assigned to you, displays their status, and checks for linked pull requests.

**Step 1: Get Cloud ID**

```bash
CLOUD_ID=$(atlassian getAccessibleAtlassianResources | jq -r '.[0].id')
echo "Cloud ID: $CLOUD_ID"
```

**Output:** `9a2dd552-3337-4821-9e53-bf3bb51ea6e0` (or your actual cloud ID)

**Step 2: Search for Open Issues**

```bash
CLOUD_ID="9a2dd552-3337-4821-9e53-bf3bb51ea6e0"  # From Step 1
atlassian searchJiraIssuesUsingJql \
  --cloud-id "$CLOUD_ID" \
  --jql "assignee = currentUser() AND status = Open"
```

**Output:** JSON with `.issues[]` array containing `key`, `fields.summary`, and `fields.status.name`.

**Step 3: Extract Issue Keys and Status**

```bash
CLOUD_ID="9a2dd552-3337-4821-9e53-bf3bb51ea6e0"
ISSUES=$(atlassian searchJiraIssuesUsingJql \
  --cloud-id "$CLOUD_ID" \
  --jql "assignee = currentUser() AND status = Open" | \
  jq -r '.issues[] | "\(.key):\(.fields.status.name)"')
echo "$ISSUES"
```

**Output:** Colon-delimited pairs (e.g., `PROJ-123:Open`, `PROJ-456:In Progress`)

**Step 4: Get PR Links for Each Issue**

```bash
CLOUD_ID="9a2dd552-3337-4821-9e53-bf3bb51ea6e0"
ISSUE_KEY="UI-7083"

atlassian getJiraIssueRemoteIssueLinks \
  --cloud-id "$CLOUD_ID" \
  --issue-id-or-key "$ISSUE_KEY"
```

**Output:** JSON array of linked resources. Example (empty):

```json
[]
```

Example with PR link:

```json
[
  {
    "id": "10000",
    "globalId": "github.com/yourorg/repo/pulls/456",
    "type": { "name": "GitHub" },
    "object": {
      "url": "https://github.com/yourorg/repo/pull/456",
      "title": "Fix payment bug",
      "summary": "PR #456"
    }
  }
]
```

**Step 5: Filter for GitHub PRs Only**

```bash
CLOUD_ID="9a2dd552-3337-4821-9e53-bf3bb51ea6e0"
ISSUE_KEY="UI-7083"

atlassian getJiraIssueRemoteIssueLinks \
  --cloud-id "$CLOUD_ID" \
  --issue-id-or-key "$ISSUE_KEY" | \
  jq -r '.[]? | select(.type.name == "GitHub" or (.globalId | contains("github"))) | "PR: \(.object.title) → \(.object.url)"'
```

**Output:** Lines like:

```
PR: Fix payment bug → https://github.com/yourorg/repo/pull/456
```

If no PRs found, returns nothing (no error).

**Step 6: Complete Loop (All Issues with Status and PRs)**

```bash
# Get cloud ID (one time)
CLOUD_ID=$(atlassian getAccessibleAtlassianResources | jq -r '.[0].id')

# Get all issues assigned to you that are Open
ISSUES=$(atlassian searchJiraIssuesUsingJql \
  --cloud-id "$CLOUD_ID" \
  --jql "assignee = currentUser() AND status = Open" | \
  jq -r '.issues[] | "\(.key):\(.fields.status.name)"')

# Loop through each issue and check for PR links
while read -r issue_data; do
  issue_key="${issue_data%:*}"
  issue_status="${issue_data#*:}"
  echo "=== $issue_key ($issue_status) ==="
  
  pr_count=$(atlassian getJiraIssueRemoteIssueLinks --cloud-id "$CLOUD_ID" --issue-id-or-key "$issue_key" 2>/dev/null | \
    jq '[.[]? | select(.type.name == "GitHub" or (.globalId | contains("github")))] | length')
  
  if [ "$pr_count" -eq 0 ]; then
    echo "  No linked PRs"
  else
    atlassian getJiraIssueRemoteIssueLinks --cloud-id "$CLOUD_ID" --issue-id-or-key "$issue_key" | \
      jq -r '.[]? | select(.type.name == "GitHub" or (.globalId | contains("github"))) | "  \(.object.title) → \(.object.url)"'
  fi
done <<< "$ISSUES"
```

**Output Example:**

```
=== PROJ-123 (Open) ===
  Fix payment bug → https://github.com/yourorg/repo/pull/456
=== PROJ-456 (In Progress) ===
  No linked PRs
=== PROJ-789 (Open) ===
  Refactor auth flow → https://github.com/yourorg/repo/pull/789
```

**Output Example:**

```
=== PROJ-123 (Open) ===
  Fix payment bug → https://github.com/yourorg/repo/pull/456
=== PROJ-456 (In Progress) ===
  No linked PRs
=== PROJ-789 (Open) ===
  Refactor auth flow → https://github.com/yourorg/repo/pull/789
```

---

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| **`--cloud-id` required but not provided** | Always fetch with `getAccessibleAtlassianResources` first, then pass `-cloud-id` explicitly or use env variable |
| **Search returns 0 results** | Verify query syntax. Try `status:Open` instead of `status:"To Do"`. Use `--jql` for advanced queries. |
| **PR link not found in `remoteIssueLinks`** | Not all PRs auto-link. Check if "Link" was created in GitHub/Jira. Filter by `globalId` containing "github". |
| **Transition fails with "Cannot transition"** | Wrong transition ID. Always run `getTransitionsForJiraIssue` first to see valid transitions for current status. |
| **Custom fields return null** | Explicitly request with `--fields`. Some require permission to view. Check project config for visibility. |
| **Pagination cuts off results** | `search` shows `total` count. Use `--max-results 50` with cursor-based pagination for large sets. |

---

## Tips

- **Store cloud ID in env variable** once per session: `export JIRA_CLOUD_ID="..."`
- **Always use `getTransitionsForJiraIssue` before transitioning** - transition IDs vary by project workflow
- **Test queries in Jira UI first**, then translate to `--jql` for scripting
- **Use `jq` for JSON parsing** in shell scripts (installed by default on most systems)
- **Optimize with `--fields`** when you only need specific data - reduces API response size
- **For large result sets**, use `--max-results` and implement pagination manually
