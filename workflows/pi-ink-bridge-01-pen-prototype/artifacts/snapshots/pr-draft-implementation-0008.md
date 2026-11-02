---
title: Prove Paper Pro pen input — attempt 3
type: Report
---

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

