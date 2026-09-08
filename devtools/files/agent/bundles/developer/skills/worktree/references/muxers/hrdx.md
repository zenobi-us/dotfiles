# Muxer contract: hrdx

## Detection

`HRDX=1` is set by hrdx for processes running in its panes. Confirmed in `devtools/files/pi/agent/extensions/@zenobius/pi-hrdx-agents/README.md` ("Requirements") and its `pi-extension/subagents/hrdx.ts` (`process.env.HRDX === "1" && hasCommand("hrdx")`). `scripts/detect.mjs`'s `detectMuxer()` checks the env var only, without the binary check — a false positive would need something else setting `HRDX=1`, which is unlikely.

## Worktree awareness

hrdx has no `worktree` subcommand. It opens workspaces and panes against a `--cwd`. The worktree itself MUST already exist — created by Worktrunk, never by hrdx.

## Opening a pane for an agent

1. Create the worktree first with Worktrunk: `wt switch --create <branch> --no-cd --no-hooks` (or with hooks, per the playbook).
2. Open hrdx against that path: `hrdx --cwd <worktree-path> --agent <harness-kind>` for a new session, or use the socket API (`workspace.create`, `pane.create`) from an already-running hrdx to add a pane without a new top-level session.
3. `<harness-kind>` is one of hrdx's built-in kinds (`claude`, `codex`, `pi`, `zot`, `shell`) or a custom entry in `harness.json`. Match it to `references/agents/*.md`.
4. Read pane output and pane state through the socket API (`pane.read`, `pane.busy`) rather than guessing from a screen scrape.

## Do not

- Do not use `git worktree` directly. Worktrunk owns creation and removal.
- Do not assume hrdx tracks which pane belongs to which worktree — that association lives in the workflow record the playbook writes, not in hrdx state.
