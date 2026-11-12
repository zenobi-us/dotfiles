---
date: 2026-11-12T00:28:49.871Z
title: Independent GUI review
type: Report
---

# Independent review: collect-evidence-feedback-03-gui

Assess the frozen native GUI slice for the parent maintainer. Date: 2026-11-12T00:28:49.871Z.

## Overview

Verdict: FAILURE. One confirmed P2 finding blocks the required usable GUI playbook. No source change was made during review.

Ticket: `tracker/tickets/collect-evidence-feedback-03-gui.md`. Complete specification: `tracker/initiatives/collect-evidence-feedback/index.md`.

Source branch: `feature/collect-evidence-feedback-03-gui`. Base branch: `master`, pinned to `cbde74f5b6cad06c726f9db388416885815b701f` before comparison.

Reviewed commit: `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71`. Reviewed tree: `36f17fc4bb60031eedb54d69a88b2a1c3ef93d74`.

Comparison: `git diff cbde74f5b6cad06c726f9db388416885815b701f...4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71`. This pins the requested `master...4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71` comparison.

Scope: read-only Linux X11 ImageMagick window/display collection, common records, permissions, assertions, preservation, safety stops, public commands and web/TUI compatibility. Unsupported Wayland-native, macOS, Windows, video, OCR and automated input are disclosed limits. The ticket does not require those implementations.

