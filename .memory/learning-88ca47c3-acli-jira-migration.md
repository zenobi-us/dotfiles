---
id: 88ca47c3
title: ACLI Jira Migration Lessons Learned
created_at: 2026-01-29T13:08:00+10:30
updated_at: 2026-01-29T13:08:00+10:30
tags: [jira, acli, atlassian, migration, best-practices, cli-tools]
status: completed
---

# ACLI Jira Migration Lessons Learned

## Summary

Successfully migrated the Jira skill from mcporter (MCP-based approach) to the Atlassian CLI (acli). The migration simplified authentication, improved UX, and reduced skill documentation size by 19%. Key learning: native CLI tools often provide better ergonomics than protocol-based approaches when available.

## Context

The original Jira skill used mcporter with the Atlassian MCP server, requiring complex setup (cloud ID extraction, environment variables) and providing limited functionality. The new acli tool offers OAuth browser authentication, simpler syntax, and direct status transitions by name.

## Key Learnings

### 1. ACLI stderr Behavior

**Issue**: ACLI outputs trace IDs and metadata to stderr even on successful operations.

**Example**:
```bash
$ acli jira workitem view RWR-14013
trace-id: aa3a...-9f76 (to stderr)
{...json output...} (to stdout)
```

**Solution**: Use `2>/dev/null` when parsing JSON output or checking exit codes:
```bash
acli jira workitem view RWR-14013 2>/dev/null | jq '.fields.summary'
```

**Impact**: Without this, JSON parsing fails and scripts break on successful operations.

---

### 2. Search and List Commands Require Pagination Flags

**Issue**: Commands like `search` and `project list` fail without explicit result limiting flags.

**Failing Commands**:
```bash
acli jira workitem search --jql "assignee = currentUser()"  # Error
acli jira project list  # Error
```

**Working Commands**:
```bash
acli jira workitem search --jql "assignee = currentUser()" --paginate
acli jira workitem search --jql "assignee = currentUser()" --limit 50
acli jira project list --recent
acli jira project list --paginate
```

**Rationale**: ACLI requires explicit confirmation when operations may return large datasets to prevent accidental resource exhaustion.

---

### 3. Comment Operations Use Named Parameters

**Issue**: Comment commands don't accept positional arguments for issue keys.

**Failing Syntax**:
```bash
acli jira workitem comment list RWR-14013  # Error
```

**Correct Syntax**:
```bash
acli jira workitem comment list --key RWR-14013
acli jira workitem comment add --key RWR-14013 --body "Comment text"
```

**Lesson**: Always use `--key` flag for issue identifiers in comment operations.

---

### 4. Terminology Change: "issue" → "workitem"

**Change**: ACLI uses "workitem" instead of traditional "issue" terminology.

**Old (mcporter/API)**:
```bash
mcp jira get_issue --issue-key RWR-14013
```

**New (acli)**:
```bash
acli jira workitem view --key RWR-14013
```

**Impact**: All documentation, scripts, and user-facing examples need terminology updates.

---

### 5. OAuth Browser Flow Simplifies Authentication

**Old Approach (mcporter)**:
1. Extract cloud ID from Jira URL
2. Set `JIRA_CLOUD_ID` environment variable
3. Configure mcporter server
4. Manage API tokens or OAuth separately

**New Approach (acli)**:
```bash
acli jira auth login --web
# Opens browser, handles OAuth flow
# Stores credentials securely
```

**Benefits**:
- One-time setup
- No cloud ID management
- Standard OAuth security
- Works across multiple Jira instances

---

### 6. Direct Status Transitions by Name

**Improvement**: ACLI allows transitioning issues using status names instead of numeric IDs.

**Old (API-based)**:
```bash
# Required looking up transition ID mapping
transition_id=$(get_transitions RWR-14013 | jq '.transitions[] | select(.name=="In Progress") | .id')
update_transition RWR-14013 "$transition_id"
```

**New (acli)**:
```bash
acli jira workitem transition --key RWR-14013 --status "In Progress"
```

