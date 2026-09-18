# Plan: Migrate skill scripts to Bun

## Goal

Migrate the runnable scripts in the skill bundles from Bash, Node.js, Python, and TypeScript entry points to Bun. Keep the scripts directly runnable after installation.

The target entry-point convention is:

```text
#!/usr/bin/env -S mise x -- bun --install=fallback
```

Use `@crustjs/core` and `@crustjs/plugins` for CLIs with discrete subcommands. Keep single-purpose helpers small and direct when a command router would add no value.

## Scope rules

- Migrate production and operator-facing scripts.
- Migrate test runners to `bun test` where the test is part of the skill's maintained test suite.
- Do not convert GLSL shader libraries into Bun. Keep them as GLSL assets.
- Do not convert shell templates into Bun. Keep templates in their target language, but make any helper used to generate or validate them Bun-based where useful.
- Keep external tools and credentials as explicit runtime prerequisites. Bun replaces the script runtime, not `gh`, `jq`, Graphviz, Godot, Linear, Exa, or Home Assistant.
- Preserve stdout, stderr, exit codes, JSON schemas, file locations, and environment-variable names.

## Shared implementation standard

1. Add or reuse the bundle-level `package.json` dependency on:
   - `@crustjs/core`
   - `@crustjs/plugins`
   - `@types/bun` for TypeScript projects
2. Use the exact `mise x -- bun --install=fallback` shebang on directly executed Bun scripts.
3. Use versioned Crust imports where the bundle already uses them:

   ```ts
   import { Crust } from "@crustjs/core@^0.0.19";
   import { helpPlugin } from "@crustjs/plugins@^0.1.2";
   ```

4. Define one function per subcommand. Keep filesystem, process, API, and formatting work outside the router.
5. Add `helpPlugin()` to every Crust CLI.
6. Prefer Bun APIs for file I/O, subprocesses, tests, and HTTP. Keep `node:` imports only where Bun compatibility is clear and the Node API is needed.
7. Add a `doctor` or `self-test` command for CLIs that depend on external tools or credentials.
8. Add direct-execution smoke tests. Test JSON output, exit codes, missing prerequisites, and paths containing spaces.
9. Update each `SKILL.md` to say to run the script directly. Do not document `node`, `python`, `bash`, or `bun run` for migrated entry points.
10. Validate every executable with `mise x -- bun --check <script>` and execute its `--help` command.

## Migration sequence

### Phase 1 — Shared foundation

- Confirm all bundles have a Bun-aware `package.json`.
- Standardize the Crust version and versioned-import type declarations.
- Add a small shared test convention for direct script invocation.
- Add a repository inventory that records migrated scripts, retained shell templates, and external prerequisites.

### Phase 2 — Existing Bun/Crust examples

Use the existing `worktree`, `shared-context`, and `private-share` CLIs as reference implementations. Extract common patterns only after the three implementations prove stable.

### Phase 3 — Small standalone scripts

Migrate Node.js, Python, and simple Bash scripts that have one clear entry point. Add Crust only where the script has multiple operations.

### Phase 4 — Large shell CLIs

Migrate `github`, `linear`, and `orch` in dependency order. Keep compatibility shims if other skills call the current paths.

### Phase 5 — Test and documentation cleanup

- Convert maintained shell tests to Bun tests where they test migrated code.
- Remove obsolete runtime instructions.
- Run all skill-level smoke tests and dependency checks.

## Per-skill plan

- `agent-core:markdown-preview`
  - Scripts: `scripts/markdown-preview.js`
  - Bun migration: Rename to `.ts` or `.js` under the same path contract. Use `Bun.serve` and preserve the printed URL and long-running server behavior.
  - Crust shape: `preview <file>`, optional `doctor`.
  - Requirements: Bun only. Keep browser opening separate from the server.

- `agent-core:shared-context`
  - Scripts: `scripts/shared-context/cli.ts`, `config.ts`, `lib.ts`, and Bun tests.
  - Bun migration: Keep the current architecture. Use the `mise x -- bun --install=fallback` shebang, named command functions, and direct smoke tests.
  - Crust shape: Existing `report`, `inject`, `files`, `list`, `init`, `migrate`, `anchor`, and `index`; add `doctor`.
  - Requirements: Bun fallback installs Crust dependencies. Calls must run from the target repository.

- `agent-core:writing-skills`
  - Scripts: `scripts/render-graphs.js`
  - Bun migration: Convert to TypeScript. Use Bun file APIs and subprocess execution. Validate Graphviz before rendering.
  - Crust shape: `render <skill>`, `combine <skill>`, `doctor`.
  - Requirements: Graphviz `dot`.

