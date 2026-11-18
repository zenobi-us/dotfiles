---
schema: collect-feedback/v1
kind: explanation
title: Evidence, feedback, and workflow records
---
# Evidence, feedback, and workflow records

The evidence workflow connects observed application behavior to saved feedback without changing ticket or phase authority.
For operators, reviewers, and agents. Version: collect-feedback/v1 and collect-evidence/v1.
For actions, use the [how-to](../howto.md). For flags and statuses, use the [CLI reference](cli.md).

## Overview

Evidence and feedback keep source identities separate from ticket and phase authority.

- **Identify owners:** [Responsibilities](#responsibilities).
- **Locate records:** [Routing and stable references](#routing-and-stable-references).
- **Read the layout:** [Record authority and layout](#record-authority-and-layout).
- **Preserve sources:** [Capture staging and immutability](#capture-staging-and-immutability).
- **Distinguish drafts:** [Saved notes and browser drafts](#saved-notes-and-browser-drafts).
- **Control access:** [Serving and publication boundaries](#serving-and-publication-boundaries).

## Responsibilities

| Component | Owns | Does not establish |
|---|---|---|
| [collect-evidence](../../collect-evidence/SKILL.md) | Approved typed plan, native capture, common evidence records, case verdicts, sealed runs | Ticket completion or review approval. |
| [collect-feedback](../SKILL.md) | Fresh request orchestration, explicit import, local viewer, durable annotations, saved-record export | A second capture model or a new store route. |
| [shared-context](../../../../../agent-core/skills/shared-context/SKILL.md) | Store routes, physical locations, stable references, publication rules | That a resolved record exists or completed successfully. |
| [reading-and-writing-tickets](../../../../../matt-pocock/skills/reading-and-writing-tickets/SKILL.md) | Canonical ticket intent, dependencies, claims, status, completion | Capture validity or a worktree phase result. |
| [worktree](../../../git/worktree/SKILL.md) | Exact source identity, append-only phase receipts, independent review and integration lifecycle | A passing phase merely because a viewer starts. |
| [writing-reports](../../../devtools/writing-reports/SKILL.md) | Read-only presentation of validated evidence and saved feedback | Another verdict source, capture driver, or annotation database. |

A canonical ticket reference identifies the requested work. A workflow ID groups its durable phase records.
Evidence run IDs identify capture attempts. A session ID identifies one feedback import and its annotations.
A report consumes those identities. It does not replace them.
For example, one ticket can have workflow `review-example`, runs `fresh-001` and `fresh-002`, and separate feedback sessions.
The agent records their actual stable references in phase receipt inputs and outputs.
Evidence and feedback never claim, complete, merge, or push a ticket.

## Routing and stable references

Both skills resolve the existing shared-context evidence route from the repository in scope.
The route can use the repository, an origin-keyed shared store, or inheritance from the workflow store.
The evidence store can differ from the workflow receipt store. A repository root is not an assumed evidence root.

```sh
BUNDLES="$HOME/.omp/agent/bundles"
SHARED_CONTEXT_SKILL_ROOT="$BUNDLES/agent-core/skills/shared-context"
REPOSITORY=/absolute/repository-in-scope
(cd "$REPOSITORY" && "$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" resolve workflow --id review-example --json)
(cd "$REPOSITORY" && "$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" resolve evidence --workflow review-example --run fresh-001 --json)
(cd "$REPOSITORY" && "$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" resolve evidence --workflow review-example --run feedback-001 --json)
```

The resolver returns `store`, `root`, `path`, and stable `ref`. Use `path` for local CLI access.
Retain the returned `ref` for durable links. Do not reconstruct it from the caller's current directory.
Feedback uses `resolve evidence --run <session-id>`, not a separate feedback resolver.
A run and session need separate IDs because both use this destination namespace.
A repository-backed example is `workflows/review-example/artifacts/evidence/fresh-001`.
The shared-store reference can differ. The resolver's output, not this example, selects it.

## Record authority and layout

The following names describe structure inside resolved locations. They do not choose a physical store.

```text
<resolved-evidence-run>/
  run.json                 sealed run identity and ordered cases
  plan.ts                  authored plan
  plan.json                generated common plan
  index.md                 generated run notes
  cases/<case-id>/
    case.json              results, steps, provenance, asset registry
    index.md               generated case notes
    events.jsonl           ordered observations
    media/                 original images and supported recordings
  native/                  retained driver-native output when present

<resolved-feedback-session>/
  session.json             session identity, source provenance, historical label
  index.md                 generated session notes
  source/                  complete sealed source snapshot
  cases/<case-id>/
    case.json              source-bound case and registered assets
    notes.md               generated case notes
    media/                 separate read-only original-byte copies
    annotations/<id>.json  authoritative saved annotation, revision, tombstone
  .writer.lock             live exclusive server ownership, not feedback
```

Native files can also appear under case-specific paths. Their recorded references select their actual location.
Third-party originals retain their original bytes, even when they do not use the common schema.

Evidence JSON and JSONL use `collect-evidence/v1` and a record `kind`.
Feedback JSON and owned Markdown use `collect-feedback/v1` and a record `kind`.
The source snapshot remains evidence, not rewritten feedback.
Markdown indexes and reports present canonical records. They are not a second annotation database.
Worktree `events/` phase receipts remain authoritative for phase progress. Tracker records remain authoritative for ticket state.

## Capture staging and immutability

The collector workspace and temporary media stay outside the watched source tree.
The collector validates the plan, runs the real driver, releases its owned resources, validates records, and finalizes a new sealed identity.
An interrupted operation or incomplete finalization is not sealed successful evidence.
Capture completion and assertions are separate. A valid image can accompany FAIL or BLOCKED results.

Each asset retains its ID, capture time, actual dimensions, capture method, provenance, and SHA-256 of the original bytes.
Retries use new run identities and increasing capture sequences rather than replacement files.
Feedback import validates the sealed run, stages a source snapshot and media copies, validates them, and finalizes a new session.
The server validates source hashes before writes and export. A changed source requires a new explicit import.

Historical import preserves capture times, run identities, hashes, results, and media bytes.
`session.createdAt` is import time. Unknown capture times remain unknown.
The viewer and export label historical evidence as historical, not current application proof.
Unsupported explicit schemas and unversioned archives require a separately approved importer. They never trigger automatic migration.

## Saved notes and browser drafts

Saved annotation files are authoritative. The server uses one writer, atomic publication, durable acknowledgement, and revision checks.
A note binds session, case, asset ID, source hash, original dimensions, normalized top-left geometry, priority, and comment.
Pixel geometry rounds each original-pixel edge once. A point has zero width and height.
Delete creates a reversible tombstone. Edit and undo preserve the annotation ID and increment its revision.
A stale revision fails instead of silently replacing another saved edit.

Browser `sessionStorage` holds unfinished drafts in the current tab and origin.
Drafts bind the source identity and starting revision. They are not saved annotations or phase evidence.
Navigation and reload recover matching drafts. Tab closure and port changes do not preserve the same draft access.
Storage errors retain memory-only drafts with a warning. A failed save retains its retry payload and starting revision.
Selecting an unchanged saved note creates no draft.

The viewer requires save or explicit discard before a complete export.
CLI and direct API exports contain saved server records only because they cannot inspect browser storage.
Exports retain source identities, annotation revisions, coordinates, timestamps, priorities, and deletion state.
Repeated exports do not change stored records.

## Serving and publication boundaries

The viewer binds only to `127.0.0.1` at an explicit port. It uses Host and Origin checks and an in-memory write token.
It serves registered assets only. It is not a general file server or a remote collaboration service.
SIGINT and SIGTERM drain pending saves and release the owned writer lock and port.
A stale lock requires operator inspection. The CLI never steals another writer's lock.

Local capture, import, serving, export, and report generation do not authorize publication.
Publication needs separate approval and an access-boundary check through shared-context.
A local path or stable reference is not a public URL. Private or uncertain records must not become guessed public links.
No remote Git command, commit, push, or credential entry belongs inside capture or serving.
Original evidence, earlier reports, and existing user feedback remain unchanged.
