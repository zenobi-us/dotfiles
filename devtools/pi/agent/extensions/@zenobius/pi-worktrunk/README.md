# pi-worktrunk

Shows Pi agent activity in the current branch's [Worktrunk](https://worktrunk.dev/) marker. This makes parallel Pi sessions easy to scan with `wt list` without opening every terminal or worktree.

## Status markers

| Pi state | Worktrunk marker |
| --- | --- |
| Session started | 💬 |
| Agent run started | 🤖 |
| Agent run ended | 💬 |
| Session shut down | Marker cleared |

Markers appear in the `Status` column produced by:

```bash
wt list
```

Automatic retries and queued follow-ups switch the marker back to 🤖 when their next agent run starts.

## Requirements

- Pi
- Worktrunk with `wt config state marker` support
- A Git branch managed or discoverable by Worktrunk

Verify Worktrunk support with:

```bash
wt config state marker --help
```

## Enable

Add the package path to Pi's `settings.json`:

```json
{
  "packages": [
    "./packages/pi-worktrunk"
  ]
}
```

For the global settings file, the relative path is resolved from `~/.pi/agent/settings.json`. Restart Pi or run `/reload` after changing settings.

## Behavior on errors

Marker updates are best-effort. If `wt` is missing, rejects the marker command, or exits unsuccessfully, the extension disables further marker updates for that Pi session. Pi continues normally; this avoids repeating a failing subprocess on every agent turn.

Fix Worktrunk, then restart Pi or run `/reload` to re-enable updates.
