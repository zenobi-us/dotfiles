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

- **Evidence:** [Build and source-review record](../artifacts/evidence/implementation-0011/build.json).
- **Evidence:** [Failed deployment command/output](../artifacts/evidence/implementation-0011/execution.json).
- **Evidence:** [Restoration and byte-equal verification](../artifacts/evidence/implementation-0011/restoration.json).
- **Evidence:** [Findings and limits](../artifacts/evidence/implementation-0011/findings.json).
- **Evidence:** [Disposable payload cleanup](../artifacts/evidence/implementation-0011/cleanup.json).
- **Result:** [implementation-0011](../events/implementation-0011.yaml).
- **Prior draft:** [Corrected attempt-3 snapshot](../artifacts/snapshots/pr-draft-implementation-0008-links-0009.md).
- **Native evidence:** [Static interface targets](../artifacts/evidence/implementation-0008/native-interfaces.json).
- **Ticket:** [Canonical requirements and review comments](../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md).

## Full receipt history

- **start-0001:** start / phase-start / started. [Receipt](../events/start-0001.yaml).
- **start-complete-0003:** start / phase-complete / blocked. [Receipt](../events/start-complete-0003.yaml).
- **start-0004:** start / phase-start / started. [Receipt](../events/start-0004.yaml).
- **implementation-0005:** implementation / phase-result / blocked. [Receipt](../events/implementation-0005.yaml).
- **start-complete-0006:** start / phase-complete / blocked. [Receipt](../events/start-complete-0006.yaml).
- **start-0007:** start / phase-start / started. [Receipt](../events/start-0007.yaml).
- **implementation-0008:** implementation / phase-result / blocked. [Receipt](../events/implementation-0008.yaml).
- **start-complete-0009:** start / phase-complete / blocked. [Receipt](../events/start-complete-0009.yaml).
- **start-0010:** start / phase-start / started. [Receipt](../events/start-0010.yaml).
- **implementation-0002:** Preserved source-local result and archived history; historical cross-checkout envelope unchanged. No receipt repair or copying occurred.

## Parent action

Validate this failed result and restoration evidence, append parent completion, and close pane `w6G:p2`. Do not dispatch review or claim ticket completion.

## Historical attempt-3 draft — not current authorization

# Prove Paper Pro pen input — attempt 3

## Status

Blocked. No source files changed. The ticket remains claimed. No hardware acceptance or production approval is claimed.

## Problem and result

The stock-editor workflow needs native library import, current-document context, and local annotated export. Cable-connected read-only firmware inspection found concrete import and context candidates. It did not establish a callable local export-start contract, annotation flush ordering, or source geometry.

Installed firmware: `3.28.0.172`. `/usr/bin/xochitl`: SHA-256 `b1816408cf90b19e448c70082625c4d6a36060368706eb7a9b35425428a9a021`, ELF build ID `aae326b4f843a6672b1aee940bfb2736dacdbb2a`.

## Native interface evidence

- **Library import:** Qt metadata declares `bool DocumentImporter::importFromUrls(QList<QUrl> urls, entry::Id parentId)` and imported/failed/finished signals. No import was invoked.
- **Folder creation:** `Library::createCollection(entry::Id parentId, QString visibleName)` returns `entry::Id`. Installed stock QML uses this result. No folder was created.
- **Editor context:** Stock `DocumentView.qml` binds `root.document`, assigns it on open, and clears it on close. Its toolbar exports `Library.entityIdForEntry(document)`. Runtime binding and document switching remain untested.
- **Context listener:** `DocumentViewListener` has `openedDocumentId` and opened/closed signals. Its QML exposure is not established.
- **Annotated export:** `ExportManager.exportPagesFromDocument` requires a registered navigation target. It does not accept a local path. `DocumentWorker.exportFinished` and `ExportTask.filesReady` expose completion, but no public local start method was found in their Qt metadata.
- **Excluded paths:** Cloud email, private document copies, LastOpen polling, USB web probes, and original-PDF upload are not substitutes.

The share-control hash `15180122603616572528` resolves to `/src/xofm/bundles/papertablet.json`. Offline decompression independently recovered the editor export call site.

## Validation

