---
schema: "tracker-ticket/v1"
id: "muxer-subagents-herdr-app-hc-spawn"
title: "Spawn herdr-app child agents through hc, without the app command"
type: "feature"
triage: "ready-for-agent"
work_status: "claimed"
blocked_by: []
---

## What to build

The herdr-app route in `muxer-subagents` spawns a child agent with the `herdr-app` command. A WSL terminal reaches that command only through Windows interop (`herdr-app.exe`, see `muxer-subagents-herdr-app-wsl`). A remote machine reached over SSH has no app command and no interop. A spawn from that machine fails.

Every terminal in the app window has `hc` (herdr-core). A terminal that `hc` starts appears in the app window when it has the label `herdr.space=<space id>`. The label `herdr.tab=<tab id>` selects the tab. The parent terminal already has both labels (`hc get $HC_TERMINAL_ID --json`).

Make the herdr-app route spawn the child with:

```sh
hc run --bg --cwd <target directory> --label herdr.space=<space id> -- <agent argv>
```

Take the space from the target directory's space, or from the parent's labels when the child runs in the parent's space. Use `hc` to wait for the child and to remove its terminal. Keep the app command only for the steps that `hc` cannot do, for example creating a missing space.

## Question

- Does a labelled `hc run` terminal on an SSH remote open a new tab in the app window, the same as on the local machine?
- Which steps still need the app command? List each one, and the error when the command is absent.

## Acceptance criteria

- [ ] A spawn from an SSH remote terminal opens a fresh tab in the target space, without a `herdr-app` command on that machine.
- [ ] A spawn from a WSL terminal works without `HERDR_APP_BIN` or `herdr-app.exe`.
- [ ] `wait` returns `completed`, and the result delivery context reaches the child, as on the current route.
- [ ] If a step needs the app command and the command is absent, `contracts` reports this before the spawn, and the error names the fix.
- [ ] The herdr-app muxer contract documents the `hc` route and the labels.
- [ ] Tests cover the `hc run` argument list and the space selection.

## Comments
