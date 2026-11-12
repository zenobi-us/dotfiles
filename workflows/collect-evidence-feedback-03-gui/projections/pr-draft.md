---
schema: worktree-pr-draft/v1
kind: projection
---

# Historical fix disposition — fix-0027

Fix [fix-0027](../events/fix-0027.yaml) resolves CEGUI-R2 only. Source `4a938e995dd0802734a90cc52d58d53fe9d4da71`, tree `24e210d91d87828411ef0d0146d938f6934e66b7`. Pinned-base rebase completed; source commit is clean. Latest historical review remains FAILURE at the older source; independent review is required. No merge or push.

# Historical fix disposition — fix-0014

Fix fix-0014 completed: CEGUI-R1 resolved as already satisfied at unchanged source `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71` / `36f17fc4bb60031eedb54d69a88b2a1c3ef93d74`. No source change or new commit needed. Latest historical review verdict remains FAILURE; a fresh review is separate and was not launched. No merge or integration approval.

# Collect scoped native GUI evidence

## Ticket summary and problem

[Ticket](../../../tracker/tickets/collect-evidence-feedback-03-gui.md): capture only the approved native window or display, use common evidence records and preserve borrowed resources. The earlier public CLI rejected the GUI driver.

## Implementation

Implemented read-only Linux X11 GUI window/display capture, exact scope approval, real selected-surface doctor checks, stable-frame RGB assertions, native provenance, immutable common records and GUI playbook. Existing web and TUI drivers remain in place.

