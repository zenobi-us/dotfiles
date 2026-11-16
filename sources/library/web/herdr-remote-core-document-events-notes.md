---
source: "web"
id: "herdr-remote-core-document-events-notes"
title: "Reuse Herdr Core connections for shared-context updates"
url: "https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/schema/README.md"
fetched_at: "2026-11-14T07:59:48Z"
linked_from: []
type: "Concept"
authored: true
status: "researched-not-implemented"
evidence: "herdr-remote-core-document-events-probe.json"
---

# Reuse Herdr Core connections for shared-context updates

Purpose: Select a supported transport for remote shared-context state and progress updates.
Reader: Agents and maintainers implementing the shared-context panel and its loaders.
Checked: 2026-11-14; Herdr app 0.1.15 and Core 0.1.21.

## Overview

Core already carries remote document-change events over its existing machine connection. A separate Server-Sent Events (SSE) or WebSocket transport is unnecessary for state and progress notifications. The missing interface is the public mod software development kit (SDK), not the Core transport.

Recommendation: expose machine-scoped document reads, writes, and managed watches through the app SDK. Reuse the app's existing Core client. This is a proposed extension, not an implemented mod API.

This note records authored research and a live protocol probe. It is not a fetched copy of the upstream documentation. Do not replace it when refreshing those sources.

## Use the existing Core connection

| Layer | Verified interface | Boundary |
|---|---|---|
| Remote helper | `hc connect` to its local Core | JSON-RPC 2.0 over standard input/output; no service listening port |
| Core | `doc.get`, `doc.set`, `events.subscribe` | Remote calls use `on`; document events use the existing machine connection |
| Herdr app | Internal `Core::call` and `Core::subscribe` | Already used for remote layout synchronization |
| QuickJS mod | `exec`, `hc`, direct TCP/WebSocket clients | No public Core document or subscription binding in the installed SDK or inspected app checkout |

The connection sequence is:

1. Establish the machine through Herdr's configured SSH or `--via` connection. `machine.connect` reconnects a known machine; it does not return a generic socket handle.
2. Subscribe to document events before reading current state. Herdr app already owns a Core subscription internally.
3. Read the current document with `doc.get`, using `on` for the selected machine.
4. Have the remote helper publish a new value with `doc.set` and the current version.
5. On a matching document event, fetch its new value and update the panel's QuickJS cache.

An external client can initiate a Core protocol connection with:

```sh
hc connect
```

This opens a new local client connection, not the app's private client handle. Core still reuses its existing remote machine connection. A direct `ssh host hc connect` instead opens a separate SSH connection; it is not the connection-reuse path proposed here.

These are existing Core JSON-RPC messages, not callable JavaScript mod SDK functions:

```json
{"jsonrpc":"2.0","id":1,"method":"events.subscribe","params":{}}
{"jsonrpc":"2.0","id":2,"method":"doc.get","params":{"name":"shared-context-state","on":"selected-machine"}}
```

Use separate connections for these two messages in plain mode: after `events.subscribe`, that connection carries notifications only. Framed mode multiplexes requests and subscription channels on one connection, as the app's internal client does.

The remote helper can read its local document version, then publish with:

```json
{"jsonrpc":"2.0","id":3,"method":"doc.set","params":{"name":"shared-context-state","version":0,"value":{"phase":"reading","completed":3,"total":7}}}
```

Version zero is valid only for an unwritten document. Read the actual version before updating an existing document. Namespace real document names by repository and follow Core's name rules.

The event contains the document name and version, not its contents. A forwarded event also identifies the machine. The actual observed event is preserved in the [verified probe result](herdr-remote-core-document-events-probe.json).

## Verified behavior

The probe used installed Core 0.1.21. It created two private Core instances with separate HOME, XDG directories, and session identities. A configured `machine add --via` connection linked them on the same host. It did not use a physical SSH host or change the desktop Core.

The probe verified:

