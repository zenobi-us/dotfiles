# Setup

This guide gets `pi-hooks` installed and gives you a safe place to put `hooks.yaml`.

## Requirements

- macOS or Linux
- Node.js `>= 22.19.0`
- `bash` on `PATH`
- `@earendil-works/pi-coding-agent 0.79.x`

Windows is unsupported because the hook runner expects a POSIX `bash`.

The package follows Pi package guidance by listing Pi host packages as peer dependencies with a `*` range and as dev dependencies for local typechecking only; they are not runtime dependencies. The documented compatibility target is Pi 0.79.x / SDK 0.79.x, with the SDK matrix retaining a legacy 0.74.0 check while it continues to pass.

## Install the extension

`pi-hooks` is installable as a PI package from npm or directly from git. The npm path should be your default unless you are actively editing a local checkout or chasing unreleased changes.

### Recommended: `pi install npm:pi-hooks`

```bash
pi install npm:pi-hooks
```

This pulls the latest published `pi-hooks` from npm. By default it writes to `~/.pi/agent/settings.json`. Add `-l` to install into `.pi/settings.json` for the current project instead.

To install from git instead (e.g. for unreleased changes):

```bash
# SSH
pi install git:git@github.com:KristjanPikhof/pi-hooks

# HTTPS
pi install https://github.com/KristjanPikhof/pi-hooks
```

### Add it through `packages`

If you prefer to edit settings directly, add the npm source to the `packages` array.

**Global**, in `~/.pi/agent/settings.json`:

```json
{
  "packages": [
    "npm:pi-hooks"
  ]
}
```

**Project-local**, in `.pi/settings.json`:

```json
{
  "packages": [
    "npm:pi-hooks"
  ]
}
```

Project settings override global ones. PI auto-installs missing project packages on startup; global packages still need an explicit `pi install`.

### Other install options

| Method | Use when |
|---|---|
| `pi -e npm:pi-hooks` | You want a one-off run without writing settings |
| `pi install git:git@github.com:KristjanPikhof/pi-hooks` | You need unreleased changes from `main` |
| `ln -s "$PWD/extensions/index.ts" ~/.pi/agent/extensions/pi-hooks.ts` | You are editing a local checkout and want PI to load that working tree |
| `<project>/.pi/extensions/pi-hooks.ts` | You want a project-local local-dev install from a checkout |
| `pi -e /path/to/pi-hooks/extensions/index.ts` | One-off local testing from a checkout |

### npm-library import

`pi-hooks` is also published to npm and can be imported directly when you embed it in another tool rather than letting PI manage the install:

```ts
import PiHooks from 'pi-hooks';
import { extensions } from 'pi-hooks/extensions';
import type { HookConfig, BashHookContext } from 'pi-hooks/types';
```

The package exposes:

- `.` to `./dist/index.js` (default export: the PI extension, plus public type re-exports)
- `./types` to the public type surface for type-only imports such as `HookConfig`, `HookEvent`, `SessionDeletedReason`, and `BashHookContext`
- `./extensions` to `./dist/extensions/index.js` (named re-export for the extensions entry-point)
- `./extensions/pi-hooks` to `./dist/extensions/pi-hooks/index.js` (equivalent subpath)

