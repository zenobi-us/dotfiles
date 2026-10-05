# Muxer contract: zellij

## Detection

`$ZELLIJ` is set by Zellij itself inside a running session.

## Worktree awareness

Zellij has no worktree concept. It has named tabs, which stand in as the "named subspace" for a worktree: one tab per branch/worktree, named after the branch.

## Opening a pane for an agent

1. Create the worktree first with Worktrunk: `wt switch --create <branch> --no-cd --no-hooks`.
2. Open a named tab at that path: `zellij action new-tab --name <branch> --cwd <worktree-path>`.
3. Start the agent inside it, `cd` explicit even with `--cwd` set, since a bare `--cwd` does not guarantee the launched command's working directory:
   ```bash
   zellij action new-pane --cwd <worktree-path> -- sh -c 'cd <worktree-path> && <agent-cli> <args>'
   ```
4. Rename the pane to the agent/ticket name for operator visibility: `zellij action rename-pane <name>`.
5. Close when done: `zellij action close-pane` (run from, or targeted at, that pane).

`<agent-cli>` MUST match a launch command in `references/agents/*.md`.

## Do not

- Do not use `git worktree` directly. Worktrunk owns creation and removal.
- Do not use `--horizontal` (invalid); use `--direction down|right|left|up`.