Source commit: `0e23bc5a95e72e69cdb4b5117b979cdd391fd510`. Source tree: `fcc897b3612aaf5ebe7faad12d773c2f7e55132f`.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/gui.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/gui-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/gui-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/load-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/render-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts`

## Validation results

- **PASSED**: RUN_GUI_EVIDENCE_TESTS=1 KEEP_GUI_EVIDENCE=1 GUI_EVIDENCE_SCOPE=<approved-fixture> GUI_EVIDENCE_IMAGE=<480x260-rgb-probes> mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test. Installed temporary copy from unrelated cwd with temporary resolved evidence store; actual GTK X11 fixture
- **PASSED**: Native image inspection. Expected heading, purple and cyan panels, fixture notice; no unrelated desktop content
- **PASSED**: GUI doctor and run with XAUTHORITY=/dev/null. Sealed BLOCKED; no assets; assertion not-run
- **PASSED**: GUI failed dimension assertion, title mismatch, scope mismatch, credential fill and Enter confirmation. Recorded in validation details.
- **PASSED**: Current public validate against retained TUI transition copy and four durable GUI runs. Recorded in validation details.
- **FAILED**: mise exec -- env COLLECT_EVIDENCE_REAL_DRIVERS=1 bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts -t "surf: capture". approved-space.3 expected Submitted, got Not submitted
- **BLOCKED**: Public doctor --driver playwright. Chrome distribution absent at /opt/google/chrome/chrome; no installation attempted
- **BLOCKED**: Public doctor --driver tui. foot, grim and tesseract absent; no installation attempted
- **UNAVAILABLE**: TypeScript language server / compiler availability. LSP initialization failed: no workspace TypeScript installation. No tsc binary or local TypeScript dependency found. No typecheck claimed.
- **PASSED**: Borrowed GUI cleanup inspection. xwininfo found the fixture window after each public case. Only its owning smoke harness later stopped its service. No borrowed resource shutdown occurred.

## Review history and findings

Latest reviewer verdict: FAILURE for `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71`. Open blocking finding: CEGUI-R1 (P2). Standards: no hard breach; CEGUI-N1 is an optional P3 heuristic. Resolved findings: none. See the [immutable review](../artifacts/reviews/review-review-0006.md) and [result](../events/review-0006.yaml). The Surf failure remains unresolved; no diff-caused change was identified.

## Fix attempt fix-0009

Blocked: CEGUI-R1 conflicts with the exact reviewed source. The published plan already contains `lines: []`. Public init and compile of the unchanged mq-extracted example both returned exit 0 from `/tmp`, with no substitutions. No source edits or source commit were made. The historical review remains immutable; no replacement verdict is claimed.

- [Fix result](../events/fix-0009.yaml)
- [Compile proof](../artifacts/snapshots/validation-fix-0009.json)
- [Fix snapshot](../artifacts/snapshots/pr-draft-fix-0009.md)
- [Parent completion](../events/fix-0010.yaml)

## Merge status

Not merged or pushed. Source ticket remains claimed. Source worktree is retained and unchanged. Reviewer terminals are closed. Parent completion: [review-0007](../events/review-0007.yaml). Next action: reconcile the inconsistent CEGUI-R1 finding with the pinned source and compile proof before another phase.

## Supporting receipts and artifacts

- [Review start](../events/review-0005.yaml)
- [Review result](../events/review-0006.yaml)
- [Review completion](../events/review-0007.yaml)
- [Immutable review](../artifacts/reviews/review-review-0006.md)

- [Start receipt](../events/start-0001.yaml)
- [Implementation result](../events/implementation-0002.yaml)
- [Immutable PR draft](../artifacts/snapshots/pr-draft-implementation-0002.md)
- [Validation details](../artifacts/snapshots/validation-implementation-0002.json)
- [native-0001](../artifacts/evidence/native-0001/run.json)
- [permission-0001](../artifacts/evidence/permission-0001/run.json)
- [pixel-failure-0001](../artifacts/evidence/pixel-failure-0001/run.json)
- [identity-blocked-0001](../artifacts/evidence/identity-blocked-0001/run.json)
- [surf-regression-0001](../artifacts/evidence/surf-regression-0001/run.json)

## Open questions

- The additional live Surf regression failed at approved-space.3 (expected Submitted, observed Not submitted). Independent review must assess this before integration; no Surf input handling changed.
- Fresh Playwright and TUI capture coverage is blocked by host prerequisites. The retained TUI transition archive validates.
- Native Wayland, macOS, Windows, GUI video, OCR and automated GUI input are explicit unsupported capabilities.

## fix-0014 — authorized finding reconciliation

CEGUI-R1 (P2, NO ADR) is resolved as already satisfied, not by a source edit. The frozen source commit `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71` and tree `36f17fc4bb60031eedb54d69a88b2a1c3ef93d74` already contain `image.lines: []`. Tracked and working GUI playbook blob: `58ebd084ae99f91255bec613d86e2f36d38c54b3`. The full mq-extracted TypeScript example equals the unchanged example preserved in fix-0009.

Fresh public absolute `collect-evidence.ts init` and `compile` ran from unrelated `/tmp` with an owned temporary repository. Both returned exit 0 and `success: true`; compile reported one GUI test. No substitutions, GUI capture, source changes, new source commit, hooks or bundle-version changes occurred. The initial init probe lacked a temporary origin and returned exit 3; adding local origin configuration allowed the real check. This was setup only; no remote operation occurred.

Recovery consumes [takeover approval](../events/fix-0011.yaml), [phase start](../events/fix-0012.yaml), both historical review receipts, and prior fix-0009/fix-0010 proof. Parent t6z repaired only the approval pane identity with explicit user authorization. [Repair provenance](../events/fix-0013.yaml) preserves the original approval bytes and SHA-256. Child t70 verified the original hash and successful history inspection. Parent owns publication and phase completion.

[Fix result](../events/fix-0014.yaml) · [Current exact-example proof](../artifacts/snapshots/validation-fix-0014.json) · [Earlier proof](../artifacts/snapshots/validation-fix-0009.json).

Changed source files: none. No new source commit is needed. Historical review-0006/0007 FAILURE and prior blocked fix-0009/0010 remain unchanged. This fix issues no review verdict. CEGUI-N1 remains optional and untouched. The earlier sections are retained history, not the current finding disposition.

Remaining verification gaps: Surf expected `Submitted`, observed `Not submitted`; unavailable Chrome, foot/grim/tesseract and TypeScript/LSP prerequisites. None were rerun or dismissed. No merge, push, tracker status mutation or integration approval occurred.

The prepared fix-0013-named validation/draft snapshots predate the receipt allocation correction. They remain immutable preparation artifacts, not phase-result receipts. Result fix-0014 consumes repair receipt fix-0013 and keeps phase-start fix-0012 as parent.



## Parent completion fix-0015

[Verified completion](../events/fix-0015.yaml) links to [fix-0014](../events/fix-0014.yaml). Parent verified authoritative receipt equality, exact clean source identity, all output paths and successful unchanged-example public init/compile evidence. Delivery hash `3079c967c349bbb91020ab5ab115f2972f9aa066da908bcdb258b99fb8990803` acknowledged. Fresh fixer `omp` terminal `t70` emitted completed sequence 2 and was closed and removed. Source workspace retained; empty app space was removed automatically.

CEGUI-R1 is resolved as already satisfied. No source edits or source commit; no new review verdict, merge, push or ticket completion. Historical FAILURE and recorded Surf/prerequisite gaps remain. Next action is fresh independent review of the unchanged clean source.


## Current review — review-0017

Latest verdict: SUCCESS for unchanged commit `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71`, tree `36f17fc4bb60031eedb54d69a88b2a1c3ef93d74`. Zero blocking findings; optional CEGUI-N1 (P3) remains. CEGUI-R1 is not present in this frozen source. Historical sections above remain history, not the current verdict.

[Immutable review](../artifacts/reviews/review-review-0017.md) · [Review result](../events/review-0017.yaml) · [Parent completion](../events/review-0018.yaml).

Fresh owned-fixture native GUI check: 1 pass, 49 assertions. Full published example init/compile/dry-run passed. Parent independently validated retained native and denied-permission archives and inspected the retained native PNG. Source files changed: none. Review terminals closed; source worktree retained.

Surf approved-space.3 still fails (expected Submitted, observed Not submitted); not rerun or accepted as passing. Fresh Playwright/TUI/typecheck coverage remains unavailable in the recorded setup. No merge, push or ticket completion.


## Finish attempt finish-0020 — blocked

No merge occurred. Read-only integration calculation found add/add conflicts in manifest.yaml and all three workflow projections. The expected clean merge tree could not be established. [Failure receipt](../events/finish-0020.yaml) records all four paths and unchanged source identity.

Source remains at reviewed commit `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71`. Ticket remains incomplete; no push or cleanup occurred. Unrelated dirty base changes were preserved. Resolve the integration strategy before retrying; source changes require a fresh review.


## Current review — review-0024

Latest verdict: FAILURE for `c224ea08907df7d2dc2a12d297bbd107fb1597af`, tree `2f409d6d19cfc5bcd56cd824f74410b58aa2ed1c`. Blocking finding CEGUI-R2 (P2): native capture-stage errors lack captureFailed and can record captureStatus not-requested instead of failed. Required change: preserve capture-stage failure classification without changing prerequisite-before-capture classification. Exact runtime failure scenario remains unexercised.

[Immutable review](../artifacts/reviews/review-review-0024.md) · [Review result](../events/review-0024.yaml) · [Parent reconciliation](../events/review-0025.yaml). Prior SUCCESS covers a stale source identity and is not integration approval.

Updated source rebase completed under [operator approval](../events/finish-0021.yaml) and [mapping](../events/finish-0022.yaml). Four projection conflicts resolved by preserving current base history. Product paths are unchanged from the previous reviewed slice.

Fresh public GUI regression passed 49 assertions. Full example init/render/compile/dry-run and retained record consumers passed. Known Surf failure and unavailable Playwright/TUI/typecheck remain. Two P1 Spec proposals are unverified concerns, not reproduced safety failures.

Recovered usable result after native wait timeouts; no duplicate reviewer was launched. Reviewer t79 and owned fixtures/axis terminals are closed. Source worktree retained; no merge, push or ticket completion. Next action: approved fresh fixer for CEGUI-R2, then another independent review.

## fix-0027 — capture-stage failure repair, attempt 5

Consumed [review-0024](../events/review-0024.yaml), [review-0025](../events/review-0025.yaml), [immutable review](../artifacts/reviews/review-review-0024.md) and [authorized phase start](../events/fix-0026.yaml).

The capture helper now marks native import errors with a private CaptureError. The GUI result propagates captureFailed, including collection doctor-probe failures. Identity, authorization and missing-tool checks before capture remain not-requested. Blocked assertions remain not-run; capture failure retains no asset. No web/TUI product behavior changed.

Changed files:

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/gui.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/gui-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts`

