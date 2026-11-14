---
authored: true
description: Authored SDK research; vendor evidence, runtime observations, and proposed design are distinguished.
fetched_at: 2026-11-14
id: research-731a-herdr-sdk-streaming
linked_from: []
source: herdr-sdk
title: Herdr SDK streaming transport
type: Research
url: https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/defaults/herdr.d.ts
---

# Herdr SDK streaming transport

Purpose: Identify real bidirectional transports and their routing/buffering limits.
Reader: Herdr mod authors. Date: 2026-11-14. Installed app/core: 0.1.15/0.1.21.

## Thinking

Research slice: HTTP, TCP, WebSocket, subprocess output, and core RPC availability.
Skills loaded by researcher: structured-research (method), mq-query (Markdown), typescript (declarations), research (primary sources). No dedicated JSON-RPC skill was available.
Installed declarations govern installed signatures. Pinned runtime code supplies implementation bounds, not a guarantee of identical installed binary internals.

## Research

**LOW — Installed client APIs.** See [installed declarations](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L22124-L22202).

```ts
import { connect } from "net";
import { WebSocket } from "websocket";

// Actual declared surfaces, summarized:
// connect(host: string, port: number): Promise<Socket>
// Socket.read(maxBytes?): Promise<Uint8Array | null>
// Socket.write(data: string): Promise<void>
// Socket.close(): void
// WebSocket.connect(url, {headers?}?): Promise<WebSocketSocket>
// socket.read(): Promise<string | Uint8Array>
// socket.write(data: string | Uint8Array): Promise<void>
// socket.close(): Promise<void>
```

These sockets originate from the desktop app. They have no `on` parameter and do not automatically use an existing Herdr machine's SSH connection.
`WebSocket` is an imported module object, not the browser global constructor. No Node child_process API is declared.

**LOW — Buffered helpers are not event streams.** `fetch` returns only text/json accessors, not a body reader. `process.run(command,args)` returns code/stdout/stderr. `herdr.exec(...,{on})` and `herdr.hc(args)` return captured results, not persistent stdin/stdout handles.
See [installed execution declarations](file:///home/zenobius/.config/herdr-app/herdr.d.ts#L4-L18) and [installed runtime declarations](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L22124-L22202).

**LOW — Pinned implementation bounds.** HTTP buffers bodies, limits them to 8 MiB, and uses a 30-second timeout. TCP limits each read/write to 1 MiB, defaults reads to 64 KiB, and uses 30-second I/O timeouts. TCP has no declared TLS/listener/Unix-path API.
WebSocket supports ws/wss, an 8 MiB message limit, and queue limits of eight outgoing commands/eight incoming messages. The implementation rejects excess queued work and closes on incoming queue overflow; this is not an unbounded lossless event log.
See [HTTP implementation](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/vendor/gpui-kit/crates/shell/src/engine/quickjs/standard/fetch.rs), [TCP implementation](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/vendor/gpui-kit/crates/shell/src/engine/quickjs/standard/net.rs#L20-L85), and [WebSocket constants](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/vendor/gpui-kit/crates/shell/src/engine/quickjs/standard/websocket.rs#L31-L38).

**LOW — Core transport is a different API layer.** Core supports JSON-RPC and push events, but installed mod types expose neither a raw core connection nor event/attach subscriptions. Calling `hc(["events"])` still collects command output; it is not a subscription object.
Plain core event subscription consumes that connection for notifications; framed mode allows control RPC alongside allocated event/terminal channels.
See [core protocol](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/schema/README.md#L20-L132) and [mod helper signatures](file:///home/zenobius/.config/herdr-app/herdr.d.ts#L4-L18).

**LOW — Lifecycle requires explicit ownership.** Views can start async tasks with owner-bound context, and a root close hook permits bounded cleanup. `Task.cancel()` leaves its promise pending; it does not declare socket closure. Hiding a tab is not a close event.
See [view lifecycle](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L550-L558), [task ownership](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L22003-L22007), and [Task](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L20604-L20608).

## Verification

All sources accessed 2026-11-14. Herdr app/core source and bundled declarations count as one publisher, not independent confirmations.

| Claim | Source | Publisher/type | Confidence | Contradictions/limits |
|---|---|---|---|---|
| TCP/WebSocket signatures | [Installed SDK](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L22154-L22182) | Herdr; generated declarations | LOW | No socket mod was runtime-tested |
| TCP I/O bounds | [net.rs](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/vendor/gpui-kit/crates/shell/src/engine/quickjs/standard/net.rs#L20-L85) | Herdr; implementation | LOW | Upstream source, not binary introspection |
| WebSocket message/queue bounds | [websocket.rs](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/vendor/gpui-kit/crates/shell/src/engine/quickjs/standard/websocket.rs#L31-L38) | Herdr; implementation | LOW | Fixed queues can overflow |
| Buffered command helpers | [herdr.d.ts](file:///home/zenobius/.config/herdr-app/herdr.d.ts#L4-L18) | Herdr; generated declaration | LOW | No incremental stdin/stdout contract |
| Core transport vs mod surface | [protocol](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/schema/README.md#L20-L132), [SDK](file:///home/zenobius/.config/herdr-app/herdr.d.ts) | Herdr; official docs/declarations | LOW | Same publisher; no direct SDK bridge |
| Generic two-way WebSocket messages | [RFC6455 section 1.2](https://www.rfc-editor.org/rfc/rfc6455.html#section-1.2) | IETF; standards-track RFC | LOW | Standard does not establish SDK behavior |

Parent read-only smoke confirmed framed event subscription and control calls coexist. No remote machines were configured. Socket throughput, overflow, reconnect, and shutdown behavior were not runtime-exercised.
Capability-gated wording in generic types does not imply Herdr prompts for every network request: [Herdr security docs](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/docs/security.md#L1-L10) explicitly describe trusted mods.
[VendorBias] Product claims remain first-party. [VersionBias] Installed and upstream details can differ.

## Insights

[INFERENCE] Use an explicitly reachable WebSocket worker service for structured bidirectional messages. Implement request-ID correlation, per-job routing, bounded queues, cancellation and reconnect policy at the application layer.
A local bridge or explicit SSH tunnel is necessary if the service is accessible only on the remote machine's loopback address. The installed SDK does not automatically provide it.
For lossless events, remote retention/acknowledgement/replay must be part of the worker protocol; terminal repaint recovery is not equivalent.

## Summary

WebSocket and TCP provide bidirectional client I/O. Remote exec and fetch are bounded result helpers. Existing core machine connections, event subscriptions, and multiplexed channels are not directly exposed to installed mods.

