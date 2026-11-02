---
title: Prove Paper Pro pen input — attempt 5
type: Report
---

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

The ARM64 XOVI cross-build, desktop/ARM64 Go builds, and `go vet` passed. Actual device export/import and full restoration were exercised. Geometry failed the source-size gate. No unrelated browser tests or permanent tests were added. [Exact validation record](../evidence/implementation-0014/validation.json).

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

- **start-0001:** started. [Receipt](../../events/start-0001.yaml).
- **start-complete-0003:** blocked. [Receipt](../../events/start-complete-0003.yaml).
- **start-0004:** started. [Receipt](../../events/start-0004.yaml).
- **implementation-0005:** blocked. [Receipt](../../events/implementation-0005.yaml).
- **start-complete-0006:** blocked. [Receipt](../../events/start-complete-0006.yaml).
- **start-0007:** started. [Receipt](../../events/start-0007.yaml).
- **implementation-0008:** blocked. [Receipt](../../events/implementation-0008.yaml).
- **start-complete-0009:** blocked. [Receipt](../../events/start-complete-0009.yaml).
- **start-0010:** started. [Receipt](../../events/start-0010.yaml).
- **implementation-0011:** failed. [Receipt](../../events/implementation-0011.yaml).
- **start-complete-0012:** failed. [Receipt](../../events/start-complete-0012.yaml).
- **start-0013:** started. [Receipt](../../events/start-0013.yaml).
- **implementation-0014:** blocked. [Receipt](../../events/implementation-0014.yaml).
- **Preserved source-local history:** implementation-0002 and archived evidence remain in the retained source checkout. No historical receipt repair or reset was performed.

## Supporting artifacts

- **Evidence:** [activation.json](../evidence/implementation-0014/activation.json).
- **Evidence:** [adapter-build.json](../evidence/implementation-0014/adapter-build.json).
- **Evidence:** [adapter-hashes.json](../evidence/implementation-0014/adapter-hashes.json).
- **Evidence:** [approval.json](../evidence/implementation-0014/approval.json).
- **Evidence:** [baseline-fingerprints.json](../evidence/implementation-0014/baseline-fingerprints.json).
- **Evidence:** [baseline.json](../evidence/implementation-0014/baseline.json).
- **Evidence:** [cable-free-outcome.json](../evidence/implementation-0014/cable-free-outcome.json).
- **Evidence:** [cable-reseat.json](../evidence/implementation-0014/cable-reseat.json).
- **Evidence:** [cleanup-cable-blocker.json](../evidence/implementation-0014/cleanup-cable-blocker.json).
- **Evidence:** [cleanup.json](../evidence/implementation-0014/cleanup.json).
- **Evidence:** [client-ready.json](../evidence/implementation-0014/client-ready.json).
- **Evidence:** [client-start.json](../evidence/implementation-0014/client-start.json).
- **Evidence:** [device-cleanup-after-reseat.json](../evidence/implementation-0014/device-cleanup-after-reseat.json).
- **Evidence:** [device-cleanup.json](../evidence/implementation-0014/device-cleanup.json).
- **Evidence:** [endpoint-verification-corrected.json](../evidence/implementation-0014/endpoint-verification-corrected.json).
- **Evidence:** [endpoint-verification.json](../evidence/implementation-0014/endpoint-verification.json).
- **Evidence:** [explicit-send.json](../evidence/implementation-0014/explicit-send.json).
- **Evidence:** [findings.json](../evidence/implementation-0014/findings.json).
- **Evidence:** [geometry-limit.json](../evidence/implementation-0014/geometry-limit.json).
- **Evidence:** [listener-attribution.json](../evidence/implementation-0014/listener-attribution.json).
- **Evidence:** [native-page.png](../evidence/implementation-0014/native-page.png).
- **Evidence:** [native-render.json](../evidence/implementation-0014/native-render.json).
- **Evidence:** [owner-observations.json](../evidence/implementation-0014/owner-observations.json).
- **Evidence:** [payload-hashes.json](../evidence/implementation-0014/payload-hashes.json).
- **Evidence:** [pdf-render.json](../evidence/implementation-0014/pdf-render.json).
- **Evidence:** [preflight-gates.json](../evidence/implementation-0014/preflight-gates.json).
- **Evidence:** [preinstall-baseline.json](../evidence/implementation-0014/preinstall-baseline.json).
- **Evidence:** [quarantine.json](../evidence/implementation-0014/quarantine.json).
- **Evidence:** [receiver-smoke.json](../evidence/implementation-0014/receiver-smoke.json).
- **Evidence:** [restoration-baseline.json](../evidence/implementation-0014/restoration-baseline.json).
- **Evidence:** [restoration-comparison.json](../evidence/implementation-0014/restoration-comparison.json).
- **Evidence:** [restoration-final.json](../evidence/implementation-0014/restoration-final.json).
- **Evidence:** [result.pdf](../evidence/implementation-0014/result.pdf).
- **Evidence:** [result.png](../evidence/implementation-0014/result.png).
- **Evidence:** [revised-approval-proposal.json](../evidence/implementation-0014/revised-approval-proposal.json).
- **Evidence:** [revised-approval.json](../evidence/implementation-0014/revised-approval.json).
- **Evidence:** [revised-precheck.json](../evidence/implementation-0014/revised-precheck.json).
- **Evidence:** [staging.json](../evidence/implementation-0014/staging.json).
- **Evidence:** [tablet-reports.jsonl](../evidence/implementation-0014/tablet-reports.jsonl).
- **Evidence:** [temporary-source-audit.json](../evidence/implementation-0014/temporary-source-audit.json).
- **Evidence:** [tls-boundary-smoke.json](../evidence/implementation-0014/tls-boundary-smoke.json).
- **Evidence:** [transport-build.json](../evidence/implementation-0014/transport-build.json).
- **Evidence:** [upstream-assessment.json](../evidence/implementation-0014/upstream-assessment.json).
- **Evidence:** [validation.json](../evidence/implementation-0014/validation.json).
- **Evidence:** [visible-marks.json](../evidence/implementation-0014/visible-marks.json).
- **Requirements:** [Canonical ticket](../../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md).
- **Prior snapshot:** [Attempt 4 and preserved earlier history](pr-draft-implementation-0011.md).
- **Prior restoration:** [Failed metadata-probe restoration](../evidence/implementation-0011/restoration.json).
- **Prior interfaces:** [Static native-interface evidence](../evidence/implementation-0008/native-interfaces.json).
- **Prior cable-free limit:** [Unmodified stock endpoint findings](../evidence/stock-editor-cable-free-001/findings.json).

