---
description: Fetch a ticket, create a Worktrunk worktree, and start a Pi agent in Herdr.
---

Fetch the ticket from `UserRequest`, create its Worktrunk worktree, and start a new Pi agent in the Herdr worktree workspace.

# Preconditions

- Require `HERDR_ENV=1`. If Herdr is not active, stop.
- Use the `worktrunk` skill. Worktrunk is required for worktree creation and hooks.
- Use Herdr commands for workspaces, panes, and agents. Do not use Zellij commands.

# Process

1. Determine the issue tracker from `UserRequest`.
2. Fetch the ticket details.
   - Jira: use `reading-and-writing-jira-tickets`.
   - GitHub: use `gh issue view`.
3. Mark the ticket as in progress and assign it to me, depending on the tracker:
  - with a status change or,
  - add a label or, 
  - comment indicating that the ticket is being worked on.
4. Choose a safe branch name and the base branch from the repository.
5. Resolve the repository root Herdr workspace with `herdr worktree list --cwd "$PWD" --json`.
6. Use Worktrunk to create or switch to the branch with hooks enabled. Use `--no-cd` and JSON output because the parent Pi process cannot consume shell directory changes.
7. Register the resulting worktree with Herdr by using `herdr worktree open` and the returned worktree path. Do not use native Herdr worktree creation instead of Worktrunk.
8. Write `/tmp/{ticket-id}-handoff.md` with the ticket details, branch, worktree path, requirements, and validation commands.
9. Read the root pane ID from the Herdr worktree-open response.
10. Start Pi in that pane with `herdr agent start <name> --kind pi --pane <pane-id> -- @/tmp/{ticket-id}-handoff.md`.
11. Do not create a duplicate tab or pane after Herdr opens the worktree.
12. Write a persistent workflow record with the ticket, source branch, base branch, worktree path, Herdr workspace ID, agent name, and handoff path.

# Output

Report the ticket, branch, worktree path, Herdr workspace, agent name, and handoff path.

UserRequest: $ARGUMENTS
