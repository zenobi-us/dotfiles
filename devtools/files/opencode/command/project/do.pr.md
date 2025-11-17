# Create Pull Request

Create and open a pull request for completed work linked to planning artifacts: $ARGUMENTS

**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts

## Step 1: Early Exit Checks

**Check uncommitted changes:**
```bash
git status --short
```

**If changes exist:**
```
⚠️  UNCOMMITTED CHANGES - Commit these first:

{git status output}

Use: /project:do:commit "message"
```
**Exit here.** (Don't proceed until clean)

**Validate readiness:**
1. Not on main/develop: `git branch --show-current`
2. Tests pass: Project-specific test command
3. Linting passes: Project-specific lint command

**If validation fails:** Report specific error and exit.

## Step 2: Fetch Planning Context

**Determine artifact source:**

1. If `$ARGUMENTS` matches `^\d+$` or `^#\d+$`:
   - GitHub issue: Extract number, use GitHub tool to fetch issue details
   - Prepare: Issue number, title, URL, type, labels

2. If `$ARGUMENTS` matches `^\d+(\.\d+)+.*-.*$`:
   - Basic Memory artifact: Fetch from `5-tasks/` folder
   - Extract: Task title, epic_id, story_id, status
   - Verify status is "in-progress" or "completed"

3. Otherwise:
   - Extract feature identifier from branch name
   - Fallback to generic PR without artifact link

## Step 3: Prepare PR

**Generate title (semantic format):**
```
{type}({scope}): {title} ({artifact_id})
```

Examples:
- `feat(auth): implement login with OAuth (closes #123)`
- `feat(database): design user schema (5.1.1-task-database-schema)`

**Generate description:**
```markdown
## Summary
{One-sentence description of what this PR accomplishes}

## Linked Artifact
{GitHub: Closes #{ISSUE}} OR {BasicMemory: Task {ARTIFACT_ID} (Epic {epic_id})}

## Changes
- {Specific change 1}
- {Specific change 2}

## Testing
- [ ] Unit tests added/passing
- [ ] Integration tests passing
- [ ] Manual testing completed
```

## Step 4: Review & Confirm

**Display:**
1. PR Title
2. PR Description
3. Changed files: `git diff --name-stat origin/main...HEAD`
4. Impact: `git diff --stat origin/main...HEAD`

**Prompt:** "Proceed with creating this pull request?"
- Option: Edit title/description
- Option: Cancel

## Step 5: Create PR

**Execute:**
```bash
gh pr create --title "{title}" --body "{description}" --base {target_branch}
```

**Update artifacts:**
- GitHub issues: Add comment with PR link, update labels
- BasicMemory tasks: Update status to "in-review", add pr_link

## Step 6: Summary

```markdown
✅ Pull Request Created

- PR: #{PR_NUMBER} → {PR_URL}
- Title: {pr_title}
- Branch: {CURRENT_BRANCH}
- Files: {count} changed, +{lines} -{lines}

Next: Wait for review, address feedback, merge when approved
```

**Related:** `/project:do:task`, `/project:do:commit`