Navigation: [Standards](#standards), [Spec](#spec), [Confirmed findings](#confirmed-findings), [Validation and compatibility](#validation-and-compatibility), [Disposition](#disposition).

## Standards

Fresh independent axis: `63f23ccf-d0f5-4cc4-981e-dbc8d18e5c7a`, terminal `t6w`.

Hard documented breaches: none found. One non-blocking possible Repeated Switches smell. The change repeats surface selection in asset creation, run creation and run validation. It also repeats capture-method selection. A provenance change must update these copies together.

CEGUI-N1, P3, heuristic only: `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts`, lines 134–135, 162, 205 and 250. Consider one typed driver-to-surface/capture-method mapping. This is not a completion requirement. Existing repository standards override the smell baseline. NO ADR: the only accepted ADR governs Pi Ink device cleanup, not this collector.

The axis read the complete ticket, initiative, context map, domain rules, ADR index and Pi Ink ADR. It inspected capture, scope validation, pipeline integration, records, contracts and public regression source. It ran no build, lint, tests, formatter, browser or GUI actions.

Proposed validation if the optional refactor is adopted: `RUN_GUI_EVIDENCE_TESTS=1 mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts`, with approved collector-owned fixture scope/image environment variables.

## Spec

Fresh independent axis: `11d068f9-db04-4ca1-bc1c-34844a34c81d`, terminal `t6x`.

The axis proposed one P1 scope finding at `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/gui-driver.ts`, lines 65–67 and 94–103. Requirement: “Keep capture within the approved window or display scope.” It observed that title and IsViewable checks do not prove an unobscured window. The playbook warns that X11 capture can include occlusion. It proposed a window-isolated method or a blocked result when isolation cannot be guaranteed. Its overlap scenario was source-grounded, not executed.

The axis found explicit approval, native permission probes, hashes/dimensions/provenance, stable-frame polling, input rejection and borrowed-resource preservation. Platform and video limits are not missing requirements. The axis did not attribute the known Surf failure to this diff.

Reviewer disposition of the proposed P1: unconfirmed cross-host risk, not a confirmed blocker. A controlled overlap smoke on this host captured only the approved window. The sample inside the overlapping window's screen region remained the approved red value, not the green overlay value. No leak was observed. This result does not establish isolation on every X11 server. A different-server claim needs real evidence, not an assumed failure.

## Confirmed findings

### CEGUI-R1: the required playbook example cannot compile

Severity: P2. Blocking: yes. NO ADR: this is a public documentation/plan contract mismatch, not an architecture decision.

Location: [GUI playbook, lines 45–46](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-03-gui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/gui.md#L45-L46). Related validator: [gui-plan.ts, line 19](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-03-gui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/gui-plan.ts#L19).

Requirement: ticket acceptance says “Deliver the GUI driver playbook and capability limits.” The initiative requires one authored typed plan and public command verification. The playbook's only authored GUI plan omits `image.lines`. The validator requires an array and requires it to be empty.

Reproduction: initialize an external workspace through the public CLI, copy the documented plan unchanged, then run:

`COLLECT_EVIDENCE_CLI compile /tmp/gui-review-example-T5YC01/workspace --json`

Here `COLLECT_EVIDENCE_CLI` names the absolute frozen-source `scripts/collect-evidence.ts` executable. No GUI access occurs during compile.

Observed exit: 2. Exact public error:

`GUI expect requires RGB pixel probes; OCR line assertions are unsupported`

Adding only `lines: []` to that temporary plan's image made the same command return exit 0 and `success: true`. The source playbook was not changed.

Required change: add `lines: []` to the published example, consistent with the existing image contract. Validate the documented example through public `init` and `compile` from an unrelated directory. A real display is not needed for this check.

Why this blocks completion: the required driver playbook gives a plan that stops before collection and emits an error that does not identify the missing field. The implementation tests use `lines: []`, so their success does not validate the published instructions.

## Validation and compatibility

### Reviewer-executed checks

- **Native archive:** public `validate` on `workflows/collect-evidence-feedback-03-gui/artifacts/evidence/native-0001` returned exit 0 from `/tmp`. Public `report` returned exit 0 and case `case` PASS.
- **Original image:** viewed the unchanged 480 × 260 PNG. It shows the expected heading, purple/cyan panels and collector-owned fixture notice. Recorded SHA-256: `2baf864452cc75f47db3e8cc9876d3af5e7f7765321f4ae5a2defc7b718076ff`.
- **Provenance rejection:** copied the archive into `/tmp/gui-review-provenance-qQZnJZ`. Changed GUI title in both event and asset, then updated inventory hashes. Public `validate` returned exit 2: `Missing approved GUI identity or borrowed-resource preservation`. This exercised the new identity check, not only file-integrity rejection.
- **Playbook mismatch:** `mise exec -- bun /tmp/gui-review-example.ts` reproduced CEGUI-R1. The published plan failed; adding only the missing empty array passed.
- **Controlled overlap:** `mise exec -- bun /tmp/gui-review-overlap.ts` used two collector-owned GTK3 X11 popup windows. Approved window `0x1e00003`: 320 × 200 at (120,120). Overlay `0x1e0000d`: 80 × 80 at (220,180). Both were viewable. Doctor returned exit 0. Collection returned exit 0/PASS. Captured pixel (120,100), inside the overlap's screen region, was `srgba(204,25,51,1)`. The original PNG was solid approved red. The overlay was green. Temporary archive: `/tmp/gui-review-overlap-fRPcMj/repository/workflows/review-overlap/artifacts/evidence/overlap`.
- **Owned cleanup:** stopped only the reviewer-created overlap fixture service. Both axis deliveries passed identity/hash verification and were acknowledged. Their terminals were closed and removed. The reviewer's main terminal remains for parent closure.

The temporary overlap run is diagnostic review proof, not a published evidence run for this ticket. No canonical evidence run was invented or rewritten. The frozen source and its retained archives remain unchanged.

### Recorded checks accepted without repetition

Implementation validation records report 102 passed, 31 skipped and 943 assertions. The real installed-copy GUI workflow produced native PASS, wrong dimensions FAIL, denied XAUTHORITY BLOCKED with no assets, title mismatch BLOCKED, and invalid scope/fill/Enter plans with exit 2. The fixture remained viewable after cases. The parent independently viewed the image and validated native/permission archives from `/tmp`.

Fresh Playwright capture was blocked by missing Chrome. Fresh TUI capture was blocked by missing foot, grim and tesseract. A retained TUI archive validated. Typecheck was unavailable because TypeScript/LSP prerequisites were absent. No installation, sudo, credentials, device action or remote Git operation occurred during this review.

### Surf failure attribution

The known live Surf `approved-space.3` failure is ground truth: expected `Submitted`, observed `Not submitted`. It was not rerun or dismissed.

The retained events record navigation, an approved `Space` press and the failed visible text assertion. Existing [Surf dispatch](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-03-gui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts#L204-L207) forwards the key to Surf. The fixture uses an autofocus button whose click changes the status. Neither Surf dispatch nor that fixture changed in the pinned diff. Shared pipeline changes select new behavior only for `gui`; existing web branches retain their prior behavior.

The source establishes no diff-caused Surf regression. It does not establish the runtime reason for the absent submission. Focus or key-dispatch explanations remain inference. Keep the failure and web verification gap visible. Do not call this a passing web acceptance run.

## Disposition

Standards: one non-blocking P3 heuristic, no hard documented breach. Spec axis: one proposed P1 scope risk, unconfirmed after controlled host proof. Reviewer verification: one confirmed blocking P2 playbook mismatch.

Verdict: FAILURE for the exact commit/tree above. Fix CEGUI-R1 and obtain a fresh review of the new source identity. No integration-readiness claim is made. Parent owns tracker comments, publication and phase completion.

