# hrdx plugin reference

## Package shape

A plugin package is a directory with:

- `plugin.json`
- An executable `entrypoint`

Use this manifest shape:

```json
{
  "schema": 1,
  "id": "example.hello",
  "version": "1.1.0",
  "entrypoint": "hello.exe",
  "protocol": {"min": 1, "max": 1},
  "requests": ["ui.action.contribute", "ui.notification"],
  "activation": {"markers": [".git"]},
  "config": [{"key": "greeting", "type": "string", "default": "Hello"}],
  "contributes": {
    "actions": [{
      "id": "example.hello.greet",
      "label": "Hello from plugin",
      "targets": ["workspace", "pane"]
    }]
  }
}
```

Declare actions, providers, activation markers, capability requests, and configuration in the manifest. Do not discover them by running the entrypoint.

Activation markers hide actions and providers in workspaces that contain none of the named markers. Configuration values are typed and stored in ordinary hrdx state. Do not store secrets there.

## Approval and runtime

Normal startup does not run plugins. Approve a package, then enable the runtime:

```bash
hrdx plugins approve --package ./path/to/package --trust \
  --grant ui.action.contribute \
  --grant ui.notification
hrdx --plugins
```

Use these commands for inspection and lifecycle control:

```text
hrdx plugins list
hrdx plugins doctor
hrdx plugins inspect --id ID
hrdx plugins enable --id ID
hrdx plugins disable --id ID
hrdx plugins revoke --id ID
hrdx plugins status --id ID
hrdx plugins start --id ID
hrdx plugins stop --id ID
hrdx plugins restart --id ID
hrdx plugins reload --id ID
```

Approval binds to the package path and content digest. Any package file change requires explicit reapproval. New approvals and changed grants require a restart. A reapproved package at the same path can reload live. The running instance checks approval state every 500 ms.

Approval scope can include `--workspace` or `--instance`. Workspace operations also require a matching scope.

## Grants

| Grant | Allows |
|---|---|
| `ui.action.contribute` | Context-menu actions declared in the manifest |
| `ui.provider.contribute` | Finder search providers |
| `ui.notification` | Transient footer notices with `info` or `error` severity |
| `ui.status.contribute` | A prioritized footer status entry |
| `ui.view.contribute` | Floating or docked plain-text views |
| `ui.view.input` | Keyboard and mouse input to plugin views |
| `workspace.read` | Scoped workspace snapshots and subscriptions |
| `pane.read_metadata` | Scoped pane metadata |
| `pane.read_screen` | Visible plain-text screen content |
| `pane.create` | Durable splits, tabs, or plugin-owned temporary floats |
| `pane.close` | Close panes in scope |
| `pane.send_input` | Bounded, ordered input to panes in scope |
| `workspace.create` | Create workspaces in scope |
| `workspace.close` | Close workspaces in scope |
| `workspace.move` | Change an exact workspace `group_path` |
| `storage.plugin_private` | Quota-limited private key-value storage |
| `host.events.subscribe` | Coalesced `snapshot.changed` events |

Every operation needs its own grant. `group.list` uses `workspace.read`. Workspace operations also need `--workspace` or `--instance` scope.

## Wire protocol

Use newline-delimited JSON on stdin and stdout. Complete the handshake first:

```text
{"type":"hello","plugin":"example.hello","protocol":1}
{"type":"hello_ack","protocol":1,"instance":"...","grants":["ui.notification"],"config":{"greeting":"Hi"}}
{"type":"ready"}
```

Then exchange requests and responses with connection-local IDs:

```text
{"type":"request","id":"7","method":"command.invoke","params":{"action_id":"example.hello.greet","target":"pane"}}
{"type":"response","id":"7","result":{"notification":"Hi from the example plugin"}}
{"type":"request","id":"1","method":"ui.notify","params":{"text":"Done","severity":"info"}}
{"type":"shutdown"}
```

The host caps frames at 256 KiB. Each direction allows 32 calls. Each call has a ten-second deadline. A plugin that floods or stalls is disconnected.

## View startup

Use view grants and the flag below only for view features:

```bash
hrdx plugins approve --package ./path/to/package --trust \
  --grant ui.view.contribute \
  --grant ui.view.input
hrdx --plugins --plugin-views
```

## Safety checks

- Inspect the package before `--trust`.
- Do not request `pane.read_screen` for metadata-only features.
- Do not request `pane.send_input`, `pane.create`, or workspace mutation grants for read-only features.
- Do not put tokens, passwords, or private keys in `--set` configuration.
- Treat the plugin environment as fully trusted because capability grants do not sandbox executable code.
