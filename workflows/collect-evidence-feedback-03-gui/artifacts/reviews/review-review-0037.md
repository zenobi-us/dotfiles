---
date: 2026-11-12T04:48:49.502322+00:00
title: Independent GUI review review-0037
type: Report
---

# Independent GUI review review-0037

## Verdict

SUCCESS. No blocking findings remain at the frozen source. This is not a green cross-driver baseline.

## Scope

Ticket: `tracker/tickets/collect-evidence-feedback-03-gui.md`. Complete specification: `tracker/initiatives/collect-evidence-feedback/index.md`. Authoritative documents and workflow inputs came from BASE `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. Source copies were not substituted.

Source: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-03-gui`. Branch: `feature/collect-evidence-feedback-03-gui`. Base: `master`, pinned `d22002f5ed1e2b1cae731171a81207ed95d0ca3b`. Reviewed commit: `d70fe7e463638f134d6226397ca38724492deca4`. Reviewed tree: `1cfddc006ae099564cbef521b2cea8384c8c461d`.

Reviewed `git diff d22002f5ed1e2b1cae731171a81207ed95d0ca3b...HEAD`: 16 files, 385 insertions, 36 deletions. Commits: `9df94bbe` tracker claim, `b17449dc` native capture, `d70fe7e4` capture status. Read complete ticket, initiative, context map, context, domain/tracker configuration, ADR index and ADR 0001. NO ADR applies: ADR 0001 concerns Pi Ink cleanup.

Consumed review-0030/0031, fix-0027/0028, pr-draft-fix-0027, validation-fix-0027, and recovery finish-0033/0034/0035. Parent review-0036 dispatches this attempt. The inspector calls the active dispatch retryable; this session completes that dispatch without creating a duplicate phase.

Reviewer: terminal `t7k`, session `herdr-app:t7k`, run `995f6101-fa78-49e7-8c64-230fdc201292`. Timestamp: 2026-11-12T04:48:49.502322+00:00.

## Standards

No required standards defect found in the complete d22002f5ed1e2b1cae731171a81207ed95d0ca3b...HEAD diff. Reviewed BASE agent instructions, ticket, initiative, context map, context, domain rules, ADR index and ADR 0001. ADR 0001 concerns Pi Ink and does not govern this GUI change. Prior review-0030 was context only.

The GUI allowlist accepts only expect and human steps. Exact local display, window and title approval precedes capture. The driver preserves borrowed resources. Records retain the common schema, actual PNG provenance and distinct capture/assertion outcomes. CaptureError propagates from doctor and case capture through verdict handling; blocked captures remain failed/not-run without assets. Pre-capture access failures remain not-requested.

Upstream records generate Markdown through mq with the required okf import. Publication seals a validated private tree, reserves the destination with exclusive mkdir and renames into that empty reservation. These unchanged prerequisites do not introduce another GUI storage convention.

Repeated driver dispatch in records.ts remains the previously documented optional CEGUI-N1 P3 heuristic, not a required defect. No additional concrete smell warrants a finding. The published example includes lines: []. Documented X11 occlusion and visible-dialog coverage limits are not reproduced defects.

Static review only. No tests, captures, source/tracker edits or workflow records were created. The known Surf approved-space.3 failure was not rerun or represented as passing. Parent owns runtime verification and final review-0037.

Axis addendum: `references/gui.md:17` still lists GNU `mv` as a prerequisite. The synchronized pipeline requires `mq`, and records publish through native mkdir/rename. This is a concrete nonblocking documentation nit, CEGUI-N2 P3. The Standards child acknowledged it in its completion signal after immutable axis delivery.

## Spec

No required Spec finding. Reviewed the complete pinned d22002f5ed1e2b1cae731171a81207ed95d0ca3b...HEAD diff for frozen d70fe7e463638f134d6226397ca38724492deca4. Read the complete BASE ticket, initiative, context map, context, ADR index and ADR 0001. Prior review-0030 was context only. No GUI ADR applies.

Static evidence: The implementation reuses Plan/Driver, store routing, records, notes and reports. gui-plan.ts:7–20 requires exact approved display/window/title, dimensions and RGB probes; only expect and human actions are allowed. The documented example includes lines: []. gui-driver.ts:49–83 probes native access and checks selected identity, dimensions, RGB probes and consecutive frame hashes. Records derive dimensions and SHA-256 from actual bytes and bind GUI identity and borrowed ownership. Cleanup removes collector temporary files only.

CaptureError at gui-driver.ts:102–108 covers native import failures, including the doctor probe. Its failure flag reaches verdict.ts:37–59 and records.ts:310–319: blocked capture failures remain failed captures with assertions not-run; pre-capture permission/identity failures remain not-requested. CEGUI-R2 is addressed statically.

records.ts:162–175 validates and seals the private tree, exclusively reserves the destination with mkdir, then publishes by same-parent rename. It no longer uses GNU mv. Markdown generation still uses mq with the required OKF import; gui.md:17 retains an obsolete GNU mv prerequisite. This is a nonblocking documentation nit, not missing GUI behavior.

The public regression covers installed-copy execution, native pixels, mismatches, denied authorization, title/scope boundaries, input rejection, capture failure, validation/report agreement and borrowed-window preservation. This axis ran no tests or captures. Parent reports fresh native smoke: 1 pass, 0 fail, 60 assertions; parent owns that runtime evidence.

Decision 38 says, ‘Before Enter or a confirmation action, check the current screen and the approved action scope.’ This read-only driver sends neither action. Input rejection does not prove generalized dialog detection. Exact X11 target selection does not prove occlusion isolation; the playbook requires an unobscured surface. Both remain unverified concerns, not reproduced failures. Known Surf approved-space.3 failure was not rerun or represented as passing.

