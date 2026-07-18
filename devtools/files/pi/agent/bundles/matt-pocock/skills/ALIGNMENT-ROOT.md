# Alignment root

Matt Pocock engineering skills use one active alignment root for workflow configuration, domain documents, ADRs, and local issue files. Repository source and ordinary project artifacts stay in the Git working tree.

## Resolve the root

1. If the system prompt contains `<matt-pocock-context root="...">`, `ALIGNMENT_ROOT` MUST be that absolute `root` path.
2. Otherwise `ALIGNMENT_ROOT` MUST be the Git repository root.

Resolve these paths against `ALIGNMENT_ROOT`, even when an upstream skill calls it the repo root:

- `AGENTS.md` or the active repository instruction file
- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`
- `docs/agents/domain.md`
- `CONTEXT.md`
- `CONTEXT-MAP.md`
- `docs/adr/`
- context-scoped `src/**/docs/adr/`
- `.scratch/` when the tracker backend is `local-markdown`

Keep these relative to `repository-root`:

- source code and tests
- ordinary `docs/` and `specs/` content outside the alignment paths above
- prototypes, research notes, commits, branches, and other Git artifacts

External tracker issues remain in their external service. Only their configuration pointer lives under `ALIGNMENT_ROOT`.

`storage="shared"` means alignment files live outside the repository. `storage="repository"` preserves repository-local behavior. Skills MUST NOT silently mix roots. Explicit user instructions override the injected root.
