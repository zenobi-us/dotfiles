# Dual-Source Task Execution Examples

This document shows practical examples of executing tasks from both GitHub issues and Basic Memory artifacts.

## Example 1: Execute GitHub Issue

### Scenario
You want to implement GitHub issue #456 to add user authentication.

### Workflow

**1. Invoke the command:**
```bash
/project:do:task 456
# or
/project:do:task #456
```

**2. System detects GitHub source:**
- Matches pattern `^\d+$` or `^#\d+$`
- Extracts issue number: `456`
- Sets source to: `github`

**3. Step 1a (GitHub Issue Fetch):**
```bash
# Fetch issue details
gh issue view 456 --json title,body,author,labels,assignees,linkedIssues

# Output example:
# title: "Add user authentication system"
# body: "Implement OAuth2 and JWT tokens. See acceptance criteria below..."
# linkedIssues: [[PRD-123], [task-457 (dependency)]]
```

**4. Analysis and planning:**
- Read full description: "Add OAuth2 and JWT tokens"
- Identify acceptance criteria in issue body
- Check linked PRD issue for broader context
- Verify task #457 (dependency) is completed first

**5. Create worktree:**
```bash
# Skill creates: feature/456-add-user-auth
git worktree add ../<project>.worktrees/456-add-user-auth -b feature/456-add-user-auth
```

**6. Update GitHub status:**
```bash
gh issue edit 456 --add-label "in-progress" --remove-label "ready,todo"
gh issue comment 456 -b "Implementation started. Working in isolated branch."
```

**7. Implement (identical steps for both sources):**
- Design tests first
- Implement core functionality
- Add comprehensive tests
- Update documentation
- Validate quality

**8. Complete task:**
```bash
# Update GitHub status
gh issue edit 456 --remove-label "in-progress" --add-label "completed"
gh issue comment 456 -b "Completed in PR #123. All acceptance criteria met."

# Create/review pull request linking to issue
# In PR description: "Closes #456"
```

---

## Example 2: Execute Basic Memory Artifact

### Scenario
You want to implement the task artifact `5.1.1-task-user-authentication` from your Basic Memory project.

### Workflow

**1. Invoke the command:**
```bash
/project:do:task 5.1.1-task-user-authentication
```

**2. System detects Basic Memory source:**
- Matches pattern `^\d+(\.\d+)+.*-.*$`
- Extracts artifact ID: `5.1.1-task-user-authentication`
- Sets source to: `basicmemory`

**3. Step 1b (Basic Memory Artifact Fetch):**
```bash
# Fetch artifact details from 5-tasks/ folder
basicmemory_read_note("5.1.1-task-user-authentication")

# Returns:
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
  dependencies: ["5.1.0-task-jwt-setup"]
---

# Task: Implement User Authentication

## Description
Implement OAuth2 and JWT token-based authentication system
supporting both web and mobile clients.

## Acceptance Criteria
- [ ] OAuth2 provider integration
- [ ] JWT token generation and validation
- [ ] User session management
- [ ] Token refresh mechanism
- [ ] Security: HTTPS-only, secure cookies

## Dependencies
- depends_on [[5.1.0-task-jwt-setup]]
- extends [[2.1.1-epic-auth-system]]
```

**4. Analysis and planning:**
- Extract description: "OAuth2 and JWT token-based authentication"
- Read acceptance criteria from content
- Check epic context: `2.1.1-epic-auth-system`
- Verify dependency completed: `5.1.0-task-jwt-setup`

**5. Create worktree:**
```bash
# Skill creates: feature/5.1.1-task-user-authentication
git worktree add ../<project>.worktrees/5.1.1-task-user-authentication \
  -b feature/5.1.1-task-user-authentication
```

**6. Update Basic Memory status:**
```bash
# Update frontmatter status
basicmemory_edit_note(
  identifier: "5.1.1-task-user-authentication",
  operation: "find_replace",
  find_text: "status: \"pending\"",
  content: "status: \"in-progress\""
)

# Add implementation note
basicmemory_edit_note(
  identifier: "5.1.1-task-user-authentication",
  operation: "append",
  content: "\n## Implementation Log\n- [Nov 9] Started implementation in branch feature/5.1.1-task-user-authentication\n"
)
```

**7. Implement (identical steps for both sources):**
- Design tests first
- Implement core functionality
- Add comprehensive tests
- Update documentation
- Validate quality

**8. Complete task:**
```bash
# Update Basic Memory status
basicmemory_edit_note(
  identifier: "5.1.1-task-user-authentication",
  operation: "find_replace",
  find_text: "status: \"in-progress\"",
  content: "status: \"completed\""
)

# Add completion note
basicmemory_edit_note(
  identifier: "5.1.1-task-user-authentication",
  operation: "append",
  content: "\n- [Nov 9] Completed and merged in PR #123\n- All acceptance criteria met ✓\n"
)

# Update parent epic
basicmemory_edit_note(
  identifier: "2.1.1-epic-auth-system",
  operation: "append",
  content: "\n- ✓ Task [[5.1.1-task-user-authentication]] completed\n"
)
```

---

## Comparison: GitHub vs Basic Memory

| Aspect | GitHub Issue | Basic Memory Artifact |
|--------|--------------|----------------------|
| **Input format** | `123` or `#123` | `5.1.1-task-*` |
| **Fetch method** | `gh issue view` | `basicmemory_read_note` |
| **Status field** | GitHub labels | frontmatter `status` |
| **Status values** | ready, in-progress, completed | pending, in-progress, completed |
| **Dependencies** | linkedIssues | relations + frontmatter |
| **Parent context** | linked PRD/Feature issue | `epic_id` in frontmatter |
| **Completion link** | PR number + "Closes #123" | PR link + artifact update |

