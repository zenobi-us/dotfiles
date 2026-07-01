# pi-hooks

Run `bash` around PI tool calls, block risky commands, and post UI notifications, confirmations, and status entries from one `hooks.yaml` file. `pi-hooks` plugs into the [PI coding agent](https://www.npmjs.com/package/@earendil-works/pi-coding-agent) as a package; nothing else to wire up.

This repo is the PI port of [OpenCode-Hooks](https://github.com/KristjanPikhof/OpenCode-Hooks). The hook model is familiar; the runtime is PI-native and the limits are explicit.

## What it does

- Run hooks on `tool.before.*`, `tool.after.*`, `file.changed`, `session.created`, `session.idle`, and `session.deleted`
- Use `bash`, `tool`, `notify`, `confirm`, and `setStatus` actions
- Filter hooks with `matchesCodeFiles`, `matchesAnyPath`, and `matchesAllPaths`
- Load one global root config and one trusted project root config; imports are gated by trust and opt-in env vars
- Show built-in diagnostics with `/hooks-status`, `/hooks-validate`, `/hooks-trust`, `/hooks-reload`, and `/hooks-tail-log`
- Emit structured in-session diagnostics when PI supports custom messages
- Inject a short hook-awareness note before agent start (disable with `PI_YAML_HOOKS_PROMPT_AWARENESS=0`)

## Quick start

Create a minimal global hook file so you can see the extension working right away.

```bash
pi install npm:pi-hooks

mkdir -p ~/.pi/agent/hook
cat > ~/.pi/agent/hook/hooks.yaml <<'YAML'
hooks:
  - event: session.idle
    actions:
      - notify: "Agent is idle"
YAML

pi
```

Expected startup output:

```text
[pi-hooks] Loaded 1 hook (global: 1, project: 0).
```

If a trusted project also has project hooks, the summary includes both scopes:

```text
[pi-hooks] Loaded 3 hooks (global: 1, project: 2).
```

## Requirements

- macOS or Linux
- Node.js `>=22.19.0`
- `bash` on `$PATH` (override with `PI_YAML_HOOKS_BASH_EXECUTABLE`)
- `@earendil-works/pi-coding-agent 0.79.x`

Windows is unsupported.

## Install

The full install reference, including settings.json edits, project-local installs, npm-library import paths, and local-checkout symlinks, lives in [`docs/setup.md`](./docs/setup.md). The short version:

```bash
pi install npm:pi-hooks         # recommended
pi install https://github.com/KristjanPikhof/pi-hooks   # latest unreleased
pi -e npm:pi-hooks               # one-off run, nothing written to settings
```

Add `-l` to `pi install` to write to project settings (`.pi/settings.json`) instead of global (`~/.pi/agent/settings.json`).

### SDK compatibility matrix

Before widening PI peer support or merging SDK-sensitive changes, run the repeatable SDK matrix:

```bash
npm run compat:sdk-matrix
```

The matrix checks both the legacy 0.74.0 SDK floor and the current Pi 0.79.3 SDK pair (`@earendil-works/pi-coding-agent` and `@earendil-works/pi-tui`). It creates a temporary copy of the repository, installs each SDK pair in that copy only, then runs `npm run typecheck` and `npm run test:internal` so tool/lifecycle/runtime behavior is exercised. The working checkout's `package.json`, `package-lock.json`, and normal `node_modules` are not mutated.

`npm test` remains a consumer-facing no-op; use `npm run test:internal` directly in the working checkout for full validation.

To preview the matrix workflow without installing anything:

```bash
npm run compat:sdk-matrix:dry-run
```

Runtime PI behavior also has a smoke checklist for surfaces unit tests cannot fully emulate, including slash commands, custom diagnostics, UI actions, follow-up prompts, `user_bash`, session switching, and `/quit`:

```bash
scripts/smoke/pi-runtime-smoke.sh
```

Maintainer-facing details, including the smoke checklist, evidence template, and gating rules, live in [`docs/maintaining.md`](./docs/maintaining.md). Keep the generated evidence file with release notes or SDK-widening PRs.

Future SDK lines (`0.80.x` and later) are gated. Try them explicitly with:

```bash
npm run compat:sdk-matrix:future
```

Do not change compatibility claims until both the future matrix and the runtime smoke pass, including the no-builtin-tools gate.

## How it works

`pi-hooks` discovers at most one global root config and one project root config. Project hooks and project-root imports load only when the repo or worktree anchor is trusted by pi-hooks (`/hooks-trust`, `trusted-projects.json`, or `PI_YAML_HOOKS_TRUST_PROJECT=1`). This hook trust is separate from Pi's project package trust and is not activated by Pi project trust alone. Global-root imports require `PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS=1`, package imports require `PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS=1`, and project imports outside the trust anchor require `PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR=1`. The project root is repo/worktree-aware, not exact-cwd-only.

When an event matches, `pi-hooks` evaluates conditions and runs the configured actions. `bash` actions receive hook context JSON on stdin plus injected `PI_*` environment variables such as `PI_PROJECT_DIR`, `PI_WORKTREE_DIR`, `PI_SESSION_ID`, and `PI_GIT_COMMON_DIR`. At agent start, the extension also appends a short hook-awareness note to the system prompt so PI has the current hook and trust context while it works.

## Native PI surface

### Events

| Event | Meaning |
|---|---|
| `tool.before.*` | Before a tool call |
| `tool.after.*` | After a tool call |
| `file.changed` | Synthesized after recognized file mutations |
| `session.created` | PI startup or a genuinely new session |
| `session.idle` | Agent turn finished and no messages are pending |
| `session.deleted` | Best-effort cleanup on shutdown or session switch; includes PI's reason (`quit`, `reload`, `new`, `resume`, or `fork`) when available |

### Actions

| Action | PI behavior |
|---|---|
| `bash` | Runs a shell command with injected context |
| `tool` | Sends a follow-up prompt into the current PI session |
| `notify` | Shows a PI notification when `ctx.hasUI` and the UI method exist, including RPC UI contexts in Pi 0.79+ |
| `confirm` | Shows a confirmation dialog before a tool runs when UI exists; headless/no-UI contexts fail closed |
| `setStatus` | Sets a PI status-bar/status entry keyed to the hook when the UI method exists |

### Slash commands

| Command | What it shows |
|---|---|
| `/hooks-status` | Active hooks, config paths, trust state, and log path |
| `/hooks-validate` | Validation results for active hooks and skipped untrusted project hooks |
| `/hooks-trust` | Adds the current repo/worktree anchor to `~/.pi/agent/trusted-projects.json` |
| `/hooks-reload` | Asks PI to reload extensions; edited hooks also refresh lazily on the next relevant event |
| `/hooks-tail-log` | Log path plus a ready-to-run `tail -F` command; `--follow` starts a detached live tail, and `--path` prints only the path |

`/hooks-status`, `/hooks-validate`, and hook-load validation errors also emit structured in-session diagnostics when PI supports custom messages.

PI exposes `ctx.ui.addAutocompleteProvider` in the TUI editor, so `pi-hooks` layers guarded `/hooks` autocomplete only when `ctx.mode` is `"tui"` (or absent on older SDKs) and the method exists. Suggestions include the command names plus contextual hook IDs, event names, config paths, and log-tail options where useful. Hook IDs are loaded lazily and memoized by hook-snapshot signature, not fixed at extension registration time.

## Important limitations

These are the PI-specific constraints that matter most:

- `command:` actions are unsupported on PI and are rejected at load time
- `tool:` is prompt injection, not imperative tool execution
- `action: stop` only has real effect on `tool.before.*`
- `runIn: main` is unsupported for non-`bash` actions
- `session.deleted` is best-effort and intentionally lossy: PI fires it for shutdown and for session switches like `/new`, `/resume`, and `/fork`, and `pi-hooks` forwards PI's `reason` (`quit`, `reload`, `new`, `resume`, or `fork`) on the envelope so hooks can disambiguate
- `user_bash` interception is opt-in with `PI_YAML_HOOKS_ENABLE_USER_BASH=1`

Keep those rules in mind when authoring hooks. They explain most surprising behavior.

### What trust grants when user_bash is enabled

When `PI_YAML_HOOKS_ENABLE_USER_BASH=1` is set, every human `!` / `!!` shell command typed in PI is routed through `tool.before.bash` hooks before PI executes it. This expands the trust surface significantly:

- **Observation**: hooks receive the typed command in stdin JSON as `tool_args.command`, so a trusted-project bash hook can read the full text of every command you type.
- **Blocking**: a `tool.before.bash` hook that exits with code `2` will prevent the command from running. A misconfigured or malicious hook can silently block commands.
- **Exfiltration risk**: the same bash hook can forward `tool_args.command` to an external service. Only enable `PI_YAML_HOOKS_ENABLE_USER_BASH=1` if you trust every hook in every trusted project.

`pi-hooks` emits a one-time stderr warning on startup listing which trusted projects will have access when this env var is set, and shows a PI UI warning on the first intercepted command when a UI is available. The warning fires once per process and names the projects currently in `~/.pi/agent/trusted-projects.json`.

This mode is disabled by default. Agent-generated `bash` tool calls are always intercepted regardless of this setting.

## Config paths and trust

Global root config paths:

1. `~/.pi/agent/hook/hooks.yaml`
2. `~/.pi/agent/hooks.yaml`

Project root config paths:

1. `<project>/.pi/hook/hooks.yaml`
2. `<project>/.pi/hooks.yaml`

Project hooks are gated by trust because they can run arbitrary `bash` with your user permissions. Trust is evaluated against the repo or worktree anchor, not an arbitrary nested directory string. `trusted-projects.json` entries must be absolute paths; relative entries such as `.` are ignored.

Two ways to trust a project:

```bash
PI_YAML_HOOKS_TRUST_PROJECT=1 pi
```

or use the built-in command:

```text
/hooks-trust
```

## Examples

Example workflows live under [`examples/`](./examples/). Start with [`examples/README.md`](./examples/README.md) for complete example packs, including pre-tool developer guards and post-tool developer feedback hooks.

These packs are opt-in examples, not built-in PI features.

## Docs

Full reference and reading order live in [`docs/README.md`](./docs/README.md).

## License

MIT.
