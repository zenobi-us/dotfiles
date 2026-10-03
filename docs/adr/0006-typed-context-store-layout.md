---
description: Assign canonical tracker, workflow, source, domain, and decision paths
title: Separate context records by responsibility
type: Decision
---

# Separate context records by responsibility

Accepted. Store typed context records through an explicit per-kind route
manifest. A route selects a repository store, an origin-keyed shared store, an
external ticket adapter, or inheritance from another record kind.

## Decision

- `alignment` stores agent instructions, domain vocabulary, ADRs, and context maps.
- `tickets` use the configured external adapter or a local Markdown store.
- `initiatives` store canonical initiative records.
- `workflows/<id>/events/` stores append-only workflow receipts.
- `workflows/<id>/artifacts/` stores immutable reviews, snapshots, and related artifacts.
- `evidence` stores manual test reports and linked test inputs; it inherits the
  workflow route unless configured separately.
- `sources/` stores external and local source copies; it inherits alignment
  unless configured separately.
- `CONTEXT-MAP.md` lists stable alignment entry points.

The route manifest selects stores independently of record ownership. The
shared-context CLI resolves record locations through `resolve`; the ticket
skill owns tracker records, and the worktree skill owns workflow records.
Changing a route moves only records of that kind. Inherited routes are pinned
to their previous store when their parent route changes.

## Considered options

- Keep ticket, workflow, review, and source records under ticket-named roots.
- Keep local Markdown tracker records under `.scratch/`.
- Separate records by ownership and mutability.

The typed layout removes ambiguous `local` and `.scratch` paths. It also makes authoritative events distinct from immutable artifacts and replaceable projections.