**Impact**: Massive UX improvement - no more ID lookups or workflow mapping.

---

### 7. Bulk Operations via JQL

**Feature**: ACLI supports bulk updates using JQL queries.

**Example**:
```bash
# Update all issues matching JQL
acli jira workitem edit --jql "assignee = currentUser() AND status = 'To Do'" --summary "Updated"

# Transition multiple issues
acli jira workitem transition --jql "project = RWR AND status = 'In Review'" --status "Done"
```

**Use Cases**:
- Batch status updates
- Mass assignment changes
- Cleanup operations
- Project migrations

---

### 8. Reduced Documentation Complexity

**Metrics**:
- Old skill: 10,181 bytes
- New skill: 8,251 bytes
- Reduction: 19% smaller

**Reasons**:
- Removed cloud ID setup instructions
- Eliminated custom helper scripts
- Simpler authentication flow
- More concise command syntax

---

## Implementation Patterns

### Safe JSON Parsing
```bash
# Always suppress stderr when parsing JSON
result=$(acli jira workitem view --key "$KEY" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$result" | jq -r '.fields.summary'
fi
```

### Pagination Best Practices
```bash
# Use --paginate for interactive queries
acli jira workitem search --jql "$query" --paginate

# Use --limit for scripts
acli jira workitem search --jql "$query" --limit 100 --output json
```

### Bulk Operations
```bash
# Combine JQL with updates for powerful bulk operations
acli jira workitem edit \
    --jql "project = RWR AND status = 'In Progress' AND updated < -7d" \
    --labels "stale"
```

---

## Migration Checklist

When migrating from MCP/API to ACLI:

- [ ] Remove cloud ID environment variables
- [ ] Update "issue" terminology to "workitem"
- [ ] Add stderr suppression to JSON parsing
- [ ] Add pagination flags to search/list commands
- [ ] Use `--key` for comment operations
- [ ] Document OAuth browser flow
- [ ] Test with real Jira instance
- [ ] Update all examples and documentation
- [ ] Remove old helper scripts
- [ ] Add troubleshooting section

---

## Testing Strategy

### Verification Commands
```bash
# 1. Authentication
acli jira auth status

# 2. View operation
acli jira workitem view --key <TEST-KEY>

# 3. Search operation
acli jira workitem search --jql "assignee = currentUser()" --limit 5

# 4. Comment operation
acli jira workitem comment list --key <TEST-KEY>

# 5. Transition syntax check (without executing)
acli jira workitem transition --help
```

### Real-World Testing
- Use an actual Jira issue (e.g., RWR-14013)
- Test in authenticated environment
- Verify JSON parsing works
- Check error handling
- Confirm bulk operations

---

## Future Implications

### For Skill Development
1. **Prefer Native CLIs**: When available, native CLI tools often provide better UX than protocol-based approaches
2. **Document Quirks**: CLI tools have unique behaviors (stderr, pagination) that need clear documentation
3. **Migration Paths**: Plan for terminology and syntax changes when migrating between tools

### For Jira Operations
1. **Automation**: Bulk operations via JQL enable powerful automation
2. **Simplicity**: Status transitions by name reduce cognitive overhead
3. **Reliability**: OAuth browser flow is more secure than API token management

### For Other Integrations
Consider migrating other MCP-based skills to native CLIs when:
- Native CLI exists with good documentation
- Authentication is simpler
- Command syntax is more intuitive
- Bulk operations are needed

---

## Related Resources

- [ACLI Capabilities Research](research-1af8e04c-acli-capabilities.md)
- [mcporter vs ACLI Comparison](research-98bec10e-mcporter-vs-acli-comparison.md)
- [Migration Task](task-acli0001-migrate-jira-skill-to-acli.md)
- [Epic](epic-jiraf2a6-acli-jira-skill-migration.md)

## References

- Atlassian CLI Documentation: https://developer.atlassian.com/server/framework/atlassian-sdk/atlassian-cli-reference/
- Jira REST API: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- OAuth 2.0 Flow: https://oauth.net/2/
