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
