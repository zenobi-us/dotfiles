---
title: Pi Ink retained prototype implementation reconciliation
type: Report
---

# Pi Ink retained prototype — implementation reconciliation

## Target and scope

Ticket: `tracker/tickets/pi-ink-bridge-01-pen-prototype.md`.
Source: `8cc3cb89c7aa50ea0862a83763edc0a339d69eb9`; tree `25872168b7dff239a95e876827916b77c3b41001`.
Branch: `prototype/pi-ink-bridge-01-pen-prototype`; base: `master`.

This result reconciles existing implementation, not a fresh implementation or acceptance review.
The prototype connects the authenticated client/server transport to the normal stock editor.
It retains native pairing, folder associations, current-document binding, status and explicit Send.
The stock editor owns drawing and editable work. The desktop flattens the annotated PDF to PNG.

## Source changes

The prior host-only result covered `ff7cb07414b2c907a1aeec24c1f14888cf1a959a`.
Seven later commits repair pairing, Qt JSON charset, charging-only USB policy, version display, diagnostics, exact native receipt filenames and stable import rows.
The delta touches16 files. This reconciliation changes no source files.
The [source reconciliation](../evidence/ticket-01-closeout-0115/source-reconciliation.json) lists every commit and changed path.

## Deployment identity

| Asset | Recorded deployed SHA-256 | Source mapping |
|---|---|---|
| Go0.3.1 | `e8f7229377dac89d7a980c9b9f0cbec67dbf3defec39e1704c4eab09be5b4eca` | Built from8b529; client source unchanged at8cc |
| QML | `35dd84aab86e7982a679e6a29dabcb374016bb43729c567897e0740893354b07` | Exact current source8cc |
| QMD | `c88ac812e2df0191d6d047235c225a960d1b997f149dcf6540e411cf6e660fbe` | Exact current source; unchanged sinceff7cb074 |
| Adapter `.so` | `aeba9fc3d8aa816bda0db8c08d4cc5929a677a83f5e8e14b02a39bc70aef5c4f` | Verified retained candidate member; adapter source unchanged |

The tracked `.xovi` file is generator input, not the deployed `.so`.
No reproducible rebuild or fresh device inventory is claimed.

## Retained validation and real proof

- **Host validation:** Prior0049 records passing host suites and simulated native integration.0081 records Go/race, gateway tests, typecheck, ARM64 build and real diagnostic transport smoke.
- **QML regression:**0089 records reordered-press failure before and success after the stable-row repair, plus bound reimport refusal. It does not uniquely establish the historical physical tap cause.
- **Actual native Send:** [Outcome0101](../evidence/tablet-activation-0054/native-send-0101-outcome.json) records an800x1000 A PNG reaching its real originating `image_editor` call. Its digest matches `4d9e07c2ab14d19b1bc37851956ebfc8e27a522d10b38bbbb4f8d371eafe9806`; B remained pending.
- **Returned content:** The retained PNG was hash-checked and visually inspected during reconciliation. Centre A, four edge marks, grid and corner markers are visible.
- **Terminal cancellation:** [Outcome0111](../evidence/tablet-activation-0054/originating-request-cancellation-0111-outcome.json) records real B cancellation without an image. [Owner confirmation0112](../evidence/tablet-activation-0054/native-terminal-cancellation-0112.json) records cancelled status, disabled Send and editable work after normal reopen.
- **Normal stock drawing:** Owner proof0087 records pen/palm, erase/Undo, zoom/orientation and save/reopen without completing the request.0102 confirms editable A after Send.

No builds, tests, lint, formatters or device operations ran in this reconciliation.

## Owner-authorized retained state

[Closure authorization](../evidence/ticket-01-closeout-0115/closure-authorization.json) authorizes the retained-prototype acceptance amendment and independent review before closure.
The owner chose to retain the prototype and preserve tripletap and stock work.
No removal, restoration or production-readiness pass is claimed.
Parent owns the canonical acceptance amendment and updated XOVI/AppLoad metadata.

## Limits and remaining gates

- **Lifecycle:** Full OS boot107 preserved assets/state but did not recreate runtime activation. Probe108 measured private stock81 in a mods-enabled session without a fresh kernel boot. Approved109 started only owned transient Go once.
- **Unsupported boundaries:** Automatic Go startup, production recovery and firmware-update activation are not implemented or proved. Only firmware3.28.0.172 and one paired server were tested.
- **Clipping:** Actual native A used the no-clipping path. Positive outside-source confirmation/invalidation remains untested on hardware.
- **Physical display:** Drawing foldout shows server/status/Send, not UUID. Correction0100 retracts the earlier physical UUID-display assertion.
- **Review and finish:** Independent whole-ticket review remains pending. Parent must complete amendment/metadata, validate the child result and shutdown, then own integration, publication and closure.

Latest reviewer verdict: none. Merge, push and ticket completion: false.

## Durable result

[Implementation receipt0052](../../events/implementation-0052.yaml) records exact-source implementation completion and provenance.
Older receipts and evidence remain unchanged. Projections are parent-owned and intentionally untouched.

