---
date: 2026-11-12T02:52:24.018262+00:00
title: Independent GUI review review-0024
type: Report
---

# Independent GUI review review-0024

Review the frozen GUI slice for the parent who owns integration. Date: 2026-11-12T02:52:24.018262+00:00.

## Overview

FAILURE. One blocking P2 capture-status defect remains. The public GUI regression passes, but it does not cover a native capture command failing after identity checks succeed. This is not a green cross-driver baseline.

## Scope

Ticket: `tracker/tickets/collect-evidence-feedback-03-gui.md`. Complete specification: `tracker/initiatives/collect-evidence-feedback/index.md`.

Source branch: `feature/collect-evidence-feedback-03-gui`. Base: `master`, pinned `af750e0e`. Reviewed commit: `c224ea08907df7d2dc2a12d297bbd107fb1597af`. Reviewed tree: `2f409d6d19cfc5bcd56cd824f74410b58aa2ed1c`.

Command: `git diff af750e0e...HEAD`. Scope: 16 files; 365 insertions and 36 deletions. Commits: `0fb8cba7` tracker claim and `c224ea08` native GUI product. A read-only product-path comparison against historical `4e5def3a` returned no differences.

Consumed the original implementation, fix-0014, its draft snapshot, prior review-0017, review-0023 and finish recovery receipts. Read context documents and the ADR index. ADR 0001 covers Pi Ink cleanup, not this GUI driver. NO ADR applies.

The inspector sees this in-flight review start as retryable. This reviewer is its dispatched child, not a duplicate review. Historical receipts and verdicts remain unchanged. Only this report and its result receipt are workflow outputs.

## Standards

Reviewed c224ea08907df7d2dc2a12d297bbd107fb1597af against af750e0e. Read the BASE ticket and initiative, CONTEXT.md, CONTEXT-MAP.md and ADR index. No applicable GUI ADR.

### Required change
P2 — scripts/browser-evidence/drivers/gui-driver.ts:86–87 (under collect-evidence). Capture failures omit captureFailed. A failed import reaches decideVerdict as a blocked assertion, then records.ts:317–319 labels capture not-requested. This violates initiative decision 26 and story 18, which separate capture failure from assertion failure. NO ADR. Tag capture-stage errors, retain BLOCKED and not-run assertions, and validate failed capture status through the installed CLI.

### Optional smells
Possible Repeated Switches — scripts/browser-evidence/records.ts:133–134,162,205,250 repeat driver-to-surface and capture-method dispatch. A small shared driver metadata map would reduce the places needed for the next driver. This is a judgement call, not a hard violation.

Validation: read-only source review. No tests or checks ran. The known Surf approved-space.3 failure was not rerun.

### Reviewer disposition

