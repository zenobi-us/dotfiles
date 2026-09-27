# Playbook: finish

Squash merge reviewed work and close its ticket.

Finish merges and removes the worktree. It does not open a new pane or launch a fresh agent for the ticket work itself, but it does need to release any pane or session left running from `start`/`fix` — use `references/muxers/<muxer>.md` for that release step only.

## Ticket resolution

Load `references/issue-tracker.md` and the ticket skill before resolving the ticket. Use the ticket skill to return the canonical `ticket` and `tracker path`. If no identifier is present, use the most recent unambiguous ticket mention in the conversation. Cross-check it against workflow records. Ask when it is missing or ambiguous. Do not guess.

# Preconditions

- Use the `worktrunk` skill. Worktrunk is required for worktree operations.
- Use the applicable Matt Pocock engineering skills, especially `code-review` and `implement`.
- Treat the shared agent context as durable project memory. Resolve `ALIGNMENT_ROOT` from `<shared-agent-context>` or fall back to the repository root. Run `/agent-core context report` and read relevant context and ADRs before merging.
- Follow `ALIGNMENT-ROOT.md`. Keep alignment files in the active storage location and keep source code, commits, and branches in the repository worktree.
- Follow `SHARED-CONTEXT-LINKS.md` for the write rule (any shared-context file created or updated while closing this ticket) and the reference rule (linking ADRs, tasks, or the review artifact in the final commit message).
- Follow `references/issue-tracker.md` and the ticket skill for the configured tracker and returned `tracker path`.
- Require a matching persisted `SUCCESS` verdict from the `review` playbook at the tracker-defined review artifact path. See `references/troubleshooting/missing-review-verdict.md` if this gate blocks you.
- Do not remove a worktree while an agent still runs inside it.

Ask the user for the missing ticket before continuing. Exit if the review artifact scope does not match the resolved ticket or if you cannot identify:

1. The source worktree.
2. The source branch.
3. The base branch.
4. The issue or ticket.

# Process

1. Resolve the active `ALIGNMENT_ROOT` and run `/agent-core context report`.
2. Resolve the source and base worktrees (for `herdr`: `herdr worktree list --cwd "$PWD" --json`; other muxers have no equivalent lookup — use `git`/`wt` state directly instead).
3. Use Worktrunk to verify the source branch and worktree state.
4. Make sure that the source worktree has no unintended changes.
5. Run the smallest validation command recorded by the successful review.
6. Stop or release the source agent's pane or session before removing its worktree, following `references/muxers/<muxer>.md`'s release/close procedure. Under `unknown-muxer` there is no pane to release.
7. Switch to or focus the base worktree. Do not run merge operations from an active source-agent pane or session.
8. Update the base branch from its remote.
9. Squash merge the source branch into the base branch.
10. Use the `writing-and-creating-git-commits` skill for the final merge commit message. Put the ticket reference in the commit title. Include the ticket link or the `tracker path` returned by the ticket skill in the commit body. Include a link, per `SHARED-CONTEXT-LINKS.md`'s reference rule, to every ADR the review verdict relied on and to the persisted review artifact itself.
11. Push the base branch.
12. After the merge and push succeed, use the ticket skill to complete the matching ticket. Follow its tracker and commit rules.
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
