# Create Pull Request

Create and open a pull request for completed work linked to planning artifacts: $ARGUMENTS

**Task Source Detection:**
- **GitHub Issue**: `123` or `#123` → Links to task issue
- **Basic Memory Artifact**: `5.1.1-task-*` (Johnny Decimal format) → Links to planning artifact
- **Branch Inference**: Empty or description → Infers from current branch/git history

**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> All [Planning Artifacts] are managed through the skills listed above.

## Step 1: Validate Readiness

**Check:**
1. `git status` - all changes committed
2. `git fetch origin && git merge-base --is-ancestor origin/main HEAD` - branch up-to-date
3. Tests pass: `npm test` / `pytest` / `cargo test`
4. Linting passes: `npm run lint` / `pylint` / `clippy`

**If validation fails:**
- Report error: "Cannot create PR until all checks pass"
- List specific failures
- Stop

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
   - Extract feature identifier from branch name: `git branch --show-current`
   - Fallback to generic PR without artifact link

## Step 3: Commit Remaining Changes

**If uncommitted changes exist:**
1. Run `/project:do:commit` with artifact context
2. Wait for completion

**If clean, proceed to Step 4**

## Step 4: Prepare Push

**Check:**
- Not on main/develop: `git branch --show-current | grep -E "^(main|develop)$"` → error if true
- Push branch if needed: `git push -u origin $(git branch --show-current)`

## Step 5: Generate PR Title

**Semantic format:**
```
{type}({scope}): {title} ({artifact_id})
```

**Examples:**
- `feat(auth): implement login with OAuth (closes #123)`
- `feat(database): design user schema (5.1.1-task-database-schema)`
- `fix(api): handle null response (closes #456)`

## Step 6: Generate PR Description

**Structure:**
```markdown
## Summary
{One-sentence description of what this PR accomplishes}

## Linked Planning Artifact
{GitHub: Closes #{ISSUE_NUM}} OR {Basic Memory: Task {ARTIFACT_ID} (Epic {epic_id})}

## Changes
- {Specific change 1}
- {Specific change 2}
- {Specific change 3}

## Testing
- [ ] Unit tests added/passing
- [ ] Integration tests passing
- [ ] Manual testing completed

## Verification
- [ ] Code follows project standards
- [ ] All acceptance criteria met
- [ ] Documentation updated
```

## Step 7: Human Review

**Display:**
1. PR Title
2. PR Description
3. Changed files: `git diff --name-stat origin/main...HEAD`
4. Impact: `git diff --stat origin/main...HEAD`

**Confirm:** "Proceed with creating this pull request?"
- Allow editing title/description or cancel

## Step 8: Create PR

**Execute:**
1. Use GitHub tool to create PR
   - Title: {Generated}
   - Description: {Generated}
   - Base: main/develop (auto-detect)
   - Head: current branch
   - Draft: false

2. If successful: Capture PR number and URL
3. If failed: Report error with troubleshooting steps

## Step 9: Update Planning Artifacts

**For GitHub issues:**
- Add comment linking to PR
- Add "pr-ready" or "in-review" label
- Remove "in-progress" label

**For Basic Memory artifacts:**
- Use `basicmemory_edit_note` to update frontmatter:
  - `pr_link: {PR_URL}`
  - `status: in-review`

## Step 10: Summary

Display:
```markdown
## Pull Request Created ✅

- **PR**: #{PR_NUMBER} → {PR_URL}
- **Title**: {pr_title}
- **Branch**: {CURRENT_BRANCH}
- **Files**: {count} changed, {+lines} added, {-lines} deleted

## Linked Artifact
{Artifact context}

## Next Steps
1. Wait for code review
2. Address feedback if needed
3. Once approved, merge the PR
4. For completed epic: Use `/project:close:retro`
```

## Workflow Integration

This command fits into the planning workflow:
```
[Task] in-progress → [Implementation] → /project:do:pr → [PR] in-review → [Code Review] → [Merged] → [Task] completed
```

**Related:** `/project:do:task`, `/project:do:commit`, `/project:close:retro`
