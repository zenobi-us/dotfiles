---
description: Stable entry points and ownership for repository context
title: Context map
type: Index
---

# Context map

Use this file for stable entry points. Do not list individual workflow receipts here.

## Entry points

- [Agent configuration](docs/agents/)
- [Architecture decisions](docs/adr/index.md)
- [Issue tracker configuration](docs/agents/issue-tracker.md)
- [Domain configuration](docs/agents/domain.md)

The issue tracker uses Local Markdown. Read the [tracker index](tracker/index.md) for ticket and initiative navigation. Read `CONTEXT.md` when it exists. Keep architecture decisions under `docs/adr/`. Resolve workflow and source paths through the shared-context CLI when needed.

## Ownership

| Area | Owner | Property |
|---|---|---|
| `docs/agents/` | Repository agent configuration | Authored configuration |
| `docs/adr/` | Domain and architecture skills | Canonical decisions |
| `tracker/` | Matt Pocock ticket skill | Canonical local tickets when configured |
| `workflows/*/events/` | Worktree skill | Authoritative and append-only |
| `workflows/*/artifacts/` | Worktree skill | Immutable outputs |
| `workflows/*/projections/` | Worktree skill | Generated and replaceable |
| `sources/` | Shared-context skill | External and local source copies |
| `domains/` | Domain skill | Stable domain vocabulary and rules |

