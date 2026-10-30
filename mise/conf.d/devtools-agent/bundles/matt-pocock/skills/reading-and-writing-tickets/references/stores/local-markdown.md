# Local Markdown store

## Resolve and read

1. Use `agent-core:shared-context` to resolve ticket IDs and the `tickets` and `initiatives` collections with `resolve <kind> --json`. Use each returned `path`. Do not construct paths from configured root segments.
2. Use `agent-core:mq-query` for every Markdown read, query, or validation. Load its matching task reference and upstream reference first. Use an explicit input and output format and load `okf.mq`.
3. Read ticket metadata from YAML frontmatter. Keep the body as human-readable intent and comments as conversation history.

Read [Tracker schemas](../schema.md). New tickets use `schema: tracker-ticket/v1`; new initiative indexes use `schema: tracker-initiative/v1`. Validate before and after writes. Legacy records remain readable; migrate explicitly before changing them. Unknown explicit schemas block mutation. Use [Check and migrate](../tasks/migrate.md), not storage relocation or ad hoc frontmatter edits.

The tracker config can declare `issue-root` and `initiative-root` as store-relative paths. If absent, they default to `tickets` and `initiatives` beneath the configured tracker base (`tracker` by default). For example, a `docs/tracker` base defaults to `docs/tracker/tickets` and `docs/tracker/initiatives`. Storage routes still select each collection's store independently. Tickets use stable `id`, `title`, `work_status`, `blocked_by`, and optional `parent` fields. Workflow tickets may also use `type` (`research`, `prototype`, `grilling`, or `task`) and `triage`. Preserve unknown fields. Valid `work_status` values are `unclaimed`, `claimed`, `implemented`, `merged`, and `completed`. Set `completed` only after validation, review, merge, and push succeed.

Claiming an already-held ticket is idempotent once durable ownership and current liveness/reservations are checked. Unknown or different ownership requires explicit scoped takeover approval before any claim mutation; do not clear or toggle `work_status` to restart a phase. Recover phase state through the worktree inspector and receipts, preserving partial source and append-only provenance. Add no recovery/session/phase frontmatter fields. A tracker commit, evidence run, or `claimed` value is not implementation evidence. `implemented` and `merged` remain incomplete; a completed ticket may still require finish reconciliation and cleanup.

When applicable, use `## What to build`, `## Question`, `## Acceptance criteria`, and `## Comments` in the body. Do not treat body text such as `Blocked by:` as canonical metadata.

## Initiatives and specifications

Follow [Initiative publication](../tasks/initiative.md). Resolve the initiative directory with the installed shared-context CLI's `resolve initiative --id <id> --json` operation. Its `index.md` holds the complete specification, `## Tickets` links, and `## Comments`. Use `id` and `title` frontmatter. Preserve unknown metadata. An optional `plan.md` holds execution planning only. New specifications are not ticket files or separate `spec.md` files.

For example, after resolving a new initiative, its `index.md` contains:

```markdown
---
schema: tracker-initiative/v1
id: example-navigation
title: Example navigation
---

## Problem Statement
Users cannot select a project without leaving the tracker.

## Solution
Add a project chooser that preserves each project's navigation state.

## User Stories
1. As a user, I want to select a project and return to its previous selection.

## Implementation Decisions
Project selection changes tracker context, not the active session directory.

## Testing Decisions
Exercise project selection and state restoration through the complete modal.

## Out of Scope
Repository cloning and storage migration.

## Tickets
- [Project chooser](../../tickets/example-navigation-01-projects.md)

## Comments
```

The resolved child file declares `schema: tracker-ticket/v1`, `parent: example-navigation`, `sequence: 1`, and `blocked_by: []`, in addition to its normal ticket fields and acceptance criteria. This relative link illustrates records in the default repository store only. Generate real links from resolved paths and shared-context publication rules. Read both records back and verify normal initiative discovery returns the specification and child. Do not copy the example's product decisions into unrelated work.

Validate child parent fields against initiative ticket links on every membership write. Preserve non-ticket links and all unrelated authored text. Existing parent-specification tickets and separate specification files require explicit migration approval; they remain readable and must not be silently relocated.

## Query and graph

Resolve the `tickets` collection before listing. Query only its returned directory. Return the canonical ID, title, state, direct blockers, and resolved file reference. For a DAG, run `./scripts/dep-tree-cli.ts markdown <repository-root> --ticket TICKET-ID` to discover the containing initiative, or `./scripts/dep-tree-cli.ts markdown <repository-root> --initiative INITIATIVE-ID` to select it directly. Initiative index links become graph roots; the command follows `blocked_by` edges and prints each node as `- [type] id - title`. Pass the repository root, not an alignment or tracker root. The CLI resolves both collections through shared-context, then uses `mq` to read initiative links and ticket frontmatter. Local links are resolved from each initiative index to the actual ticket files, including links across stores. It fails when a referenced blocker has no matching local ticket. Do not read body text as a replacement for frontmatter relationships. Derive reverse edges; do not store a second `blocks` list.

## Writes

Resolve each ticket or initiative before writing. Preserve frontmatter and body structure. Before a dependency write, verify unique references, no self-edge, no cycle, a real start-time dependency, and that a completed blocker does not need to remain open. Apply these publication rules to initiative indexes and membership updates as well as ticket files.

Before the first write, identify the Git repository that contains the resolved issue store and read its status. If it is a Git repository, commit changed tracker Markdown before issue work. Use `writing-and-creating-git-commits` and keep tracker commits separate from source commits.

After a write to `store: shared`, read the shared-context publishing procedure and publish when the store has a usable remote. Report local-only storage when it has no usable remote.