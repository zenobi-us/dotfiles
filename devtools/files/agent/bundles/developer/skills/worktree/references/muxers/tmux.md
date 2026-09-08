# Muxer contract: tmux

## Detection

`$TMUX` is set by tmux itself inside a running session.

## Worktree awareness

tmux has no worktree concept. It has named sessions, which stand in as the "named subspace" for a worktree: one session per branch/worktree, named after the branch.

## Opening a pane for an agent

1. Create the worktree and launch in one step with Worktrunk's own tmux pattern:
   ```bash
   tmux new-session -d -s <branch-name> "wt switch --create <branch-name> -x <agent-cli> -- '<task description>'"
   ```
2. To add a pane to an existing session instead of a new one: `tmux split-window -t <branch-name> -c <worktree-path> '<agent-cli> <args>'`.
3. Read output: `tmux capture-pane -t <branch-name> -p`.
4. Close when done: `tmux kill-session -t <branch-name>`.

`<agent-cli>` MUST match a launch command in `references/agents/*.md`.

## Do not

- Do not use `git worktree` directly. `wt switch --create` inside the `tmux new-session` command is what creates it — Worktrunk still owns creation and removal.
- Do not run this pattern outside an explicit spawn/handoff request — see `worktrunk` skill's "Advanced: Agent Handoffs" for the requirement gate.
