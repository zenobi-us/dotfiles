# Muxer contract: herdr

## Detection

`HERDR_ENV=1` is set. This is the only muxer with a confirmed self-identifying signal today.

## Worktree awareness

Herdr is worktree-native. Use its own worktree commands. Do not open a plain pane and `cd` by hand.

- Resolve the current worktree: `herdr worktree list --cwd "$PWD" --json`
- Open a worktree in its own space: `herdr worktree open <worktree-path>`

## Opening a pane for an agent

1. If the current Herdr space is not the target worktree space, run `herdr worktree open <worktree-path>`. Start the agent in the returned worktree space and root pane.
2. If the current Herdr space already is the target worktree space, create a new tab instead: `herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd <worktree-path> --no-focus`. Start the agent in the returned tab's root pane.
3. Start the agent: `herdr agent start <name> --kind <agent-kind> --pane <pane-id> -- @<handoff-file>`.
4. Wait for completion: `herdr agent wait <agent-name> --until done --until blocked --timeout <ms>`.
5. Read its output: `herdr agent read <agent-name> --source recent-unwrapped --lines 120`.
6. Close the pane when done: `herdr pane close <pane-id>`.

`<agent-kind>` MUST match one of `references/agents/*.md` (`claude`, `pi`; `zot` has no detection signal — pass it explicitly).

## Do not

- Do not use `git worktree` directly. Worktrunk (`wt`) creates and removes the worktree; Herdr only opens a pane onto its path.
- Do not use Zellij commands inside a Herdr session.
