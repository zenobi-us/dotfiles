---
description: Review completed work in an existing worktree, then route to finish or fix.
---

Scope: $ARGUMENTS

Review completed work for `Scope` in the current or inferred worktree. This prompt is for a separate review chat after `worktree-start` finished the implementation.

# Exit early

Exit if you cannot identify all of these items:

1. The worktree.
2. The branch or pull request.
3. The issue, ticket, or requested scope.

Do not change code during review.

# Process

1. Infer the worktree and ticket from chat context, branch name, pull request, or `Scope`.
2. Use skill `code-review`.
3. Review the work against:
   - the ticket requirements,
   - repository standards,
   - validation output,
   - the actual diff against the base branch.
4. Write a review verdict:
   - `SUCCESS`: no blocking findings remain.
   - `FAILURE`: blocking findings remain.
5. Include the exact scope that the verdict covers.
6. If the verdict is `SUCCESS`, ask the user whether to run `worktree-finish`.
7. If the verdict is `FAILURE`, ask the user whether to fix the findings in a subagent.
8. If the user chooses a fix, spawn a subagent in the same worktree with only:
   - the blocking findings,
   - the exact files,
   - the expected validation command.

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

## Next step
{Ask for worktree-finish or subagent fix.}
```
