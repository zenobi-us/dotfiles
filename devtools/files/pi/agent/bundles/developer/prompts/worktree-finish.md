---
description: Squash merge a successfully reviewed worktree into the base branch and close the ticket.
---

Scope: $ARGUMENTS

Finish completed work from a worktree. Use this after `worktree-start` and a successful `worktree-review` verdict.

# Exit early

Exit if this chat has no successful `worktree-review` verdict for `Scope`.

Exit if you cannot identify all of these items:

1. The worktree.
2. The source branch.
3. The base branch.
4. The issue or ticket.

Exit if the review verdict scope does not match `Scope`.

# Process

1. Use skill `worktrunk` for worktree operations.
2. Identify the worktree, source branch, base branch, and ticket.
3. Make sure the worktree has no unintended changes.
4. Run the smallest validation command that proves the reviewed work still passes.
5. Switch to the base branch worktree.
6. Update the base branch from remote.
7. Squash merge the source branch into the base branch.
8. Use skill `writing-and-creating-git-commits` for the final commit message.
9. Include the ticket id in the commit message.
10. Push the base branch.
11. Close the GitHub issue or ticket with a short summary and validation result.
12. Remove the worktree only after the push and ticket update succeed.

# Safety rules

- Do not squash merge without a matching successful review verdict in chat context.
- Do not delete the worktree before the base branch push succeeds.
- Do not close the ticket if the merge or push fails.

# Output

Use this format:

```md
## Finished
- Ticket: {ticket}
- Source branch: {branch}
- Base branch: {base}
- Commit: {sha}

## Validation
- {command}: {result}

## Ticket
- {closed or not closed, with reason}

## Worktree
- {removed or kept, with reason}
```