The hk hook updated both bundle manifests to developer 0.2.21. The source was rebased through Worktrunk onto approved pinned master `b29b5387973467d8e21266fc9989127b4bdf3c92` before product edits. No event receipts were rewritten.

Validation:

- **OBSERVED:** `mise exec -- wt step rebase b29b5387973467d8e21266fc9989127b4bdf3c92` — passed; authorized pinned-base synchronization; no manual conflicts.
- **OBSERVED:** `mise exec -- env RUN_GUI_EVIDENCE_TESTS=1 GUI_EVIDENCE_SCOPE='{"display":":0","window":"0x2a0000a","title":"CEGUI-R2 owned fixture"}' GUI_EVIDENCE_IMAGE='{"width":480,"height":260,"pixels":[{"x":40,"y":110,"rgb":[102,51,153]}],"lines":[]}' bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts` — before fix: failed at capture-failure event; expected failed, observed not-requested; BLOCKED, no asset, assertion not-run.
- **OBSERVED:** `mise exec -- env RUN_GUI_EVIDENCE_TESTS=1 GUI_EVIDENCE_SCOPE='{"display":":0","window":"0x2a0000a","title":"CEGUI-R2 owned fixture"}' GUI_EVIDENCE_IMAGE='{"width":480,"height":260,"pixels":[{"x":40,"y":110,"rgb":[102,51,153]}],"lines":[]}' bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts` — after fix: 1 pass, 0 fail, 60 assertions; installed-copy public CLI; native PNG policy denial after identity; BLOCKED, captureStatus failed, assertionResult not-run, assetId null, no assets; prerequisite permission and identity cases not-requested.
- **OBSERVED:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/verdict.test.ts mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts` — 99 pass, 0 fail, 892 assertions.
- **UNAVAILABLE:** `xd://lsp references guiDriver` — unavailable: initialize failed; no valid workspace TypeScript installation; no typecheck claimed.
- **OBSERVED:** `mise exec -- git commit` — passed; hk bundle-versions updated developer to 0.2.21 and staged two manifests.

