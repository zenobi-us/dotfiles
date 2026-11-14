---
authored: true
description: Authored SDK research; vendor evidence, runtime observations, and proposed design are distinguished.
fetched_at: 2026-11-14
id: research-c92f-herdr-sdk-remote-routing
linked_from: []
source: herdr-sdk
title: Herdr SDK remote routing
type: Research
url: https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/defaults/herdr.d.ts
---

# Herdr SDK remote routing

Purpose: Establish which machine owns processes and which APIs route work there.
Reader: Herdr mod authors. Date: 2026-11-14. Installed app/core: 0.1.15/0.1.21.

## Thinking

Research slice: remote identity, execution, lifecycle, and SDK exposure. No source exclusions specified.
Skills loaded by researcher: structured-research (evidence), creating-herdr-app-mods (installed SDK), mq-query (Markdown), shared-context (storage); writing-reports was checked but not applied because this is not screenshot evidence.
Method: installed declarations, pinned Herdr app/core documentation and source, independent JSON-RPC specification; parent ran read-only runtime probes.

## Research

**LOW — Local UI, remote execution.** Mods are trusted JavaScript in the desktop app. A core on each machine owns terminals, programs, history, and files. Closing a viewer does not end a terminal program.
See [app guide](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/defaults/AGENTS.md#L15-L40), [core overview](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/README.md), and [machines guide](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/docs/machines.md).

**LOW — Explicit machine routing.** `herdr.exec(command, args, {on, cwd, timeout})` selects a named core machine. `SpaceInfo.machine` is a local alias, not necessarily its hostname. Remote terminal addresses retain `machine/t7` qualification.
The helper returns `{code, stdout, stderr}`, with 8 MiB output and timeout in milliseconds (30,000 default; 600,000 cap). It does not return the richer raw core result or a persistent subprocess handle.
See [installed signatures](file:///home/zenobius/.config/herdr-app/herdr.d.ts#L4-L35) and [pinned signatures](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/defaults/herdr.d.ts#L4-L35).

**LOW — Different lifecycle APIs.** Core `terminal.run` creates a managed terminal/agent. `machine.exec` runs a bounded nonterminal command and ends its started process tree on completion, timeout, or caller disconnect.
Core's timeout is in seconds; the mod helper's timeout is milliseconds. Do not interchange them.
See [core method definitions](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/crates/herdr-core/src/api.rs), [installed schema via hc schema](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/schema/hc.openrpc.json), and [machines guide](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/docs/machines.md).

**LOW — Projections, not subscription handles.** `herdr.machines()`, `spaces()`, `agents()`, `panes()`, and `terminals()` expose app-maintained live state. `herdr.run(name,args)` invokes app commands; `herdr.hc(args)` runs CLI arguments and returns captured output.
No general core RPC call, core event subscription, or terminal-attach stream handle appears in the installed mod declarations.
See [model APIs](file:///home/zenobius/.config/herdr-app/herdr.d.ts#L134-L221), [CLI helper](file:///home/zenobius/.config/herdr-app/herdr.d.ts#L16-L17), and [app command API](file:///home/zenobius/.config/herdr-app/herdr.d.ts#L46-L79).

**LOW — Core has a richer wire protocol.** `hc connect` exposes newline-delimited JSON-RPC; SSH can carry it remotely. Framed mode multiplexes control RPC on channel 0 and event/terminal streams on allocated channels. This is a core capability, not an installed mod helper.
See [wire protocol](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/schema/README.md#L20-L132).
Core status comes from the program's OSC 7501 reports, not interpretation of terminal text. Kept terminals recover with a fresh shell, not a rerun of the original agent/task.
See [status and recovery](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/schema/README.md).

**LOW — Custom services are separate.** Core has a defined method table. No documented arbitrary-service registration/proxy mechanism was found. Starting a service does not register its custom JSON-RPC methods with core.
[INFERENCE] Use core for lifecycle/status and an explicitly integrated service protocol for domain payloads.

## Verification

All sources accessed 2026-11-14. Herdr files and installed declarations are one publisher. Exact API facts are directly observed but LOW under the requested independent-publisher rubric.

| Claim | Exact source | Type and publisher | Confidence | Contradiction/limit |
|---|---|---|---|---|
| Local app/remote core ownership | [Machines](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/docs/machines.md), [app guide](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/defaults/AGENTS.md#L15-L40) | Official docs; Herdr | LOW | Remote behavior not exercised |
| Remote exec signature | [Installed declaration](file:///home/zenobius/.config/herdr-app/herdr.d.ts#L4-L35) | Generated declaration; Herdr | LOW | Signature is observed; no configured remote |
| Multiplexing/events | [Protocol](https://github.com/herdrdev/herdr-core/blob/c84d6e76156a6c2aac1da20efbe800f10acfe897/schema/README.md#L20-L132) | Official protocol docs; Herdr | LOW | Framed subscription/control exercised locally only |
| Generic JSON-RPC mechanics | [JSON-RPC specification](https://www.jsonrpc.org/specification#request_object) | Standard; JSON-RPC Working Group | LOW | Does not corroborate Herdr routing |
| Missing installed subscription helper | [Installed SDK](file:///home/zenobius/.config/herdr-app/herdr.d.ts) | Generated declaration; Herdr | LOW | Absence scoped to installed surface |

Parent observed app 0.1.15, core 0.1.21, and no configured machines. Plain `terminal.list`/`events.subscribe` succeeded. Framed `events.subscribe` allocated channel 1 while `server.status` still replied on channel 0.
Installed events.subscribe schema has only terminal/children_of/labels filters; upstream guide also documents docs filters. Installed schema wins.
[VendorBias] Official implementation evidence is not independent evaluation. [VersionBias] Pinned master can include unreleased additions.

## Insights

[INFERENCE] Key worker state by machine identity and terminal/job identity. Separate app UI actions from core lifecycle operations and custom service messages.
Use app-maintained projections when they contain enough information. Raw core subscriptions require an additional client/bridge integration, not a long-running captured `hc` call.

## Summary

Remote process management exists. A high-level mod API for persistent core RPC/event channels does not appear in the installed SDK. Preserve machine-qualified addresses and distinguish terminal persistence from process recovery.