Cable SSH read firmware identity, binary hashes, loader scripts, and safe resource paths. Host-only SCP copied the installed application binary and QML hash table. Offline ELF, Qt metadata, and zstd inspection produced the [interface extracts](../artifacts/evidence/implementation-0008/native-interfaces.json). [Findings](../artifacts/evidence/implementation-0008/findings.json) record commands, outcomes, and limits.

BusyBox rejected `find -printf`; the corrected `-print` command listed loader files. `/opt` is absent. These discovery errors did not prevent firmware inspection. No browser build, tests, HTTP replay, runtime notebook access, installation, restart, import, export, or cloud change ran.

## Required approval

Ask the parent to obtain separate approval for one temporary ARM64 XOVI metadata-only extension: `/home/root/xovi/extensions.d/pi-ink-interface-probe.so`. Restart only `xochitl` once to load it and once after removal. The owner must save and close documents before each restart.

The probe may resolve native singleton objects and emit only class names, method signatures, property types, and resolution success. It must not invoke import/export/library operations or read document values, IDs, titles, paths, contents, passwords, or library listings. Read only uniquely prefixed probe output, not general device logs. No QML patch or service configuration change is requested.

Rollback: remove only the probe extension, restart `xochitl` after owner confirmation, confirm file absence and the unchanged stock binary hash. Preserve all existing extensions. Do not execute the broad XOVI `start` script.

This approval would establish runtime accessibility only. Synthetic import/export needs a separate scope after the local export contract exists.

## Remaining acceptance

All end-to-end criteria remain unpassed: pairing and server folders; cable-free authenticated LAN HTTPS/WebSocket receipt; stock library visibility; actual marked flattened PNG at source dimensions; editable work preservation; save distinct from Send; document/server/job isolation; terminal cancellation; and owner latency, palm, edge, scale, and orientation verdicts. No source implementation or speculative adapter was added.

## Changed files and source identity

Only attempt-3 evidence, receipt, immutable snapshot, manifest, and projections changed in the base store. Source remains `564c037546911f6e26936383b63eab9129819b97`, tree `57df0dbb0fb91fa3da0716f1c3a62460906c96eb`, branch `prototype/pi-ink-bridge-01-pen-prototype`.

## Review history and findings

The canonical ticket preserves the earlier two-axis review comments. The failed native drawing experiment passed review only for record accuracy; it did not pass pen latency. Stock-editor feasibility and cable-free diagnostics passed only their bounded evidence scopes, not implementation acceptance. No current implementation SUCCESS verdict exists. No acceptance finding is resolved by this attempt.

## Supporting history

- **Attempt 1:** [start-0001](../events/start-0001.yaml), retained source-local `implementation-0002` and stock-editor-hooks-001 evidence, and [start-complete-0003](../events/start-complete-0003.yaml). The historical cross-checkout envelope remains unchanged.
- **Attempt 2:** [start-0004](../events/start-0004.yaml), [implementation-0005](../events/implementation-0005.yaml), [snapshot](../artifacts/snapshots/pr-draft-implementation-0005.md), [evidence](../artifacts/evidence/stock-editor-attempt-002/findings.json), and [start-complete-0006](../events/start-complete-0006.yaml).
- **Attempt 3:** [start-0007](../events/start-0007.yaml), [implementation-0008](../events/implementation-0008.yaml), and [immutable snapshot](../artifacts/snapshots/pr-draft-implementation-0008.md).

## Merge status

Not merged or pushed. Ticket completion is not requested. Parent must validate this blocked result, append completion, and close the pane. Obtain the scoped probe approval before device mutation.

## Primary sources

- **Source:** https://github.com/rmitchellscott/rm-librarian/blob/5b68a00616cc99089d27d3be3ede6ea9d0fa6243/src/main.cpp
- **Source:** https://github.com/rmitchellscott/xovi-qmd-extensions/blob/ba86ebd3878e8a98166c6952f5481a431afaca22/3.28/createDocumentFromPages.qmd
- **Source:** https://github.com/rmitchellscott/xovi-qmd-extensions/blob/ba86ebd3878e8a98166c6952f5481a431afaca22/3.28/share-button-to-menu.qmd
- **Source:** https://api.github.com/repos/asivery/rm-xovi-extensions/contents/qt-resource-rebuilder
