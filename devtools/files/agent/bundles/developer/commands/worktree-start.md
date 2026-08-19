---
description: Fetch one or more tickets, create isolated Worktrunk worktrees, and start agents of the current harness in parallel in Herdr.
---

Fetch the tickets from `UserRequest`. Create one isolated Worktrunk worktree per ticket. Start one agent per worktree, matching the harness this command is running in.

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
- Follow the `herdr` skill to detect the harness and launch agents.
- Use the applicable Matt Pocock engineering skill. Use `/ask-matt` when the right skill is unclear.
- Treat the shared agent context as durable project memory. Resolve `ALIGNMENT_ROOT` from `<shared-agent-context>` or fall back to the repository root. Follow `ALIGNMENT-ROOT.md` before reading or writing `CONTEXT.md`, `CONTEXT-MAP.md`, ADRs, or `docs/agents/`.
- Run `/eng-context report` before using alignment files. Read relevant context and ADRs from the active `ALIGNMENT_ROOT`; do not invent a shared path or write to an inactive storage location.
- Prefer `storage="shared"` for memory shared across worktrees when it is active. If a durable domain or architecture decision emerges, record it with `domain-modeling` or `codebase-design` in the active alignment storage instead of leaving it only in chat.
- Follow `SHARED-CONTEXT-LINKS.md`'s write rule for every file you create or update under `ALIGNMENT_ROOT`.

# Process

1. Resolve the ticket selector from `UserRequest` or the Ticket resolution rules.
2. Parse the selector into a list of ticket numbers.
   - Expand ranges inclusively.
   - Remove duplicate ticket numbers.
3. Resolve the active engineering context and select the applicable engineering skill for the ticket jobs.
   - If `<shared-agent-context />` isn't in context, run the slash cmd `/eng-context report` to understand where we store information.
   - Read relevant `CONTEXT.md` or `CONTEXT-MAP.md`, ADRs, and `docs/agents/` files from the active `ALIGNMENT_ROOT`.
4. Determine the issue tracker from the explicit or inferred ticket source.
5. Fetch every ticket's details.
   - Jira: use `reading-and-writing-jira-tickets`.
   - GitHub: use `gh issue view`.
6. Validate every ticket before changing any ticket state.
7. Mark every ticket as in progress and assign it to me, depending on the tracker:
  - with a status change or,
  - add a label or, 
  - comment indicating that the ticket is being worked on.
8. Resolve the repository root Herdr workspace once with `herdr worktree list --cwd "$PWD" --json`.
9. Start one independent job for each ticket. Run these jobs in parallel.
   - Choose a unique safe branch name that includes the ticket ID.
   - Resolve the base branch from the repository.
   - Use Worktrunk to create or switch to the branch with hooks enabled.
   - Use `--no-cd` and JSON output because the parent process cannot consume shell directory changes.
   - If the current Herdr space is not the target worktree space, register the resulting worktree with Herdr by using `herdr worktree open` and the returned worktree path. Start the agent in the returned worktree space and root pane.
   - If the current Herdr space is the target worktree space, create a new tab with `herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd <worktree-path> --no-focus`. Start the agent in the returned tab's root pane.
   - Do not use native Herdr worktree creation instead of Worktrunk.
   - Write `/tmp/{ticket-id}-handoff.md` with the ticket details, branch, base branch, worktree path, active `ALIGNMENT_ROOT` and storage mode, selected engineering skill, relevant context files, requirements, and validation commands.
   - Follow the `herdr` skill to run `herdr agent start <name> --kind $(scripts/identify-harness.sh) --pane <pane-id> -- @/tmp/{ticket-id}-handoff.md`.
   - Do not create a duplicate tab or pane after Herdr opens the worktree space.
   - Write one persistent workflow record for the ticket with the ticket, source branch, base branch, worktree path, Herdr workspace ID, agent name, handoff path, active `ALIGNMENT_ROOT`, and storage mode.
   - If the active `ALIGNMENT_ROOT` has `storage="shared"`, follow `SHARED-CONTEXT-LINKS.md`'s write rule for the workflow record before starting the ticket agent.
10. Keep each ticket job isolated. Use absolute paths and separate variables.
11. If one ticket job fails, record the failure and continue the other jobs.

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
