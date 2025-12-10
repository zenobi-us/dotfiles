# Create Pull Request

**Meta**

- DefaultBranch : !`gh repo view --json defaultBranchRef --template '{{.defaultBranchRef.name}}'`


## Step 1: Early Exit Checks

**Check uncommitted changes:**

```bash
git status --short
```

**If changes exist:**

```markdown
⚠️  UNCOMMITTED CHANGES - Commit these first:

{git status output}

Use: /commit "message"
```

**Exit here.** (Don't proceed until clean)

**Validate readiness:**
 
1. DefaultBranch must not be the current branch: !`git branch --show-current`
  - Exit if same.
2. Ensure current branch is pushed to remote:
   - Check: `git rev-parse --abbrev-ref --symbolic-full-name @{u}`
   - Exit if not set.
3. Verify `$ARGUMENTS` is provided (artifact reference):
   -  Exit if missing.

**If validation fails:** Report specific error and exit.

## Step 2: Gather Info

**Identify current branch:**

```bash
CURRENT_BRANCH=$(git branch --show-current)
```

**Determine target branch:**

```bash
TARGET_BRANCH={DefaultBranch}
```

**Parse artifact reference from `$ARGUMENTS`:**

- If GitHub issue: `#123`
- If BasicMemory task: `5.1.1-task-database-schema`
- If Jira ticket: `PROJ-456`

**Fetch artifact details:**
- For GitHub issues: Use `gh issue view {ISSUE_NUMBER} --json title,body,labels`
- For BasicMemory tasks: Query BasicMemory API for task details
- For Jira tickets: Delegate using `task(jira)` Use Jira API to get issue summary, description, labels

**Review commits on current branch:**

```bash
git log {TARGET_BRANCH}...HEAD --oneline
```

**Summarize changes:**
- Extract key changes from commit messages
- Identify affected components/modules for scope
- Propose the WHY based on commit context and artifact details

## Step 3: Prepare PR

**Generate title (semantic format):**

```markdown
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
echo "{description}" > /tmp/pr_description.md
gh pr create --title "{title}" --body-file "/tmp/pr_description.md" --base {target_branch}
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

