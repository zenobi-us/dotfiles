---
title: Prove Paper Pro pen input — implementation-0017
type: Report
---

# Prove Paper Pro pen input — implementation-0017

## Status

**Full ticket: blocked.** The repository-only clipping gate is implemented and exercised. The canonical ticket remains claimed. This manual browser PDF import is not tablet current-document integration.

## Problem

The stock editor can export visible marks beyond the original source window. Fitting its expanded page into source dimensions stretches the source. Silent clipping loses outer marks without consent.

## Implementation

- **Detection:** Render the full PDF with alpha, independent of ink color. Use conservative paint bounds for subpixel or uncertain visibility. Ignore known hidden, zero-opacity, and empty annotation appearances. Expanded empty margins do not require consent.
- **Source mapping:** Compare decoded source samples to this request. Accept one opaque, direct source image at the original scale and position. Reject unsupported transforms, masks, extra images, page geometry, and paint state. Never trust browser-supplied bounds.
- **Consent:** Bind one-use confirmation to the immutable request ID, source digest, export digest, and nonce. Replacement, cancellation, server closure, and OMP session changes invalidate consent. Abort obsolete processing and reject late delivery.
- **Output:** After confirmation, render the original source window at source dimensions without stretching. Keep the full original PDF on private disk after server shutdown. Report its server-local path in the UI and tool result.
- **Browser preservation:** Keep Excalidraw mounted during PDF review. Existing drawing state survives Import stock PDF and Back. Ordinary PNG submission remains available.

## Source identity

Commit `ff9ec2a2f5aedbf804ad8cce7c8843ec95f25456`. Tree `93faf247089822a60c8cb534416997690fb989de`. Branch `prototype/pi-ink-bridge-01-pen-prototype`. Baseline `564c037546911f6e26936383b63eab9129819b97`. Source worktree: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype`.

## Verification

| Check | Observed result |
|---|---|
| Scoped Vite build | Passed; existing use-client and large-chunk warnings remain. |
| Scoped TypeScript check | Passed. |
| Final regression suite | 13 passed, 0 failed; 100 assertions. |
| Actual image_editor + browser PDF path | Delivery stayed pending until explicit per-result consent; then returned a marked 800 × 1000 PNG. |
| Source geometry | All four 40 × 40 marker regions matched the source pixels exactly; annotated PNG differs from source. |
| Full original PDF | Retrieved from disk after server shutdown; SHA-256 `fc49be15009fdf904eb4cd5edc82833b22cfeec40c656d90d5041a98a4ab42cf`. |
| Actual browser PNG path | Rectangle remained after PDF mode and Back; Undo remained enabled; Done returned the marked PNG. |
| Missing offline dependency | HTTP 500 with explicit renderer setup error; no PNG delivered and no dependency network fallback. |

The final detector observed 7,179 outer alpha-bearing pixels in the retained PDF. This is not the earlier red-threshold diagnostic.

## Review history and resolved slice findings

Independent standards and specification self-checks found drawing loss on mode change, invisible-content false prompts, late resource checks, and obsolete work after cancellation. The implementation fixes those issues. Focused regressions and the final live browser run exercise the fixes. The original reports and resolution evidence remain linked below. These self-checks are not a formal worktree review or a whole-ticket SUCCESS verdict. Earlier review history remains preserved.

## Remaining findings and limits

- **Tablet integration:** Pairing, authenticated tablet LAN transport, stable stock-library folder/document/server/job associations, current-document resolution, and toolbar Send remain missing.
- **Hardware acceptance:** Tablet wrong-document/wrong-server cancellation, pen/palm/zoom/undo/erasing/orientation quality with the toolbar, sleep/wake, reboot, and firmware-update behavior remain untested.
- **Mapping boundary:** Unsupported PDFs fail closed. Conservative paint bounds can require confirmation where visibility cannot be proved. This does not establish arbitrary-document support.
- **Owner observation:** The owner reports that the device slept and they disabled auto-sleep. The agent did not verify or change that setting. This is not a lifecycle pass or new device approval.
- **Tool limits:** LSP initialization could not locate workspace TypeScript; direct scoped typecheck passed. The browser upload helper produced ERR_FILE_NOT_FOUND, so the smoke assigned exact retained bytes to a real File/DataTransfer input. It did not mock submission, detection, confirmation, or delivery.

## Changed source files

- **Source:** `README.md`.
- **Source:** `bun.lock`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/index.ts`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/package.json`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/pdf-session.ts`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/pdf-worker.py`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/src/PdfImport.tsx`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/src/main.tsx`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/src/style.css`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/editing-session.test.ts`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/pdf-fixtures.py`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/pdf-samples.py`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/pdf-submission.test.ts`.