---

## Example 3: Resuming Work in Existing Worktree

### Scenario
You started a task earlier and want to resume work in the same session or future session.

### GitHub Issue Resumption

```bash
# Run command again
/project:do:task 456

# System detects:
# - Worktree already exists: ../project.worktrees/456-add-user-auth
# - Resumes work from that worktree
# - No duplicate workspaces created
# - Original branch state preserved
```

### Basic Memory Artifact Resumption

```bash
# Run command again
/project:do:task 5.1.1-task-user-authentication

# System detects:
# - Worktree already exists: ../project.worktrees/5.1.1-task-user-authentication
# - Resumes work from that worktree
# - Status in Basic Memory remains "in-progress"
# - No duplicate workspaces created
```

---

## Example 4: Mixed Workflow (Both Sources in Same Project)

### Scenario
Your project uses GitHub issues for tracking, but planning artifacts in Basic Memory.

### Session Flow

**1. Start with Basic Memory planning:**
```bash
# Task defined in Basic Memory: 5.1.1-task-user-auth
# Create GitHub issue to track progress
gh issue create --title "5.1.1-task-user-authentication" \
  --body "Implements Basic Memory artifact 5.1.1-task-user-authentication"
# Returns: issue #456
```

**2. Update Basic Memory artifact with GitHub reference:**
```bash
basicmemory_edit_note(
  identifier: "5.1.1-task-user-authentication",
  operation: "append",
  content: "\n## Tracking\n- GitHub Issue: #456\n"
)
```

**3. Execute from either source:**
```bash
# Option A: Use GitHub issue number
/project:do:task 456

# Option B: Use Basic Memory artifact ID (system will find GitHub reference)
/project:do:task 5.1.1-task-user-authentication
```

**4. After completion, both channels updated:**
```bash
# GitHub issue automatically closed/labeled
# Basic Memory artifact status set to "completed"
# Both reference the merged PR
```

---

## Example 5: Dependency Checking

### GitHub Issues

**Before starting task #456, check dependencies:**

```bash
# Task #456 might have linked issues that are blockers
gh issue view 456 --json linkedIssues | jq '.linkedIssues[]'

# If any show "blocks" relationship and are not completed:
# ⚠️ Cannot proceed - prerequisite tasks must be done first
```

### Basic Memory Artifacts

**Before starting task 5.1.1-task-user-auth, check dependencies:**

```bash
# Read artifact
basicmemory_read_note("5.1.1-task-user-authentication")

# Check frontmatter:
# dependencies: ["5.1.0-task-jwt-setup"]

# Verify each dependency is completed:
basicmemory_read_note("5.1.0-task-jwt-setup")
# Should show: status: "completed"

# If any dependency has status: "pending" or "in-progress":
# ⚠️ Cannot proceed - prerequisite tasks must be done first
```

---

## Troubleshooting

### Issue: Invalid Task Format Error

**Problem:** System can't determine if input is GitHub or Basic Memory

```bash
/project:do:task abc123  # ❌ Not recognized
/project:do:task 5.1.1.1-extra-segments  # ❌ Too many segments
```

**Solution:** Check format
```bash
# GitHub: pure digits with optional #
/project:do:task 456      # ✓ Correct
/project:do:task #456     # ✓ Correct

# Basic Memory: N.N.N-type-name pattern
/project:do:task 5.1.1-task-auth  # ✓ Correct
```

### Issue: GitHub Issue Not Found

```bash
# Error: GitHub issue #999 not found

# Solution:
# 1. Verify issue number is correct
# 2. Check issue isn't in different repository
# 3. Check GitHub credentials: gh auth status
```

### Issue: Basic Memory Artifact Not Found

```bash
# Error: Basic Memory artifact 5.1.1-task-foo not found

# Solution:
# 1. Verify artifact ID matches Johnny Decimal format
# 2. Check artifact is in 5-tasks/ folder
# 3. Use basicmemory_list_memory_projects to verify project access
# 4. Use basicmemory_search_notes to find similar artifacts
```

### Issue: Worktree Already Exists

```bash
# System says worktree already exists

# This is normal! The skill provides idempotent resumption:
# - If worktree exists, system resumes work there
# - No duplicate workspaces created
# - Original branch state preserved

# To start fresh, you must manually delete:
rm -rf ../<project>.worktrees/<feature-id>
# Then run command again
```

---

## Best Practices for Mixed Workflows

1. **Document the link** - If artifact has GitHub issue, note it in both places
2. **Use consistent naming** - Keep artifact ID and issue title aligned
3. **Update both channels** - When task completes, update both sources
4. **Check dependencies** - Verify prerequisites before starting work
5. **Use relations wisely** - Link artifacts to show planning hierarchy
6. **Keep frontmatter clean** - Don't manually edit YAML in Basic Memory UI
7. **Comment consistently** - Add notes explaining decisions in both channels

---

## Quick Reference: Command Examples

```bash
# Execute GitHub issue
/project:do:task 123
/project:do:task #123

# Execute Basic Memory artifact
/project:do:task 5.1.1-task-name
/project:do:task 5.2.3-epic-feature

# Resume existing worktree (automatic, same command)
/project:do:task 123      # Returns to existing worktree if present

# Create GitHub issue for Basic Memory artifact
gh issue create --title "5.1.1-task-name" --body "Implements artifact 5.1.1-task-name"

# Link GitHub issue to Basic Memory artifact
# (Add to artifact content or frontmatter)
- GitHub Issue: #123

# Update Basic Memory artifact status
basicmemory_edit_note("5.1.1-task-name", "find_replace", "status: pending", "status: in-progress")

# Check artifact dependencies
basicmemory_read_note("5.1.1-task-name")  # Check dependencies field
```

