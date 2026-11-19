---
date: 2026-11-19
description: User-confirmed choices for the target-owned tracker rewrite
title: Confirmed tracker replication decisions
type: Concept
---

# Confirmed tracker replication decisions

Record the user’s confirmed architecture choices before and after the SyncedStore mod experiment.

Date: 2026-11-19. Status: confirmed choices, not implementation approval.

These choices are consolidated in [the rewrite proposal](target-owned-tracker-replication.md). The experiment report separately establishes its tested runtime scope.

## Source authority

The synchronized store holds a derived tracker view. Routed source records, tracker adapters and Git evidence remain authoritative. Desktop actions change target sources through explicit commands.

## Runtime scope

Use the existing Herdr Core and app interfaces. Do not change Core or the app. The tracker replica stays inside the mod.

A local transport-only helper is allowed. It carries WebSocket frames but owns no Yjs document, SyncedStore instance, tracker projection or tracker parser.

Each target provides a private WebSocket endpoint that the local machine can reach. Remote execution obtains connection information and access grants. It is not the ongoing data channel.

## Store scope and lifetime

Use `<prefix>-<slugified-machine-id>` as the machine store namespace. Keep separate checkout documents. Synchronize the selected checkout only.

The target keeps registered checkouts indexed until explicitly unregistered. It continuously indexes all tracker details, including workflow state. Selecting a record must not start a remote detail read.

## Local behavior

Persist the replica and show its last synchronized state when the target is offline. Mark that state offline. Keep target actions unavailable while disconnected.

Panels showing the same target checkout share one replica and connection. Each panel keeps its own selection, filters and layout.

## Access and publication

Existing authenticated remote-execution access authorizes a read-only subscription to the selected checkout. No separate desktop approval list is required.

Publish completed record groups without waiting for a checkout-wide update. Commit related fields together and expose pending derivations. Different groups can reflect different source observation times.

## Transport detail examined by experiment

The user selected a WebSocket transport helper. The experiment subsequently proved a helper-backed WebSocket adapter using held local HTTP requests. The consolidated design uses this demonstrated bridge without introducing another tracker synchronization implementation.

The experiment used real SyncedStore, Yjs and y-websocket libraries inside the mod. The helper-backed WebSocket adapter supplied the missing runtime network interface. The helper remained a frame relay.

## Experiment acceptance

Prove initial synchronization, live creation/edit/deletion, reconnect with missed changes, representative binary transfer, shared-panel lifetime and rejection of desktop writes. Exercise the visible mod in an isolated window. Keep process cleanup and acceptance verdicts separate.

A failure must not be hidden by moving the replica into the helper or changing Core/app interfaces.
## Experiment finding

The authorized experiment passed local runtime feasibility with the replica inside the actual GPUI mod and a transport-only helper. Read the [reviewed result and limitations](syncedstore-mod-experiment.md). The experiment used held local HTTP requests inside the WebSocket adapter. The user then approved consolidation of the design, not production implementation.
## Decisions confirmed after the experiment

### Action feedback

Send desktop commands to the target. Show a pending indicator while they run. Display the new record state only after the target publishes it. Do not optimistically mutate the tracker replica.

### Normal target restart

Persist and restore the target document history. After restart, reconcile source changes and publish updates. A normal restart does not replace every desktop replica with a new document.

### Registration trigger

Opening a tracker panel registers its selected checkout automatically. The target continues indexing that checkout until the user explicitly unregisters it.

### Invalid source records

If a source record becomes invalid, retain its last valid state with an explicit source error. Disable its actions until the source becomes valid again.

### Transport recovery

The transport helper owns temporary frame queues, not a durable frame journal. After helper failure or queue loss, reconnect and use Yjs state-vector synchronization to recover missing state. Durable document state belongs to the target and mod.
### Action concurrency

If relevant sources changed after an action appeared, revalidate the exact requested action against current target sources. Execute it only if its conditions still hold. Otherwise return the conflict. Do not overwrite conflicting edits or substitute a different action.
