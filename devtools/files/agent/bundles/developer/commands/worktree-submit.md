---
description: Commit successfully reviewed Worktrunk work and open a pull request through Herdr.
---

Submit the reviewed work for the resolved ticket as a pull request.

## Ticket resolution

Resolve the ticket before submitting work.

1. Use an explicit issue or ticket identifier in `UserRequest`.
2. If `UserRequest` has no identifier, use the most recent unambiguous ticket mention in the conversation.
3. Cross-check the inferred ticket against the current worktree and persisted workflow or review records.
4. If no unique ticket matches, or candidates conflict, ask the user which ticket to submit.
5. Do not guess or silently choose a ticket.

# Preconditions

- Require `HERDR_ENV=1`. If Herdr is not active, stop.
- Use the `worktrunk` skill. Worktrunk is required for worktree and branch operations.
- Use the applicable Matt Pocock engineering skills from `@devtools/files/pi/agent/bundles/matt-pocock/skills/engineering/`, especially `code-review` and `implement`.
- Treat the shared agent context as durable project memory. Resolve `ALIGNMENT_ROOT` from `<shared-agent-context>` or fall back to the repository root. Run `/eng-context report` and read relevant context and ADRs before submitting.
- Follow `ALIGNMENT-ROOT.md`. Keep alignment files in the active storage location and keep source code, commits, and pull requests in the worktree repository.
- Require a matching persisted `SUCCESS` verdict from `worktree-review`.
- Do not push directly to the base branch.

Ask the user for the missing ticket before continuing. Exit if the review artifact scope does not match the resolved ticket or if you cannot identify:

1. The source worktree.
2. The source branch.
3. The base branch.
4. The issue or ticket.

# Process

1. Resolve the active `ALIGNMENT_ROOT` and run `/eng-context report`.
2. Resolve the current or reviewed Herdr worktree with `herdr worktree list --cwd "$PWD" --json`.
3. Use Worktrunk to verify the source branch and worktree state.
4. Make sure that the source worktree has no unintended changes. Commit intended changes with the `writing-git-commits` skill.
5. Run the smallest validation command recorded by the successful review.
6. Push the source branch.
7. Use the pull request creation skill if available. Otherwise use `gh pr create`.
8. Add these items to the pull request body:
   - the ticket link,
   - the successful review artifact path,
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

UserRequest: $ARGUMENTS
