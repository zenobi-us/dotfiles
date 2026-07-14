# Matt Pocock Pi bundle

Engineering workflow skills plus origin-keyed shared context support.

## Context extension

The bundled extension resolves the current Git repository's `origin`, canonicalizes it, and derives:

```text
~/.pi/shared-context/<slugified-origin>--<hash>/
```

Run `/matt-context` to inspect resolution. In repository mode it also shows the external shared-context candidate. Run `/matt-context init` to create `AGENTS.md` at that candidate; shared storage activates on the next agent turn.

When shared `AGENTS.md` exists, the extension appends:

```xml
<matt-pocock-context
  storage="shared"
  root="/home/q/.pi/shared-context/github-com-owner-repo--12345678"
  shared-root="/home/q/.pi/shared-context/github-com-owner-repo--12345678"
  repository-root="/work/repo"
  origin="https://github.com/owner/repo.git"
  slug="github-com-owner-repo--12345678"
  source="/home/q/.pi/shared-context/github-com-owner-repo--12345678/AGENTS.md">
  <instructions source="/home/q/.pi/shared-context/github-com-owner-repo--12345678/AGENTS.md">
    ...XML-escaped instructions...
  </instructions>
</matt-pocock-context>
```

Without shared `AGENTS.md`, repository behavior remains active:

```xml
<matt-pocock-context
  storage="repository"
  root="/work/repo"
  shared-root="/work/repo"
  repository-root="/work/repo"
  origin="https://github.com/owner/repo.git"
  slug="github-com-owner-repo--12345678"
  source="/work/repo/AGENTS.md">
  <instructions source="/work/repo/AGENTS.md" already-loaded="true" />
</matt-pocock-context>
```

`root` and `shared-root` both identify the active alignment storage. They point to the repository in repository mode and the origin-keyed external directory in shared mode. The external candidate is intentionally omitted from XML while repository storage is active.

## Alignment files

Skills resolve these paths against the injected `root`, falling back to the repository root when the extension is absent:

```text
AGENTS.md
docs/agents/issue-tracker.md
docs/agents/triage-labels.md
docs/agents/domain.md
CONTEXT.md
CONTEXT-MAP.md
docs/adr/
.scratch/
```

Repository source code always remains in the Git working tree.