The published `pi.extensions` entry points at `./extensions/index.ts`. PI loads it via [jiti](https://github.com/unjs/jiti), so the TypeScript source loads without compilation. The tarball ships both the compiled `dist/` tree (for `import` consumers) and the `extensions/` and `src/` TypeScript sources (for PI's jiti-backed load). Test files (`*.test.ts`) are excluded.

`npm install pi-hooks` requires Node.js `>= 22.19.0`. When PI installs the package, PI provides the host SDK packages; standalone TypeScript consumers should install compatible `@earendil-works/pi-coding-agent` and `@earendil-works/pi-tui` packages for their build.

## Create your first hook file

The preferred global location is:

```text
~/.pi/agent/hook/hooks.yaml
```

Create it like this:

```bash
mkdir -p ~/.pi/agent/hook
cat > ~/.pi/agent/hook/hooks.yaml <<'YAML'
hooks:
  - id: idle-notify
    event: session.idle
    actions:
      - notify: "Agent is idle"
YAML
```

Then start PI:

```bash
pi
```

You should see a startup summary like:

```text
[pi-hooks] Loaded 1 hook (global: 1, project: 0).
```

## Hook file locations

`pi-hooks` checks at most one global root file and one project root file.

### Global locations

Checked in this order:

1. `~/.pi/agent/hook/hooks.yaml`
2. `~/.pi/agent/hooks.yaml`

Windows is not a supported runtime, even if some internal path discovery code recognizes Windows-style locations.

### Project locations

Checked in this order:

1. `<project>/.pi/hook/hooks.yaml`
2. `<project>/.pi/hooks.yaml`

Within each scope, the first existing path wins.

A root file may declare top-level imports when the relevant gate allows it:

```yaml
imports:
  - ./hooks.d
  - ./base.yaml
  - my-shared-hooks
hooks:
  - event: session.created
    actions:
      - notify: "ready"
```

Import rules:

- project-root imports require the repo or worktree trust anchor to be trusted
- global-root imports require `PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS=1`
- package imports require `PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS=1`
- project imports outside the trust anchor require `PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR=1`
- imports load before the importing file's own hooks
- relative imports resolve from the importing file
- non-relative imports resolve through Node module resolution when package imports are enabled
- directory imports expand files in stable lexical order
- repeated imports are deduped by canonical path
- import cycles and missing imports are load errors
- imported files inherit the root file scope (`global` or `project`)
- trust is still decided only at the discovered project root file

## Trust project hooks

Project hooks can run arbitrary `bash`, so they are disabled by default.

### One-session trust

```bash
PI_YAML_HOOKS_TRUST_PROJECT=1 pi
```

### Persistent trust

Add the absolute repo or worktree trust anchor path to:

```text
~/.pi/agent/trusted-projects.json
```

Example:

```json
[
  "/Users/me/code/my-project"
]
```

If a project hook file exists but the repo or worktree is not trusted by pi-hooks, `pi-hooks` prints a warning once and skips that file. Pi's own project/package trust is separate: trusting a project for Pi package loading does not activate project hooks here. Use `/hooks-trust`, `trusted-projects.json`, or `PI_YAML_HOOKS_TRUST_PROJECT=1` for hook trust.

For nested packages, monorepos, and linked worktrees, `pi-hooks` resolves the nearest project hook root up to the current git worktree root and evaluates hook trust against that repo or worktree anchor, not just the current cwd string.

## How loading works

The load order is:

1. enabled global root file imports, then global root hooks
2. trusted project root file imports, then project root hooks

That means:

- roots and enabled imports can contribute active hooks
- global-root imports are refused with a validation error unless `PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS=1` is set
- package imports are refused with a validation error unless `PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS=1` is set
- project imports outside the trust anchor are refused with a validation error unless `PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR=1` is set
- the project root does not automatically replace the global root
- replacement only happens when the later file uses `override:` against a hook `id`

For exact override behavior, see [`hooks-reference.md`](./hooks-reference.md).

## Hook file reload behavior

`pi-hooks` re-checks discovered hook files on later events. If file size or modification time changes, it reloads the active hook set automatically.

In practice this means:

- edit `hooks.yaml`
- trigger another PI event
- the new hook set is picked up without reinstalling the extension

If reload fails, PI keeps the last known good hook set and logs the parse errors.

## Native `/hooks-*` commands

Once the extension is loaded, PI exposes these helper commands:

- `/hooks-status`: inspect the active hook summary, paths, trust state, and log file
- `/hooks-validate`: validate active hooks and explain whether the project file is valid but untrusted
- `/hooks-trust`: trust the current project without manually editing `trusted-projects.json`
- `/hooks-reload`: asks PI to reload extensions; edited hooks also refresh lazily on the next relevant event, while in-flight hooks finish under the previous config
- `/hooks-tail-log`: show the log file path and a ready-made tail command; pass `--follow` to start a detached live tail, or `--path` to print only the log file path

## Environment variables

This is the canonical environment-variable reference for `pi-hooks`. Other docs link here.

| Variable | Effect |
|---|---|
| `PI_YAML_HOOKS_ENABLE_USER_BASH` | `=1` routes human `!` / `!!` shell commands through `tool.before.bash` hooks |
| `PI_YAML_HOOKS_TRUST_PROJECT` | `=1` temporarily trusts the current project for the session |
| `PI_YAML_HOOKS_PROMPT_AWARENESS` | `=0` disables the hook-awareness note appended to the system prompt |
| `PI_YAML_HOOKS_BASH_EXECUTABLE` | Override the bash executable path |
| `PI_YAML_HOOKS_MAX_OUTPUT_BYTES` | Per-stream stdout/stderr capture cap. Default `1048576` (1 MiB). |
| `PI_YAML_HOOKS_MAX_STDIN_BYTES` | Stdin payload cap to bash hooks. Default `262144` (256 KiB). |
| `PI_YAML_HOOKS_ENV_ALLOWLIST` | Optional comma-separated inherited-env allowlist for bash hooks. When set, only listed inherited variables (for example `PATH,HOME,NPM_TOKEN`) are passed, plus required PI/OPENCODE context variables. |
| `PI_YAML_HOOKS_ASYNC_MAX_PENDING` | Per-lane async hook pending cap. Default `1000`; extra queued runs are dropped with a warning. |
| `PI_YAML_HOOKS_ASYNC_WATCHDOG_MS` | Optional per-run async hook watchdog. When set to a positive integer, a still-running async hook logs a `watchdog_timeout` warning after this many milliseconds; it is not canceled and its lane remains occupied until it settles. |
| `PI_YAML_HOOKS_CONFIRM_AUTO_APPROVE` | `=1` auto-accepts `confirm:` instead of denying in headless mode (testing only) |
| `PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS` | `=1` allows top-level `imports:` in the global root config |
| `PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS` | `=1` allows bare-specifier imports resolved through `node_modules` |
| `PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR` | `=1` allows project imports whose target falls outside the project's trust anchor |
| `PI_YAML_HOOKS_DEBUG` | `=1` enables verbose, persistent NDJSON logging |
| `PI_YAML_HOOKS_LOG_LEVEL` | Set the log level explicitly: `debug`, `info`, `warn`, or `error` |
| `PI_YAML_HOOKS_LOG_FILE` | Override the log file location (default `~/.pi/agent/logs/pi-hooks.ndjson`) |
| `PI_YAML_HOOKS_LOG_MAX_BYTES` | Rotate the structured log file once it exceeds this many bytes (positive integer). Default `10485760` (10 MiB). On rotation the live file is renamed to `<path>.1`, replacing any prior `.1`. |
| `PI_YAML_HOOKS_LOG_STDERR` | `=1` mirrors structured log entries to stderr |

## First troubleshooting steps

1. Check Node: `node --version`
2. Check bash: `which bash`
3. Start PI and look for `[pi-hooks] Loaded ...`
4. If using project hooks, confirm trust is enabled
5. If using UI actions, make sure PI is running with a UI surface

## Maintainer-only checks

The runtime PI smoke checklist and SDK compatibility matrix details live in [`maintaining.md`](./maintaining.md). Skip that file unless you are releasing or widening SDK support.

## Next step

Once the extension loads, continue with [`hooks-reference.md`](./hooks-reference.md) or copy from [`examples/`](./examples/).