## Supporting evidence

- **Summary:** [Bounded evidence summary](../artifacts/evidence/implementation-0017/summary.json).
- **Raw checks:** [Build](../artifacts/evidence/implementation-0017/accepted-build.log), [typecheck](../artifacts/evidence/implementation-0017/accepted-typecheck.log), and [final isolated tests](../artifacts/evidence/implementation-0017/isolated-final-tests.log).
- **Live delivery:** [Actual tool result](../artifacts/evidence/implementation-0017/final-smoke/pdf-tool-result.json), [ordinary marked PNG result](../artifacts/evidence/implementation-0017/final-smoke/png-tool-result.json), [geometry checks](../artifacts/evidence/implementation-0017/final-smoke/output-verification.json), and [full retained PDF](../artifacts/evidence/implementation-0017/final-smoke/retained-annotated.pdf).
- **Visual evidence:** [Blocked confirmation UI](../artifacts/evidence/implementation-0017/final-smoke/confirmation.webp), [completed PDF UI](../artifacts/evidence/implementation-0017/final-smoke/delivered.webp), [drawing before PDF mode](../artifacts/evidence/implementation-0017/final-smoke/drawing-before.webp), and [drawing after returning](../artifacts/evidence/implementation-0017/final-smoke/drawing-after.webp).
- **Self-checks:** [Standards](../artifacts/evidence/implementation-0017/standards-self-check.txt), [specification](../artifacts/evidence/implementation-0017/spec-self-check.txt), and [resolutions](../artifacts/evidence/implementation-0017/review-resolutions.json).
- **Failure boundaries:** [Explicit offline dependency error](../artifacts/evidence/implementation-0017/offline-dependency-result.json), [preserved initial failures](../artifacts/evidence/implementation-0017/browser-upload-errors.json), and [owner observation](../artifacts/evidence/implementation-0017/owner-device-observation.json).
- **Integrity:** [Source identity](../artifacts/evidence/implementation-0017/source-identity.json), [fresh session](../artifacts/evidence/implementation-0017/session-identity.json), and [all evidence checksums](../artifacts/evidence/implementation-0017/checksums.json).

## Receipt history

- **start-0001:** [start-0001](../events/start-0001.yaml).
- **start-complete-0003:** [start-complete-0003](../events/start-complete-0003.yaml).
- **start-0004:** [start-0004](../events/start-0004.yaml).
- **implementation-0005:** [implementation-0005](../events/implementation-0005.yaml).
- **start-complete-0006:** [start-complete-0006](../events/start-complete-0006.yaml).
- **start-0007:** [start-0007](../events/start-0007.yaml).
- **implementation-0008:** [implementation-0008](../events/implementation-0008.yaml).
- **start-complete-0009:** [start-complete-0009](../events/start-complete-0009.yaml).
- **start-0010:** [start-0010](../events/start-0010.yaml).
- **implementation-0011:** [implementation-0011](../events/implementation-0011.yaml).
- **start-complete-0012:** [start-complete-0012](../events/start-complete-0012.yaml).
- **start-0013:** [start-0013](../events/start-0013.yaml).
- **implementation-0014:** [implementation-0014](../events/implementation-0014.yaml).
- **start-complete-0015:** [start-complete-0015](../events/start-complete-0015.yaml).
- **start-0016:** [start-0016](../events/start-0016.yaml).
- **implementation-0017:** [implementation-0017](../events/implementation-0017.yaml).

## Latest reviewer verdict and merge status

No formal verdict covers this source commit. No merge, rebase, push, device operation, or ticket completion occurred. Parent reconciliation remains pending.

## Immutable snapshots

[Current draft](../artifacts/snapshots/pr-draft-implementation-0017.md). [Previous draft](../artifacts/snapshots/pr-draft-implementation-0014.md).

