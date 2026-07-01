# Hooks reference

This document describes the current `pi-hooks` behavior as implemented in this repository.

## Contents

- [Hook file shape](#hook-file-shape)
- [`/hooks` command autocomplete](#hooks-command-autocomplete)
- [Optional `user_bash` interception](#optional-user_bash-interception)
- [`imports`](#imports)
- [Hook fields](#hook-fields)
- [Path conditions](#path-conditions)
- [Actions](#actions)
- [Bash environment variables](#bash-environment-variables)
- [PI compatibility smoke-check checklist](#pi-compatibility-smoke-check-checklist)
- [Unsupported and advisory cases](#unsupported-and-advisory-cases)
- [Debug logging](#debug-logging)

## Hook file shape

A hook file must parse to an object with a top-level `hooks:` array. It may also define an optional top-level `imports:` array.

```yaml
imports:
  - ./hooks.d
  - my-shared-hooks

hooks:
  - id: example
    event: session.idle
    scope: all
    runIn: current
    conditions:
      - matchesCodeFiles
    actions:
      - notify: "Done"
```

Each action entry must define exactly one action key.

## `/hooks` command autocomplete

On PI versions that expose `ctx.ui.addAutocompleteProvider`, `pi-hooks` registers a guarded autocomplete provider for the built-in `/hooks-*` commands in the TUI editor (`ctx.mode === "tui"`, or older SDKs with no `mode`). The provider is capability-detected at runtime, so RPC/headless contexts and older supported PI versions continue to load without this TUI-only feature.

Autocomplete suggestions are deterministic and intentionally lightweight: command names are static; event names use the supported event list; config paths and the current log path are resolved when the provider builds suggestions. Hook ID suggestions are loaded lazily from the current global/project snapshot and memoized by snapshot signature, so edits to root or imported hook files refresh suggestions after the next snapshot change.

Useful completions include:

- `/hooks-status`, `/hooks-validate`, `/hooks-trust`, `/hooks-reload`, `/hooks-tail-log`
- loaded hook IDs such as `audit-write`
- event names such as `session.idle`, `tool.before.bash`, and `tool.after.write`
- global and project hook config paths
- the resolved log path and a ready-to-run `tail -F` command produced by `/hooks-tail-log`

## Agent-start awareness

At agent start, `pi-hooks` appends a short hook-awareness note to the system prompt. It summarizes the loaded hook count, current project trust state, and the main PI-specific limitations that matter while authoring or debugging hooks.

This prompt injection is part of the current compatibility surface for Pi 0.79 and the package's Pi host peer metadata (`*`) on the `@earendil-works` scope.

Set `PI_YAML_HOOKS_PROMPT_AWARENESS=0` to disable this prompt injection.

## Optional `user_bash` interception

Set `PI_YAML_HOOKS_ENABLE_USER_BASH=1` to run human `!` / `!!` shell commands through `tool.before.bash` hooks before PI executes them.

- this mode is opt-in and disabled by default
- it applies only pre-bash safety hooks
- it does not synthesize `tool.after.*` or `file.changed` for `user_bash`
- headless confirm behavior stays fail-closed

Enabling this feature expands the trust surface: hooks in trusted projects can observe, block, and potentially exfiltrate the typed command text. See [What trust grants when user_bash is enabled](../README.md#what-trust-grants-when-user_bash-is-enabled) in the main README for a full breakdown of the risks.

## `imports`

`imports` composes hook files before the current file's own hooks are merged.

- imports load before local hooks
- import order is preserved
- directory imports expand files in lexical order, but only `*.yaml` / `*.yml` entries are loaded; dotfiles (e.g. `.DS_Store`) and other extensions are skipped
- package imports (bare specifiers like `hook-pack`) use Node module resolution from the importing file, but are **disabled by default**; set `PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS=1` to opt in
- imports declared inside the **global** `hooks.yaml` are **refused by default**; set `PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS=1` to opt in
- imports declared inside a **project** `hooks.yaml` whose target (after symlink resolution) falls outside the project's trust anchor are **refused by default**; set `PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR=1` to opt in
- duplicate imports are skipped by canonical path
- cycles and missing imports produce load errors
- import recursion is bounded at depth 32; deeper chains fail with `invalid_imports`
- imported files inherit the importing root scope (`global` or `project`)

### Trust expansion

Trust on PI is anchored at the repo or worktree anchor, not at every imported file. Once that anchor is trusted, all of the project root's `imports:` are loaded transitively under that same trust decision. Three safety rails keep that expansion narrow:

1. The global hooks file (which always loads) cannot pull in additional files unless `PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS=1` is set, so a global hook cannot silently extend its own footprint.
2. Bare-specifier imports that resolve through `node_modules` are gated behind `PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS=1`, so an arbitrary npm dependency cannot register hooks just by being installed.
3. Project imports cannot escape the project's trust anchor (its repo or worktree anchor, or the discovered project root). The check follows symlinks, so a link that lives inside the project but points outside is still refused. Set `PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR=1` to opt in.

All three gates fail closed with a `[PIYAMLHOOKS]` error message so operators see exactly which import was refused and which env var to set. When an import bypass env var is enabled, `pi-hooks` emits a one-time warning naming the affected trust boundary.

## Load order and precedence

`pi-hooks` discovers at most:

- one global root hook file
- one trusted project root hook file

The order is always:

1. global imports, then global root hooks
2. project imports, then project root hooks

Without overrides, hooks from both files stay active.

## Hook fields

| Field | Required | Type | Exact behavior |
|---|---|---|---|
| `id` | no | string | Stable hook name used by later-file overrides. Strongly recommended for any hook you may replace or disable later. |
| `event` | yes | string | One of the supported hook events listed below. |
| `actions` | yes | array | Non-empty list of action objects. Actions run in order. |
| `action` | no | `stop` | Accepted only on `tool.before.*` hooks. On PI it does not add much beyond the normal pre-tool block behavior. |
| `conditions` | no | array | Additional filters. All conditions must pass. |
| `scope` | no | `all`, `main`, `child` | Filters which session lineage the hook itself runs in. Defaults to `all`. |
| `runIn` | no | `current`, `main` | Compatibility field for action targeting. Defaults to `current`. On PI, non-`bash` actions (i.e. `tool`, `notify`, `confirm`, `setStatus`) with `runIn: main` are rejected at load time and the hook is dropped. See the PI-specific notes below before relying on it. |
| `async` | no | boolean or object | Queues the hook for background execution. `true` keeps serialized per-event behavior. `{ group?, concurrency? }` lets hooks share a named async queue with optional bounded concurrency. Only allowed on non-`tool.before` hooks, not on `session.idle`, and only for `bash`-only hooks. |
| `override` | no | string | Replaces a previously loaded hook with the given `id`. |
| `disable` | no | boolean | When used with `override`, removes the targeted earlier hook instead of replacing it. |

## Supported events

### Tool events

| Event | When it fires | Can block? |
|---|---|---|
| `tool.before.*` | Before every tool call | yes |
| `tool.before.<name>` | Before a specific tool call | yes |
| `tool.after.*` | After every tool call | no |
| `tool.after.<name>` | After a specific tool call | no |

On stock PI, built-in tool names are:

- `bash`
- `read`
- `edit`
- `write`
- `grep`
- `find`
- `ls`

Custom tool names can also match if the host emits them.

### Session and file events

| Event | When it fires | Notes |
|---|---|---|
| `file.changed` | After recognized file mutations | Synthesized by `pi-hooks`; see below for exact sources |
| `session.created` | On PI startup or a genuinely new session | Does not fire on resume, reload, or fork re-entry |
| `session.idle` | When the agent loop ends and there are no pending messages | Includes accumulated file changes since the last successful idle dispatch |
| `session.deleted` | On shutdown and before session switches | Best-effort and lossy by design; PI may provide a `reason` (`quit`, `reload`, `new`, `resume`, or `fork`), which is forwarded on the envelope when available |

### Exact `file.changed` behavior

`file.changed` is synthesized from the tool result payload.

On stock PI, `pi-hooks` can synthesize it from:

- `write`
- `edit`
- `bash`, but only when the command text looks like one of these operations:
  - `rm` or `git rm`
  - `mv` or `git mv`
  - `cp` or `git cp`
  - `touch`
  - `mkdir`

For direct `write` and `edit` tool calls, `pi-hooks` reports the target path as a `modify` change. Recognized `touch`, `cp`, and `mkdir` shell commands are reported as `create` changes for their target paths.

If you install custom tools named `multiedit`, `patch`, or `apply_patch`, the runtime can also synthesize `file.changed` from them.

## Conditions

Conditions are ANDed together. If any condition fails, the hook does not run.

### `matchesCodeFiles`

```yaml
conditions:
  - matchesCodeFiles
```

This passes when at least one known code or config file extension is present in the event's file list.

Practical note:

- it is most useful on `file.changed`, `tool.after.<mutation>`, and `session.idle`
- on events with no file context, it will not match

Path conditions are accepted on these events:

- `file.changed`
- `session.idle`
- `tool.after.*`
- `tool.after.<name>`

For `tool.after.*` and `tool.after.<name>`, path conditions only match when `pi-hooks` can infer changed paths from the tool result. Stock PI path context is available for `write`, `edit`, and recognized mutation-shaped `bash` commands. Non-mutating tools such as `read`, `grep`, `find`, and `ls` have no changed paths, so path conditions on those events do not match.

### `matchesAnyPath`

```yaml
conditions:
  - matchesAnyPath:
      - "src/**/*.ts"
      - "package.json"
```

This passes when any changed path matches any listed glob.

### `matchesAllPaths`

```yaml
conditions:
  - matchesAllPaths:
      - "src/**"
```

This passes when every changed path matches at least one glob in the list.

Important detail: this is an allowlist over paths, not a per-path intersection of all patterns.

If you want an intersection such as "all changed paths are under `src/` and all are `*.ts`", write two separate conditions:

```yaml
conditions:
  - matchesAllPaths: "src/**"
  - matchesAllPaths: "**/*.ts"
```

### Path normalization rules

For path conditions:

- paths inside the current project are matched as project-relative paths like `src/index.ts`
- absolute paths outside the project stay absolute
- path separators are normalized to forward slashes

## Actions

### `bash`

Short form:

```yaml
actions:
  - bash: "echo hi"
```

Long form:

```yaml
actions:
  - bash:
      command: "./script.sh"
      timeout: 15000
```

Exact behavior:

- the command runs through `bash -c`
- default timeout is `60000` ms
- hook context JSON is written to the process stdin
- stdout and stderr are captured up to `PI_YAML_HOOKS_MAX_OUTPUT_BYTES` bytes total per stream buffer, default `1048576`
- on `tool.before.*`, exit code `2` blocks the tool call
- exit code `124` indicates the bash process exceeded its timeout; `127` indicates a spawn error (e.g. `bash` binary missing); both are logged as hook failures but do not block
- other non-zero exits are logged as hook failures but do not block

### `tool`

```yaml
actions:
  - tool:
      name: read
      args:
        path: README.md
```

Exact PI behavior:

- this does not imperatively execute the tool
- it sends a follow-up message into the current PI session saying to use that tool with those arguments
- cross-session targeting is not available on PI

### `notify`

Short form:

```yaml
actions:
  - notify: "Done"
```

Long form:

```yaml
actions:
  - notify:
      text: "Build finished"
      level: success
```

Levels:

- `info`
- `success`
- `warning`
- `error`

On PI, `success` is mapped to `info` because the UI API does not expose a separate success level. Notifications run whenever the current context reports `ctx.hasUI` and exposes `ctx.ui.notify`, including RPC UI contexts in Pi 0.79+; no-UI/headless contexts degrade without throwing.

### `confirm`

```yaml
actions:
  - confirm:
      title: "Run command?"
      message: "Continue?"
```

Exact behavior:

- `message` is required
- `title` is optional; PI uses `Confirm` when omitted
- if the user rejects on a `tool.before.*` hook, the tool call is blocked
- on non-blocking events, rejection does not abort the event and later actions can still run
- confirm runs whenever the current context reports `ctx.hasUI` and exposes `ctx.ui.confirm`, including RPC UI contexts in Pi 0.79+
- in no-UI/headless PI, confirm denies by default unless `PI_YAML_HOOKS_CONFIRM_AUTO_APPROVE=1`

### `setStatus`

Short form:

```yaml
actions:
  - setStatus: "Watching changes"
```

Long form:

```yaml
actions:
  - setStatus:
      text: "Working"
```

Exact behavior:

- this updates a PI status/status-bar slot when the current context reports `ctx.hasUI` and exposes `ctx.ui.setStatus`, including RPC UI contexts in Pi 0.79+
- status entries are keyed per hook as `pi-hooks:<hook-id-or-fallback>@<source-file>`
- when `id` is present, it contributes to a stable per-hook key without colliding with the same id reused in another file
- when `id` is absent, pi-hooks falls back to a deterministic source-location key so hooks in the same file do not collide
- the parser currently requires a non-empty status string

### `command`

```yaml
actions:
  - command: "/something"
```

This is rejected at load time on PI. The hook is dropped from the active hook map.

## `scope` versus `runIn`

These fields do different things.

### `scope`

`scope` filters where the hook itself is allowed to fire.

```yaml
scope: all
scope: main
scope: child
```

Exact behavior:

- `all` means every session
- `main` means only the root session in the current lineage
- `child` means only non-root sessions

### `runIn`

`runIn` is a compatibility field intended to target another session.

```yaml
runIn: current
runIn: main
```

Current PI caveats:

- `runIn: main` on non-`bash` actions is rejected at load time
- `tool:` actions still go to the current session because PI only exposes current-session prompt injection
- `bash` actions currently run with the current event context; do not rely on `runIn` to change the bash process session context

Practical guidance: prefer `scope` for real routing decisions and treat `runIn` as compatibility metadata unless you have verified the exact behavior you want.

## Async hooks

```yaml
- event: tool.after.write
  async: true
  actions:
    - bash: "./slow-hook.sh"
```

Exact rules:

- `async: true` is allowed only for non-`tool.before` hooks
- `async: true` is not allowed on `session.idle`
- `async: true` combined with `action: stop` is rejected at load time; the async queue runs after the dispatch loop has returned, so a stop directive could not block anything
- async hooks must contain only `bash` actions; `command`, `tool`, `notify`, `confirm`, and `setStatus` actions are rejected at load time because they either have no timeout, require the live UI session, or block the agent turn, all of which would stall or misroute the async queue
- `async: true` keeps the legacy serialized `event + session` queue
- `async: { group: <name> }` makes hooks in the same session share a named queue
- `async: { group: <name>, concurrency: N }` allows up to `N` hooks from that named queue to run at once; omit it to keep serialized behavior
- `concurrency` requires `group`, and every hook in the same group must use the same concurrency value

Use async for slow post-processing that should not block the agent turn.

## Overrides and disable behavior

Overrides target hooks that were already loaded earlier.

That means the main supported pattern is:

- define a hook in the global file
- replace or disable it in the project file

### Replace an earlier hook

Global file:

```yaml
hooks:
  - id: idle-message
    event: session.idle
    actions:
      - notify: "Global idle"
```

Project file:

```yaml
hooks:
  - override: idle-message
    event: session.idle
    actions:
      - notify: "Project idle"
```

### Disable an earlier hook

```yaml
hooks:
  - override: idle-message
    disable: true
```

Important detail: overrides resolve against hooks loaded from earlier files. Same-file override entries are not a reliable authoring pattern.

## Bash hook stdin contract

Every `bash` action receives JSON on stdin.

Example shape for a `file.changed` hook:

```json
{
  "session_id": "session-123",
  "event": "file.changed",
  "cwd": "/Users/me/project",
  "files": ["src/index.ts"],
  "changes": [
    {"operation": "modify", "path": "src/index.ts"}
  ],
  "tool_name": "edit",
  "tool_args": {
    "path": "src/index.ts"
  }
}
```

Fields are omitted when unavailable.

`tool_args` is shallow-cloned with sensitive keys (`password`, `token`, `api_key`, `secret`, `authorization`, `auth`, `private_key`, `bearer`) redacted before serialization, and the JSON encoding is capped at 64 KiB. When the cap is exceeded, `tool_args` collapses to a placeholder of the form:

```json
{
  "_pi_hooks_tool_args_truncated": true,
  "_pi_hooks_tool_args_original_byte_length": 123456,
  "_pi_hooks_tool_args_max_byte_length": 65536,
  "note": "<truncated>"
}
```

If the entire stdin payload still exceeds `PI_YAML_HOOKS_MAX_STDIN_BYTES` (default 262144, 256 KiB), large fields are dropped or replaced and a `_pi_hooks_truncated: true` marker is added at the top level.

Change objects use one of these shapes:

```json
{"operation": "create", "path": "..."}
{"operation": "modify", "path": "..."}
{"operation": "delete", "path": "..."}
{"operation": "rename", "fromPath": "old", "toPath": "new"}
```

## Bash environment variables

These environment variables are injected into every `bash` hook:

| Variable | Legacy alias | Meaning |
|---|---|---|
| `PI_PROJECT_DIR` | `OPENCODE_PROJECT_DIR` | Current project directory |
| `PI_WORKTREE_DIR` | `OPENCODE_WORKTREE_DIR` | Git worktree root when resolvable |
| `PI_SESSION_ID` | `OPENCODE_SESSION_ID` | Current session id |
| `PI_GIT_COMMON_DIR` | `OPENCODE_GIT_COMMON_DIR` | Git common dir for worktrees when resolvable |

The process working directory is the current project directory.

By default, bash hooks inherit the full PI process environment for backwards compatibility. Set `PI_YAML_HOOKS_ENV_ALLOWLIST` to a comma-separated list to opt into filtered inheritance. In allowlist mode, only named inherited variables are passed; `PATH` and `HOME` are not special and must be listed explicitly if a hook needs them. The PI/OPENCODE context variables above are always injected.

Async hook lanes are bounded: each lane keeps at most `PI_YAML_HOOKS_ASYNC_MAX_PENDING` pending runs (default `1000`) and drops additional queued runs with a warning. Set `PI_YAML_HOOKS_ASYNC_WATCHDOG_MS` to a positive millisecond value to log a `watchdog_timeout` warning for a still-running async hook; it does not cancel the hook, and the lane remains occupied until it settles.

## PI compatibility smoke-check checklist

Use the repeatable runtime checklist in [`maintaining.md`](./maintaining.md) for real PI verification before widening SDK support or changing session, UI, prompt, command, or tool-event behavior. The local harness lives in [`scripts/smoke/`](../scripts/smoke/) and creates an evidence file for future release updates.

For a real PI 0.79-compatible run, verify these compatibility-sensitive surfaces:

- `before_agent_start` appends the hook-awareness note when `PI_YAML_HOOKS_PROMPT_AWARENESS` is not `0`
- no-UI/headless mode still mentions degraded UI actions in that prompt note, while RPC UI mode can deliver `notify`, `confirm`, and `setStatus` when `ctx.hasUI` is true
- `/hooks-status`, `/hooks-validate`, and `/hooks-reload` work and emit structured diagnostics when PI supports custom messages
- `tool.before.bash`, `tool.after.read`, `tool.after.write`, and synthesized `file.changed` events reach smoke hooks
- `tool:` actions produce a follow-up prompt in the current PI session, not imperative tool execution
- `PI_YAML_HOOKS_ENABLE_USER_BASH=1` routes human `!` / `!!` commands through `tool.before.bash` only
- `/new` triggers lossy cleanup via `session.deleted` and a fresh `session.created`
- `/resume` and `/fork` do not re-fire `session.created` for an existing session re-entry
- `/new`, `/resume`, `/fork`, and `/quit` do not double-run `session.deleted` cleanup when PI emits both `session_before_switch` and `session_shutdown`
- Future PI minor lines (e.g. `0.80.x`) remain gated until `npm run compat:sdk-matrix:future` and the runtime smoke both pass, including the no-builtin-tools check

## Unsupported and advisory cases

| Case | Behavior |
|---|---|
| `command:` action | hard load error; hook is dropped |
| `runIn: main` with `tool:`, `notify:`, `confirm:`, or `setStatus:` | hard load error; hook is dropped |
| `tool.before.multiedit`, `tool.before.patch`, `tool.before.apply_patch` without matching custom tools | advisory only; they will not fire on stock PI |
| `session.deleted` | supported but lossy |
| `confirm:` in headless mode | deny by default |

## Debug logging

When you start PI with:

```bash
PI_YAML_HOOKS_DEBUG=1 pi
```

`pi-hooks` writes persistent NDJSON logs to:

```text
~/.pi/agent/logs/pi-hooks.ndjson
```

For the full environment-variable reference (debug logging, log level, log file, stderr mirroring, and other knobs), see [`setup.md`](./setup.md#environment-variables). The easiest way to inspect the log is:

```bash
./scripts/tail-hook-log.sh
```

For focused debugging, filter by hook or event:

```bash
./scripts/tail-hook-log.sh --hook load-writer-skill-when-markdown-changes
./scripts/tail-hook-log.sh --event session.idle
```

## Best next steps

- For installation and trust: [`setup.md`](./setup.md)
- For authoring advice: [`agent-authoring-guide.md`](./agent-authoring-guide.md)
- For copy-paste snippets: [`examples/`](./examples/)
