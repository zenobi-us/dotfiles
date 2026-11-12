---
date: 2026-11-12T04:36:58.936Z
title: Independent GUI review review-0030
type: Report
---

# Independent GUI review review-0030

## Verdict

SUCCESS. No blocking findings remain at the frozen source. CEGUI-R2 is resolved. CEGUI-N1 remains optional P3. This verdict is not a green cross-driver baseline.

## Scope

Ticket: `tracker/tickets/collect-evidence-feedback-03-gui.md`. Specification: `tracker/initiatives/collect-evidence-feedback/index.md`. Authoritative workflow inputs came from BASE `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`, not source copies.

Source: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-03-gui`. Branch: `feature/collect-evidence-feedback-03-gui`. Base: `master`, pinned `b29b5387973467d8e21266fc9989127b4bdf3c92`. Reviewed source: `4a938e995dd0802734a90cc52d58d53fe9d4da71`; tree: `24e210d91d87828411ef0d0146d938f6934e66b7`.

Reviewed `git diff b29b5387973467d8e21266fc9989127b4bdf3c92...HEAD`: 16 files, 385 insertions, 36 deletions. Commits: d92df7fd tracker claim, 78a9119c native GUI, 4a938e99 capture status. Bundle manifests advance developer to 0.2.21.

Consumed review-0029, fix-0027, fix-0028, implementation-0002, prior review-0024, pr-draft-fix-0027 and validation-fix-0027. Read complete ticket, initiative, CONTEXT-MAP.md, CONTEXT.md, tracker/domain configuration, ADR index and ADR 0001. ADR 0001 concerns Pi Ink cleanup; NO ADR applies to this GUI change.

The inspector reports this dispatched in-flight review as retryable. This session completes its assigned review-0029, not a duplicate phase.

Reviewer: herdr-app terminal `t7f`, session `herdr-app:t7f`, run `0c2f208c-c0d5-489b-a769-ea72f88bea3f`. Timestamp: 2026-11-12T04:36:58.936Z.

## Standards

Standards: no required defect found in the reviewed diff. Read the authoritative BASE ticket, initiative, context documents, ADR index and review-0024. No GUI ADR applies.

CEGUI-R2 is addressed by code inspection: gui-driver.ts:103–108 wraps native capture failures in CaptureError. The catch at line 86 propagates captureFailed, including failures in the doctor probe before step records exist. verdict.ts:37–59 preserves failed capture status; records.ts:310–319 preserves BLOCKED assertions as not-run. Missing tools, denied identity queries and title mismatch do not receive CaptureError and remain not-requested. This is static evidence, not a fresh runtime pass. The public regression now includes a PNG-denial capture failure and checks all three status outcomes. The parent owns execution.

CEGUI-N1 remains an optional P3 Repeated Switches heuristic in records.ts. No change is required.

The published GUI example contains image.lines: []; CEGUI-R1 does not apply.

The driver forbids GUI input. The specification introduces its confirmation safety boundary with Before Enter or a confirmation action. Visible-dialog detection and X11 occlusion isolation remain unverified coverage concerns, not observed failures or additional required standards changes. The playbook documents occlusion limits.

Reviewed the full b29b5387973467d8e21266fc9989127b4bdf3c92...HEAD diff and relevant status propagation. No tests, installation, capture or source changes occurred. The known Surf approved-space.3 failure was not rerun and is not a passing acceptance claim.

## Spec

No required Spec finding from the read-only review of b29b5387973467d8e21266fc9989127b4bdf3c92...4a938e995dd0802734a90cc52d58d53fe9d4da71. Read the complete BASE ticket, initiative, context map, context, ADR index and review-0024; reviewed the full diff and relevant pipeline, verdict and record callers. No GUI ADR applies.

Code facts: The driver uses the common Plan/Driver, routing, records and report pipeline. Exact display/window/title approval precedes native capture. Image expectations check dimensions, RGB probes and consecutive frame hashes. Capture provenance records actual bytes, dimensions and borrowed ownership. GUI input is rejected; cleanup removes only temporary collector files. Linux X11 and unavailable-video limits are explicit.

CEGUI-R2 is addressed statically: gui-driver.ts:30–31,49,87,102–108 routes both the doctor probe and collection import failures through CaptureError. verdict.ts:37–59 preserves BLOCKED and captureStatus failed; records.ts:310–319 keeps blocked assertions not-run. Missing tools, denied identity access and title mismatch before capture remain not-requested. The public regression includes native capture denial and separate prerequisite failures. Parent must confirm runtime results.

Decision 38 says, ‘Before Enter or a confirmation action, check the current screen and the approved action scope.’ In this read-only driver no such action exists. Requiring generalized dialog recognition would extend this boundary. Actual visible-dialog handling remains unverified; rejected input plans do not prove dialog recognition. Do not retain the prior dialog proposal as an observed failure.

Ticket scope says, ‘Keep capture within the approved window or display scope.’ The implementation selects the exact approved X11 target and documents an unobscured-window prerequisite. Overlap isolation remains unverified. Neither foreign-pixel leakage nor isolation is proved here; the prior occlusion proposal is not a reproduced blocker.

CEGUI-R1 remains disproven: the published example includes lines: []. CEGUI-N1 remains an optional Standards concern, not a missing requirement.

Checks: read-only source/spec comparison only. No tests, desktop capture or runtime smoke ran in this axis. The known Surf approved-space.3 failure was not rerun or represented as passing. Parent owns smoke verification and the integration verdict.

## Findings and disposition

**Blocking findings:** None.

**CEGUI-R2 resolved:** CaptureError marks native import failures in doctor and case capture. The existing verdict and record pipeline preserves BLOCKED, failed capture, not-run assertion and no asset. Fresh public CLI smoke confirms the doctor-probe failure boundary. Pre-capture identity and authorization failures remain not-requested. The existing regression failure was not suppressed.

**CEGUI-N1 optional:** P3, NO ADR, `scripts/browser-evidence/records.ts:134` under collect-evidence. Repeated driver-to-surface/method dispatch remains a maintainability heuristic, not a completion blocker. No change required.

**Retained uncertainty:** No visible-dialog or overlapping-window experiment ran. Input-plan rejection proves that the driver sends no input; it does not prove dialog detection. Exact X11 target selection does not prove occlusion isolation. The playbook requires an unobscured approved surface. Neither prior proposal is promoted to an observed safety failure. No generalized dialog recognition or new capture backend is required by this bounded review.

**Historical CEGUI-R1:** Disproven. The unchanged published example contains `lines: []`; prior public example compile evidence is retained, not rerun here.

## Validation

```sh
mise exec -- env RUN_GUI_EVIDENCE_TESTS=1 GUI_EVIDENCE_SCOPE='{"display":":0","window":"0x2a00011","title":"Collector owned review 0030"}' GUI_EVIDENCE_IMAGE='{"width":480,"height":260,"pixels":[{"x":40,"y":110,"rgb":[102,51,153]},{"x":300,"y":110,"rgb":[51,204,221]}],"lines":[]}' bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts
```

**Fresh result:** 1 pass, 0 fail, 60 assertions, 11.00 seconds. The suite runs an installed temporary copy from an unrelated directory and temporary resolved repository store. It exercises real native pixels, dimension mismatch, denied authorization, title mismatch, PNG-policy capture failure, scope mismatch, credential-input rejection and Enter-confirmation rejection. Public validate, verdicts and report agree. Dry-run leaves the root unchanged. The borrowed fixture remains viewable after each collected case.

**Capture-stage proof:** The temporary real ImageMagick PNG-denial policy fails native capture after identity succeeds. The sealed case is BLOCKED with `captureStatus: failed`, `assertionResult: not-run`, `assetId: null` and no assets. Permission and identity cases remain `captureStatus: not-requested`. No fake capture or mocked failure was used.

**Fixture setup correction:** The first invocation used Tk's unnamed inner ID `0x2a00010`. Doctor correctly stopped before capture with title mismatch; 0 pass, 1 fail, 1 assertion. An owned-window-only xwininfo query identified its titled wrapper `0x2a00011`. The single complete native scenario then passed with that corrected scope. This setup error is not a product failure and is not hidden.

**Prior checks, not fresh:** fix-0027 records failing-before capture status, passing-after 60 native assertions, and 99 supporting tests with 892 assertions. No supporting suite rerun is claimed here. No fresh standalone example workflow or retained-run validation ran in this attempt.

**Known Surf failure:** `approved-space.3` expected `Submitted`, observed `Not submitted`. It was not rerun, suppressed or labelled pass. No Surf input code changed in this diff. This review finds no code-backed GUI regression cause; the unrelated retained failure remains an integration caveat.

**Coverage limits:** Fresh Playwright, TUI and typecheck remain unexercised due to recorded prerequisites. No installs, sudo, desktop capture, arbitrary window capture or unapproved input occurred. The native test checked captured dimensions and RGB probes; this review did not separately inspect a fresh original PNG visually.

## Resources and delivery

Standards axis: run `31141811-3b82-4859-bb0c-fae22c97647a`, terminal `t7g`. Spec axis: run `c941c979-7ea2-49ac-b209-82b56463ee6c`, terminal `t7h`. Both performed read-only review, delivered verified review-axis/v1 results and sent completed signals. Results were acknowledged; only these child terminals were stopped and removed.

The owned Tk fixture service `cegui-review-0030-fixture` was stopped. Its script was removed. The regression removed its temporary installed copy, evidence stores and denial policy. No borrowed window or session was closed. Terminal t7f remains for the parent.

No durable fresh evidence run exists; evidence is null. Source, tracker, projections and HEAD were not changed. No commit, push or merge occurred. This artifact and review-0030 are the only authoritative outputs.

## Next step

Parent must validate the receipt and unchanged source, append its phase completion, and inspect the workflow before integration. The parent owns finish. This review does not authorize a merge independently.

Axis totals: Standards has zero blocking findings and one optional P3 heuristic. Spec has zero blocking findings and two retained unverified coverage concerns.