## Preserved prior PR draft — historical

# Prove Paper Pro pen input — attempt 5

## Status

Blocked. The bounded cable-free loopback experiment passed. The full ticket remains claimed; production remains blocked.

## Problem and implementation

The stock editor must retain editable drawing data while an authenticated tablet client exports actual annotations without USB or runtime SSH. Temporary XOVI hooks made the existing stock HTTP service private to tablet loopback. A disposable client used authenticated, certificate-verified WSS for control/status and HTTPS for source/PDF bytes. No custom drawing renderer, LAN proxy, QML settings bypass, or production client was added.

The first approved preflight found a pre-existing webserver-remote.so and wildcard HTTP listener. Installation stopped. Revised owner approval authorized hash-verified quarantine, one load restart, and exact restoration afterward. The owner explicitly chose restoration despite the warned wildcard listener.

## Exercised results

- **Local service:** Root HTTP 200 at 127.0.0.1:81. During the experiment, stock port 80/81 had no Wi-Fi, USB, or wildcard listener. Process-wide Qt hooks remain a risk, not a scoped native API.
- **Cable-free export:** Both USB controllers reported not attached; USB IPv4 was absent. Authenticated LAN telemetry continued. Explicit owner Send produced a 137198-byte annotated PDF, SHA-256 `fc49be15009fdf904eb4cd5edc82833b22cfeec40c656d90d5041a98a4ab42cf`.
- **Actual marks:** Native rendering shows red freehand strokes over the synthetic grid and outside its original black boundary. The render contains 32947 red-dominant pixels.
- **Geometry failure:** Actual MediaBox/CropBox is `[-31.51,-121.92,928.57,1000]`, not source `[0,0,800,1000]`. Native 72-DPI PNG is 961×1122. `result.png` is a forced 800×1000 diagnostic and is disqualified. No source-window mapping, crop, aligned PNG, or Pi/OMP result is accepted.
- **Synthetic import:** One known source upload returned HTTP 201 with USB disconnected. The owner reports the normal library entry “Pi Ink loopback 0014 synthetic” is visible and opens. This is not automated UUID/folder/destination-isolation proof.
- **Editable work:** The owner reports the original alignment document retains editable annotations. No new latency, palm, edge, or orientation quality verdict was obtained.
- **Transport boundaries:** Actual desktop probes returned 401 without authentication, 200 for the pinned source, and 409 for a wrong-origin result. An untrusted TLS certificate was rejected. Temporary cable-provisioned credentials do not prove production pairing.

## Restoration and lifecycle

Authenticated stop was acknowledged. The first cleanup connection failed before remote execution because host USB networking was absent. The owner reseated the cable; the direct route returned. Cleanup then restored the exact original extension hash, owner, mode, size, and modification time. Stock/loader hashes, all pre-existing extension hashes/metadata, service configuration/state, and normalized listener bindings match the current preinstall baseline. The owner-selected wildcard proxy is restored. All temporary tablet paths, source code, host credentials, dependency clone, and owned toolchain image were removed.

Exactly one load and one cleanup `systemctl restart xochitl` command executed. No additional restart, reboot, settings change, broad XOVI activation, or account/cloud change occurred. Sleep, tablet reboot, firmware update, and XOVI reactivation remain untested. Only firmware 3.28.0.172 was exercised.

## Changed files and validation

No permanent source files changed. Source remains `564c037546911f6e26936383b63eab9129819b97`, tree `57df0dbb0fb91fa3da0716f1c3a62460906c96eb`, branch `prototype/pi-ink-bridge-01-pen-prototype`. The worktree is clean. Only this BASE evidence run, result receipt, immutable snapshot, manifest, and projections change. No empty source commit is created.

The ARM64 XOVI cross-build, desktop/ARM64 Go builds, and `go vet` passed. Actual device export/import and full restoration were exercised. Geometry failed the source-size gate. No unrelated browser tests or permanent tests were added. [Exact validation record](../artifacts/evidence/implementation-0014/validation.json).

## Remaining findings


