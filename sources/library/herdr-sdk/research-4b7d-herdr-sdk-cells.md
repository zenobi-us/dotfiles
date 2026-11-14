---
authored: true
description: Authored SDK research; vendor evidence, runtime observations, and proposed design are distinguished.
fetched_at: 2026-11-14
id: research-4b7d-herdr-sdk-cells
linked_from: []
source: herdr-sdk
title: Herdr SDK cell and view boundaries
type: Research
url: https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/defaults/herdr.d.ts
---

# Herdr SDK cell and view boundaries

Purpose: Distinguish application dataflow cells from the SDK's retained views and explicit invalidation.
Reader: Herdr mod authors. Date: 2026-11-14. Installed app/core: 0.1.15/0.1.21.

## Thinking

Research slice: Cell naming, dependency tracking, targeted render updates, scheduling, lifetime and isolation.
Skills loaded by researcher: structured-research (confidence), mq-query (Markdown), react-patterns/typescript/ui-design (UI terminology and declarations).
Evidence: installed SDK, vendored runtime source, and Longbridge upstream GPUI Kit documentation. Parent independently retrieved the state guide.

## Research

**LOW — No declared Cell API.** Installed types do not expose `Cell<T>`, signals, or a cell scheduler. Their occurrences of cell refer to table/accessibility/input geometry.
This absence is scoped to inspected installed declarations, not every possible extension or future release.
See [installed context](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L279-L411) and [retained entities](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L535-L585).

**MEDIUM — Explicit notification rather than dependency tracking.** View fields hold ordinary state. Reading a field during render does not subscribe to it. Code changes state and calls notify explicitly.
Installed declarations and [Longbridge's State and Views guide](https://gpui-kit.com/shell/state#cxnotify) agree. The upstream guide explicitly states there are no signals, observables, or automatic dependency tracking.
It also states multiple notifications in one event handler coalesce into one render. Treat this as snapshot invalidation/coalescing, not a transaction or throughput guarantee.

**LOW — Installed targeted update APIs.**

```ts
interface Context {
  notify(target?: Entity): void;
  new(Class: ViewClass, props?: Record<string, any>): Entity;
  spawn(body: (cx: AsyncContext) => unknown, opts?: TaskOptions): Task;
}
interface Entity {
  set_props(props?: Record<string, any>): void;
  release(): boolean;
}
```

`cx.new` creates a retained nested view outside render. `entity.set_props` runs its optional update hook and rebuilds only that child. `cx.notify(entity)` invalidates its description without processing new props.
These are script snapshot boundaries, not promises that the window never repaints or that no layout work occurs elsewhere.
See [targeted notification](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L287-L299), [creation](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L364-L384), and [entity update](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L565-L585).

**LOW — Shared is broad, not cell-scoped.** `herdr.shared(key)` reads persisted app-wide state; `setShared(key,value)` causes every mod to re-render. A key name is not a render subscription boundary.
See [installed shared API](file:///home/zenobius/.config/herdr-app/herdr.d.ts#L396-L400).

**MEDIUM — Async is not parallel CPU execution.** AsyncContext survives await; ordinary Context does not. The upstream state guide says script-visible async work stays on the main thread, with no Worker. Installed sleep/timer declarations identify the foreground executor.
See [async context](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L279-L411) and [upstream async work](https://gpui-kit.com/shell/state#asynchronous-work).
Remote preprocessing therefore matters for high-volume workloads; async code alone does not isolate heavy parsing from UI scheduling.

**LOW — Lifecycle is ownership, not security.** A retained entity can be released; owned tasks have cancellation semantics. View close is root-only; hiding/switching tabs does not close it.
Trusted mods have user-level process/network access, so separating views or JavaScript objects does not separate permissions.
See [view lifecycle](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L550-L585), [task ownership](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L22003-L22007), and [Herdr trust model](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/docs/security.md#L1-L10).

## Verification

All sources accessed 2026-11-14. Different Herdr files remain one publisher. Longbridge is a second publisher for generic GPUI Kit semantics, not independent proof of every Herdr fork addition.

| Claim | Sources | Publisher/type | Confidence | Contradictions/limits |
|---|---|---|---|---|
| No installed Cell abstraction | [Installed SDK](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L279-L411) | Herdr; generated declaration | LOW | API-absence claim limited to inspected version |
| Explicit invalidation; no automatic tracking | [Installed SDK](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L287-L299), [State and Views](https://gpui-kit.com/shell/state#cxnotify) | Herdr declarations; Longbridge official guide | MEDIUM | Upstream may differ from fork |
| Retained children can be targeted | [Installed entity contract](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L565-L585) | Herdr; generated declaration | LOW | No performance benchmark |
| Shared mutation invalidates all mods | [Installed shared API](file:///home/zenobius/.config/herdr-app/herdr.d.ts#L396-L400) | Herdr; generated declaration | LOW | Persistence is app-level, not remote replication |
| Script async is not CPU parallelism | [Async guide](https://gpui-kit.com/shell/state#asynchronous-work), [installed foreground executor](file:///home/zenobius/.config/herdr-app/gpui-kit.d.ts#L377-L390) | Longbridge guide; Herdr declarations | MEDIUM | Native I/O implementations can use background work |
| No privilege isolation | [Security](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/docs/security.md#L1-L10) | Herdr; security docs | LOW | Views are organizational boundaries only |

No UI runtime or redraw benchmark was run. Parent's core protocol smoke does not establish view performance.
[VendorBias] SDK intent and implementation are primarily vendor-owned. [VersionBias] Generic upstream docs are supporting context; installed signatures win.

## Insights

[INFERENCE] Define a logical cell as an application-owned `(machine, job, topic)` unit with bounded incoming state, sequence/cursor, pending request map, connection status and retained child view.
Route events only to the owning unit; notify only its child. Update a separate summary view only when summary values change. Batch replaceable progress before notification.
Keep durable data and heavy computation in the remote worker. Different view entities limit script rebuild scope, not CPU, network, fault, process, or security isolation.
Use explicit cancellation and socket closure; do not assume hiding a panel stops a worker.

## Summary

The SDK has retained views and explicit notification, not reactive cells. It can support an application-defined cell design, but the dispatcher, queues, processing boundaries and remote protocol belong to your implementation.

