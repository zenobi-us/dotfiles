# shared-agent-context

Origin-keyed engineering context with per-record storage routes. Alignment,
initiatives, workflows, evidence, and sources can use repository or shared
storage. External tickets stay in their tracker. Each origin uses its
canonicalized git `origin`. The CLI works with pi, OMP, Zot, and Claude Code.

## Why

- Some repos aren't fully under your control, so you either don't want to
  influence other people's agents, or aren't allowed to modify the repo's
  `AGENTS.md`.
- Some repos are part of a larger project or effort, and you want a shared
  `AGENTS.md` that isn't tied to any one repo/clone/worktree.

## Storage location

Configured in `~/.config/shared-agent-context/config.json`:

```json
{ "storage_path": "~/Notes/SharedAgentContext" }
```

Auto-created with that default on first use if missing. Each repo gets its
own subdirectory: `<storage_path>/<slugified-origin>--<hash>/`.

## How it works

On session or agent start, the tool injects a `<shared-agent-context>` XML block
with the alignment root, repository root, origin, and route summary. Skills can
resolve each file-backed record through the CLI. See
[`../matt-pocock/ALIGNMENT-ROOT.md`](../matt-pocock/ALIGNMENT-ROOT.md).

- **pi**: `extensions/pi-shared-context.ts` wires this into
  `before_agent_start` and registers `/eng-context`.
- **OMP**: `hooks/pre/shared-context.ts` resolves context on `session_start` and
  `session_switch`, then extends each `before_agent_start` system prompt.
- **Zot**: `extensions/zot-shared-context.ts` uses Zot's extension protocol,
  including the `before_agent_start` prompt hook, and registers `/eng-context`.
- **Claude Code**: ships as the `shared-agent-context` plugin —
  `hooks/hooks.json` runs `cli.ts inject` on `SessionStart`; the hook wraps
  the generic CLI output in Claude's response shape.

All hosts call the same `lib.ts`/`config.ts` — no duplicated context logic
between tools.

## Running the CLI

Run `scripts/shared-context/cli.ts` directly. Its shebang is
`#!/usr/bin/env -S mise x -- bun --install=fallback`, which starts Bun
through mise and auto-installs `@crustjs/core` and `@crustjs/plugins` when they are
missing. The import specifiers carry their own version ranges for that reason.

Do not call it as `bun run cli.ts`. That skips the shebang, and bun disables
auto-install whenever a `node_modules` directory exists next to the script — even
an empty one, which is what a plugin install leaves behind.

## Usage

`/eng-context` (pi) or `/shared-agent-context:eng-context` (Claude Code)
subcommands:

- `report` (default) — route table, roots, origin, and slug. `mode` is a summary, not a path selector.
- `root` — print the alignment root for scripts.
- `init [--preset hosted-shared]` — create shared instructions and a route manifest.
- `list` — list origin-keyed contexts under the shared base.
- `resolve alignment` — resolve the alignment root.
- `resolve initiative --id <ID>` — resolve one initiative directory.
- `resolve workflow --id <ID>` — resolve one workflow directory.
- `resolve evidence --workflow <ID> --run <ID>` — resolve one evidence directory.
- `resolve source --ticket <ID> --source <name>` — resolve ticket source material.
- `resolve source --library --source <name>` — resolve library source material.
- `resolve ticket --id <ID>` — resolve a local Markdown ticket. External tickets
  must use the tracker skill.
- `resolve <kind> ... --json` — print adapter, store, root, path, stable ref, and publication rule.
- `migrate <kind> --to <store>` — copy only that record kind after conflict checks.
- `migrate --legacy-only` — write a route manifest from the legacy `.storage` preference.
- `doctor` — check Bun, mise, git, and fd prerequisites.
- `index <dir> [--kind <kind> ...] [--force]` — rebuild the managed block of
  `<dir>/index.md` from sibling Markdown frontmatter. `--kind` selects the route
  and accepts the resolver selectors (`--id`, `--workflow`, `--run`, `--ticket`,
  `--source`, `--library`). The CLI rejects targets outside the selected record
  store and targets or inputs that escape through symlinks. Text outside the
  `<!-- shared-context:index start -->` / `<!-- shared-context:index end -->`
  markers is kept. An `index.md` with no markers is refused unless `--force`.

## Route manifest

The origin-scoped shared candidate stores project routes in
`.context-routes.toml`. Machine-local `storage_path` remains in
`~/.config/shared-agent-context/config.json`.

```toml
schema = 2

[records.alignment]
adapter = "markdown"
store = "shared"

[records.tickets]
adapter = "github"

[records.initiatives]
adapter = "markdown"
store = "shared"

[records.workflows]
adapter = "files"
store = "shared"

[records.evidence]
adapter = "files"
store = "inherit:workflows"

[records.sources]
adapter = "files"
store = "inherit:alignment"
```