Retain CEGUI-R2, P2, blocking, NO ADR. The concrete defect is the loss of capture-stage status, not a wrong BLOCKED verdict. At [`gui-driver.ts:65–87`](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-03-gui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/gui-driver.ts#L65-L87), native capture can fail after an assertion record exists, but the catch never sets `captureFailed`. [`verdict.ts:37–59`](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-03-gui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/verdict.ts#L37-L59) only propagates failed capture status when that flag exists. [`records.ts:317–319`](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-03-gui/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts#L317-L319) therefore reports `not-requested` for a requested capture that failed.

Required change: identify capture-stage failures and preserve `captureStatus: failed`. Keep prerequisite failures that stop before capture as `not-requested`. Keep blocked assertions `not-run`. Validate through the public CLI with an owned fixture whose native capture fails after a successful identity check. Require BLOCKED, no asset, capture failed and assertion not-run. This is a static, code-backed finding; that precise runtime transition was not exercised here.

CEGUI-N1 remains an optional P3 Repeated Switches heuristic. No change is required for approval.

## Spec

Spec verdict: FAILURE. Two P1 safety gaps; NO ADR applies. Static review of af750e0e...c224ea08907df7d2dc2a12d297bbd107fb1597af and complete GUI driver, plan validation, public workflow coverage, pipeline and record paths. Read the BASE ticket and initiative plus context and ADR index. Existing checks cover rejected input plans, not actual visible dialogs or overlapping windows. Optional smells: none. No tests or checks ran, as assigned. The known Surf approved-space.3 failure was not rerun. Runtime validation remains with the parent.

### Axis concern SP-1

P1, NO ADR, `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/gui-driver.ts:65`. Specification: Initiative decision 38: Stop an affected case when a credential prompt or an unapproved operation appears.

GUI collection has no prompt/operation safety check. identity() checks only the selected parent title and viewability; expectations check dimensions and selected RGB probes. A credential or confirmation dialog can appear without changing those checks. The case can continue and even pass. Rejecting fill/press plans does not exercise the required visible-dialog boundary.

Proposed change: Add a supported visible-state safety boundary that stops the affected GUI case as BLOCKED when such a dialog appears. Do not treat input prohibition alone as prompt detection.

Proposed validation: Through the public CLI, show an actual credential or unapproved confirmation dialog on the approved fixture while unrelated pixel probes still match. Require BLOCKED and verify that no credentials or confirmation input are submitted.

### Axis concern SP-2

P1, NO ADR, `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/gui-driver.ts:102`. Specification: Ticket acceptance: Keep capture within the approved window or display scope.

The selected-window capture path does not check occlusion. The delivered playbook explicitly admits that X11 capture can include occlusion. Window title and IsViewable checks do not establish that another unapproved window is absent from the captured pixels. A warning to keep the window unobscured does not enforce the approved capture boundary.

Proposed change: Use a selected-window capture method that excludes foreign-window pixels, or block collection when the approved window is obscured. Do not broaden approval to the desktop implicitly.

Proposed validation: Overlap the approved fixture with a distinct unapproved window. Run the public CLI and inspect the original PNG. Require either selected-window-only pixels or a blocked case without retained out-of-scope media.

### Reviewer disposition

The two P1 proposals remain unresolved static risks, not reproduced safety failures. The driver forbids all input. Decision 38 begins with a condition about Enter or confirmation actions; the axis applies its later prompt-stop sentence more broadly. This report does not claim that a real credential dialog passed collection.

The playbook explicitly warns about X11 occlusion. No overlapping-window experiment completed. The malformed overlay-write tool call did not execute. This report does not claim that foreign pixels were captured or that selected-window isolation was proved. Preserve this coverage gap for the parent; do not silently convert it to a pass.

Historical CEGUI-R1 is absent at the reviewed source. The complete published example already has `image.lines: []`; fresh public init, render, compile and dry-run passed without substitutions.

## Validation and limits

- **Public CLI smoke:** Absolute source CLI ran from `/tmp`. Help and version passed. The complete mq-extracted example passed init, render, compile and dry-run in an owned temporary repository with repository evidence routing. No capture occurred during dry-run.
- **Fresh native regression:** One run of `RUN_GUI_EVIDENCE_TESTS=1 GUI_EVIDENCE_SCOPE=<owned-X11-fixture> GUI_EVIDENCE_IMAGE=<480x260-three-probes> mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts` passed: 1 test, 49 assertions, 0 failures, 9.41 seconds. The fixture identity was display `:0`, window `0x1e00003`, title `Collector owned review 0024`. Native PASS, dimension FAIL, permission/title BLOCKED and invalid approval/input plans behaved as asserted. The suite used an installed copy and unrelated temporary store.
- **Retained evidence consumers:** Current public validate and verdicts returned exit 0 for native-0001, permission-0001, pixel-failure-0001, identity-blocked-0001 and surf-regression-0001. GUI verdicts remained PASS, BLOCKED, FAIL and BLOCKED. Consumer success does not change recorded failures.
- **Original image inspection:** Retained native-0001 PNG shows the fixture heading, purple and cyan panels and the collector-owned notice. This is historical visual proof, not a fresh screenshot from this review.
- **Known Surf failure:** approved-space.3 still records expected `Submitted`, observed `Not submitted`. The live failure was not rerun. No Surf input code differs in this product slice. Its runtime cause remains unresolved.
- **Unavailable coverage:** Fresh Playwright, TUI and typecheck were not rerun. Recorded Chrome, foot/grim/tesseract and TypeScript/LSP prerequisites remain unavailable. No tools were installed and no sudo was requested. No occlusion or actual visible-dialog scenario completed.
- **Owned-resource cleanup:** The first fixture selected Wayland and could not provide an X11 ID. It was stopped. A separate explicit X11 fixture supported the passing regression and was then stopped. Temporary example repository and test outputs were removed. No borrowed window or session was closed. Axis terminals t7b and t7c were acknowledged and removed; this review terminal t79 remains for the parent.
- **Evidence identity:** No durable fresh evidence run was created. Result evidence is null. Retained evidence was read, not rewritten. Source, tracker, projections and HEAD were not modified. No commit or push occurred.

Axis totals: Standards reports one P2 required change and one optional P3 smell. Spec reports two P1 proposals, both retained as unverified concerns. Final blocking finding: CEGUI-R2. Parent must reconcile this result and the coverage gaps before deciding the next authorized phase.

