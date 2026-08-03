---
description: Commit reviewed work from a worktree and open a pull request.
---

Scope: $ARGUMENTS

Submit reviewed work as a pull request. Use this when the team wants pull requests instead of direct squash merges.

# Exit early

Exit if this chat has no work context for `Scope`.

Exit if this chat has no successful `worktree-review` verdict for `Scope`.

Exit if the review verdict scope does not match `Scope`.

Exit if you cannot identify all of these items:

1. The worktree.
2. The source branch.
3. The base branch.
4. The issue or ticket.

# Process

1. Use skill `worktrunk` for worktree operations.
2. Switch to the reviewed worktree.
3. Make sure the worktree has no unintended changes.
4. Run the smallest validation command that proves the reviewed work still passes.
5. Use skill `writing-and-creating-git-commits`.
6. Commit the intended changes.
7. Push the source branch.
8. Use the pull request creation skill if available.
9. If no pull request creation skill exists, use the `pr-creator` prompt or `gh pr create`.
10. Add these items to the pull request body:
    - the ticket link,
    - the successful review verdict,
    - validation output,
    - a concise summary of changes.
11. Report the pull request URL.

# Safety rules

- Do not create a pull request without a matching successful review verdict in chat context.
- Do not include unrelated changes in the commit.
- Do not push directly to the base branch.

# Output

Use this format:

```md
## Submitted
- Pull request: {url}
- Ticket: {ticket}
- Source branch: {branch}
- Base branch: {base}

## Validation
- {command}: {result}

## Review gate
- Verdict: SUCCESS
- Scope: {reviewed scope}
```
