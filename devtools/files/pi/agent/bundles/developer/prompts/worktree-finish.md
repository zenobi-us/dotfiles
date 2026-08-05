---
description: Squash merge a successfully reviewed Worktrunk worktree through Herdr and close the ticket.
---

Finish the reviewed work for `UserRequest`.

# Preconditions

- Require `HERDR_ENV=1`. If Herdr is not active, stop.
- Use the `worktrunk` skill. Worktrunk is required for worktree operations.
- Require a matching persisted `SUCCESS` verdict from `worktree-review`.
- Do not remove a worktree while an agent still runs inside it.

Exit if the review artifact scope does not match `UserRequest` or if you cannot identify:

1. The source worktree.
2. The source branch.
3. The base branch.
4. The issue or ticket.

# Process

1. Resolve the source and base worktrees with `herdr worktree list --cwd "$PWD" --json`.
2. Use Worktrunk to verify the source branch and worktree state.
3. Make sure that the source worktree has no unintended changes.
4. Run the smallest validation command recorded by the successful review.
5. Stop or release the source agent before removing its worktree.
6. Use Herdr to open or focus the base worktree workspace. Do not run merge operations from an active source-agent pane.
7. Update the base branch from its remote.
8. Squash merge the source branch into the base branch.
9. Use the `writing-git-commits` skill for the final commit message.
10. Include the ticket ID in the commit message.
11. Push the base branch.
12. Close the matching GitHub issue or ticket using the correct tracker workflow.
13. Remove the source worktree with Worktrunk only after the push and ticket update succeed.

# Safety rules

- Do not squash merge without the matching persisted `SUCCESS` review artifact.
- Do not remove the worktree before the base push succeeds.
- Do not close the ticket if the merge or push fails.
- Keep the worktree when agent shutdown, merge, push, or ticket update fails.

# Output

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

UserRequest: $ARGUMENTS