## Findings and retained limits

**Blocking findings:** None.

**CEGUI-R2 resolved:** CaptureError preserves capture failure from the doctor probe and case capture. Fresh public CLI smoke confirms BLOCKED, failed capture, not-run assertion, null asset and no media. Pre-capture permission and identity failures remain not-requested.

**CEGUI-N2 optional P3:** NO ADR. `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/gui.md:17` lists obsolete GNU `mv`. Remove that prerequisite to match synchronized portable publication. Validation: compare the playbook with pipeline.ts:90–96 and records.ts:162–175. It does not block correct GUI collection.

**CEGUI-N1 optional P3:** Repeated driver dispatch in records.ts remains a maintainability heuristic. No required change.

**CEGUI-R1 disproven:** The published example contains `image.lines: []`. No example rerun was needed.

**Unverified concerns:** Input-plan rejection does not prove generalized visible-dialog detection. Exact X11 window selection does not prove occlusion isolation. No new dialog or overlap experiment ran. Neither concern is a reproduced failure. The read-only driver and unobscured-window requirement remain explicit limits.

## Synchronization review

The approved base-sync commit has recorded parents `14f0f571` and `8faf41f4`; source is rebased onto it. pipeline.ts:93 retains GUI in its driver allowlist; line 94 retains upstream mq-only prerequisites. No GNU mv probe returned. records.ts:162–175 retains upstream validate/seal, exclusive mkdir reservation and same-parent rename publication. The GUI changes add provenance and surface checks without replacing that mechanism.

`git merge-tree --write-tree d22002f5ed1e2b1cae731171a81207ed95d0ca3b d70fe7e463638f134d6226397ca38724492deca4` returned `1cfddc006ae099564cbef521b2cea8384c8c461d`. The expected clean integration tree equals the frozen source tree. No integration was performed.

## Validation

```sh
mise exec -- env RUN_GUI_EVIDENCE_TESTS=1 GUI_EVIDENCE_SCOPE='{"display":":0","window":"0x2a00014","title":"Collector owned review 0037"}' GUI_EVIDENCE_IMAGE='{"width":480,"height":260,"pixels":[{"x":40,"y":110,"rgb":[102,51,153]},{"x":300,"y":110,"rgb":[51,204,221]}],"lines":[]}' bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts
```

Fresh result: **1 pass, 0 fail, 60 expect() calls, 11.01 seconds**. Ran once after static review. No failed test invocation or setup correction occurred. The owned Tk inner window was queried before the test to select its exact titled wrapper `0x2a00014`.

The test runs a temporary installed CLI copy from an unrelated directory with a temporary resolved repository store. It exercises real native RGB pixels, dimension mismatch, denied X11 authorization, title mismatch, PNG-policy capture failure, approval mismatch, credential-input rejection and confirmation rejection. Public validate, verdicts and report agree. The synchronized mkdir/rename path successfully seals normal and blocked GUI runs. Dry-run leaves the temporary root unchanged. The borrowed fixture remains viewable after each collected case.

The PNG-denial policy causes a real native capture failure after identity access succeeds. Its record is BLOCKED with captureStatus failed, assertionResult not-run, assetId null and no assets. Permission/title failures stop before capture and retain not-requested.

A separate owned-window xwininfo query after the test confirmed the titled fixture remained viewable at 480 × 260. The test removed `/tmp/evidence-gui-public-WGtxus`. This review did not separately inspect a fresh original PNG visually; pixel and dimension checks are the fresh image proof. No fresh durable resolved evidence run exists: evidence is null.

Prior evidence, not rerun: fix-0027 records failing-before/passing-after capture status and 99 supporting tests with 892 assertions. Known Surf `approved-space.3` expected `Submitted`, observed `Not submitted`; it was not rerun, suppressed or labelled pass. Fresh Playwright, TUI and typecheck remain unexercised due to retained prerequisite gaps. No broad suite or unchanged-example rerun is claimed.

No manual installation, sudo, arbitrary desktop capture, remote Git operation or unapproved input occurred in this review. finish-0035 records that mise automatically installed font-install and rustledger during the parent's earlier base synchronization; do not interpret this review as proof that the environment installed nothing.

## Resources and delivery

Standards axis: run `0befa4b6-6ef7-4332-ae64-1b6a77a4bf32`, terminal `t7n`. Spec axis: run `b2f6f2c9-5142-4412-bf5a-ce59f09550b4`, terminal `t7m`. Both delivered verified review-axis/v1 results, emitted completed signals and received hash acknowledgements. Only those terminals were stopped and removed. Desktop listing confirmed they were gone; source workspace and reviewer t7k remain for the parent.

The owned fixture service `cegui-review0037-fixture` was stopped and its script removed. The regression removed its temporary installed copy, stores and policy. Temporary axis handoffs were removed. No borrowed resource was closed. No source, HEAD, tracker or projection edits occurred. No commit, push or merge occurred.

Sole review artifact: `workflows/collect-evidence-feedback-03-gui/artifacts/reviews/review-review-0037.md`. Authoritative result receipt: `workflows/collect-evidence-feedback-03-gui/events/review-0037.yaml`. Result transport follows the assigned result-delivery context; it is not workflow authority.

## Next step

Parent validates this receipt and source identity, records phase completion, and inspects the workflow. Parent owns finish and independently verifies the integrated native workflow after merge. This review does not authorize integration independently.

Axis totals: Standards has zero blocking findings, optional CEGUI-N1 and optional CEGUI-N2. Spec has zero blocking findings and retained unverified dialog/occlusion coverage concerns.

