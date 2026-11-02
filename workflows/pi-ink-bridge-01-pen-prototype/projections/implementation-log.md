---
title: Pi Ink prototype implementation log
type: Report
---

# Implementation log

## Current attempt — implementation-0017

**Status:** Full ticket blocked; repository-only clipping gate implemented and exercised. [Result](../events/implementation-0017.yaml). [Immutable snapshot](../artifacts/snapshots/pr-draft-implementation-0017.md).

**Source:** `ff9ec2a2f5aedbf804ad8cce7c8843ec95f25456`, tree `93faf247089822a60c8cb534416997690fb989de`. The 13 source files are listed in the [source identity](../artifacts/evidence/implementation-0017/source-identity.json). The source commit includes request-bound PDF processing, explicit per-result clipping consent, durable original retention, mounted-browser state preservation, regressions, pinned dependencies, and README usage.

**Validation:** Build and typecheck passed. Final suite: 13 tests, 100 assertions, zero failures. Actual image_editor/browser submission stayed pending before consent, then delivered a marked 800 × 1000 PNG. Four marker regions match source pixels. The full PDF remains retrievable after server close. Browser drawing state survived PDF mode and returned through the ordinary PNG tool path. Missing offline dependencies produced an explicit error without image delivery.

**Self-check resolutions:** Fixed mode-switch drawing loss, known invisible/empty paint false prompts, post-decode size guards, and obsolete processing after cancellation. Original standards/spec reports remain preserved. No formal review verdict is claimed.

**Remaining questions:** Tablet pairing/LAN transport, folder/document/server/job associations, live current-document toolbar Send, tablet cancellation/isolation, owner quality with toolbar, and lifecycle acceptance. Owner reports disabling auto-sleep after the device slept; the agent did not verify the setting or access the device.

**Evidence:** [Summary](../artifacts/evidence/implementation-0017/summary.json), [final tests](../artifacts/evidence/implementation-0017/isolated-final-tests.log), [live geometry and drawing proof](../artifacts/evidence/implementation-0017/final-smoke/output-verification.json), [review resolutions](../artifacts/evidence/implementation-0017/review-resolutions.json), and [owner observation](../artifacts/evidence/implementation-0017/owner-device-observation.json).

## Complete canonical receipt history

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
- **start-complete-0015:** blocked. [Receipt](../events/start-complete-0015.yaml).
- **start-0016:** started. [Receipt](../events/start-0016.yaml).
- **implementation-0017:** blocked. [Receipt](../events/implementation-0017.yaml).

## Preserved prior implementation log — historical

# Implementation log

## Current attempt — implementation-0014

**Status:** Blocked. [Result](../events/implementation-0014.yaml). [Immutable snapshot](../artifacts/snapshots/pr-draft-implementation-0014.md).

**Changed files:** No permanent source changes. Temporary adapter/client removed. BASE evidence run, receipt, snapshot, manifest, and projections only.

**Validation:** Cross-builds and go vet passed; actual private-loopback cable-free annotated PDF export and one import passed. Geometry/source-size gate failed. Owner reports library visibility/open and editable-work preservation. Device restoration passed; exact original proxy restored by owner choice. [Validation](../artifacts/evidence/implementation-0014/validation.json).

**Unresolved questions:**
- **source-geometry:** Annotated export expands MediaBox/CropBox to [-31.51,-121.92,928.57,1000]. Original source 800x1000. No accepted source-window mapping; forced scale is disqualified. Source-dimension aligned PNG gate remains blocked.
- **document-folder-associations:** Owner sees and opens synthetic import, but returned UUID/folder identity and upload destination isolation were not established. No server-associated stock folders or pairing UI implemented.
- **current-document-toolbar:** No editor toolbar or live current-document binding implemented. Fixed synthetic UUID in diagnostic config is not toolbar/current-document proof.
- **origin-cancellation-delivery:** Actual PDF accepted only for fixed diagnostic server/job; wrong-origin receiver request rejected. No originating Pi/OMP tool request integrated; production cancellation, document switching and wrong-server isolation untested.
- **owner-quality-lifecycle:** Owner confirms editable marks remain; no latency/palm/zoom/undo/erasing/orientation verdict with custom toolbar. Sleep, tablet reboot, firmware update and XOVI reactivation untested.

## Complete receipt history

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

## Preserved prior implementation log — historical

# Implementation log

## Preserved events

- **implementation-0005:** implementation / phase-result / blocked. Source `564c037546911f6e26936383b63eab9129819b97`, tree `57df0dbb0fb91fa3da0716f1c3a62460906c96eb`. [Receipt](../events/implementation-0005.yaml).
- **start-0001:** start / phase-start / started. Source `d17c0898f2219b3097f6a4e37bafd430f4c53b89`, tree `2efb55acf06f28c841e176399c74a7f8d4c2467f`. [Receipt](../events/start-0001.yaml).
- **start-0004:** start / phase-start / started. Source `564c037546911f6e26936383b63eab9129819b97`, tree `57df0dbb0fb91fa3da0716f1c3a62460906c96eb`. [Receipt](../events/start-0004.yaml).
- **start-complete-0003:** start / phase-complete / blocked. Source `564c037546911f6e26936383b63eab9129819b97`, tree `57df0dbb0fb91fa3da0716f1c3a62460906c96eb`. [Receipt](../events/start-complete-0003.yaml).

