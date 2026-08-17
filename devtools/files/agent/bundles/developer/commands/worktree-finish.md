---
description: Squash merge a successfully reviewed Worktrunk worktree through Herdr and close the ticket.
---

Finish the reviewed work for the resolved ticket.

## Ticket resolution

Resolve the ticket before finishing work.

1. Use an explicit issue or ticket identifier in `UserRequest`.
2. If `UserRequest` has no identifier, use the most recent unambiguous ticket mention in the conversation.
3. Cross-check the inferred ticket against the current worktree and persisted workflow or review records.
4. If no unique ticket matches, or candidates conflict, ask the user which ticket to finish.
5. Do not guess or silently choose a ticket.

# Preconditions

- Require `HERDR_ENV=1`. If Herdr is not active, stop.
- Use the `worktrunk` skill. Worktrunk is required for worktree operations.
- Use the applicable Matt Pocock engineering skills, especially `code-review` and `implement`.
- Treat the shared agent context as durable project memory. Resolve `ALIGNMENT_ROOT` from `<shared-agent-context>` or fall back to the repository root. Run `/eng-context report` and read relevant context and ADRs before merging.
- Follow `ALIGNMENT-ROOT.md`. Keep alignment files in the active storage location and keep source code, commits, and branches in the repository worktree.
- Require a matching persisted `SUCCESS` verdict from `worktree-review`, read from `<ALIGNMENT_ROOT>/docs/agents/reviews/{ticket-id}.md` in the active shared agent context root.
- Do not remove a worktree while an agent still runs inside it.

Ask the user for the missing ticket before continuing. Exit if the review artifact scope does not match the resolved ticket or if you cannot identify:

1. The source worktree.
2. The source branch.
3. The base branch.
4. The issue or ticket.

# Process

1. Resolve the active `ALIGNMENT_ROOT` and run `/eng-context report`.
2. Resolve the source and base worktrees with `herdr worktree list --cwd "$PWD" --json`.
3. Use Worktrunk to verify the source branch and worktree state.
4. Make sure that the source worktree has no unintended changes.
5. Run the smallest validation command recorded by the successful review.
6. Stop or release the source agent before removing its worktree.
7. Use Herdr to open or focus the base worktree workspace. Do not run merge operations from an active source-agent pane.
8. Update the base branch from its remote.
9. Squash merge the source branch into the base branch.
10. Use the `writing-git-commits` skill for the final commit message.
11. Include the ticket ID in the commit message.
12. Push the base branch.
13. Close the matching GitHub issue or ticket using the correct tracker workflow.
14. Remove the source worktree with Worktrunk only after the push and ticket update succeed.

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
