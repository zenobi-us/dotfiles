# AGENTS.md

Agent contract for `pi-hooks`. Facts only; tutorials in `docs/`.

## Facts

- Runtime: `pi-hooks` PI extension. Type-only `pi-hooks/types` exports `HookConfig`, `HookEvent`, `BashHookContext`, `SessionDeletedReason`; smoke: `src/public-types-smoke.test.ts`.
- Node `>=22.19.0`; macOS/Linux only (`src/pi/register-adapter.ts` guards win32).
- Pi host peers: `@earendil-works/pi-coding-agent` + `@earendil-works/pi-tui` as `*`; dev-tested at `0.79.3`; matrix still covers `0.74.0`.
- No direct `@mariozechner/*` host deps. Transitive `@mariozechner/clipboard` may appear under Pi SDK packages in `package-lock.json`.
- `package-lock.json` is canonical; no bun.lock.

## Structure

- `src/index.ts`: PI entry; registers policy, adapter, commands, autocomplete, diagnostics, prompt support.
- `src/core/`: host-agnostic. `runtime.ts` owns state; `load-hooks.ts` is a barrel; hook loading is in `core/hooks/*`; dispatch/actions/path/async are in `core/runtime/*`. Never import `src/pi/*` or PI SDK types from core.
- `src/pi/`: PI adapter/register/lifecycle/registry, event mappers, commands, autocomplete, diagnostics, prompt, `user_bash`, session lineage, unsupported policy; `adapter.ts` is a barrel.
- `extensions/`: TS entrypoints loaded by PI/jiti; `extensions/index.ts` -> `extensions/pi-hooks/index.ts` -> `src/index.ts`.
- `examples/`: shipped: `pre-tool-developer-guards`, `post-tool-developer-feedback`, `README.md`. Repo-only: `atomic-commit-snapshot-worker`, snapshot helpers; not built-ins.
- `scripts/`: test runner, SDK matrix, tail-log, smoke helpers.
- `dist/`: generated; do not edit. `build`/`build:publish` regenerate extension stubs.

## Runtime contracts

- Built-ins: events `tool.before.*`, `tool.after.*`, `file.changed`, `session.{created,idle,deleted}`; actions `bash`, `tool`, `notify`, `confirm`, `setStatus`; commands `/hooks-{status,validate,trust,reload,tail-log}`.
- Diagnostics use PI custom messages when available; prompt awareness runs at agent start.
- `command:` actions rejected. `tool:` injects a follow-up prompt into the current PI session; it does not execute tools or target other sessions.
- `runIn: main` rejected for non-`bash`; for bash it does not change process/session context. Prefer `scope` for main-vs-child routing.
- `action: stop` only affects `tool.before.*`; `async: true` + `action: stop` rejected at parse time and runtime warns once per source/runtime.
- `session.deleted.reason` is optional opaque string; known PI values include `quit|reload|new|resume|fork`.
- UI actions gate on `ctx.hasUI` + method. RPC may expose UI in Pi 0.79+; no-UI/headless degrades and `confirm` fails closed.
- `/hooks` autocomplete is TUI-only: register only when `ctx.mode === "tui"` or older SDKs omit `mode`, and `ctx.ui.addAutocompleteProvider` exists.
- `user_bash` opt-in: `PI_YAML_HOOKS_ENABLE_USER_BASH=1`.
- `tool_args` redacted by `sanitizeToolArgsForSerialization` before bash stdin (`src/core/runtime/actions.ts`).

## Paths, trust, imports

- Conditions: `matchesCodeFiles` legacy single-file; `matchesAnyPath` / `matchesAllPaths` only on `file.changed`, `session.idle`, `tool.after.*` when paths exist; pathless/non-mutating tools never match.
- Mutation paths come from `src/core/tool-paths.ts`: `write|edit|multiedit|patch|apply_patch|bash`; unknown tools are pathless.
- One global root config + one project root config; project discovery is repo/worktree-aware, not exact-cwd-only.
- Hook trust is separate from Pi package/project trust. Persistent trust: `~/.pi/agent/trusted-projects.json`; entries must be absolute canonical repo/worktree anchors. Shortcuts: `/hooks-trust`, `PI_YAML_HOOKS_TRUST_PROJECT=1`.
- Imports: global-root needs `PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS=1`; package needs `PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS=1`; project imports must stay inside trusted anchor unless `PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR=1`.
- `HookPolicy` (`src/core/types.ts`) plugs host diagnostics into loader; core ships `NOOP_POLICY`; `src/pi/unsupported.ts` sets PI policy.

## Commands

- Setup/deps: `npm install`.
- TS: `npm run typecheck` after TS changes.
- Build: `npm run build` before direct `dist/**/*.test.js`; emits `dist/extensions/*`.
- Full tests: `npm run test:internal` = build + `node scripts/run-tests.mjs`; known flake: `timed out bash hooks kill descendant background processes on POSIX`.
- `npm test` is consumer no-op; not validation. No lint script exists.
- SDK matrix: `npm run compat:sdk-matrix` checks `0.74.0` + `0.79.3` in temp copies with typecheck + internal tests; `:dry-run` prints workflow; `:future` probes `0.80.x` only and does not change claims.
- Override SDK specs: `bash scripts/check-sdk-matrix.sh --versions "0.74.0 0.79.3"`.
- Runtime smoke: `scripts/smoke/pi-runtime-smoke.sh` prepares temp project/evidence and prints manual `pi -e <checkout>/extensions/index.ts`; interactive smoke is still manual.

## Limits, publish, docs

- Key caps: YAML 1 MiB; import/canonicalize depth 32; snapshot LRU 16; runtime registry LRU 8; recursion depth 32; glob LRU 256; pending tool calls 1000 / 5 min TTL/FIFO; `tool_args` 64 KiB; session lineage 64 / depth 64 / header 64 KiB. Check constants/docs before changing limits.
- `prepack` runs clean `build:publish` via `tsconfig.publish.json`. Package contents follow `package.json#files`; update it when adding shipped examples/scripts. `scripts/tail-hook-log.sh` backs `/hooks-tail-log` and is packaged.
- Env vars canonical source: [`docs/setup.md#environment-variables`](docs/setup.md#environment-variables); do not duplicate env tables here.
- Doc rules: built-ins ≠ examples; say `action: stop`, not `behavior: stop`; mark opt-in features; name trust anchors (cwd/project root/repo-worktree anchor); `tool:` docs must say PI receives a follow-up prompt.
- Keep runtime smoke and SDK-widening evidence with release notes/SDK-widening PRs.

## Pitfalls

- Local atomic-commit hook may auto-commit per Edit/Write; expect one commit per edit in this environment.
- Future SDK pass is advisory; widening support also needs runtime smoke evidence for slash commands, custom messages, RPC/TUI UI actions, TUI autocomplete, lifecycle hooks, no-builtin-tools behavior.
- Future matrix may fail on stale session-bound regex wording; inspect `scripts/check-sdk-matrix.sh` before broadening claims.