Resolved: CEGUI-R2 (P2, NO ADR). Remaining: CEGUI-N1 optional P3; two unverified P1 Spec concerns.

- Known Surf approved-space.3 failure: expected Submitted, observed Not submitted; not rerun or passed.
- Fresh Playwright/TUI/typecheck coverage not established; prior host prerequisite limits retained.
- CEGUI-N1 optional P3 unchanged.
- Two P1 Spec proposals remain UNVERIFIED concerns; no prompt-dialog or occlusion experiment performed.
- No durable independently resolved evidence run created; evidence null. Native test temporary stores and policy removed.
- Independent review required for new source; no merge, push, removal or tracker completion.

Owned fixture service stopped. Own temporary fixture script, test stores and policy removed. [Validation snapshot](../artifacts/snapshots/validation-fix-0027.json) · [Immutable draft](../artifacts/snapshots/pr-draft-fix-0027.md) · [Result receipt](../events/fix-0027.yaml).

Earlier sections below/above retain historical dispositions, not current integration approval. Parent owns fresh review and finish.



# Historical finish checkpoint — verified integration

The latest review is SUCCESS: [review-0037](../artifacts/reviews/review-review-0037.md), frozen source `d70fe7e463638f134d6226397ca38724492deca4`, tree `1cfddc006ae099564cbef521b2cea8384c8c461d`. CEGUI-R2 is resolved; no blocking findings. Optional CEGUI-N1 and CEGUI-N2 remain. Historical sections above retain prior verdicts and are not current status.

