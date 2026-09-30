🧭 **Decision:** Separate the store by responsibility. The current structure mixes tracker records, architecture decisions, workflow state, generated views, test evidence, and ingested sources.

## Problem

The current root has several competing layouts:

- `.scratch/ledger-ui-shadcn-migration/`
  - Canonical spec and tickets.
  - Review artifacts.
  - implementation and fix results.
  - manual-test fixtures, screenshots, scripts, generated reports, and assets.
- `ledger-ui-04/local/`
  - Workflow summaries.
  - immutable event receipts.
  - review artifacts.
  - many dated and versioned workflow copies.
- `ledger-ui-06/{local,projections,snapshots}/`
  - A newer event-sourced workflow layout.
- `ledger-ui-shadcn-migration/architecture-decision/`
  - Architecture decisions linked to tickets in `.scratch/`.
- `docs/agents/`
  - Tracker and domain configuration.

Specific problems:

1. **Top-level names do not identify record type.**  
   `ledger-ui-04` is a workflow. `ledger-ui-shadcn-migration` is an architecture-decision container. `.scratch/ledger-ui-shadcn-migration` is the tracker initiative.

2. **`.scratch` contains authoritative records.**  
   The name suggests temporary data, but it contains the canonical specification and tickets.

3. **`local` is overloaded.**  
   The shared-context skill defines it as a source anchor. The worktree skill uses it as a workflow database.

4. **Reviews have two homes.**
   - `.scratch/ledger-ui-shadcn-migration/reviews/`
   - `ledger-ui-04/local/reviews/`

5. **Architecture decisions have two representations.**
   - Decision tickets under `.scratch/.../issues/`
   - Resolved decision documents under `ledger-ui-shadcn-migration/architecture-decision/`

6. **Generated and authoritative data are adjacent.**  
   Receipts are authoritative. Projections are generated. Snapshots and reviews are immutable artifacts. The current paths do not make these properties clear.

7. **Indexes can become stale.**  
   `ledger-ui-06/local/events/index.md` says that no files are recorded, but the directory contains many YAML receipts.

8. **The current projections do not consistently implement the worktree contract.**  
   For example, `ledger-ui-06/projections/latest-status.yaml` does not use all required field names from `worktree/references/receipts.md`.

9. **There is no root navigation document.**  
   The store has no `CONTEXT-MAP.md` or root index. An agent must infer the model from directory names.

10. **The skill seams overlap.**
    - `shared-context` controls source anchors.
    - `matt-pocock` controls tracker and review records.
    - `worktree` controls receipts, reviews, snapshots, and projections.
    
    Reviews and paths therefore have more than one owner.

---

# Recommended structure

```text
github-com-airtonix-finance--1fb15e85/
├── AGENTS.md
├── CONTEXT-MAP.md
│
├── docs/
│   ├── agents/
│   │   ├── domain.md
│   │   └── issue-tracker.md
│   └── adr/
│       ├── index.md
│       ├── ledger-ui-10-shell-state.md
│       └── ledger-ui-11-drawer-interaction.md
│
├── domains/
│   ├── ledger/
│   │   └── CONTEXT.md
│   ├── importing/
│   │   └── CONTEXT.md
│   ├── market/
│   │   └── CONTEXT.md
│   ├── reporting/
│   │   └── CONTEXT.md
│   └── tax/
│       └── CONTEXT.md
│
├── tracker/
│   ├── index.md
│   ├── initiatives/
│   │   ├── ledger-ui-shadcn-migration/
│   │   │   ├── spec.md
│   │   │   ├── plan.md
│   │   │   └── index.md
│   │   └── ledger-package-extraction/
│   │       ├── spec.md
│   │       └── index.md
│   └── tickets/
│       ├── index.md
│       ├── ledger-ui-01.md
│       ├── ledger-ui-02.md
│       ├── ledger-ui-04.md
│       ├── ledger-ui-06.md
│       └── ledger-package-extraction-01.md
│
├── workflows/
│   ├── index.md
│   └── ledger-ui-04/
│       ├── manifest.yaml
│       ├── events/
│       │   ├── start-0001.yaml
│       │   ├── implementation-0002.yaml
│       │   ├── review-0003.yaml
│       │   └── finish-0031.yaml
│       ├── artifacts/
│       │   ├── reviews/
│       │   │   ├── review-0021.md
│       │   │   └── review-0027.md
│       │   ├── snapshots/
│       │   │   ├── pr-draft-0002.md
│       │   │   └── pr-draft-0014.md
│       │   └── evidence/
│       │       └── manual-test-0001/
│       │           ├── test-plan.md
│       │           ├── results.jsonl
│       │           ├── diagnostics.txt
│       │           └── screenshots/
│       └── projections/
│           ├── latest-status.yaml
│           ├── implementation-log.md
│           └── pr-draft.md
│
├── sources/
│   ├── tickets/
│   │   └── ledger-ui-04/
│   │       ├── confluence/
│   │       ├── jira/
│   │       ├── local/
│   │       └── web/
│   └── library/
│       ├── document/
│       ├── library-docs/
│       └── web/
│
└── archive/
    └── layout-v1/
        └── migration-map.yaml
```

