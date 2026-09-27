# Playbook: start

Create isolated Worktrunk worktrees and start agents for tickets.

This playbook receives `muxer` and `agent` already resolved by the `worktree` skill's Rule 1 (muxer) and Rule 2 (agent) — it does not detect either itself.

## Ticket resolution

Load `references/issue-tracker.md` and the ticket skill before starting work. Use the ticket skill to resolve every selector and return the canonical `ticket` and `tracker path`. If `UserRequest` has no identifier, use the most recent unambiguous ticket mention in the conversation. Ask when the selector is missing or ambiguous. Do not guess.

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

1. Load `references/issue-tracker.md` and the ticket skill.
2. Resolve each ticket with the ticket skill. Preserve its `ticket` and `tracker path`.
3. Resolve the active engineering context and select the applicable engineering skill for the ticket jobs.
   - If `<shared-agent-context />` isn't in context, run the slash cmd `/agent-core context report` to understand where we store information.
   - Read relevant `CONTEXT.md` or `CONTEXT-MAP.md`, ADRs, and `docs/agents/` files from the active `ALIGNMENT_ROOT`.
4. Use the ticket skill to read and validate every ticket, then run its configured preflight and claim operation. Preserve the ticket format and keep tracker commits separate from source commits.
5. Resolve the current workspace or session state for the active `muxer` (for `herdr`: `herdr worktree list --cwd "$PWD" --json`; other muxers have no equivalent lookup — skip this step for them).
6. Start one independent job for each ticket. Run these jobs in parallel.
   - Choose a unique safe branch name that includes the ticket ID.
   - Resolve the base branch from the repository.
   - Use Worktrunk to create or switch to the branch with hooks enabled: `wt switch --create <branch> --no-cd --no-hooks` or with hooks, per the ticket's needs.
   - Use `--no-cd` and JSON output where supported, because the parent process cannot consume shell directory changes.
   - Write `/tmp/{ticket-id}-handoff.md` with the ticket details, branch, base branch, worktree path, active `ALIGNMENT_ROOT` and storage mode, selected engineering skill, relevant context files, requirements, and validation commands.
   - Open a pane or session for the agent following `references/muxers/<muxer>.md`'s "Opening a pane for an agent" procedure, using `references/agents/<agent>.md`'s launch command with `@/tmp/{ticket-id}-handoff.md` as the task input.
   - Do not open a second pane or session for the same worktree once one is running.
   - Write one persistent workflow record for the ticket with the ticket, source branch, base branch, worktree path, muxer, agent, pane/session identifier (when the muxer has one), agent name, handoff path, active `ALIGNMENT_ROOT`, and storage mode.
   - If the active `ALIGNMENT_ROOT` has `storage="shared"`, follow `SHARED-CONTEXT-LINKS.md`'s write rule for the workflow record before starting the ticket agent.
7. Keep each ticket job isolated. Use absolute paths and separate variables.
8. If one ticket job fails, record the failure and continue the other jobs.

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