- **source-geometry:** Annotated export expands MediaBox/CropBox to [-31.51,-121.92,928.57,1000]. Original source 800x1000. No accepted source-window mapping; forced scale is disqualified. Source-dimension aligned PNG gate remains blocked.
- **document-folder-associations:** Owner sees and opens synthetic import, but returned UUID/folder identity and upload destination isolation were not established. No server-associated stock folders or pairing UI implemented.
- **current-document-toolbar:** No editor toolbar or live current-document binding implemented. Fixed synthetic UUID in diagnostic config is not toolbar/current-document proof.
- **origin-cancellation-delivery:** Actual PDF accepted only for fixed diagnostic server/job; wrong-origin receiver request rejected. No originating Pi/OMP tool request integrated; production cancellation, document switching and wrong-server isolation untested.
- **owner-quality-lifecycle:** Owner confirms editable marks remain; no latency/palm/zoom/undo/erasing/orientation verdict with custom toolbar. Sleep, tablet reboot, firmware update and XOVI reactivation untested.

## Review history and merge status

No workflow reviewer verdict exists for this attempt. Prior record-accuracy reviews did not pass the failed native drawing quality gate. Earlier stock-editor and cable-free diagnostics retain their bounded findings. Attempts 1–3 were blocked; attempt 4 built and installed a metadata probe but failed before loading it, then restored the device. The new loopback direction supersedes a separate native export-start prerequisite; it does not erase those records. No findings are marked resolved beyond the bounded local-service/export feasibility and owner-reported library/editable-work observations.

Not reviewed, merged, pushed, or completed. Parent must validate this blocked result and append its own completion receipt. Do not dispatch a successful implementation review or claim production completion.

## Receipt history

- **start-0001:** started. [Receipt](../events/start-0001.yaml).
- **start-complete-0003:** blocked. [Receipt](../events/start-complete-0003.yaml).
- **start-0004:** started. [Receipt](../events/start-0004.yaml).
- **implementation-0005:** blocked. [Receipt](../events/implementation-0005.yaml).
- **start-complete-0006:** blocked. [Receipt](../events/start-complete-0006.yaml).
- **start-0007:** started. [Receipt](../events/start-0007.yaml).
- **implementation-0008:** blocked. [Receipt](../events/implementation-0008.yaml).
- **start-complete-0009:** blocked. [Receipt](../events/start-complete-0009.yaml).
- **start-0010:** started. [Receipt](../events/start-0010.yaml).
- **implementation-0011:** failed. [Receipt](../events/implementation-0011.yaml).
- **start-complete-0012:** failed. [Receipt](../events/start-complete-0012.yaml).
- **start-0013:** started. [Receipt](../events/start-0013.yaml).
- **implementation-0014:** blocked. [Receipt](../events/implementation-0014.yaml).
- **Preserved source-local history:** implementation-0002 and archived evidence remain in the retained source checkout. No historical receipt repair or reset was performed.

## Supporting artifacts

