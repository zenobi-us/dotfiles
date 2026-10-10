# hrdx socket API reference

## Connection

While hrdx runs, the control API serves newline-delimited JSON on a Unix socket. Disable it with `--api=false`.

The socket normally sits next to the state file. On Linux, hrdx can use `$XDG_RUNTIME_DIR/hrdx/` when the state directory cannot host Unix sockets. The fallback socket is `hrdx-<id>.sock`, where `<id>` is the first 16 hex digits of the SHA-256 hash of the absolute state-file path.

Use a socket path from the running hrdx instance. Do not guess a path when a status or configuration source provides it.

Example:

```bash
SOCK="$XDG_CONFIG_HOME/hrdx/hrdx.sock"
printf '%s\n' '{"id":"1","method":"status"}' | nc -U "$SOCK"
```

Each request has an `id`, a `method`, and optional `params`. Each response uses the same `id`.

## Methods

| Method | Effect |
|---|---|
| `ping` | Returns `pong` |
| `status` | Lists workspaces, tabs, and panes with IDs, kinds, and state |
| `workspace.create` | Opens a directory, optionally in a group |
| `workspace.move` | Changes a workspace group without restarting panes |
| `group.list` | Lists occupied group paths and ancestors |
| `workspace.close` | Closes a workspace by name or path |
| `pane.create` | Adds a pane with `right`, `down`, `tab`, or `float` split |
| `pane.send_text` | Types into a pane and can press Enter |
| `pane.read` | Reads the visible pane screen as plain text |
| `pane.wait` | Waits for an agent to become `idle` or `busy` |
| `pane.close` | Closes a pane by ID |
| `menu.register` | Adds a process-local pane, tab, or sidebar menu item |
| `events.subscribe` | Keeps the connection open and pushes events |
| `plugins.status` | Lists approved plugin lifecycle, grants, scopes, and contributions |
| `plugins.control` | Starts, stops, restarts, or reloads an approved plugin |

## Safe operation order

1. Call `status` before using a workspace or pane ID.
2. Use only the workspaces that the task needs.
3. Use `pane.read` only when the task needs visible screen content.
4. Send input only after the target pane and text are known.
5. Call `pane.wait` before reading output from an agent pipeline.
6. Query `status` after a missed event because events are best-effort.
7. Use `plugins.status` before lifecycle control.

## Workspace groups

Pass `group_path` to `workspace.create` or `workspace.move`:

```json
{"id":"1","method":"workspace.create","params":{"path":"/work/game-feature","agent":"shell","group_path":["game","reviews"]}}
{"id":"2","method":"workspace.move","params":{"workspace":"/work/game-feature","group_path":["game","ready"]}}
{"id":"3","method":"group.list"}
```

Use `[]` for a standalone workspace. Group labels are case-sensitive. They are not filesystem paths. `group_from_git: true` can derive a default group from the primary repository name. An explicit `group_path` takes precedence.

## Events

After `events.subscribe`, hrdx can push these events:

- `workspace.created`
- `workspace.closed`
- `workspace.moved`
- `pane.created`
- `pane.closed`
- `pane.busy_changed`
- `menu.action`

Example event:

```json
{"event":"pane.busy_changed","data":{"pane_id":3,"busy":false}}
```

Events are best-effort. Query `status` or `group.list` after a missed event.

## Floating panes

Create a floating pane with integer `width_pct` and `height_pct` values from 1 through 100:

```json
{"id":"3b","method":"pane.create","params":{"workspace":"api","kind":"shell","split":"float","anchor":"center","width_pct":40,"height_pct":30}}
```

`anchor` accepts `center`, `top`, `bottom`, `left`, or `right`. Floating panes do not change split ratios. They do not appear in the sidebar and are not restored after restart.

## Menu actions

Register an ephemeral menu item with `menu.register`:

```json
{"id":"7","method":"menu.register","params":{"target":"pane","label":"Run linter","action_id":"custom.run_linter"}}
```

Selecting the item emits a best-effort `menu.action` event. The event includes `action_id`, target context, and applicable pane, tab, and workspace data.

## Common errors

- Use `--api=false` only when no socket integration is required.
- Do not use a stale pane ID after closing or restarting a workspace.
- Do not assume events are durable.
- Do not send a plugin method through the control socket unless the method belongs to the documented API.
- Do not confuse the hrdx control socket with the plugin stdin/stdout protocol.