## Record ownership

| Area | Owner | Property |
|---|---|---|
| `tracker/` | Matt Pocock ticket skill | Canonical ticket state |
| `docs/adr/` | Domain and architecture skills | Canonical decisions |
| `workflows/*/events/` | Worktree skill | Authoritative, append-only |
| `workflows/*/artifacts/` | Worktree skill | Immutable outputs |
| `workflows/*/projections/` | Worktree skill | Generated and replaceable |
| `sources/` | Shared-context skill | External and local source copies |
| `domains/` | Domain skill | Stable domain vocabulary and rules |
| `CONTEXT-MAP.md` | Shared-context skill | Root navigation |

This creates three clear workflow state classes:

1. **Events:** authoritative and append-only.
2. **Artifacts:** immutable evidence and authored results.
3. **Projections:** regenerated from events.

---

# Skill interface changes

## `shared-context`

The current interface exposes a generic source anchor:

```text
<root>/<KEY>/<source>/
```

That interface is too shallow. Callers still need to understand the complete physical layout.

Replace it with typed path commands:

```sh
shared-context path tracker
shared-context path ticket --id ledger-ui-04
shared-context path initiative --id ledger-ui-shadcn-migration
shared-context path workflow --id ledger-ui-04
shared-context path source --ticket ledger-ui-04 --source jira
shared-context path source --library --source document
shared-context path adr --id ledger-ui-10
```

The CLI should own all path construction. The skills should not join root-relative path segments.

Proposed source anchors:

```text
sources/tickets/<ticket-id>/<source>/
sources/library/<source>/
```

`local` remains a valid source type, but it no longer contains workflow state.

## `matt-pocock`

The ticket skill should own only:

```text
tracker/initiatives/
tracker/tickets/
```

Recommended tracker configuration:

```yaml
---
backend: local-markdown
initiative-root: tracker/initiatives
issue-root: tracker/tickets
---
```

A ticket filename should use its stable ID:

```text
tracker/tickets/ledger-ui-04.md
```

The sequence and title belong in frontmatter. They should not determine the path.

The Matt ticket skill should not select a second review directory. For a worktree review:

- Worktree owns the review artifact.
- Matt updates the ticket with the verdict and a link to that artifact.
- The review body exists once.

## `worktree`

The worktree skill should request:

```sh
shared-context path workflow --id ledger-ui-04
```

It should then use fixed internal paths:

```text
events/
artifacts/reviews/
artifacts/snapshots/
artifacts/evidence/
projections/
```

It must not write into:

```text
.scratch/
<ticket>/local/
tracker/
sources/
```

except through the owning skill.

A workflow `manifest.yaml` gives agents one entry point:

```yaml
schema: worktree-workflow/v2
workflow_id: ledger-ui-04
ticket: ledger-ui-04
tracker_path: tracker/tickets/ledger-ui-04.md
initiative: ledger-ui-shadcn-migration
event_root: events
artifact_root: artifacts
projection_root: projections
latest_receipt: finish-0031-complete
state: FINISHED
```

This manifest is a projection. Events remain authoritative.

---

# Path migration

