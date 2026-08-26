# tempomat (Herdr plugin)

Auto start, pause, resume, and stop [Tempomat](https://github.com/szymonkozak/tempomat)
time trackers from the pane you focus in Herdr. No manual `tempo start` /
`tempo stop` needed for work that matches your rules.

## Requirements

- `tempo setup` already run (Atlassian + Tempo API tokens configured).
- [Bun](https://bun.sh) 1.3 or newer. Built on the [Crust](https://crustjs.com)
  CLI framework (`@crustjs/core`, `@crustjs/plugins`).

## How it works

On every `pane.focused` event, the plugin reads the focused pane's title,
its tab label, its cwd, and its foreground cwd, and checks them against your
rules (first match wins):

- `ticket_pattern`: a regex searched across those four sources. The match
  (or its named group `issue`) becomes the Tempo issue key.
- `path_glob`: a glob matched against cwd/foreground_cwd. Requires an
  explicit `issue`, since a path carries no ticket key.

State transitions:

| Focused pane... | Action |
|---|---|
| Matches issue X, nothing tracked yet | `tempo tracker:start X` |
| Matches the issue already tracked | no-op (or `tracker:resume` if paused) |
| Matches a different issue Y | `tracker:stop` the old one, `tracker:start Y` |
| Matches nothing | `tracker:pause` the current tracker |
| Stays unmatched past `grace_period_seconds` | `tracker:stop` (worklog written) |

Pane close, tab close, and workspace close are treated the same as an
unmatched focus, so a tracker left running in a closed pane still gets its
grace period and eventually gets flushed — including on Herdr restart, via
the plugin's startup hook.

## Setup

1. Link the plugin from this repo:
   ```sh
   herdr plugin link /home/zenobius/Projects/dotfiles/shells/files/herdr/plugins/local/tempomat
   ```
   The plugin's `[[build]]` step runs `bun install` to fetch `@crustjs/core`
   and `@crustjs/plugins` into the plugin directory.
2. Find your config directory:
   ```sh
   herdr plugin config-dir tempomat
   ```
3. Copy `rules.example.toml` to `rules.toml` in that directory and edit your
   rules.
4. Leave `live = false` at first. Work for a while, then inspect
   `dry-run.log` in the plugin's state directory (printed by
   `herdr plugin log list --plugin tempomat --limit 20` on error, or found
   next to `state.json` under Herdr's plugin state root) to confirm the
   matched issues and transitions look right.
5. Set `live = true` in `rules.toml` once you trust it.

## Actions

```sh
herdr plugin action invoke tempomat.status      # show current issue/state/live flag
herdr plugin action invoke tempomat.stop        # force-finalize now, skip the grace period
```

## Troubleshooting

```sh
herdr plugin list --plugin tempomat --json
herdr plugin log list --plugin tempomat --limit 20
```

A rule pattern that never matches produces no trackers at all — check
`tempomat.status` first, then confirm your regex/glob against the pane's
actual title/cwd with `herdr pane get <pane_id>`.