- **Evidence:** [activation.json](../artifacts/evidence/implementation-0014/activation.json).
- **Evidence:** [adapter-build.json](../artifacts/evidence/implementation-0014/adapter-build.json).
- **Evidence:** [adapter-hashes.json](../artifacts/evidence/implementation-0014/adapter-hashes.json).
- **Evidence:** [approval.json](../artifacts/evidence/implementation-0014/approval.json).
- **Evidence:** [baseline-fingerprints.json](../artifacts/evidence/implementation-0014/baseline-fingerprints.json).
- **Evidence:** [baseline.json](../artifacts/evidence/implementation-0014/baseline.json).
- **Evidence:** [cable-free-outcome.json](../artifacts/evidence/implementation-0014/cable-free-outcome.json).
- **Evidence:** [cable-reseat.json](../artifacts/evidence/implementation-0014/cable-reseat.json).
- **Evidence:** [cleanup-cable-blocker.json](../artifacts/evidence/implementation-0014/cleanup-cable-blocker.json).
- **Evidence:** [cleanup.json](../artifacts/evidence/implementation-0014/cleanup.json).
- **Evidence:** [client-ready.json](../artifacts/evidence/implementation-0014/client-ready.json).
- **Evidence:** [client-start.json](../artifacts/evidence/implementation-0014/client-start.json).
- **Evidence:** [device-cleanup-after-reseat.json](../artifacts/evidence/implementation-0014/device-cleanup-after-reseat.json).
- **Evidence:** [device-cleanup.json](../artifacts/evidence/implementation-0014/device-cleanup.json).
- **Evidence:** [endpoint-verification-corrected.json](../artifacts/evidence/implementation-0014/endpoint-verification-corrected.json).
- **Evidence:** [endpoint-verification.json](../artifacts/evidence/implementation-0014/endpoint-verification.json).
- **Evidence:** [explicit-send.json](../artifacts/evidence/implementation-0014/explicit-send.json).
- **Evidence:** [findings.json](../artifacts/evidence/implementation-0014/findings.json).
- **Evidence:** [geometry-limit.json](../artifacts/evidence/implementation-0014/geometry-limit.json).
- **Evidence:** [listener-attribution.json](../artifacts/evidence/implementation-0014/listener-attribution.json).
- **Evidence:** [native-page.png](../artifacts/evidence/implementation-0014/native-page.png).
- **Evidence:** [native-render.json](../artifacts/evidence/implementation-0014/native-render.json).
- **Evidence:** [owner-observations.json](../artifacts/evidence/implementation-0014/owner-observations.json).
- **Evidence:** [payload-hashes.json](../artifacts/evidence/implementation-0014/payload-hashes.json).
- **Evidence:** [pdf-render.json](../artifacts/evidence/implementation-0014/pdf-render.json).
- **Evidence:** [preflight-gates.json](../artifacts/evidence/implementation-0014/preflight-gates.json).
- **Evidence:** [preinstall-baseline.json](../artifacts/evidence/implementation-0014/preinstall-baseline.json).
- **Evidence:** [quarantine.json](../artifacts/evidence/implementation-0014/quarantine.json).
- **Evidence:** [receiver-smoke.json](../artifacts/evidence/implementation-0014/receiver-smoke.json).
- **Evidence:** [restoration-baseline.json](../artifacts/evidence/implementation-0014/restoration-baseline.json).
- **Evidence:** [restoration-comparison.json](../artifacts/evidence/implementation-0014/restoration-comparison.json).
- **Evidence:** [restoration-final.json](../artifacts/evidence/implementation-0014/restoration-final.json).
- **Evidence:** [result.pdf](../artifacts/evidence/implementation-0014/result.pdf).
- **Evidence:** [result.png](../artifacts/evidence/implementation-0014/result.png).
- **Evidence:** [revised-approval-proposal.json](../artifacts/evidence/implementation-0014/revised-approval-proposal.json).
- **Evidence:** [revised-approval.json](../artifacts/evidence/implementation-0014/revised-approval.json).
- **Evidence:** [revised-precheck.json](../artifacts/evidence/implementation-0014/revised-precheck.json).
- **Evidence:** [staging.json](../artifacts/evidence/implementation-0014/staging.json).
- **Evidence:** [tablet-reports.jsonl](../artifacts/evidence/implementation-0014/tablet-reports.jsonl).
- **Evidence:** [temporary-source-audit.json](../artifacts/evidence/implementation-0014/temporary-source-audit.json).
- **Evidence:** [tls-boundary-smoke.json](../artifacts/evidence/implementation-0014/tls-boundary-smoke.json).
- **Evidence:** [transport-build.json](../artifacts/evidence/implementation-0014/transport-build.json).
- **Evidence:** [upstream-assessment.json](../artifacts/evidence/implementation-0014/upstream-assessment.json).
- **Evidence:** [validation.json](../artifacts/evidence/implementation-0014/validation.json).
- **Evidence:** [visible-marks.json](../artifacts/evidence/implementation-0014/visible-marks.json).
- **Requirements:** [Canonical ticket](../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md).
- **Prior snapshot:** [Attempt 4 and preserved earlier history](../artifacts/snapshots/pr-draft-implementation-0011.md).
- **Prior restoration:** [Failed metadata-probe restoration](../artifacts/evidence/implementation-0011/restoration.json).
- **Prior interfaces:** [Static native-interface evidence](../artifacts/evidence/implementation-0008/native-interfaces.json).
- **Prior cable-free limit:** [Unmodified stock endpoint findings](../artifacts/evidence/stock-editor-cable-free-001/findings.json).

## Preserved prior drafts — historical, not current authorization

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
