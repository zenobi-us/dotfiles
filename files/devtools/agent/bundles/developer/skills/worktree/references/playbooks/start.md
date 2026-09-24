# Playbook: start

Create isolated Worktrunk worktrees and start agents for tickets.

This playbook receives `muxer` and `agent` already resolved by the `worktree` skill's Rule 1 (muxer) and Rule 2 (agent) — it does not detect either itself.

## Input format

Trim `UserRequest` before parsing.

Accept the selector forms defined by `references/issue-tracker.md` and the project's tracker document.

For external numeric trackers, retain these forms:

- `issue 1`
- `1`
- `issues 1-3`
- `1-3`

For `backend: local-markdown`, also accept the tracker-defined issue path, path relative to `ALIGNMENT_ROOT`, path relative to `issue-root`, number, or slug. Do not force a local path through numeric range parsing. Reject ambiguous selectors. Do not add comma-separated or mixed selectors unless the tracker document defines them.

## Ticket resolution

Resolve the ticket or tickets before starting work.

1. Use explicit issue or ticket identifiers in `UserRequest`.
2. If `UserRequest` has no identifier, use the most recent unambiguous ticket mention in the conversation.
3. Cross-check the inferred ticket against repository and workflow records.
4. If no unique ticket matches, or candidates conflict, ask the user which ticket to use.
5. Do not guess or silently choose a ticket.

# Preconditions

- Use the `worktrunk` skill. Worktrunk is required for worktree creation and hooks.
- Use `references/muxers/<muxer>.md` for workspace, pane, and agent commands. Do not use commands from a different muxer's contract.
- Use `references/agents/<agent>.md` for the launch command. If `agent` is `unknown-agent` and no override was given, ask the user before proceeding.
- Use the applicable Matt Pocock engineering skill. Use `/ask-matt` when the right skill is unclear.
- Treat the shared agent context as durable project memory. Resolve `ALIGNMENT_ROOT` from `<shared-agent-context>` or fall back to the repository root. Follow `ALIGNMENT-ROOT.md` before reading or writing `CONTEXT.md`, `CONTEXT-MAP.md`, ADRs, or `docs/agents/`.
- Run `/agent-core context report` before using alignment files. Read relevant context and ADRs from the active `ALIGNMENT_ROOT`; do not invent a shared path or write to an inactive storage location.
- Prefer `storage="shared"` for memory shared across worktrees when it is active. If a durable domain or architecture decision emerges, record it with `domain-modeling` or `codebase-design` in the active alignment storage instead of leaving it only in chat.
- Follow `SHARED-CONTEXT-LINKS.md`'s write rule for every file you create or update under `ALIGNMENT_ROOT`.

# Process

1. Load `references/issue-tracker.md` and the project issue tracker definition.
2. Resolve the ticket selector from `UserRequest` or the Ticket resolution rules.
3. Parse the selector according to the configured backend.
   - For external numeric trackers, expand supported ranges and remove duplicates.
   - For local Markdown, resolve each path, number, or slug to one issue file. Preserve the resolved tracker path.
4. Resolve the active engineering context and select the applicable engineering skill for the ticket jobs.
   - If `<shared-agent-context />` isn't in context, run the slash cmd `/agent-core context report` to understand where we store information.
   - Read relevant `CONTEXT.md` or `CONTEXT-MAP.md`, ADRs, and `docs/agents/` files from the active `ALIGNMENT_ROOT`.
5. Resolve the issue tracker backend and fetch every ticket's details.
   - Jira, GitHub, GitLab, or another external backend: use the configured tracker skill and operations.
   - Local Markdown: read each resolved file under `$ALIGNMENT_ROOT/<issue-root>` and follow the tracker document's claim operation.
6. Validate every ticket before changing any ticket state.
7. Mark every ticket as in progress using the configured tracker operation. For local Markdown, update the issue file only as the tracker document requires and preserve its format.
8. Resolve the current workspace or session state for the active `muxer` (for `herdr`: `herdr worktree list --cwd "$PWD" --json`; other muxers have no equivalent lookup — skip this step for them).
9. Start one independent job for each ticket. Run these jobs in parallel.
   - Choose a unique safe branch name that includes the ticket ID.
   - Resolve the base branch from the repository.
   - Use Worktrunk to create or switch to the branch with hooks enabled: `wt switch --create <branch> --no-cd --no-hooks` or with hooks, per the ticket's needs.
   - Use `--no-cd` and JSON output where supported, because the parent process cannot consume shell directory changes.
   - Write `/tmp/{ticket-id}-handoff.md` with the ticket details, branch, base branch, worktree path, active `ALIGNMENT_ROOT` and storage mode, selected engineering skill, relevant context files, requirements, and validation commands.
   - Open a pane or session for the agent following `references/muxers/<muxer>.md`'s "Opening a pane for an agent" procedure, using `references/agents/<agent>.md`'s launch command with `@/tmp/{ticket-id}-handoff.md` as the task input.
   - Do not open a second pane or session for the same worktree once one is running.
   - Write one persistent workflow record for the ticket with the ticket, source branch, base branch, worktree path, muxer, agent, pane/session identifier (when the muxer has one), agent name, handoff path, active `ALIGNMENT_ROOT`, and storage mode.
   - If the active `ALIGNMENT_ROOT` has `storage="shared"`, follow `SHARED-CONTEXT-LINKS.md`'s write rule for the workflow record before starting the ticket agent.
10. Keep each ticket job isolated. Use absolute paths and separate variables.
11. If one ticket job fails, record the failure and continue the other jobs.

# Output

Report one result per ticket:

- ticket
- status
- branch
- worktree path
- muxer and pane/session identifier
- agent name
- handoff path
- failure reason, if applicable