- `developer:atlassian/twg-bench-lite`
  - Scripts: `scripts/benchmark-lite/runner.mjs`, `report-renderer.mjs`
  - Bun migration: Convert to TypeScript. Separate benchmark execution, result validation, and report rendering. Keep `contract.json` as data.
  - Crust shape: `run`, `render`, `validate`, `doctor`.
  - Requirements: TWG benchmark CLI and its configured live environment.

- `developer:browsers/agent-browser`
  - Scripts: `templates/*.sh`
  - Bun migration: Do not translate the templates. Add a Bun generator or validator only if template drift becomes a problem. Generated workflows remain Bash.
  - Crust shape: Optional `validate-template`.
  - Requirements: `agent-browser` CLI when generated scripts run.

- `developer:browsers/firefox-devtools`
  - Scripts: `detailed_analysis.sh`, `test_analysis.sh`, `tests.ts`, `integration.test.ts`
  - Bun migration: Convert analysis shell logic to TypeScript and tests to `bun:test`. Separate protocol connection, page inspection, and report formatting.
  - Crust shape: `analyze`, `test`, `doctor`.
  - Requirements: Firefox remote debugging and its configured endpoint.

- `developer:devtools/writing-reports`
  - Scripts: `scripts/imgsize.ts`, `new-report.ts`, `validate-report.ts`
  - Bun migration: Keep TypeScript. Use the `mise x -- bun --install=fallback` shebang. Add a shared Crust router while preserving the direct script paths as compatibility shims.
  - Crust shape: `new`, `validate`, `imgsize`, `doctor`.
  - Requirements: Bun fallback handles package installation. Run scripts directly.

- `developer:game-dev/cyberpunk-help`
  - Scripts: `get_cp2077_help_context.py`
  - Bun migration: Port discovery to TypeScript with Bun file traversal and JSON APIs. Keep discovery read-only and preserve the output schema.
  - Crust shape: `discover`, `inventory`, `doctor`.
  - Requirements: Access to the local game installation. Nexus lookup remains external.

- `developer:game-dev/godot/project`
  - Scripts: `scripts/session_start.sh`
  - Bun migration: Port session detection and project inspection to TypeScript. Keep Godot invocation as an external subprocess.
  - Crust shape: `start`, `inspect`, `doctor`.
  - Requirements: Godot and a valid Godot project.

- `developer:game-dev/shader-noise`
  - Scripts: `scripts/*.glsl`
  - Bun migration: Do not migrate. These are GLSL source libraries. Add a Bun validator only if reliable shader syntax validation is available.
  - Crust shape: Optional `validate`.
  - Requirements: A Godot or GLSL consumer for runtime verification.

- `developer:game-dev/ttrpg-gm`
  - Scripts: `package.py`
  - Bun migration: Replace the packaging helper with a TypeScript/Bun packager. Use Bun file APIs and deterministic archive or file-copy logic.
  - Crust shape: `package`, `verify`, `doctor`.
  - Requirements: Target skill package layout.

- `developer:worktree`
  - Scripts: `scripts/router.mjs`
  - Bun migration: Use the current script as the reference implementation. Add tests for route matches, overrides, unknown values, and missing playbooks.
  - Crust shape: Existing `detect-muxer`, `detect-agent`, `session-context`, and `route`; add `doctor`.
  - Requirements: Bun fallback. Runtime still depends on muxer and agent environment variables.

- `matt-pocock:diagnosing-bugs`
  - Scripts: `scripts/hitl-loop.template.sh`
  - Bun migration: Do not translate the generated human-interaction template. Add Bun tooling only if a generator or static validator is needed.
  - Crust shape: Optional `validate-template`.
  - Requirements: Generated script remains Bash and requires human input.

- `matt-pocock:wizard`
  - Scripts: `template.sh`
  - Bun migration: Do not translate the wizard template. Generated wizards remain Bash for portability.
  - Crust shape: Optional `validate-template`.
  - Requirements: Generated wizard requires the tools and credentials defined by each procedure.

- `platform:pi-mono/working-with-pi-coding-agent-shared-sessions`
  - Scripts: `scripts/pi-session-gists.sh`
  - Bun migration: Port GitHub gist and session operations to TypeScript. Use `Bun.spawn` for `gh` and parse JSON in-process.
  - Crust shape: `list`, `show`, `delete`, `doctor`.
  - Requirements: `gh` and GitHub authentication.

- `platform:homeassistant/homeassistant-ops`
  - Scripts: `scripts/ha_ops.js`
  - Bun migration: Convert to TypeScript. Use Bun's built-in `fetch` and WebSocket support. Keep the plan/apply/validate safety model.
  - Crust shape: Existing operation groups plus `plan`, `apply`, `validate`, `snapshot`, and `doctor`.
  - Requirements: Bun, `HA_URL`, and `HA_TOKEN`. No npm runtime dependencies.

