# Alignment root

Matt Pocock engineering skills use one active alignment root for workflow configuration, domain documents, ADRs, and local issue files. Repository source and ordinary project artifacts stay in the Git working tree.

## Markdown access policy

Use `agent-core:mq-query` for every agent operation that searches, reads, filters,
selects, lists, summarises, or validates local Markdown content. Load its matching
task reference and the required upstream reference first. Use explicit input and
output formats.

Do not use `grep`, `find`, `rg`, `fd`, `ls`, shell globs, or ad hoc Markdown
parsers to locate or inspect local Markdown. A known path may be passed to
`mq`, but `mq` remains the content-reading interface. This applies to
`CONTEXT.md`, `CONTEXT-MAP.md`, ADRs, `docs/agents/`, `tracker/`, `workflows/`,
review artifacts, and other alignment Markdown.

## Resolve the root

Run the shared-context CLI procedure from `agent-core:shared-context` in the repository root before reading or writing alignment artifacts:

```bash
<shared-context-skill-root>/scripts/shared-context/cli.ts report
```

Run `cli.ts` directly. Do not prefix it with Bun's runner. Use the reported `root` as `ALIGNMENT_ROOT` and the reported `repository-root` for source code and ordinary project files. The CLI is the source of truth. Do not inspect the prompt or environment, and do not derive a path from the origin or a storage configuration.

If the CLI exits with a non-zero status, stop and report the error. Use
`cli.ts path` to resolve tracker, workflow, source, and ADR targets. Run
`cli.ts index <dir>` after adding or removing a file in a source directory.
After any write under a shared `ALIGNMENT_ROOT`, read the shared-context
publishing procedure and publish when its rules require it.

Resolve these paths against `ALIGNMENT_ROOT`, even when an upstream skill calls
it the repo root:

- `AGENTS.md` or the active repository instruction file
- `docs/agents/`
- `CONTEXT.md`
- `CONTEXT-MAP.md`
- `docs/adr/`
- `domains/`
- `tracker/`
- `workflows/`
- `sources/`

Keep these relative to `repository-root`:

- source code and tests
- ordinary `docs/` and `specs/` content outside the alignment paths above
- prototypes, research notes, commits, branches, and other Git artifacts

External tracker issues remain in their external service. Only their configuration pointer lives under `ALIGNMENT_ROOT`.

`storage="shared"` means alignment files live outside the repository. `storage="repository"` preserves repository-local behavior. Skills MUST NOT silently mix roots. Explicit user instructions override the injected root.
