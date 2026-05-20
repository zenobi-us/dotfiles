---
name: writing-and-creating-git-commits
description: Create semantic git commits following best practices and Conventional Commits specification.
---

Create a semantic commit to accomodate user request. 

## Soft Validation

If any of these checks fail, check with the user before proceeding.

1. WARN_ON_DEFAULTBRANCH: !`[$(git branch --show-current) = $(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)] && echo 1 || echo 0` should equal 0
2. WARN_MERGECONFLICTS: !`git ls-files -u | wc -l` should equal 0
3. WARN_INVALIDBRANCHNAME: !`git branch --show-current` should match `^(feat|fix|docs|style|refactor|perf|test|chore)\/[a-z0-9\-]+$` (if not on default branch)

## Hard Validation

If any of these checks fail, fix the issue before proceeding. or Exit if human intervention is required.

1. on default branch, but it needs to be fastforwarded from remote.
2. uncommitted merge conflicts detected. Please resolve them before committing.

## Setup

1. Ensure git is installed and configured with user name and email.


## Execution Process

1. Analyse
2. Prepare
3. Commit
4. Sync


### 1. Analyse Changes

1. **Assess current state**:
   ```bash
   git status --porcelain
   git diff --stat
   git diff --cached --stat
   ```
   - Identify all modified, added, and deleted files
   - Check for any staged changes already in place
   - Note any untracked files that should be included

2. **Analyze changes by file**:
   ```bash
   git diff
   git diff --cached
   ```
   - Review the actual content of each change
   - Understand what each modification accomplishes
   - Identify related changes that belong together

### 2. Prepare Changes

1. **Group changes into logical commits**:
   - Each commit should represent ONE logical change (feature, fix, refactor, etc.)
   - Related files should be committed together
   - Avoid mixing unrelated changes in a single commit
   - Order commits logically (dependencies first, then dependents)

### 3. Commit Changes

4. **Create atomic commits**:
   For each logical group:
   ```bash
   git add <specific-files>
   git commit -m "<type>: <brief description>"
   ```

### 4. Push Process

1. determine default branch with the gh cli tool
2. fast forward the default branch from remote: ie: `git fetch origin master:master`
3. rebase the current branch onto the default branch: ie: `git rebase master`
4. push the current branch to remote: ie: `git push origin HEAD --force-with-lease`


## Guidance: Commit Message Writing

Use the `skills_superpowers_writing_git_commits` skill to guide you in writing great commit messages and body content following the Conventional Commits specification.

Otherwise:

1. Use conventional commit prefixes:
- `feat:` - New feature, functionality.
- `fix:` - Bug fix or refactoring.
- `docs:` - Documentation changes
- `style:` - Formatting, whitespace (no code change)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, dependencies, config

2. Commit Message format:
- 1st line: `<type>(scope): <subject>`
- Blank line
- Body: Detailed explanation of what and why (wrap at 72 chars)
  - Keep subject line under 72 characters
  - Use imperative mood ("add" not "added")
  - Be specific but concise
  - No period at the end of subject line

Examples:
- `feat: add user authentication endpoint`
- `fix(config): resolve null pointer in config parser`
- `feat(scope): extract validation logic to separate module`
- `docs(apiv2): update API documentation for v2 endpoints`
- `chore: update dependencies to latest versions`

## Content Guidelines

- Use direct, factual commit messages
- Avoid vague messages ("fix bug", "update code", "misc changes")
- No emojis unless project convention requires them
- Focus on WHAT changed and WHY (briefly)
- Group related changes even if in different files
