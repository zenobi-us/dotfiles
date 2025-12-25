---
name: pr-descriptions
description: Use when gh pr edit --body fails silently or returns no error but doesn't persist changes - provides fallback pattern using GitHub REST API directly for reliable PR description updates
---

# Updating PR Descriptions

## Overview

`gh pr edit --body` can fail silently on some GitHub instances or configurations, accepting the command but not persisting changes. The GitHub REST API provides a reliable fallback when standard CLI tools don't work as expected.

## When to Use

- `gh pr edit --body` accepts command but changes don't persist (silent failure)
- Need to programmatically update PR description with multiline content
- Working with complex PR templates where edits aren't reflected
- Need guaranteed persistence before moving forward

**Not needed when:**

- `gh pr edit --body-file` successfully updates your PR
- You only need to update title or simple fields

## Core Pattern

When `gh pr edit` doesn't persist:

```bash
# Step 1: Get current PR details to verify number
gh pr view --json number -q '.number'

# Step 2: Try standard approach first
gh pr edit <PR_NUMBER> --body "$(cat <<'EOF'
[new body content]
EOF
)"

# Step 3: If no error but changes don't persist, use API directly
gh api repos/OWNER/REPO/pulls/<PR_NUMBER> -X PATCH -f body="$(cat <<'EOF'
[new body content]
EOF
)"
```

## Key Pattern Elements

### Use heredoc with `<<'EOF'` (not `<<"EOF"`)

The single quotes prevent shell expansion:

```bash
# ✅ Correct - preserves backticks, $variables, special chars
gh api repos/owner/repo/pulls/123 -X PATCH -f body="$(cat <<'EOF'
Contains `backticks` and $special chars
EOF
)"

# ❌ Wrong - shell expands variables before API call
gh api repos/owner/repo/pulls/123 -X PATCH -f body="$(cat <<"EOF"
Contains `backticks` and $special (expands!)
EOF
)"
```

### Get PR number if unknown

```bash
# From current branch (if tracking remote PR)
gh pr view --json number -q '.number'
```

### Verify API call succeeded

Check the returned JSON contains your body:

```bash
gh api repos/owner/repo/pulls/123 -X PATCH -f body="new content" | grep -q "new content" && echo "Success"
```

## Implementation

### Simple Update

```bash
PR_NUMBER=$(gh pr view --json number -q '.number')

gh api repos/Reckon-Limited/reckon-frontend/pulls/$PR_NUMBER -X PATCH -f body="$(cat <<'EOF'
# Summary

This PR implements feature X.

## Features
- Feature A
- Feature B

# Testing
<!-- Testing notes -->
EOF
)"
```

### Update with Verification

```bash
PR_NUMBER=$(gh pr view --json number -q '.number')
NEW_BODY="# Summary

This PR implements employee list actions."

gh api repos/Reckon-Limited/reckon-frontend/pulls/$PR_NUMBER -X PATCH -f body="$NEW_BODY"

# Verify by checking the returned body matches
gh pr view $PR_NUMBER --json body -q '.body' | head -1
```

## Common Mistakes

**Mistake 1: Using wrong quoting for heredoc**

```bash
# ❌ Wrong - variables expand, breaks formatting
gh api repos/owner/repo/pulls/123 -X PATCH -f body="$(cat <<"EOF"
Variables like $VAR and $(commands) will expand
EOF
)"

# ✅ Correct
gh api repos/owner/repo/pulls/123 -X PATCH -f body="$(cat <<'EOF'
Variables like $VAR and $(commands) stay literal
EOF
)"
```

**Mistake 2: Not checking return value before assuming success**

```bash
# ❌ Command returns 200 but changes don't persist
gh pr edit 123 --body "new content"  # exits 0, no error

# ✅ Use API and check response
gh api repos/owner/repo/pulls/123 -X PATCH -f body="new content" | grep -q "new content"
```

**Mistake 3: Forgetting `--body-file` as intermediate step**

```bash
# ✅ Best practice order:
# 1. Try gh pr edit --body-file (file-based, more reliable than inline)
# 2. If that fails, use gh api (always works)
gh pr edit 123 --body-file my_body.md  # Try this first
```

**Mistake 4: Building body string incorrectly with special chars**

```bash
# ❌ Wrong - newlines lost, special chars cause issues
BODY="# Summary\nNew content"
gh api repos/owner/repo/pulls/123 -X PATCH -f body="$BODY"

# ✅ Correct - use heredoc to preserve formatting
gh api repos/owner/repo/pulls/123 -X PATCH -f body="$(cat <<'EOF'
# Summary

New content
EOF
)"
```

## Troubleshooting

**If API call returns 422 Unprocessable Entity:**

- Check PR number is correct: `gh pr view --json number`
- Check repository path (OWNER/REPO): `gh api repos/Reckon-Limited/reckon-frontend --json nameWithOwner`
- Verify authentication: `gh auth status`

**If body updates but contains escaped newlines or formatting issues:**

- Use heredoc with single quotes: `<<'EOF'` not `<<"EOF"`
- Avoid inline strings for complex content - use heredoc

**If command succeeds but `gh pr view` shows old body:**

- Wait a moment (GitHub API eventual consistency)
- Clear any local cache: `gh pr view --refresh`
- Verify via GitHub web UI (browser may cache)

## Real-World Impact

Using the API fallback when `gh pr edit` silently fails ensures PR descriptions are reliably updated in automation scripts, reducing manual follow-up work and ensuring accurate PR documentation for reviewers.