GUI squash integration `4441b5c0aacecbb6620b1696a5b3c483e5733fb7` has sole parent `d22002f5ed1e2b1cae731171a81207ed95d0ca3b` and exact reviewed tree. Authorized remote-settings synchronization `11a3cf835e66934ffa9104ec971140f7004428cb` preserves both histories without changing GUI code. [Prepared mapping](../events/finish-0039.yaml), [merged mapping](../events/finish-0040.yaml), [integrated validation](../events/finish-0042.yaml).

Integrated native public CLI: 1 pass, 60 assertions. Supporting verdict/workflow checks: 99 pass, 892 assertions. The first integrated invocation correctly failed because the owned resizable fixture was851x463 instead of480x260; the failure and original PNG remain [sealed](../artifacts/evidence/integrated-fixture-size-0041/run.json). Only fixture sizing changed. The corrected full workflow passed; [all five sealed scenarios](../artifacts/evidence/integrated-native-0042/) validate. The original480x260 native PNG was visually inspected.

Known Surf failure and unavailable Playwright/TUI/typecheck remain. No generalized dialog-detection or occlusion-isolation proof is claimed. Merge verified; remote publication, ticket completion and worktree cleanup are pending.


# Current outcome — ticket completed; cleanup blocked

GUI integration `4441b5c0aacecbb6620b1696a5b3c483e5733fb7` and canonical ticket completion are published on origin/master. Last observed remote `445f458480358d980089e8d614d7353750fe2275` contains both. Ticket state is completed. [Publication](../events/finish-0043.yaml) · [Published completion](../events/finish-0045.yaml). Review-0037 SUCCESS covers the frozen source and preserved integration mapping. Integrated native60 assertions and99 supporting tests passed; prior fixture-sizing failure remains immutable.

Finish is FINISH_FAILED only at worktree cleanup. [Failure receipt](../events/finish-0046.yaml): scoped cleanup refused `feature/collect-evidence-feedback-03-gui` because a process uses its source directory. Worktree and branch retained; no force removal or unidentified process shutdown. Reviewer/fixer panes and owned fixtures are closed; no source app workspace remains. Unrelated cleanup candidates were left untouched.

Release the process using the source worktree, then rerun finish to reconcile cleanup without repeating merge, push or ticket completion. Remaining historical Surf/typecheck/platform coverage limits and optional findings stay recorded above.


## Finish recovery finish-0048

Approved takeover: [finish-0047](../events/finish-0047.yaml). [Finish result](../events/finish-0048.yaml): FINISH_FAILED at worktree cleanup. Integration `4441b5c0aacecbb6620b1696a5b3c483e5733fb7` and ticket completion `a8f8758beb01cc0246d5a7260ba74d8968393879` are reachable from observed remote master `4f8f6ed72e3d63a416d58e9888be548fbe423915`. Ticket remains completed. No merge, product change, ticket completion, or product validation was repeated. Existing validation remains recorded in finish-0042.

The prior parent t6z exited 0. No active source workspace appears in herdr-app. Scoped cleanup refused because a process runs in the source worktree. The branch and worktree remain; unrelated resources remain unchanged. Release that process, then rerun finish. No FINISHED receipt is claimed.


## Finish recovery — finish-0051

Current state: FINISHED. [Approved takeover](../events/finish-0049.yaml) verified prior owner shutdown. [Cleanup checkpoint](../events/finish-0050.yaml) records successful scoped removal of `feature/collect-evidence-feedback-03-gui`; no processes were killed. The source workspace was already closed.

[Terminal receipt](../events/finish-0051.yaml) retains reviewed source `d70fe7e463638f134d6226397ca38724492deca4` and merge `4441b5c0aacecbb6620b1696a5b3c483e5733fb7`. Integration and ticket completion are reachable from observed `origin/master` at `b6cccc3c781be4615cc55cddf40cc644f664b533`. Ticket remains completed. No merge, ticket mutation, or integrated validation was repeated. Earlier review history, validation limits, and cleanup failures remain historical records.


## Approved history normalization — finish-0052

[Final receipt and repair](../events/finish-0052.yaml) supplements only the historical start-0001 workflow root after source-worktree removal. Original bytes remain unchanged; the supplement records SHA-256 and explicit user approval. Inspector returns mode `complete`, with no workflow error.
