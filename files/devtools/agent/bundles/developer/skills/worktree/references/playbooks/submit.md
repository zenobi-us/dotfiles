# Playbook: submit

Submit the reviewed work for the resolved ticket as a pull request.

Submit commits, pushes, and opens a pull request from the current worktree — it does not open a new pane or launch a fresh agent. The muxer and agent contracts do not apply to this playbook.

## Ticket resolution

Resolve the ticket before submitting work.

1. Use an explicit issue or ticket identifier in `UserRequest`.
2. If `UserRequest` has no identifier, use the most recent unambiguous ticket mention in the conversation.
3. Cross-check the inferred ticket against the current worktree and persisted workflow or review records.
4. If no unique ticket matches, or candidates conflict, ask the user which ticket to submit.
5. Do not guess or silently choose a ticket.

# Preconditions

- Use the `worktrunk` skill. Worktrunk is required for worktree and branch operations.
- Use the applicable Matt Pocock engineering skills, especially `code-review` and `implement`.
- Treat the shared agent context as durable project memory. Resolve `ALIGNMENT_ROOT` from `<shared-agent-context>` or fall back to the repository root. Run `/agent-core context report` and read relevant context and ADRs before submitting.
- Follow `ALIGNMENT-ROOT.md`. Keep alignment files in the active storage location and keep source code, commits, and pull requests in the worktree repository.
- Follow `SHARED-CONTEXT-LINKS.md` for the write rule (any shared-context file created or updated while submitting this ticket) and the reference rule (linking ADRs, tasks, or the review artifact in the commit message and pull request body).
- Require a matching persisted `SUCCESS` verdict from the `review` playbook, read from `<ALIGNMENT_ROOT>/docs/agents/reviews/{ticket-id}.md` in the active shared agent context root. See `references/troubleshooting/missing-review-verdict.md` if this gate blocks you.
- Do not push directly to the base branch.

Ask the user for the missing ticket before continuing. Exit if the review artifact scope does not match the resolved ticket or if you cannot identify:

1. The source worktree.
2. The source branch.
3. The base branch.
4. The issue or ticket.

# Process

1. Resolve the active `ALIGNMENT_ROOT` and run `/agent-core context report`.
2. Resolve the current worktree (for `herdr`: `herdr worktree list --cwd "$PWD" --json`; other muxers have no equivalent lookup — use `git`/`wt` state directly instead).
3. Use Worktrunk to verify the source branch and worktree state.
4. Make sure that the source worktree has no unintended changes. Commit intended changes with the `writing-git-commits` skill, including the ticket link and a link, per `SHARED-CONTEXT-LINKS.md`'s reference rule, to every ADR the review verdict relied on.
5. Run the smallest validation command recorded by the successful review.
6. Push the source branch.
7. Use the pull request creation skill if available. Otherwise use `gh pr create`.
8. Add these items to the pull request body:
   - the ticket link,
   - a link, per `SHARED-CONTEXT-LINKS.md`'s reference rule, to the successful review artifact,
   - a link, per `SHARED-CONTEXT-LINKS.md`'s reference rule, to every ADR the review verdict relied on,
   - validation output,
   - a concise summary of changes.
9. Leave the source worktree open. Do not remove it after submitting the pull request.

# Safety rules

- Do not create a pull request without the matching persisted `SUCCESS` review artifact.
- Do not include unrelated changes in the commit.
- Do not push directly to the base branch.

# Output

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