| Current path | Target path |
|---|---|
| `.scratch/ledger-ui-shadcn-migration/spec.md` | `tracker/initiatives/ledger-ui-shadcn-migration/spec.md` |
| `.scratch/ledger-ui-shadcn-migration/wayfinder-map.md` | `tracker/initiatives/ledger-ui-shadcn-migration/plan.md` |
| `.scratch/ledger-ui-shadcn-migration/issues/04-rich-ledger-code-view.md` | `tracker/tickets/ledger-ui-04.md` |
| `.scratch/ledger-package-extraction/issues/01-core-contracts.md` | `tracker/tickets/ledger-package-extraction-01.md` |
| `ledger-ui-shadcn-migration/architecture-decision/10-shell-state-decision.md` | `docs/adr/ledger-ui-10-shell-state.md` |
| `ledger-ui-04/local/events/*` | `workflows/ledger-ui-04/events/*` |
| `ledger-ui-06/local/events/*` | `workflows/ledger-ui-06/events/*` |
| `ledger-ui-04/local/reviews/*` | `workflows/ledger-ui-04/artifacts/reviews/*` |
| `.scratch/.../reviews/04-ledger-ui-04-attempt-06.md` | `workflows/ledger-ui-04/artifacts/reviews/review-<receipt-id>.md` |
| `ledger-ui-06/snapshots/*` | `workflows/ledger-ui-06/artifacts/snapshots/*` |
| `ledger-ui-06/projections/*` | `workflows/ledger-ui-06/projections/*` |
| `.scratch/.../manual-tests/*` | `workflows/<ticket>/artifacts/evidence/manual-test-<run-id>/*` |
| `ledger-ui-04/local/fix-workflow-*.md` | Delete after receipt coverage, or move to `archive/layout-v1/ledger-ui-04/` |
| `docs/agents/*` | Keep in place |
| `AGENTS.md` | Keep in place |

For manual-test evidence that covers the full initiative, use:

```text
workflows/ledger-ui-shadcn-migration/artifacts/evidence/
```

Do not keep the generated HTML report and its copied input files inside the tracker tree.

---

# Migration sequence

## 1. Change writers first

Update the three skill contracts before moving data:

1. Add typed paths to `shared-context`.
2. Change the Matt tracker roots.
3. Change worktree receipts, artifacts, snapshots, and projections to use `workflows/`.

Otherwise, the next workflow run will recreate the old paths.

## 2. Add root navigation

Create:

- `CONTEXT-MAP.md`
- `tracker/index.md`
- `workflows/index.md`
- `docs/adr/index.md`

`CONTEXT-MAP.md` should identify only the stable entry points. It should not list every receipt.

## 3. Move canonical records

Move specs, tickets, and ADRs first.

Update:

- `parent`
- `blocked_by`
- tracker links
- ADR references
- `docs/agents/issue-tracker.md`
- workflow `ticket_path` fields in new receipts

Do not rewrite old immutable receipts only to change historical absolute paths.

## 4. Consolidate reviews

For each review attempt:

1. Match the Markdown review to its YAML review receipt.
2. Assign the receipt ID as the artifact filename.
3. Keep one copy under `artifacts/reviews/`.
4. Update projections and ticket comments to point to it.
5. Remove the duplicate from `.scratch/.../reviews/` or `local/reviews/`.

If a review has no matching receipt, preserve it as:

```text
artifacts/reviews/legacy-<original-name>.md
```

Do not silently discard it.

## 5. Move workflow state

Move event receipts byte-for-byte. Preserve their IDs and order.

Then regenerate:

- `manifest.yaml`
- `projections/latest-status.yaml`
- `projections/implementation-log.md`
- `projections/pr-draft.md`
- directory indexes

Old receipt paths remain historical provenance. Add an immutable migration event or `archive/layout-v1/migration-map.yaml` that maps old paths to new paths.

## 6. Classify old summary documents

For each `fix-workflow-*.md`, `workflow.md`, implementation result, and fix result:

- Delete it if events and immutable artifacts contain all its information.
- Preserve it under `archive/layout-v1/` if it contains unique information.
- Do not leave it beside current workflow records.

## 7. Move evidence

Put screenshots, fixture files, JSON workflow captures, diagnostics, reports, and scripts under one evidence run.

Avoid copied files such as:

```text
manual-tests/report/files/test-plan.md
manual-tests/test-plan.md
```

The report should link to the evidence inputs instead of copying them.

## 8. Regenerate and validate

Required checks:

- Every ticket ID resolves to exactly one tracker file.
- Every review artifact has exactly one path.
- Every event parent resolves.
- Every workflow projection is reproducible from events and artifacts.
- `latest-status.yaml` follows one schema.
- No active link points to `.scratch/`, `<ticket>/local/`, or the old architecture-decision directory.
- No generated index claims that a non-empty directory is empty.
- A `start → review → fix → review → finish` smoke workflow writes only under `workflows/<id>/`.
- Shared-context source ingestion writes only under `sources/`.

## 9. Clean cutover

Remove the old directories after validation:

```text
.scratch/
ledger-ui-04/
ledger-ui-05/
ledger-ui-06/
ledger-ui-09/
ledger-ui-10/
ledger-ui-11/
ledger-ui-12/
ledger-ui-shadcn-migration/
```

Do not retain symlinks or compatibility copies. They would restore the same ambiguity.

