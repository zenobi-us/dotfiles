# Playbook: finish

Squash merge reviewed work and close its ticket.

Finish does not launch an agent for source work. It releases every remaining agent pane before merge and removes the worktree only after the push and ticket update succeed.

## Preconditions

- Read `references/receipts.md`.
- Resolve the canonical ticket and tracker path with the ticket skill.
- Use Worktrunk and the applicable `code-review` and `implement` skills.
- Run the shared-context CLI from the source repository. Use its reported root and storage mode.
- Follow `ALIGNMENT-ROOT.md`. Resolve the workflow root with
  `cli.ts path workflow --id <ticket-id>`.
- Require an immutable `SUCCESS` review receipt for the current source commit and tree.
- Confirm that no later source changes exist after the successful review.
- Do not remove the worktree while an agent is running.

## Process

1. Resolve the workflow root, source branch, base branch, and source worktree.
2. Read the latest `SUCCESS` review receipt, its artifact under
   `artifacts/reviews/`, the fix or implementation receipt, relevant context,
   ADR links, and validation command.
3. Verify that the successful review covers the current source commit and tree.
4. Run the recorded validation command.
5. Append a `finish` receipt with status `FINISHING`.
6. Stop or release every source-worktree agent pane or session using the active muxer contract. Keep the receipt if shutdown fails.
7. Focus the base worktree. Do not merge from a source-agent pane.
8. Update the base branch from its remote.
9. Verify that Worktrunk is configured for a squash merge. If `[merge].squash = false`, stop and report the configuration mismatch instead of silently performing a non-squash merge.
10. Squash merge the source branch into the base branch with Worktrunk.
11. Use `writing-and-creating-git-commits` for the final merge commit. Put the ticket reference in the title. Include the tracker path, successful review artifact, and every ADR relied on by the review in the body.
12. Push the base branch.
13. Complete the ticket with the ticket skill.
14. Remove the source worktree with Worktrunk.
15. Close the hrdx workspace after the worktree is removed.
16. Append a final immutable `FINISHED` receipt using the terminal receipt fields
    in `references/receipts.md`. If any step from 6 through 15 fails, append
    `FINISH_FAILED` with the failure fields and preserve every resource required
    for recovery. Regenerate the final manifest and projections.

## Safety rules

- Do not merge without a matching `SUCCESS` review receipt.
- Do not merge when the source commit changed after review.
- Do not remove the worktree before the push and ticket update succeed.
- Do not close the ticket when merge or push fails.
- Keep the worktree and receipts when agent shutdown, merge, push, ticket update, or cleanup fails.
- Never replace a `FINISHING` receipt with a terminal receipt. Append the terminal receipt.

## Output

```md
## Finished
- Ticket: {ticket}
- Source branch: {branch}
- Base branch: {base}
- Reviewed source commit: {sha}
- Merge commit: {sha}
- Finish receipt: {path}

## Validation
- {command}: {result}

## Ticket
- {closed or not closed, with reason}

## Worktree
- {removed or kept, with reason}

## Workspace
- {closed or kept, with reason}
```
