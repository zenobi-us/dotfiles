---
description: Start a Herdr agent, matching the current harness, to fix blocking review findings in an existing Worktrunk worktree.
---

Fix the blocking findings for the resolved ticket in the existing reviewed worktree.

## Ticket resolution

Resolve the ticket before fixing work.

1. Use an explicit issue or ticket identifier in `UserRequest`.
2. If `UserRequest` has no identifier, use the most recent unambiguous ticket mention in the conversation.
3. Cross-check the inferred ticket against the current worktree and persisted workflow or review records.
4. If no unique ticket matches, or candidates conflict, ask the user which ticket to fix.
5. Do not guess or silently choose a ticket.

# Preconditions

- Require `HERDR_ENV=1`. If Herdr is not active, stop.
- Use the `worktrunk` skill. Worktrunk is required for worktree inspection and operations.
- Use Herdr commands for panes and agents. Do not use Zellij commands.
- Follow the `herdr` skill to detect the harness and launch agents.
- Use the applicable Matt Pocock engineering skill, normally `implement`, `tdd`, or `diagnosing-bugs`.
- Treat the shared agent context as durable project memory. Resolve `ALIGNMENT_ROOT` from `<shared-agent-context>` or fall back to the repository root. Run `/eng-context report` and read relevant context and ADRs before changing code.
- Follow `ALIGNMENT-ROOT.md`. Do not invent a shared path or write alignment files to inactive storage.
- Prefer `storage="shared"` for memory shared across worktrees when it is active. Record durable domain or architecture decisions with `domain-modeling` or `codebase-design` in the active alignment storage.
- Require a matching persisted `FAILURE` verdict from `worktree-review`, read from `<ALIGNMENT_ROOT>/docs/agents/reviews/{ticket-id}.md` in the active shared agent context root.
- Do not create a second worktree for the same source branch.

# Process

1. Resolve the ticket, then identify the source branch, worktree path, and blocking findings from `UserRequest` or the review artifact at `<ALIGNMENT_ROOT>/docs/agents/reviews/{ticket-id}.md`.
2. Resolve the active `ALIGNMENT_ROOT`, run `/eng-context report`, and select the applicable engineering skill.
3. Read relevant `CONTEXT.md` or `CONTEXT-MAP.md`, ADRs, and `docs/agents/` files from the active alignment storage.
4. Use Worktrunk to verify that the source worktree exists and that the branch is correct.
5. Write `/tmp/{ticket-id}-fix-handoff.md` with only the blocking findings, exact files, source worktree path, active `ALIGNMENT_ROOT` and storage mode, selected engineering skill, relevant context files, expected validation command, and these completion instructions:
   - Fix the blocking findings.
   - Run the expected validation command.
   - End the final response with the exact marker `WORKTREE_FIX_DONE` when the fix and validation pass.
   - Do not use the marker when the fix is blocked or validation fails.
6. If the current Herdr space is not the source worktree space, open the source worktree with `herdr worktree open`. Start the fixer in the returned worktree space and root pane.
7. If the current Herdr space is the source worktree space, create a new tab with `herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd <worktree-path> --no-focus`. Start the fixer in the returned tab's root pane.
8. Follow the `herdr` skill to run `herdr agent start <name> --kind $(scripts/identify-harness.sh) --pane <pane-id> -- @/tmp/{ticket-id}-fix-handoff.md`.
9. Wait for the fixer with `herdr agent wait <agent-name> --until done --until blocked --timeout 120000`.
10. Read the fixer response with `herdr agent read <agent-name> --source recent-unwrapped --lines 120`.
11. If the fixer reaches `blocked`, fails validation, or does not include `WORKTREE_FIX_DONE`, report the failure and do not start a review.
12. If the fixer includes `WORKTREE_FIX_DONE`, close the fixer pane with `herdr pane close <pane-id>`.
13. After the fixer pane closes, run `/worktree-review {ticket-id}` from the spawning agent.
14. Do not create a second worktree for the same source branch. Worktrunk owns the checkout.
15. Record the fixer agent name, pane ID, active `ALIGNMENT_ROOT`, and storage mode in the workflow record.

# Output

Report the source branch, worktree path, fixer agent, pane ID, handoff path, validation command, fixer completion marker, pane close result, and review command result.

UserRequest: $ARGUMENTS
