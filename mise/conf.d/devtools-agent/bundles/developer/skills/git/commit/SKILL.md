---
name: commit
description: Commit staged and unstaged changes with atomic conventional commits.
user-invocable: true
model-invocable: false
---

# Commit changes

Own the mechanics of grouping changes and creating Git commits. Use this skill both for standalone commit requests and when another workflow (such as `pr`) delegates commit mechanics to it.

## Procedure

1. Resolve every merge conflict first. `git ls-files -u` must print nothing.
2. Unstage before analysis, so grouping comes from the diff and not from what happened to be staged:

   ```bash
   git restore --staged .
   ```

3. Read the whole change before grouping it:

   ```bash
   git status --porcelain
   git diff
   ```

4. Plan atomic groupings with the correct scope. Several commits are the default. Plan one commit only when the user asked for a single commit.
5. Print the plan as a table, then continue. Do not wait for approval and do not ask whether to commit: the request is the approval.
6. Make each commit with its own `git add <paths>` and `git commit -m "<message>"`, with no `&&` or `;` between them.
7. Stop and report any file that belongs to no group. Never `git stash`: the stash is shared by every worktree of the checkout.
8. Rebase on the target branch last when the calling workflow requires it. Skip this when that workflow rebases next. With no calling workflow, the target is the base of the branch's open PR, else the default branch:

   ```bash
   git fetch origin <target-branch>
   git rebase origin/<target-branch>
   ```

## Commit messages

Write semantic, atomic Conventional Commit messages, one logical change per commit:

```text
<type>(<scope>): <description>
```

- `<type>`: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `style`, or `test`.
- `<scope>`: use the repository's own vocabulary, found with `git log --oneline -50`.
- `<description>`: lowercase, concise, imperative, under 72 characters, and without a final full stop.
- A body is optional. Use it to explain what changed and why, wrapped at 72 characters.
- Include the issue or ticket reference in the subject when the caller resolved one.
- Avoid vague subjects and emojis unless the repository's history uses them.

Examples:

- `fix(auth): guard a null session on first render`
- `feat(reports): add support for multiple currencies`
- `chore(ci): update the deployment scripts for the new environment`

Map review feedback to commit types: bugs/errors/crashes/wrong behaviour → `fix`; added behaviour → `feat`; rename/refactor → `refactor`; docs/comments → `docs`; performance → `perf`; formatting → `style`; test coverage → `test`.

Do not batch unrelated review feedback into one commit. Use one commit per review thread or CI check type when the PR workflow requires that cadence.

## Success criteria

- Every commit contains one logical change.
- `git status --porcelain` is empty, except for files explicitly reported as belonging to no group.
- Every subject follows the rules above and includes any resolved ticket reference.

This skill does not own branch creation, PR creation or updates, review responses, or pushing. Those belong to the calling workflow or the `pr` skill.
