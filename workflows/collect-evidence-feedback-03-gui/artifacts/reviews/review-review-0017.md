---
date: 2026-11-12T01:47:14.231Z
title: Independent GUI review review-0017
type: Report
---

# Independent GUI review: review-0017

## Verdict

SUCCESS. No blocking product finding remains in this frozen GUI slice. This verdict does not turn failed or unavailable compatibility checks into passes.

## Scope

Ticket: `tracker/tickets/collect-evidence-feedback-03-gui.md`. Complete specification: `tracker/initiatives/collect-evidence-feedback/index.md`.

Timestamp: 2026-11-12T01:47:14.231Z. Source branch: `feature/collect-evidence-feedback-03-gui`. Base branch: `master`, observed at `a16997e5e9231af3327c3b22dc36abbd398b47ef`.

Frozen source commit: `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71`. Frozen source tree: `36f17fc4bb60031eedb54d69a88b2a1c3ef93d74`.

Comparison: `git diff master...HEAD`. Merge base: `cbde74f5b6cad06c726f9db388416885815b701f`. The actual three-dot diff contains 191 files, including retained workflow evidence. Product commit `0e23bc5a` adds the GUI slice and package metadata. `231bb9d3` changes the tracker. `fc564640`, `9f7d0ce8` and `4e5def3a` record workflow results. Workflow-only commits do not establish product implementation.

Review covers read-only Linux X11 window/display capture, exact approval, permissions, common records, pixel assertions, public commands and borrowed-resource preservation. Unsupported platforms, GUI input, OCR and video are documented limits. The ADR index lists only ADR 0001, Pi Ink cleanup trust boundary; it does not govern this GUI slice.

The reviewer is fresh session `herdr-app:t72`, run `ee06097f-ff8d-4b1e-97e9-d87f876662c1`. Both axes ran concurrently in fresh read-only agents. No source, tracker or projection was changed.

## Standards
No blocking documented-standard breach found in the reviewed product diff. No applicable ADR was identified; the ADR index lists only the unrelated Pi Ink cleanup decision.

### Optional concern
S-01 — Low, non-blocking; possible Repeated Switches. In scripts/browser-evidence/records.ts:134–135, 162, 205 and 250, the change repeats the driver-to-surface and driver-to-capture-method decisions. Example: `options.plan.driver === "gui" ? "gui" : options.plan.driver === "tui" ? "tui" : "web"`. A small typed provenance map could keep record creation and validation aligned. This is a heuristic concern, not a documented violation. No change is required for approval.

### Scope and validation
Reviewed `git diff master...HEAD` at supplied HEAD 4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71. Distinguished product commit 0e23bc5a from tracker and workflow history. Read the changed driver, plan checks, provenance, pipeline, CLI, public workflow test and playbooks. Read the authoritative base ticket and initiative through mq with the OKF import and a /tmp lockfile. CONTEXT.md is absent from the source checkout; the owning reviewer read the authoritative BASE CONTEXT.md. No builds, lint, tests, formatters, GUI capture or tool installation ran, as instructed. Suggested validation after an optional refactor: `bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test`. Native opt-in coverage still requires its approved fixture.

Standards result: zero blocking findings; one optional concern.

Standards agent: `d3d5086e-293c-4e7b-bfff-82d5e328fcf5`, terminal `t73`. Verified payload SHA-256: `08f9b09de24067773214e912cf43be56f876dcdea896b85e2fb63068c7bfb404`. Result acknowledged; terminal removed.

## Spec
No confirmed new GUI specification defect in `git diff master...HEAD` at `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71`.

### Missing or partial requirements
The ticket requires: "Exercise the public CLI with a real GUI case and a blocked-permission case." Retained native and permission cases satisfy this boundary: the native case has a 480 × 260 PNG, exact X11 identity, tool version, capture time and SHA-256. The permission case has no assets, a blocked error and assertion not-run. I inspected the retained native PNG; its heading, panels and fixture notice match the recorded scene.

Cross-driver verification remains incomplete. Initiative Testing Decision 3 requires: "Test the existing Surf and Playwright paths through their public command boundary when their prerequisites are available." The retained Surf event at `approved-space.3` records expected `Submitted`, observed `Not submitted`. This is an unresolved real failure, not a passing regression check. The diff does not change Surf input handling; its cause is not established. Missing Chrome, foot/grim/tesseract and TypeScript prerequisites remain coverage gaps. None were rerun or installed.

### Scope creep
None identified. Read-only Linux X11 capture and explicit unsupported-platform, input and recording limits fit the ticket's requirement to "Deliver the GUI driver playbook and capability limits." Other initiative slices are not missing GUI deliverables.

### Implemented-but-wrong behavior
None confirmed in the GUI changes. CEGUI-R1 must not recur: the complete published example includes `lines: []`, and fix-0014 retains successful unchanged public init/compile evidence. Historical review FAILURE remains historical; this axis does not rewrite it or grant integration approval.

