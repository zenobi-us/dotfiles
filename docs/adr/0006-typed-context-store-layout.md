---
description: Assign canonical tracker, workflow, source, domain, and decision paths
title: Separate context records by responsibility
type: Decision
---

# Separate context records by responsibility

Accepted. Use typed roots under the active shared-context root.

## Decision

- `tracker/` stores canonical local initiatives and tickets.
- `docs/adr/` stores canonical architecture decisions.
- `domains/` stores domain vocabulary.
- `workflows/<id>/events/` stores append-only workflow receipts.
- `workflows/<id>/artifacts/` stores immutable reviews, snapshots, and evidence.
- `workflows/<id>/projections/` and `manifest.yaml` are generated views.
- `sources/` stores external and local source copies.
- `CONTEXT-MAP.md` lists stable entry points.

The shared-context CLI owns physical path construction through typed `path` commands. The ticket skill owns tracker records. The worktree skill owns workflow records.

## Considered options

- Keep ticket, workflow, review, and source records under ticket-named roots.
- Keep local Markdown tracker records under `.scratch/`.
- Separate records by ownership and mutability.

The typed layout removes ambiguous `local` and `.scratch` paths. It also makes authoritative events distinct from immutable artifacts and replaceable projections.
