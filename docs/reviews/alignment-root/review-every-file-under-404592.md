# Agent review: agent-core ALIGNMENT_ROOT references

- Agent: `review-every-file-under-404592`
- Scope: all files under `.mise/conf.d/devtools-agent/bundles/agent-core/skills` that contain `ALIGNMENT_ROOT`
- Result: no files edited

## Findings

### P0 — Publishing instructions use an undefined `ALIGNMENT_ROOT`

Files and lines:

- `shared-context/references/publishing.md:13`
- `shared-context/references/publishing.md:40`
- `shared-context/references/publishing.md:79-81`
- `shared-context/references/publishing.md:115`
- `shared-context/references/ingest.md:44`

The new CLI prints `root`; it does not export an `ALIGNMENT_ROOT` environment variable. Replace shell references to `$ALIGNMENT_ROOT` with the root returned by the CLI. Do not rely on a pre-existing environment variable.

### P0 — `index` accepts arbitrary paths outside the resolved context root

Files and lines:

- `shared-context/references/layout.md:124-125`
- `shared-context/references/ingest.md:31`
- `shared-context/SKILL.md:101-105`

Harden the CLI. Resolve the active context, canonicalise the target directory, refuse paths outside `context.root`, refuse symlink escapes, and require directories to come from `anchor` unless an explicit trusted mode exists.

### P1 — Public-link rules contradict each other

Files and lines:

- `shared-context/SKILL.md:77-90`
- `shared-context/references/publishing.md:120-132`

Only construct public URLs after verifying the remote host, public repository visibility, and matching access boundary. Otherwise use `SharedContext/<relative-path>` or report that no citable link exists.

### P1 — Publishing commands do not use the CLI to resolve the storage repository

Files and lines:

- `shared-context/references/publishing.md:9-18`
- `shared-context/references/publishing.md:37-46`
- `shared-context/references/publishing.md:74-96`

Use the CLI-resolved root and Git metadata from that path. Do not reconstruct storage with `dirname` or an ambient variable.

### P1 — Ingest documentation incorrectly promises that every ingest is pushed

Files and lines:

- `shared-context/references/ingest.md:7-8`
- `shared-context/references/ingest.md:32-33`
- `shared-context/references/ingest.md:37-45`

Allow valid local-only writes and report publication results explicitly. Do not require `storage: shared` for repository storage.

### P1 — Screenshot paths bypass the CLI anchor rule

Files and lines:

- `shared-context/references/layout.md:146-155`
- especially line 150

Use a CLI-managed asset path or require assets to be placed relative to the directory returned by `anchor`.

### P2 — Source validation documentation does not match the CLI

Files and lines:

- `shared-context/references/layout.md:22-27`

Choose one source-name grammar and enforce it in both the CLI and documentation.

### P2 — `index` path quoting is not path safety

Files and lines:

- `shared-context/references/layout.md:125`
- `shared-context/references/ingest.md:31`

Quoting protects shell parsing only. The CLI must enforce root containment and symlink safety.

### P2 — `ALIGNMENT_ROOT` remains ambiguous

Files and lines:

- `shared-context/SKILL.md:38`
- `shared-context/references/layout.md:3`
- `shared-context/references/publishing.md:5,18,37,124`
- `shared-context/references/ingest.md:44`

Define its relationship to `root`, `shared root`, and `shared candidate`, or treat it as documentation-only terminology.

## Correct uses

- `shared-context/SKILL.md:38` identifies the CLI root.
- `shared-context/SKILL.md:99-105` requires the resolved root, `anchor`, and `index`.
- `layout.md:3-4` scopes layout rules to the active root.
- `publishing.md:16-18` notes that the Git repository root may differ from the origin-keyed root.
