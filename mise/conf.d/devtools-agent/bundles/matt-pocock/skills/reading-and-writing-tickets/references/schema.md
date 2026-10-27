# Tracker record schemas

The ticket skill owns tracker content contracts. `shared-context` owns storage routes and paths, not tracker record conversion. Setup state versions and worktree receipt versions are independent.

## Machine contract

The authoritative validator is `scripts/record-schema.ts`, relative to the installed `reading-and-writing-tickets` skill directory (`TICKET_SKILL_ROOT`). Use `validateRecord` or `assertRecord` rather than duplicating field rules. The graph and tracker UI use the same validator for explicit versions. Preserve unknown metadata and authored body sections.

| Record | Schema | Required content | Forbidden ticket state |
|---|---|---|---|
| Initiative `index.md` | `tracker-initiative/v1` | Stable string `id`, string `title`, complete specification, child links under `## Tickets`, discussion under `## Comments` | `work_status`, `blocked_by` |
| Executable ticket | `tracker-ticket/v1` | Stable string `id`, string `title`, recognized `work_status`, string-list `blocked_by`; optional string `parent` and positive integer `sequence` | None |
| Skill/CLI result | `tracker-result/v1` | Operation result and observed validation/publication | Do not represent an initiative as a ticket |
| Migration plan | `tracker-migration-plan/v1` | Repository/routes, explicit selector, before/after snapshots and hashes, source provenance, coverage, conflicts | No implied execution approval |
| Migration event | `tracker-migration/v1` | Migration identity, immutable plan hash, sequence/parent hash, observed apply or recovery state | Never rewrite historical receipts |

Ticket status values are `unclaimed`, `claimed`, `implemented`, `merged`, and `completed`. Status is not triage. A parent is an initiative identity, not a dependency. Sequence is display order, not an execution edge. Required product intent and acceptance evidence remain workflow requirements beyond structural validation.

`scripts/record-migration.ts` validates plan identity, snapshot hashes, fresh routes, staged records, and append-only migration event chains. Results declare `tracker-result/v1`; that envelope does not upgrade the records it reports.

## Example records

```yaml
# Resolved initiative directory's index.md frontmatter
schema: tracker-initiative/v1
id: example-navigation
title: Example navigation
```

The body holds the complete specification plus `## Tickets` links and `## Comments`. No separate `spec.md` is required.

```yaml
# Resolved child ticket's frontmatter
schema: tracker-ticket/v1
id: example-navigation-01-projects
title: Select a project
parent: example-navigation
sequence: 1
work_status: unclaimed
blocked_by: []
```

Keep the initiative's ticket links and direct child parent fields consistent. Explicit v1 readers must not interpret arbitrary specification links as child membership. Resolve paths and references through shared-context. Never derive a store from the schema name.

## Version policy

An absent schema is a legacy record, not an implicit v1 record. Read-only consumers may read supported legacy shapes without modifying them. New records must declare v1. Before changing a legacy record, use an explicitly approved migration rather than silently stamping a schema. Unknown explicit schemas fail validation even when legacy reading is enabled. Refuse mutation until a supported migration exists.

Schema versions change when record meaning or required structure changes. Skill descriptions, package versions, setup CLI versions, and template hashes do not upgrade records. Change this reference, validator, consumers, migration steps, fixtures, and caller instructions together.

## Ownership

- **Ticket skill:** Record validation, result schema, membership, content migration, and migration journals.
- **Shared context:** Typed path resolution, route manifest v2, layout v1, storage relocation, and publication boundaries.
- **Worktree:** Immutable receipts, coordinator events, source/review identities, and workflow projections. Tracker migration never rewrites this history.
- **Specification callers:** `to-spec` and `to-tickets` request ticket-skill operations; they do not implement their own schema or migration.

Read [Migration](tasks/migrate.md) for explicit conversion.