## Attempt 1 — source-local result

The blocked implementation-0002 remains in the source checkout. Its merge reconciled the archived custom drawing source with the revised stock-editor requirements. It added no replacement stock-editor integration. It reported build success, 7 passing tests with 39 assertions, an existing browser HTTP smoke, and firmware 3.28.0.172 installation preflight. Those were not tablet acceptance. Its historical root mismatch remains preserved, not repaired. The base parent completion records its unusable result.

Result: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/workflows/pi-ink-bridge-01-pen-prototype/events/implementation-0002.yaml`. Findings: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-hooks-001/findings.json`. Snapshot: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/workflows/pi-ink-bridge-01-pen-prototype/artifacts/snapshots/pr-draft-implementation-0002.md`.

## Attempt 2 — implementation-0005

No source files changed. Exact parent source commit/tree were retained. New evidence records bounded source-interface inspection, the existing browser build, 7 tests/39 assertions, and a two-server real HTTP smoke. It does not report new hardware, pairing, authenticated LAN WebSocket/HTTPS, or stock export acceptance. No excluded device probes ran.

Changed records:

- **Record:** `workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-attempt-002/findings.json`.
- **Record:** `workflows/pi-ink-bridge-01-pen-prototype/events/implementation-0005.yaml`.
- **Record:** `workflows/pi-ink-bridge-01-pen-prototype/artifacts/snapshots/pr-draft-implementation-0005.md`.
- **Record:** `workflows/pi-ink-bridge-01-pen-prototype/manifest.yaml`.
- **Record:** `workflows/pi-ink-bridge-01-pen-prototype/projections/pr-draft.md`.
- **Record:** `workflows/pi-ink-bridge-01-pen-prototype/projections/implementation-log.md`.
- **Record:** `workflows/pi-ink-bridge-01-pen-prototype/projections/latest-status.yaml`.

## Review history and unresolved questions

The canonical ticket retains all earlier independent review comments. The native pen gate failed. Stock-editor feasibility had five acceptance limits. Cable-free diagnostic evidence passed only its diagnostic scope. No current implementation SUCCESS or formal worktree review exists.

Stock-library registration, authoritative current-document ownership, actual annotated output, and owner hardware acceptance remain unresolved. No new finding was cleared. Do not infer support outside prior tested firmware 3.28.0.172. See the [current draft](pr-draft.md) for exact owner operations and [fresh findings](../artifacts/evidence/stock-editor-attempt-002/findings.json) for validation.



## Attempt 3 — implementation-0008

No source files changed. Cable SSH inspected firmware 3.28.0.172 read-only. Offline Qt metadata and compressed QML establish native import, folder, and current-editor context candidates. Local annotated export-start, flush ordering, geometry, and runtime access remain unproven. No device mutation or notebook access occurred. No browser validation was repeated.

Changed records: [receipt](../events/implementation-0008.yaml), [interface extracts](../artifacts/evidence/implementation-0008/native-interfaces.json), [findings and approval scope](../artifacts/evidence/implementation-0008/findings.json), [snapshot](../artifacts/snapshots/pr-draft-implementation-0008.md), manifest, and all three projections.

Parent reconciliation: [start-complete-0006](../events/start-complete-0006.yaml). Current authorization: [start-0007](../events/start-0007.yaml). All previous implementation and review history above remains retained. No finding is cleared. Next human decision: approve or reject the metadata-only extension and two owner-safe Xochitl restarts. This does not approve synthetic import/export or satisfy hardware acceptance.


## Attempt 4 — implementation-0011

Failed metadata-probe attempt; implementation remains blocked. No source changes. ARM64 cross-build and named extension install/hash check passed. The device lacks `timeout`; load restart and initial rollback restart wrappers failed before invoking systemctl. The trap removed only the probe. A host-bounded recovery restarted only xochitl once; the final safe snapshot matches the baseline byte for byte. No runtime metadata, document access, import/export, or acceptance result exists. Temporary source/build/image payloads were removed.

- **Evidence:** [build.json](../artifacts/evidence/implementation-0011/build.json).
- **Evidence:** [execution.json](../artifacts/evidence/implementation-0011/execution.json).
- **Evidence:** [restoration.json](../artifacts/evidence/implementation-0011/restoration.json).
- **Evidence:** [findings.json](../artifacts/evidence/implementation-0011/findings.json).
- **Evidence:** [cleanup.json](../artifacts/evidence/implementation-0011/cleanup.json).
- **Receipt:** [implementation-0011](../events/implementation-0011.yaml).
- **Snapshot:** [Attempt-4 immutable draft](../artifacts/snapshots/pr-draft-implementation-0011.md).
- **Parent records:** [start-complete-0009](../events/start-complete-0009.yaml); [start-0010](../events/start-0010.yaml).

Changed files: attempt-4 evidence directory, receipt, immutable snapshot, manifest, and the three projections. All earlier implementation/fix/review history above is retained. No review or fix attempt was added. No finding was cleared. Another probe cycle requires renewed approval and saved/closed-document confirmation; safe local annotated-export initiation and all owner acceptance gates remain unresolved.