- **Remote publication:** a write on the remote Core produced a pushed local event with `machine: "probe-remote"`, document name, and version.
- **Remote reads:** a local `doc.get` with `on` returned the exact remote JSON value and version.
- **Reverse writes:** a local `doc.set` with `on` updated the remote document and produced another event.
- **Version protection:** a stale write was rejected with a conflict.
- **Transport reuse:** the test opened no separate service listening port.
- **Cleanup:** both private Core instances and their scratch directories were removed.

[Machine-readable probe evidence](herdr-remote-core-document-events-probe.json) preserves the synthetic values, events, versions, and assertions. The temporary probe script was removed. The evidence is not a reusable test runner.

Not verified: a physical SSH host, reconnect recovery, throughput, large snapshot transfer, or an end-to-end QuickJS document watch. The proposed SDK binding does not exist yet.

## Constraints and recommended SDK work

- **Payload limit:** each document is limited to 1 MiB of serialized JSON. Use small progress/index documents and separate record documents or bounded chunks for larger snapshots.
- **Versioned state:** document writes persist atomically and use compare-and-set versions. Coalesce progress updates; do not treat documents as a high-volume transient event log.
- **Resynchronization:** subscribe before the initial read. Reread after reconnects or missed notifications. Do not assume disconnected changes are replayed or that subscription snapshots include documents.
- **Installed filtering:** Core 0.1.21's installed schema has no `docs` parameter on `events.subscribe`. Use an unfiltered subscription and filter document events in the app. Current upstream documentation describes newer document-name filters; do not assume those exist in the installed version.
- **SDK scope:** add machine selection, document reads/writes, and cancellable app-managed document watches. Forward relevant events from the app's existing subscription rather than creating one connection per panel or document.
- **Direct networking:** installed `net.connect(host, port)` and `WebSocket.connect(url, options)` connect from the local app process. They have no Herdr machine selector. The installed `fetch` API returns completed text/JSON and exposes no streaming body or `EventSource`.
- **Execution is not streaming:** `exec` and `hc` return completed output. A long-running SSE client inside `exec` is not an incremental event transport. Core also bounds execution duration and output.
- **No generic tunnel:** Core documents provide state notifications, not arbitrary helper RPC, TCP/Unix forwarding, or an SSE/WebSocket tunnel. Terminal labels and PTY output are not substitutes for a supported service channel.
- **Reuse domain rules:** keep route resolution with `shared-context` and snapshot/workflow rules with `worktree`. The helper should reuse canonical loaders. The app SDK owns delivery and cancellation; QuickJS owns presentation and cached indexes. Revalidate before executing actions.

The earlier suggestion to add a separate WebSocket transport is superseded for this state-update use case. General helper RPC would need a separate design if document state is insufficient.

## Sources

Source claims were checked against the installed interfaces and these pinned implementation revisions:

- [Core protocol: connection modes, events, and documents](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/schema/README.md). The installed `hc schema` reported version 0.1.21 and confirmed the document methods and limits. The upstream document-filter addition is not in that installed schema.
- [Core remote connection and event relay](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/crates/herdr-core/src/remote.rs).
- [App-owned Core subscription, `src/hc.rs:480-491`](https://github.com/herdrdev/herdr-app/blob/ce0fd1b245a7fdaa4e6c9e3c7ddac23ddbb1e799/src/hc.rs#L480-L491).
- [Remote-aware document reads and writes, `src/mirror_sync.rs:74-107`](https://github.com/herdrdev/herdr-app/blob/ce0fd1b245a7fdaa4e6c9e3c7ddac23ddbb1e799/src/mirror_sync.rs#L74-L107).
- [Mod host registration, `src/mods.rs:933-1156`](https://github.com/herdrdev/herdr-app/blob/ce0fd1b245a7fdaa4e6c9e3c7ddac23ddbb1e799/src/mods.rs#L933-L1156) and [mod API declarations](https://github.com/herdrdev/herdr-app/blob/ce0fd1b245a7fdaa4e6c9e3c7ddac23ddbb1e799/defaults/herdr.d.ts).
- Installed generated interfaces inspected: `~/.config/herdr-app/herdr.d.ts` and `~/.config/herdr-app/gpui-kit.d.ts`, especially the latter's lines 22154-22202. Those files are regenerated by the app; the version boundary above is part of this finding.
