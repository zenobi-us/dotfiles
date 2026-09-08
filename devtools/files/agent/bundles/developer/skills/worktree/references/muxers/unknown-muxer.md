# Muxer contract: unknown-muxer

## Detection

None of `HERDR_ENV`, `$ZELLIJ`, `$TMUX`, or `HRDX` are set, and no `--muxer` override was given. There is no multiplexer to open a pane in — treat this the same whether it means "genuinely no muxer" or "an active muxer this script cannot recognize."

## Worktree awareness

N/A — no muxer to hand a worktree path to. Worktrunk still creates the worktree; nothing opens a separate pane for it.

## Running the agent

Run the agent in the foreground of the current process, in the worktree directory, and wait for it to finish before continuing:

```bash
wt switch --create <branch>
<agent-cli> <args>
```

There is no background pane to poll, no pane ID to close, and no parallel ticket handling. Sequential only.

## Do not

- Do not invent a background/detached run for a muxer that cannot supervise it — a detached process here has no supervisor to report failure or attention.
