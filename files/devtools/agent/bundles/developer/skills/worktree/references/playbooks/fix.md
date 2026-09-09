# Playbook: fix

Start an agent to fix blocking review findings in an existing Worktrunk worktree.

This playbook receives `muxer` and `agent` already resolved by the `worktree` skill's rule 0 and rule 1.

## Ticket resolution

Resolve the ticket before fixing work.

1. Use an explicit issue or ticket identifier in `UserRequest`.
2. If `UserRequest` has no identifier, use the most recent unambiguous ticket mention in the conversation.
3. Cross-check the inferred ticket against the current worktree and persisted workflow or review records.
4. If no unique ticket matches, or candidates conflict, ask the user which ticket to fix.
5. Do not guess or silently choose a ticket.

# Preconditions

- Use the `worktrunk` skill. Worktrunk is required for worktree inspection and operations.
- Use `references/muxers/<muxer>.md` for pane and agent commands. Do not use commands from a different muxer's contract.
- Use `references/agents/<agent>.md` for the launch command. If `agent` is `unknown-agent` and no override was given, ask the user before proceeding.
- Use the applicable Matt Pocock engineering skill, normally `implement`, `tdd`, or `diagnosing-bugs`.
- Treat the shared agent context as durable project memory. Resolve `ALIGNMENT_ROOT` from `<shared-agent-context>` or fall back to the repository root. Run `/agent-core context report` and read relevant context and ADRs before changing code.
- Follow `ALIGNMENT-ROOT.md`. Do not invent a shared path or write alignment files to inactive storage.
- Prefer `storage="shared"` for memory shared across worktrees when it is active. Record durable domain or architecture decisions with `domain-modeling` or `codebase-design` in the active alignment storage.
- Follow `SHARED-CONTEXT-LINKS.md`'s write rule for every file you create or update under `ALIGNMENT_ROOT`.
- Require a matching persisted `FAILURE` verdict from the `review` playbook, read from `<ALIGNMENT_ROOT>/docs/agents/reviews/{ticket-id}.md` in the active shared agent context root.
- Do not create a second worktree for the same source branch.

# Process

1. Resolve the ticket, then identify the source branch, worktree path, and blocking findings from `UserRequest` or the review artifact at `<ALIGNMENT_ROOT>/docs/agents/reviews/{ticket-id}.md`.
2. Resolve the active `ALIGNMENT_ROOT`, run `/agent-core context report`, and select the applicable engineering skill.
3. Read relevant `CONTEXT.md` or `CONTEXT-MAP.md`, ADRs, and `docs/agents/` files from the active alignment storage.
4. Use Worktrunk to verify that the source worktree exists and that the branch is correct.
5. Write `/tmp/{ticket-id}-fix-handoff.md` with only the blocking findings, exact files, source worktree path, active `ALIGNMENT_ROOT` and storage mode, selected engineering skill, relevant context files, expected validation command, and these completion instructions:
   - Fix the blocking findings.
   - Run the expected validation command.
   - End the final response with the exact marker `WORKTREE_FIX_DONE` when the fix and validation pass.
   - Do not use the marker when the fix is blocked or validation fails.
6. Open a pane or session for the fixer following `references/muxers/<muxer>.md`'s "Opening a pane for an agent" procedure, using `references/agents/<agent>.md`'s launch command with `@/tmp/{ticket-id}-fix-handoff.md` as the task input, in the existing source worktree path.
7. Wait for the fixer to finish. Under `herdr`, `zellij`, `tmux`, or `hrdx`, follow the active muxer contract's wait/read commands. Under `unknown-muxer`, the fixer already ran to completion in the foreground — read its final output directly.
8. If the fixer reaches `blocked`, fails validation, or does not include `WORKTREE_FIX_DONE`, report the failure and do not start a review. See `references/troubleshooting/fixer-agent-blocked.md`.
9. If the fixer includes `WORKTREE_FIX_DONE`, close its pane or session per the active muxer contract, then run this skill again with `review {ticket-id}`.
10. Do not create a second worktree for the same source branch. Worktrunk owns the checkout.
11. Record the fixer agent name, pane/session identifier, active `ALIGNMENT_ROOT`, and storage mode in the workflow record.
12. If the active `ALIGNMENT_ROOT` has `storage="shared"`, follow `SHARED-CONTEXT-LINKS.md`'s write rule for the workflow record.

# Output

Report the source branch, worktree path, fixer agent, pane/session identifier, handoff path, validation command, fixer completion marker, pane/session close result, and review command result.
