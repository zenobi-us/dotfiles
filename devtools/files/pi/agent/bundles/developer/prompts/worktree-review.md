---
description: Review completed Worktrunk work in Herdr and persist a verdict.
---

Review completed work for `UserRequest` in the current or inferred Worktrunk worktree.

# Preconditions

- Require `HERDR_ENV=1`. If Herdr is not active, stop.
- Use the `worktrunk` skill. Worktrunk is required for worktree and branch inspection.
- Do not change source code during review.
- Do not rely on chat context as the review gate.

# Exit early

Exit if you cannot identify all of these items:

1. The Worktrunk worktree.
2. The source branch or pull request.
3. The issue, ticket, or requested scope.

# Process

1. Resolve the current Herdr worktree with `herdr worktree list --cwd "$PWD" --json`.
2. Use Worktrunk and Git to identify the source branch, base branch, and actual diff.
3. Use the `code-review` skill.
4. Review the work against:
   - the ticket requirements,
   - repository standards,
   - recorded validation output,
   - the actual diff against the base branch.
5. Run the smallest validation command that proves the reviewed work passes.
6. Write a persistent review artifact with the exact scope, source branch, base branch, commit, findings, validation command, validation result, verdict, and timestamp.
7. Use `SUCCESS` when no blocking findings remain. Use `FAILURE` when blocking findings remain.
8. If the verdict is `FAILURE`, ask whether to run `worktree-fix`. Pass only the blocking findings, exact files, and validation command.
9. If the verdict is `SUCCESS`, ask whether to run `worktree-finish` or `worktree-submit`.

# Output

Use this format:

```md
## Verdict
SUCCESS or FAILURE

## Scope
{issue, branch, pull request, or user request reviewed}

## Findings
- {blocking finding, or "None"}

## Validation
- {command}: {result}

## Review artifact
{path}

## Next step
{Ask for worktree-finish/worktree-submit or worktree-fix.}
```

UserRequest: $ARGUMENTS
