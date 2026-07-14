# Alignment root

Matt Pocock engineering skills use one alignment root for workflow configuration, domain documents, ADRs, and local issue files.

## Resolve the root

1. If the system prompt contains `<matt-pocock-context root="...">`, `ALIGNMENT_ROOT` MUST be that absolute `root` path.
2. Otherwise `ALIGNMENT_ROOT` MUST be the repository root.

Paths named by these skills are relative to `ALIGNMENT_ROOT` unless the skill explicitly says otherwise:

- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`
- `docs/agents/domain.md`
- `CONTEXT.md`
- `CONTEXT-MAP.md`
- `docs/adr/`
- `.scratch/`

`storage="shared"` means these files live outside the repository. `storage="repository"` preserves the original repository-local behavior.

Skills MUST NOT silently mix roots. Configuration, domain documents, ADRs, and local issue files created during one workflow MUST stay beneath the active `ALIGNMENT_ROOT`.

Explicit user instructions override the injected root. Repository instructions override conflicting shared instructions. If no injected context exists, repository-local behavior remains unchanged.
