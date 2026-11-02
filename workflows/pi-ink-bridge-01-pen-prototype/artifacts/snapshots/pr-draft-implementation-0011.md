---
title: Prove Paper Pro pen input — attempt 4
type: Report
---

# Prove Paper Pro pen input — attempt 4

## Status

Failed probe attempt; ticket implementation remains blocked and claimed. Device restoration passed. No source implementation or runtime accessibility proof was produced.

## Problem and result

The approved probe sought metadata-only runtime accessibility for Library, DocumentImporter, DocumentController, NavigationManager.exportManager, and the existing DocumentView. The host-built ARM64 extension passed source review, build, and ABI inspection. The target Qt library is 6.10.3; the toolchain uses Qt 6.10.

Installation and the extension hash check succeeded. The remote load command failed because `timeout` is absent. Neither the intended load restart nor the trap's initial rollback restart executed. The trap removed only the probe. A separate host-bounded cable SSH command completed the required restoration restart of only `xochitl`.

No probe callback ran. No journal was collected. Singleton resolution and DocumentView availability remain unknown. DocumentViewListener still has static metadata only; QML exposure remains unproved. No native import/export/library method or document value was read or invoked.

## Restoration

`xochitl` is active; the probe path is absent. The final allowlisted snapshot matches the pre-install snapshot byte for byte: stock binary, XOVI loader and scripts, all six pre-existing extension hashes/listings, service file hashes, combined service configuration hash, and drop-in paths. The stock binary retains SHA-256 `b1816408cf90b19e448c70082625c4d6a36060368706eb7a9b35425428a9a021`.

Exactly zero load restarts and one restoration restart executed. No QML patch, settings change, broad XOVI start, document operation, cloud/account/network change, or unrelated service restart occurred. Temporary host source, binaries, build files, and the newly pulled toolchain image were removed.

## Validation and changed files

The upstream RMPP Podman cross-build exited 0. ELF inspection confirmed ARM aarch64, XOVI exports, Qt 6.10 dependency, and build ID `759ffbdead1bc33d717f76db275bb27b05bc2e97`. Deployment returned 91 after its missing-command failures. The recovery restart and read-only final snapshot verification exited 0.

Only BASE workflow evidence, this snapshot, implementation-0011, manifest, and projections changed. Source remains commit `564c037546911f6e26936383b63eab9129819b97`, tree `57df0dbb0fb91fa3da0716f1c3a62460906c96eb`, branch `prototype/pi-ink-bridge-01-pen-prototype`, base `master`. No browser builds, unrelated tests, or HTTP smoke were rerun.

## Exact next prerequisite

Another probe cycle needs renewed scoped approval and owner confirmation that documents remain saved and closed. Use host-side deadlines, not the unavailable target `timeout` command. No second cycle or extra restart is authorized by this result.

Safe local annotated-export initiation remains unknown. Runtime method availability alone cannot establish save/Send, actual marked PNG output, source dimensions, editable-work preservation, cancellation, isolation, LAN transfer, or owner pen/palm/edge/orientation quality. Synthetic import/export and hardware acceptance remain separate, unexecuted gates.

## Review history and findings

Earlier two-axis reviews remain in the canonical ticket and prior immutable snapshots. The failed native drawing experiment passed record-accuracy review only, not pen latency. Stock-editor feasibility and cable-free diagnostics passed only their bounded evidence scopes. No current implementation SUCCESS verdict exists. No finding was resolved. No merge, push, ticket completion, or new production integration occurred.

## Supporting evidence

- **Evidence:** [Build and source-review record](../evidence/implementation-0011/build.json).
- **Evidence:** [Failed deployment command/output](../evidence/implementation-0011/execution.json).
- **Evidence:** [Restoration and byte-equal verification](../evidence/implementation-0011/restoration.json).
- **Evidence:** [Findings and limits](../evidence/implementation-0011/findings.json).
- **Evidence:** [Disposable payload cleanup](../evidence/implementation-0011/cleanup.json).
- **Result:** [implementation-0011](../../events/implementation-0011.yaml).
- **Prior draft:** [Corrected attempt-3 snapshot](pr-draft-implementation-0008-links-0009.md).
- **Native evidence:** [Static interface targets](../evidence/implementation-0008/native-interfaces.json).
- **Ticket:** [Canonical requirements and review comments](../../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md).

## Full receipt history

- **start-0001:** start / phase-start / started. [Receipt](../../events/start-0001.yaml).
- **start-complete-0003:** start / phase-complete / blocked. [Receipt](../../events/start-complete-0003.yaml).
- **start-0004:** start / phase-start / started. [Receipt](../../events/start-0004.yaml).
- **implementation-0005:** implementation / phase-result / blocked. [Receipt](../../events/implementation-0005.yaml).
- **start-complete-0006:** start / phase-complete / blocked. [Receipt](../../events/start-complete-0006.yaml).
- **start-0007:** start / phase-start / started. [Receipt](../../events/start-0007.yaml).
- **implementation-0008:** implementation / phase-result / blocked. [Receipt](../../events/implementation-0008.yaml).
- **start-complete-0009:** start / phase-complete / blocked. [Receipt](../../events/start-complete-0009.yaml).
- **start-0010:** start / phase-start / started. [Receipt](../../events/start-0010.yaml).
- **implementation-0002:** Preserved source-local result and archived history; historical cross-checkout envelope unchanged. No receipt repair or copying occurred.

## Parent action

Validate this failed result and restoration evidence, append parent completion, and close pane `w6G:p2`. Do not dispatch review or claim ticket completion.

