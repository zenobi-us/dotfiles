# Assign worktree and agent workspace ownership to separate tools

Accepted. Use Worktrunk to create, switch, merge, and remove worktrees. Use hrdx to manage workspaces and agent panes, and pass absolute worktree paths to hrdx so duplicate workspace names cannot select the wrong worktree.

## Considered Options

- Let hrdx create and manage worktrees.
- Call `git worktree` directly.
- Address hrdx workspaces by name.

We chose separate ownership because it gives each tool one lifecycle responsibility and makes worktree targeting unambiguous.