- `private-share:share-artifacts-privately`
  - Scripts: `scripts/private-share.mjs`, web `validate-sessions-index.mjs`
  - Bun migration: Convert both scripts to TypeScript. Use Bun file APIs and centralize GitHub command execution. Preserve setup, share, self-test, and branch-contract behavior.
  - Crust shape: Existing `setup`, `share`, and `self-test`; add `validate` and `doctor`.
  - Requirements: Bun fallback, `gh`, authentication, a private repository, Pages setup, and the config file.

- `vanilla-green:decider`
  - Scripts: `scripts/decisions`, `scripts/lib/vstack-env.sh`
  - Bun migration: Port decision search, numbering, index updates, and environment loading to TypeScript. Keep JSON output and document paths.
  - Crust shape: `search`, `list`, `next-id`, `create`, `update`, `doctor`.
  - Requirements: Removes Bash 4 and GNU grep requirements. Prefer removing the `jq` dependency as well.

- `vanilla-green:deep-research`
  - Scripts: `scripts/deep-research`
  - Bun migration: Convert to TypeScript and use native `fetch` for Exa. Separate query, report generation, JSON output, validation, and doctor logic.
  - Crust shape: `report`, `json`, `validate`, `doctor`.
  - Requirements: `EXA_API_KEY`; `op` is optional.

- `vanilla-green:github`
  - Scripts: `scripts/github.sh`, commands, libraries, helpers, and tests
  - Bun migration: First implement a typed process and API layer. Then port each command. Keep `gh` as the supported auth and API fallback. Convert tests to `bun:test`.
  - Crust shape: Existing command names as Crust subcommands; add `doctor`.
  - Requirements: Removes Bash and `jq` from the implementation. Still requires authenticated `gh`; `op` remains optional.

- `vanilla-green:linear`
  - Scripts: `scripts/linear.sh`, commands, libraries, and tests
  - Bun migration: Port the GraphQL client, cache, formatters, validation, and commands to TypeScript. Use typed GraphQL helpers and convert shell tests to grouped Bun tests.
  - Crust shape: Nested subcommands for `issues`, `projects`, `comments`, `cache`, `sync`, `auth-check`, and related resources.
  - Requirements: Removes Bash 4 and `jq` requirements. Requires Linear API credentials.

- `vanilla-green:orch`
  - Scripts: `scripts/*`, shell libraries, and tests
  - Bun migration: Migrate after `github`, `linear`, and `project-management`. Keep workflow-state schemas stable. Port waiters, artifact checks, environment handling, and tracker routing.
  - Crust shape: `initialize`, `start`, `fix`, `review`, `submit`, `merge`, `handoff`, and internal command groups.
  - Requirements: Migrated skill CLIs, worktree tools, tracker authentication, and vstack settings.

- `vanilla-green:project-management`
  - Scripts: `scripts/verification-scope` and shell tests
  - Bun migration: Port verification-scope logic to TypeScript. Keep tracker routing abstract. Convert contract tests to Bun tests.
  - Crust shape: `verification-scope`, `doctor`.
  - Requirements: Selected tracker CLI or API context.

- `vanilla-green:second-opinion`
  - Scripts: `scripts/second-opinion`, shell library, and tests
  - Bun migration: Port external AI CLI invocation, JSON recovery, retry handling, and scope gates to TypeScript. Use `Bun.spawn` with bounded timeouts. Convert tests to Bun tests.
  - Crust shape: `review`, `audit`, `challenge`, `quick`, `doctor`.
  - Requirements: Configured external AI CLI and project settings.

## Test plan

### Per-script checks

- `--help` exits 0.
- Unknown subcommands exit non-zero and print useful help.
- Missing required arguments exit non-zero.
- JSON output parses and keeps its existing shape.
- Paths with spaces work.
- The script works when called by absolute path from another directory.
- The script does not depend on the caller's `PATH` for Bun dependencies.

### External prerequisite checks

Each `doctor` command should report:

- Bun and `mise` availability.
- Required external commands.
- Required environment variables, without printing secrets.
- Required files and directories.
- Authentication status where safe.

### Compatibility checks

- Keep old paths as executable shims during one transition cycle.
- Compare old and new stdout, stderr, exit status, and generated files.
- Remove shims only after all skill documentation and callers use the Bun entry points.

## Definition of done

- Every production script has a direct Bun shebang.
- Every multi-command CLI uses Crust subcommands and `helpPlugin`.
- Every migrated CLI has a `doctor` command when external setup exists.
- Existing command names, output contracts, and exit behavior remain compatible.
- Maintained tests run with `bun test`.
- Skill documentation contains no stale invocation instructions.
- The migration inventory marks each script as migrated, intentionally retained, or intentionally excluded.
