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
- Detect the current harness kind for Herdr's `--kind` flag. Never hardcode `claude` or `pi`. Run:
  ```bash
  if [[ -n "${CLAUDE_CODE:-}" || -n "${CLAUDE_PROJECT_DIR:-}" ]]; then echo claude
  elif [[ -n "${CODEX_SANDBOX:-}" ]]; then echo codex
  elif [[ -n "${PI_CODING_AGENT_DIR:-}" ]]; then echo pi
  elif [[ -n "${OPENCODE:-}" ]]; then echo opencode
  else echo claude
  fi
  ```
  This mirrors `detect_current_harness` in the `second-opinion` skill script. Use the result everywhere below as `<harness-kind>`.
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
5. Write `/tmp/{ticket-id}-fix-handoff.md` with only the blocking findings, exact files, source worktree path, active `ALIGNMENT_ROOT` and storage mode, selected engineering skill, relevant context files, and expected validation command.
6. Create a sibling Herdr pane in the existing worktree workspace with `herdr pane split --current --cwd <worktree-path> --no-focus`.
7. Start a named agent of the detected `<harness-kind>` in the returned pane with `herdr agent start <name> --kind <harness-kind> --pane <pane-id> -- @/tmp/{ticket-id}-fix-handoff.md`.
8. Do not create a tab or worktree. Herdr already owns the layout, and Worktrunk already owns the checkout.
9. Record the fixer agent name, pane ID, active `ALIGNMENT_ROOT`, and storage mode in the workflow record.

# Output

Report the source branch, worktree path, fixer agent, pane ID, handoff path, and validation command.

UserRequest: $ARGUMENTS
