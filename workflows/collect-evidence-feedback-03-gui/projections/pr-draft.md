---
schema: worktree-pr-draft/v1
kind: projection
---

# Current fix disposition

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
