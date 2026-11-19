---
date: 2026-11-19
description: Replace remote full refreshes with target indexing and a SyncedStore replica inside the Herdr mod
id: herdr-target-owned-tracker-replication
status: open
title: Target-owned tracker replication
type: Idea
---

# Target-owned tracker replication

Keep tracker information current on target machines and synchronize it into the Herdr mod without repeated full refreshes.

Date: 2026-11-19. State: open. Repository: `zenobi-us/dotfiles`.

## Original wording

> next i want to explore a shift in thinking about how we transport tracker information from remote machines to localmachines.

> outcome is that we get a signalling and streaming channel that auto updates UI from events occuring on target machines.

## Context

The current Desktop query cache, Herdr Core transport and Target helper runtime collect tracker data, transfer it to the desktop and cache it. The user reports repeated waits for full refreshes.

Replace that read pipeline with continuously maintained target state and a mod-owned replica. Use SyncedStore, Yjs and y-websocket. Keep authoritative source records and Git evidence outside the derived view.

## Concepts

All concepts remain unchecked because none has confirmed coverage by an initiative or executable ticket. The design is agreed; implementation is not approved.

- [ ] **C1 — Target-owned indexing:** The target observes source changes and maintains the derived tracker view. It continuously indexes all ticket details, initiative membership, relations and workflow state.
- [ ] **C2 — Checkout scope:** Name the machine namespace `<prefix>-<slugified-machine-id>`. Keep separate checkout documents and synchronize only the selected checkout. Do not merge different worktrees merely because they share a Git origin.
- [ ] **C3 — Persistent registration:** Opening a tracker panel registers its checkout automatically. Keep it indexed until explicit unregistration, even when no panel is connected. Restore target document history after normal restarts and reconcile missed source changes.
- [ ] **C4 — Mod-owned replicas:** Keep the real SyncedStore/Yjs replica inside the GPUI mod. Panels showing the same target checkout share one replica and connection. Keep their selection, filters and layout separate.
- [ ] **C5 — Transport-only helper:** Use a local helper to carry WebSocket frames through a helper-backed adapter. Give it no tracker parser, projection, Yjs document or durable frame journal. Recover helper failures through Yjs synchronization.
- [ ] **C6 — Target connection and authority:** Discover the selected target’s reachable private WebSocket endpoint through existing authenticated remote execution. That access authorizes checkout-scoped read-only subscription grants. Only the target indexer writes the synchronized view.
- [ ] **C7 — Incremental publication:** Publish completed related record groups without waiting for a whole-checkout refresh. Commit related fields together and expose pending derivations and source observation state.
- [ ] **C8 — Offline and invalid state:** Save the mod replica and show its last synchronized state offline. If a source record becomes invalid, retain its last valid state with a source error. Keep affected actions unavailable while offline or invalid.
- [ ] **C9 — Source commands and feedback:** Send desktop actions to target commands. Revalidate the exact requested action against current source conditions. Reject conflicts without overwriting edits or substituting actions. Show pending status and display new record state only after target publication; do not optimistically mutate the replica.
- [ ] **C10 — Existing-runtime clean cutover:** Use the current Herdr Core and app interfaces. Adapt the real libraries to the mod runtime. Replace the old tracker cache, validation, query-worker and refresh paths without compatibility support for older mod versions. Keep arbitrary file browsing separate from tracker replication.

## Agreed design and evidence

- **Design:** [Consolidated rewrite proposal and replacement Mermaid diagram](target-owned-tracker-replication.md).
- **Decisions:** [Confirmed grilling answers](replication-grilling-decisions.md).
- **Runtime proof:** [Reviewed SyncedStore mod experiment](syncedstore-mod-experiment.md).
- **Original architecture:** [Source-backed current system diagram](system-diagram.md).
- **Reproduction:** [Experimental source, original screenshots and logs](syncedstore-mod-experiment.tar.gz).
- **Library:** [SyncedStore](https://github.com/yousefed/SyncedStore) and its [y-websocket provider integration](https://syncedstore.org/docs/sync-providers/#y-websocket).

The experiment proved local runtime feasibility with the replica inside the actual GPUI mod. It passed live changes, reconnect catch-up, a larger binary update, shared-panel lifetime and server-side write rejection.

It did not prove real tracker indexing, remote deployment, authentication or saved-replica recovery. Rejected desktop writes remained visible locally; the production interface must not depend on server rejection to roll them back.

## Planning status

No initiative, executable ticket or conversion coverage has been created for this idea. The supporting design and experiment do not mark its concepts covered.

This file is a plain Markdown idea capture in the existing library source store. It is not a registered `tracker-idea/v1` record. The installed context resolver and tracker operations do not yet support first-class idea records.