ADR: NO ADR applies. ADR 0001 concerns the separate Pi Ink device operation. Optional concerns: none on this axis. No builds, tests, formatters or live desktop captures ran during this review.

Spec agent: `03f342c3-c515-4aa7-9ad4-5edf90f52ebd`, terminal `t74`. Verified payload SHA-256: `2b6e91c457cf909e6e2d3edde707b5cedb48aa401c1c30a4e282685cd19d44a6`. Result acknowledged; terminal removed.

## Finding disposition

No blocking findings. S-01 is the same optional concern as historical CEGUI-N1; it is not a second defect. Severity P3, Standards heuristic, NO ADR. File: `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts`, line 134, also 135, 162, 205 and 250. Description: repeated surface/capture-method selection can drift. Required change: none for approval; optionally use one typed provenance map. Validation command: `RUN_GUI_EVIDENCE_TESTS=1 mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts`, with an approved collector-owned fixture.

Historical CEGUI-R1 is not present at this exact source. The full tracked example includes `image.lines: []`. Fresh public init and compile of the unchanged mq-extracted example both returned 0. No substitutions were made. Historical review-0006 FAILURE and fix-0014 reconciliation remain immutable. This is a new independent verdict, not a rewrite.

## Exercised checks

| Check | Observed result |
|---|---|
| Absolute source CLI --help and --version --json from /tmp | Exit 0; GUI documented; version 1.1.0 |
| Public init, compile and run --dry-run of the full documented example | All exit 0; one GUI case; temporary resolved repository store; no capture |
| Installed-copy GUI regression with newly collector-owned GTK X11 fixture | 1 pass, 0 fail, 49 assertions; 9.51 seconds |
| Native fixture image inspection | Original 480 × 260 PNG shows only the owned label and purple/cyan panels; SHA-256 f75ff1952fe75a2f40bfa2b8cfa1dddd93469c78ca80afff1991a06922eb8421 |
| Public native doctor, run, validate, verdicts and report | PASS; native dimensions, identity, source hash and unavailable-video limit checked |
| Same public scenario: denied XAUTHORITY and title mismatch | BLOCKED, exit 3; no assets; assertion not-run |
| Same public scenario: mismatched dimensions | FAIL, exit 1; actual native image retained in temporary run |
| Same public scenario: mismatched approval, credential fill and Enter | Compile exit 2 before collection |
| Public validate/verdicts on temporary copies of four retained GUI runs | All validate exit 0; outcomes PASS, BLOCKED, FAIL, BLOCKED |
| Public validate/verdicts on retained Surf archive copy | Valid records, not passing behavior; approved-space remains FAIL |
| Public report of retained native archive copy | Exit 0; common asset identity and PASS agree |
| Borrowed fixture preservation | Public regression queried the same window after each case; harness stopped only its owned fixture afterward |

Fresh native command: `RUN_GUI_EVIDENCE_TESTS=1 KEEP_GUI_EVIDENCE=1 GUI_EVIDENCE_SCOPE=<new-owned-scope> GUI_EVIDENCE_IMAGE=<480x260-three-RGB-probes> mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts`.

Temporary root was `/tmp/evidence-gui-public-lr7xNR`. Scope was display `:0`, window `0x1e00003`, title `Review 0017 owned fixture`. Only this newly owned window was captured. No desktop or arbitrary window capture occurred. These were disposable smoke diagnostics, not a new durable workflow evidence run; receipt evidence is null. Temporary stores and fixture were removed.

The archive/example smoke completed every CLI check with exit 0. Its harness initially exited 1 only during cleanup because copied sealed directories were read-only. Explicit chmod on the owned temporary copies allowed cleanup. This was not a product command failure; no check was rerun to hide it.

## Compatibility limits and retained failure

The Surf failure is real: `approved-space.3` expected `Submitted` and observed `Not submitted`. The retained event and current public verdict both show FAIL. It was not rerun. The product diff leaves Surf input handling unchanged; no diff-caused defect was identified. Cause remains unresolved. This review does not claim a passing Surf baseline or a green cross-driver suite. The parent must retain this failure in integration and publication decisions.

Fresh Playwright, TUI and TypeScript checks were not run. Recorded missing Chrome, foot/grim/tesseract and TypeScript/LSP prerequisites remain coverage gaps. No tools were installed, no sudo was used, and no remote Git operation ran. No broad suite or typecheck pass is claimed.

## Handoff

Standards: zero blocking findings, one optional P3 heuristic. Spec: zero confirmed GUI defects; unresolved cross-driver failure and unavailable coverage remain explicit. Parent owns receipt validation, tracker updates, publication and integration decisions. Only this immutable review and review-0017 phase-result are authoritative outputs.

