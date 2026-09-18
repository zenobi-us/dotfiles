# shared-agent-context

Origin-keyed shared agent context: a place for `AGENTS.md` and related alignment
files (`docs/agents/`, `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, `library/`,
`.scratch/` when the tracker backend is `local-markdown`) to live outside any single
repository clone, keyed by the repo's canonicalized git `origin`. Works the
same way whether you're driving the repo with pi or with Claude Code.

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

On session/agent start, the tool injects a `<shared-agent-context>` XML block
into the system prompt pointing at the active root (shared or repository).
Skills that understand this block (e.g. matt-pocock's engineering skills, via
[`../matt-pocock/ALIGNMENT-ROOT.md`](../matt-pocock/ALIGNMENT-ROOT.md)) resolve
alignment files against it, falling back to the repository root when absent.

- **pi**: `extensions/pi-shared-context.ts` wires this into
  `before_agent_start` and registers `/eng-context`.
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

- `report` (default) — current storage, roots, origin, slug.
- `init` — create shared `AGENTS.md` and activate shared storage.
- `list` — list every origin-keyed shared context.
- `migrate` — copy alignment files to the opposite storage, verifying existing
  files match first. Source files are left intact.
- `anchor --source <name> [--key <KEY>] [--dry-run]` — create and print the
  directory an ingested source belongs in: `<root>/<KEY>/<name>/` with a key,
  `<root>/library/<name>/` without one. `--dry-run` prints the path and creates
  nothing.
- `doctor` — check Bun, mise, git, and fd prerequisites.
- `index <dir> [--force]` — rebuild the managed block of `<dir>/index.md` from the
  frontmatter of its sibling Markdown files. Text outside the
  `<!-- shared-context:index start -->` / `<!-- shared-context:index end -->`
  markers is kept. An `index.md` with no markers is refused unless `--force`.

When shared `AGENTS.md` exists, the injected block looks like:

```xml
<shared-agent-context
  storage="shared"
  root="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678"
  shared-root="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678"
  repository-root="/work/repo"
  origin="https://github.com/owner/repo.git"
  slug="github-com-owner-repo--12345678"
  source="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678/AGENTS.md">
  <instructions source="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678/AGENTS.md">
    ...XML-escaped instructions...
  </instructions>
</shared-agent-context>
```

Without shared `AGENTS.md`, repository behavior remains active (Claude Code
already loads repository `CLAUDE.md`/`AGENTS.md` natively, so the hook is a
no-op in that case rather than re-injecting it).
