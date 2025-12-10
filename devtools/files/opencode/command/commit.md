# Git Commit

Create a semantic commit for staged changes: $ARGUMENTS

## Soft Validation

If any of these checks fail, check with the user before proceeding.

1. WARN_ON_DEFAULTBRANCH: !`[$(git branch --show-current) = $(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)] && echo 1 || echo 0` should equal 0
2. WARN_MERGECONFLICTS: !`git ls-files -u | wc -l` should equal 0
3. WARN_INVALIDBRANCHNAME: !`git branch --show-current` should match `^(feat|fix|docs|style|refactor|perf|test|chore)\/[a-z0-9\-]+$` (if not on default branch)

## Hard Validation

If any of these checks fail, fix the issue before proceeding. or Exit if human intervention is required.

1. on default branch, but it needs to be fastforwarded from remote.
2. uncommitted merge conflicts detected. Please resolve them before committing.

## Process

1. Check `git status` and `git diff --staged` to review staged changes
2. Generate commit message using format: `[scope] description`
3. Suggest 3-5 commit message options
4. Wait for user confirmation before committing
5. Execute `git commit -m "selected message"`
- if branch name validation fails, always fix, never ignore or skip it.
1. determine default branch with the gh cli tool
2. fast forward the default branch from remote: ie: `git fetch origin master:master`
3. rebase the current branch onto the default branch: ie: `git rebase master`
4. push the current branch to remote: ie: `git push origin HEAD --force-with-lease`

## Scope Rules

Use the `skills_superpowers_writing_git_commits` skill to guide you in writing great commit messages and body content following the Conventional Commits specification.

Key principles:

- Use file directory or functionality as scope
- Common scopes: `[ui]`, `[api]`, `[docs]`, `[config]`, `[claude]`
- Description starts lowercase, concise and clear
- Follow semantic commit format: `[type](scope): description`

## Examples

- `[ui] fix button styling on mobile devices`
- `[api] add user authentication endpoint`
- `[docs] update installation instructions`
