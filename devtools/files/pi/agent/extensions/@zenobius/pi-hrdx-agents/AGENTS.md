# Repository instructions

`pi-hrdx-agents` launches Pi child agents in hrdx panes and workspaces.

## Code map

- `pi-extension/subagents/index.ts` — public tools, commands, discovery, lifecycle, and delivery.
- `pi-extension/subagents/hrdx.ts` — hrdx socket client and Git worktree setup.
- `pi-extension/subagents/terminal.ts` — hrdx terminal operations used by the launcher.
- `pi-extension/subagents/launch.ts` — Pi session and process launch.
- `pi-extension/subagents/lifecycle.ts` — process and turn state.
- `pi-extension/subagents/completion.ts` — completion evidence and delivery.

## Rules

- Use hrdx's socket API. Do not add Herdr CLI calls.
- Keep completion sidecars as the primary completion evidence.
- Treat hrdx `busy` as active and `running` as process presence.
- Do not claim reliable blocked-state detection.
- Do not push, merge, or delete worker branches automatically.
- Keep worktrees and session evidence after successful or failed runs.
