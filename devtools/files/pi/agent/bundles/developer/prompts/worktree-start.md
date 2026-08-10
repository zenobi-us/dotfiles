---
description: Fetch one or more tickets, create isolated Worktrunk worktrees, and start Pi agents in parallel in Herdr.
---

Fetch the tickets from `UserRequest`. Create one isolated Worktrunk worktree per ticket. Start one Pi agent per worktree.

## Input format

Trim `UserRequest` before parsing.

Accept these forms:

- `issue 1`
- `1`
- `issues 1-3`
- `1-3`

The range is inclusive. The `issue` or `issues` prefix is optional and case-insensitive.

Reject invalid input. Do not add support for comma-separated or mixed selectors.

## Ticket resolution

Resolve the ticket or tickets before starting work.

1. Use explicit issue or ticket identifiers in `UserRequest`.
2. If `UserRequest` has no identifier, use the most recent unambiguous ticket mention in the conversation.
3. Cross-check the inferred ticket against repository and workflow records.
4. If no unique ticket matches, or candidates conflict, ask the user which ticket to use.
5. Do not guess or silently choose a ticket.

# Preconditions

- Require `HERDR_ENV=1`. If Herdr is not active, stop.
- Use the `worktrunk` skill. Worktrunk is required for worktree creation and hooks.
- Use Herdr commands for workspaces, panes, and agents. Do not use Zellij commands.

# Process

1. Resolve the ticket selector from `UserRequest` or the Ticket resolution rules.
2. Parse the selector into a list of ticket numbers.
   - Expand ranges inclusively.
   - Remove duplicate ticket numbers.
3. Determine the issue tracker from the explicit or inferred ticket source.
4. Fetch every ticket's details.
   - Jira: use `reading-and-writing-jira-tickets`.
   - GitHub: use `gh issue view`.
5. Validate every ticket before changing any ticket state.
6. Mark every ticket as in progress and assign it to me, depending on the tracker:
  - with a status change or,
  - add a label or, 
  - comment indicating that the ticket is being worked on.
7. Resolve the repository root Herdr workspace once with `herdr worktree list --cwd "$PWD" --json`.
8. Start one independent job for each ticket. Run these jobs in parallel.
   - Choose a unique safe branch name that includes the ticket ID.
   - Use Worktrunk to create or switch to the branch with hooks enabled.
   - Use `--no-cd` and JSON output because the parent Pi process cannot consume shell directory changes.
   - Register the resulting worktree with Herdr by using `herdr worktree open` and the returned worktree path.
   - Do not use native Herdr worktree creation instead of Worktrunk.
   - Write `/tmp/{ticket-id}-handoff.md` with the ticket details, branch, worktree path, requirements, and validation commands.
   - Read the root pane ID from the Herdr worktree-open response.
   - Start Pi in that pane with `herdr agent start <name> --kind pi --pane <pane-id> -- @/tmp/{ticket-id}-handoff.md`.
   - Do not create a duplicate tab or pane after Herdr opens the worktree.
   - Write one persistent workflow record for the ticket.
9. Keep each ticket job isolated. Use absolute paths and separate variables.
10. If one ticket job fails, record the failure and continue the other jobs.

# Output

Report one result per ticket:

- ticket
- status
- branch
- worktree path
- Herdr workspace
- agent name
- handoff path
- failure reason, if applicable

UserRequest: $ARGUMENTS
