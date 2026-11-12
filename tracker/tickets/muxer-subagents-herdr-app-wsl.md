---
schema: "tracker-ticket/v1"
id: "muxer-subagents-herdr-app-wsl"
title: "Spawn herdr-app child agents from a WSL terminal"
type: "bug"
triage: "ready-for-agent"
work_status: "implemented"
blocked_by: []
---

## What to build

On 2026-11-12, a Claude session in a WSL terminal of the Windows Herdr-app window tried to spawn a child agent. The router detected `herdr-app` from `HC_TERMINAL_ID=t8`. The spawn then failed with:

> Could not spawn child agent: Executable not found in $PATH: "herdr-app"

`hc` is installed in `~/.local/bin`. The `herdr-app` command is not on the WSL `PATH`, because the app runs on the Windows host.

Make the router find the app command in this setup, or stop before the spawn with an error that names the fix.

## Question

How does a WSL terminal reach the Windows `herdr-app` command? Check Windows interop (`herdr-app.exe`), a configured path, and whether `hc` alone can open a tab in an app space.

## Acceptance criteria

- [ ] The router finds the app command through one documented method: a configured path, `herdr-app.exe` through interop, or an `hc` equivalent.
- [ ] If no method works, the `contracts` output reports the problem before a spawn, and the error names the fix.
- [ ] The herdr-app muxer contract documents WSL behaviour.
- [ ] A real spawn from a WSL terminal opens a fresh tab in the target space.

## Comments

- 2026-11-12, S: Answer to the question. The Windows `herdr-app.exe` works from WSL through interop. The app reports the WSL session as machine `wsl-docker` and prefixes its addresses (`wsl-docker/t8`). `hc` alone cannot open a tab in an app space. Fixed in `af1207db`: the router finds the app through `HERDR_APP_BIN`, `herdr-app`, or `herdr-app.exe`, matches the prefixed parent address, places the child on the parent's machine, and strips the prefix for local `hc`. 39 tests pass. A real spawn into the `wsl-docker` space for `reckonone-monorepo` opened a fresh tab, `wait` returned `completed`, and the smoke terminal was removed. This session did the work directly on `master`, without a worktree or an independent review. Status is `implemented`, not `completed`. Open: where to set `HERDR_APP_BIN` permanently.
