# Alignment root

Matt Pocock engineering skills resolve alignment files from one active alignment root. Tickets, initiatives, workflows, evidence, and sources can use separate routes. Repository source and ordinary project artifacts stay in the Git working tree.

## Markdown access policy

Use `agent-core:mq-query` for every agent operation that searches, reads, filters,
selects, lists, summarises, or validates local Markdown content. Load its matching
task reference and the required upstream reference first. Use explicit input and
output formats.

Do not use `grep`, `find`, `rg`, `fd`, `ls`, shell globs, or ad hoc Markdown
parsers to locate or inspect local Markdown. A known path may be passed to
`mq`, but `mq` remains the content-reading interface. This applies to
`CONTEXT.md`, `CONTEXT-MAP.md`, ADRs, `docs/agents/`, `tracker/`, `workflows/`,
review artifacts, and other alignment Markdown. `tracker/` and `sources/` are default base directories, not fixed locations.

## Resolve the root

Run the shared-context CLI procedure from `agent-core:shared-context` in the repository root before reading or writing alignment artifacts:

```bash
<shared-context-skill-root>/scripts/shared-context/cli.ts report
```

Run `cli.ts` directly. Use its `root` as `ALIGNMENT_ROOT` for alignment files
and its `repository-root` for source code and ordinary project files. The CLI is
the source of truth. Do not derive either path.

If the CLI exits with a non-zero status, stop and report the error. Use
`cli.ts resolve <kind> ... --json` for a record-specific path and publication
rule. Use `cli.ts index <dir> --kind source --source <SOURCE>` after adding or
removing a source file. Include `--ticket <ID>` or `--library` as needed.

Resolve these alignment files against `ALIGNMENT_ROOT`:

- `AGENTS.md` or the active repository instruction file
- `docs/agents/`
- `CONTEXT.md`
- `CONTEXT-MAP.md`
- `docs/adr/`
- `domains/`

Resolve file-backed tracker records, workflows, evidence, and sources with
`cli.ts resolve`. Do not join their paths to `ALIGNMENT_ROOT`. Resolve the
tracker configuration from `ALIGNMENT_ROOT`, then use the configured tracker
adapter for ticket operations. A GitHub ticket stays in GitHub even when its
initiative or workflow record uses Markdown.

Use `cli.ts resolve tracker --json`, `resolve tickets --json`,
`resolve initiatives --json`, and `resolve sources --json` for collection roots.
Use each record's `path`; collections can use different stores. Local tracker
`issue-root` and `initiative-root` fields override their collection paths.

The optional `docs/agents/context-layout.toml` lives under `ALIGNMENT_ROOT`:

```toml
schema = 1
[paths]
tracker = "docs/tracker"
sources = "docs/sources"
```

Without this file, the bases are `tracker` and `sources`. The layout changes
base directories, not storage routes. Configured paths must stay relative to
the selected store. Resolve records again after a layout or tracker change.

Keep these relative to `repository-root`:

- source code and tests
- ordinary `docs/` and `specs/` content outside the alignment paths above
- prototypes, research notes, commits, branches, and other Git artifacts

External tracker issues remain in their service. Only the tracker configuration
lives under `ALIGNMENT_ROOT`. Treat `mode` as a summary. Resolve each record
before reading or writing it. Explicit user instructions override the injected
route table.
