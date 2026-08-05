---
description: Start a Herdr Pi agent to fix blocking review findings in an existing Worktrunk worktree.
---

Fix the blocking findings for `UserRequest` in the existing reviewed worktree.

# Preconditions

- Require `HERDR_ENV=1`. If Herdr is not active, stop.
- Use the `worktrunk` skill. Worktrunk is required for worktree inspection and operations.
- Use Herdr commands for panes and agents. Do not use Zellij commands.
- Require a matching persisted `FAILURE` verdict from `worktree-review`.
- Do not create a second worktree for the same source branch.

# Process

1. Identify the source branch, worktree path, review artifact, and blocking findings from `UserRequest` or the persisted workflow record.
2. Use Worktrunk to verify that the source worktree exists and that the branch is correct.
3. Write `/tmp/{ticket-id}-fix-handoff.md` with only the blocking findings, exact files, source worktree path, and expected validation command.
4. Create a sibling Herdr pane in the existing worktree workspace with `herdr pane split --current --cwd <worktree-path> --no-focus`.
5. Start a named Pi agent in the returned pane with `herdr agent start <name> --kind pi --pane <pane-id> -- @/tmp/{ticket-id}-fix-handoff.md`.
6. Do not create a tab or worktree. Herdr already owns the layout, and Worktrunk already owns the checkout.
7. Record the fixer agent name and pane ID in the workflow record.

# Output

Report the source branch, worktree path, fixer agent, pane ID, handoff path, and validation command.

UserRequest: $ARGUMENTS
