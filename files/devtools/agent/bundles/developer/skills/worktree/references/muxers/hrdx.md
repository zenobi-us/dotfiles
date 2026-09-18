# Muxer contract: hrdx

## Detection

`HRDX=1` is set by hrdx for processes running in its panes. Confirmed in `files/devtools/pi/agent/extensions/@zenobius/pi-hrdx-agents/README.md` ("Requirements") and its `pi-extension/subagents/hrdx.ts` (`process.env.HRDX === "1" && hasCommand("hrdx")`). `scripts/router.ts`'s `detectMuxer()` checks the env var only, without the binary check — a false positive would need something else setting `HRDX=1`, which is unlikely.

## Worktree awareness

hrdx has no `worktree` subcommand. It opens workspaces and panes against a `--cwd`. The worktree itself MUST already exist — created by Worktrunk, never by hrdx.

## Opening a pane for an agent

1. Create the worktree first with Worktrunk: `wt switch --create <branch> --no-cd --no-hooks` (or with hooks, per the playbook).
2. Open hrdx against that path. Pick one:
   - No hrdx running: `hrdx --cwd <worktree-path> --agent <harness-kind>`.
   - hrdx already running (the normal case, since `HRDX=1` proves it): use the socket API below. Do not start a second top-level session.
3. `<harness-kind>` is one of hrdx's built-in kinds (`claude`, `codex`, `pi`, `zot`, `shell`) or a custom entry in `harness.json`. Match it to `references/agents/*.md`.
4. Read pane output and pane state through the socket API (`pane.read`, `pane.wait`) rather than guessing from a screen scrape.

## Socket API

A running hrdx serves a control socket next to its state file. Start there for every pane, tab, and workspace action.

| Platform | Socket path |
|---|---|
| Linux | `$XDG_CONFIG_HOME/hrdx/hrdx.sock` (default `~/.config/hrdx/hrdx.sock`) |
| macOS | `~/Library/Application Support/hrdx/hrdx.sock` |
| Windows | `%AppData%\hrdx\hrdx.sock` |

Under WSL the hrdx process runs inside WSL, so its socket is an ordinary Linux socket at the Linux path. A *native Windows* hrdx is a separate case: its socket lives in a different namespace and WSL cannot reach it.

The protocol is newline-delimited JSON. Send one request line, read one response line.

- Request: `{"id": "<any>", "method": "<method>", "params": {...}}`
- Success: `{"id": "...", "result": {...}}`
- Failure: `{"id": "...", "error": {"code": "...", "message": "..."}}`

Error codes: `not_found`, `invalid_params`, `unknown_method`, `timeout`, `error`.

`nc -U` is the shortest client when it exists:

```bash
SOCK="${XDG_CONFIG_HOME:-$HOME/.config}/hrdx/hrdx.sock"
echo '{"id":"1","method":"status"}' | nc -U "$SOCK"
```

`nc -U` is not guaranteed. When it is absent, use Node:

```bash
node --input-type=module -e '
import net from "node:net";
const c = net.createConnection(process.argv[1]);
let buf = "";
c.setTimeout(5000, () => { console.error("timeout"); process.exit(1); });
c.on("error", (e) => { console.error(e.message); process.exit(1); });
c.on("data", (d) => {
  buf += d;
  const nl = buf.indexOf("\n");
  if (nl < 0) return;
  const res = JSON.parse(buf.slice(0, nl));
  if (res.error) { console.error(JSON.stringify(res.error)); process.exit(1); }
  console.log(JSON.stringify(res.result));
  process.exit(0);
});
c.on("connect", () => c.write(process.argv[2] + "\n"));
' "$SOCK" '{"id":"1","method":"status"}'
```

### Methods

| Method | Params | Effect |
|---|---|---|
| `ping` | — | Liveness check. Returns `{"type":"pong"}` |
| `status` | — | Every workspace, tab, and pane, with `pane_id`, `kind`, `running`, `busy` |
| `workspace.create` | `path`, optional `agent` | Open a directory as a workspace. Returns `workspace` and the root `pane_id` |
| `workspace.close` | `workspace` (name **or** path) | Close a workspace |
| `pane.create` | `workspace` (name or path), `kind`, `split` | Add a pane. Returns `pane_id` |
| `pane.send_text` | `pane_id`, `text`, optional `enter` | Type into a pane |
| `pane.read` | `pane_id` | The pane's visible screen as plain text, under `screen` |
| `pane.wait` | `pane_id`, `until` (`idle` or `busy`), optional `timeout_ms` | Block until the pane's agent reaches that state |
| `pane.close` | `pane_id` | Close one pane |
| `events.subscribe` | — | Keep the connection open and push events |

Events pushed after `events.subscribe`: `workspace.created`, `workspace.closed`, `pane.created`, `pane.closed`, `pane.busy_changed`, `menu.action`. Subscribe instead of polling `status` in a loop.

### Pane, tab, and workspace: which call to use

| Goal | Call |
|---|---|
| Pane beside the current one | `pane.create` with `split` `right` or `down` |
| New tab in an existing workspace | `pane.create` with `split` `"tab"` |
| New workspace for a worktree path | `workspace.create` |

`split` accepts `right`, `down`, `tab`, and `float`. With `split: "float"`, `width_pct` and `height_pct` are required integers from 1 through 100, and `anchor` accepts `center` (default), `top`, `bottom`, `left`, or `right`. Floating panes belong to the active tab and are left out of the sidebar and of persisted state.

```bash
# pane beside the current one
{"id":"1","method":"pane.create","params":{"workspace":"<worktree-path>","kind":"shell","split":"right"}}
# new tab
{"id":"2","method":"pane.create","params":{"workspace":"<worktree-path>","kind":"claude","split":"tab"}}
# new workspace
{"id":"3","method":"workspace.create","params":{"path":"<worktree-path>","agent":"claude"}}
```

### Traps

These cost real debugging time. Read them before writing a playbook step.

1. **Pass `workspace` as an absolute path, never a name.** hrdx derives the workspace name from the directory basename and allows duplicates. Two worktrees whose directories share a basename produce two workspaces with the same name. A name that matches more than one workspace resolves to the **first** match with no error, so the pane lands in the wrong worktree silently. Verified: `a/collide` and `b/collide` both opened as `collide`, and `pane.create` with `workspace: "collide"` hit `a/collide`.
2. **`pane.create` has no tab selector.** With `split` `right` or `down` the pane joins the workspace's **active** tab, whichever that is. To target a known tab, create it with `split: "tab"` and keep the returned `pane_id`. Split from that `pane_id`'s workspace only while it stays active, or address the pane directly.
3. **`workspace.close` takes `workspace`, not `path`.** `workspace.create` takes `path`. The keys differ between the two methods. Passing `path` to `workspace.close` fails with `not_found` and the message `workspace "" not found`, which does not name the real problem.
4. **`workspace.create` rejects an already-open path** with code `error` and the message `<path> is already open`. It is not idempotent. Call `status` first and reuse the existing workspace, or treat that message as success.
5. **A `pane_id` is a number.** Send it as a JSON number, not a string.

## Do not

- Do not use `git worktree` directly. Worktrunk owns creation and removal.
- Do not assume hrdx tracks which pane belongs to which worktree — that association lives in the workflow record the playbook writes, not in hrdx state.
- Do not launch `hrdx --cwd ...` when `HRDX=1` is already set. That starts a second top-level session instead of adding to the running one. Use the socket API.
- Do not poll `status` in a loop to wait for an agent. Use `pane.wait`, or `events.subscribe`.