External ticket adapters have no `store`. Local Markdown tickets set
`adapter = "local-markdown"` and a `store`.

When shared `AGENTS.md` exists, the injected block looks like:

```xml
<shared-agent-context
  storage="shared"
  mode="shared"
  root="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678"
  alignment-root="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678"
  routes="alignment=shared,tickets=github,initiatives=shared,workflows=shared,evidence=workflows-&gt;shared,sources=alignment-&gt;shared"
  shared-root="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678"
  repository-root="/work/repo"
  origin="https://github.com/owner/repo.git"
  slug="github-com-owner-repo--12345678"
  tickets="github"
  initiatives="shared"
  workflows="shared"
  evidence="shared"
  sources="shared"
  source="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678/AGENTS.md">
  <instructions source="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678/AGENTS.md">
    ...XML-escaped instructions...
  </instructions>
</shared-agent-context>
```

Without shared `AGENTS.md`, repository behavior remains active (Claude Code
already loads repository `CLAUDE.md`/`AGENTS.md` natively, so the hook is a
no-op in that case rather than re-injecting it).


## Configurable record layout

Storage routes select **which store** holds each record. Layout selects the relative
directory **inside that selected store**. Neither setting changes the other.

Optionally add `docs/agents/context-layout.toml` under the active alignment root:

```toml
schema = 1

[paths]
tracker = "docs/tracker"
sources = "docs/sources"
```

Without this file, the bases remain `tracker` and `sources`. Only `tracker` and
`sources` can be overridden. Paths must be non-empty relative directories without
absolute paths, traversal, or symlink escapes. Invalid configuration fails; it
never silently falls back to default paths.

For a local Markdown tracker, `issue-root` and `initiative-root` in
`docs/agents/issue-tracker.md` frontmatter take precedence for ticket and initiative
collections. Each is relative to its own routed store, not the alignment root.
Absent fields default to `<tracker>/tickets` and `<tracker>/initiatives`. The
tracker collection itself still uses the configured tracker base. Workflows,
evidence, and ADR layouts do not change.

Use these collection selectors instead of rebuilding directory names:

```text
resolve tracker --json
resolve tickets --json
resolve initiatives --json
resolve sources --json
```

Each result has the same adapter, store, root, path, ref, and publication fields
as a singular record. `root` is the selected store; `path` is the exact collection
directory. `path tracker` remains available. Local ticket collections are not
available when an external tracker owns tickets.

`migrate tickets`, `migrate initiatives`, and `migrate sources` copy the configured
collection paths. Alignment migration carries the layout and tracker configuration
with the other alignment records. Initialization carries these two configuration
files into a newly selected shared alignment root without overwriting existing
files. Resolve again after changing routes or configuration.

## Pi/OMP onboarding modal

`/shared-context`, `/shared-context files`, and `Ctrl+Shift+G` show a centered
readiness banner instead of loading the explorer when either prerequisite is
missing:

- Established context routing, identified by the resolver. The route manifest
  in the origin-keyed shared directory counts. Supported legacy storage markers,
  shared instructions, and the tracker configuration used for fallback routing
  also count. The modal does not require repository-local configuration files.
- Shared registration: the origin-keyed `candidateSharedRoot` exists as a
  directory. `sharedRoot` is not a registration check; it can alias the
  repository alignment root. An empty directory alone is not configured context.

The resolver reports the configuration it used as `routeSource`. The modal uses
that result rather than searching for configuration in a second location.
`docs/agents/context-layout.toml` and `docs/agents/issue-tracker.md` are read from
the resolved alignment root, which can be shared storage. Neither optional file
is required to complete onboarding. Missing tracker-specific configuration is
reported by the explorer separately.

The banner has solid-background, borderless **Run setup** and **Close** buttons.
Use Tab or Left/Right to select a button, Enter or Space to activate it, and
Escape or Ctrl+C to close. Native mouse clicks work when the host supports and
enables mouse input, such as the fullscreen Pi/OMP renderer. Keyboard controls
remain available without mouse support.

**Run setup** executes the same initialization API as `/shared-context init`;
it does not stage editor text or run a shell command. Activation writes shared
instructions and the route manifest while preserving existing files. Buttons
are disabled during setup to prevent duplicate writes. Failures remain visible
and are also reported through the host notification system.

After setup, the extension refreshes session context and checks readiness again.
Successful shared-only setup opens the requested explorer tab without adding
configuration to the repository. If routing or the shared directory is still
missing, the banner stays open with **Check again**.

Malformed configuration, invalid path types, and filesystem access errors are
reported as errors, not treated as missing setup.
