---
schema: worktree-artifact/v1
kind: implementation-log
---
# Implementation history

## implementation-0002 — blocked

[Result receipt](../events/implementation-0002.yaml), parent [start-0001](../events/start-0001.yaml). Source implementation commit: 8e8089f2032bceb03a182e262a1667f939e9d9b3.

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/tui.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/load-plan.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/plan.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/render-plan.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/tui-plan.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts

## Validation by phase

Implementation: public CLI smoke passed through compile/dry-run; actual native run blocked with exit 3. Regression suite: 101 passed, three skipped. Live browser suite: three failed. Archived Surf diagnostic run validates; its actual image shows Not submitted. No native image exists. No review or fix phase ran.

[Exact commands and outcomes](../artifacts/snapshots/validation-implementation-0002.json). [Immutable draft](../artifacts/snapshots/pr-draft-implementation-0002.md). [Web diagnostic](../artifacts/evidence/controlled/run.json).

## Unresolved questions

Native foot, grim and tesseract require separate setup. Native colour, spacing, frame transitions, live safety and cleanup must still be exercised. Playwright lacks configured Chrome. Surf failed the approved Space confirmation. TypeScript/LSP checking is unavailable. The ticket is not completed.

## implementation-0005 — completed acceptance, parent completion passed

[Result](../events/implementation-0005.yaml), parent [start-0004](../events/start-0004.yaml), after [blocked parent completion](../events/start-0003.yaml). Source d87d03613efcfbd9ff1b079d9cb90b8c6ca905b7, tree a5b300690ed096e654cc23f777377fc501304c72.

### Changed files in attempt 2

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/tui.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts

### Validation in attempt 2

Native delayed transition, actual PNG inspection, RGB, spacing, dimensions, SHA-256, exact shared terminal/display identity, credential/unapproved-input stops and interrupted cleanup passed. Borrowed tmux pane PID 2220414 stayed intact. Regression: 102 pass, three browser skips, zero failures. All retained native runs validate. [Exact checks](../artifacts/snapshots/validation-implementation-0005.json). [Draft snapshot](../artifacts/snapshots/pr-draft-implementation-0005.md). [Native proof](../artifacts/evidence/transition-02/run.json).

### Current limits and unresolved questions

Separate provisioning resolved the attempt 1 missing-tools block. The native acceptance gaps listed above are historical, not current. TypeScript/LSP remains unavailable. Prior live web failures remain unchanged and were not rerun. Native video and borrowed-desktop capture are not supported. No scope decision remains open. Independent review, merge and publication have not occurred.

## Parent acceptance implementation-0006

[Parent receipt](../events/implementation-0006.yaml) verifies the result, original PNG hashes and visible transition, public validate/verdicts, and owned-resource cleanup. Terminal t4z is closed. Clean review target: 68acd4074c636933fdf5e8645a09d1acf6abdf67, tree 68589997ea8dafb4a336777829a0105806fa44d2. Only the immutable result receipt changed after the validated child source; application code is unchanged. Independent review remains required.

## Review attempt 1 — FAILURE

[Result review-0008](../events/review-0008.yaml), [sole review](../artifacts/reviews/review-review-0008.md), [parent review-0009](../events/review-0009.yaml). Reviewed commit 68acd4074c636933fdf5e8645a09d1acf6abdf67, tree 68589997ea8dafb4a336777829a0105806fa44d2. No source changes or fixes. Findings remain open: STD-01, STD-02, SPEC-1, SPEC-2. Standards and Spec retain separate reports; three distinct defects block completion. Parent native regression: 1 pass, 0 fail, 11 assertions. Parent validated retained native records and inspected both original images and matching SHA-256 hashes.

## fix-0011 — native review findings resolved

Source: acca2d29294e8c60bf8a97d0b98dbdbb4bb095aa, tree 1c5b4864e098d70b53519051d2df6d05184f5729. [Fix start](../events/fix-0010.yaml). [Child result](../events/fix-0011.yaml). [Exact validation](../artifacts/snapshots/validation-fix-0011.json). Parent acceptance and a fresh independent review remain pending. Latest historical verdict: FAILURE on the previous commit; it does not review this source. No merge, rebase, push, publication or ticket completion occurred.

### Resolved findings

- **STD-01 / SPEC-2:** Native capture errors now set capture failure and leave unexecuted assertions not-run. A genuine image assertion failure remains an assertion failure.
- **STD-02:** Register the native diagnostics destination at session open, before preconditions. All-blocked cases retain native JSONL, stderr and frames. The public regression verifies the private runtime, tmux server, application, termscope, Cage and foot are released.
- **SPEC-1:** Before input, compare live confirmation lines from terminal text and native OCR with the approved expected screen. A retained heading alone cannot approve a different operation. An explicitly expected prompt still accepts its approved key.

### Changed files in this fix

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/tui.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts

The commit hook advanced the developer bundle to 0.2.16 in both metadata files. Neither web driver changed.

### Validation in this fix

- **Native public regressions:** 6 passed, 0 failed, 42 assertions. Cases cover delayed rendering, post-doctor grim failure, unmet precondition, unexpected confirmation, expected confirmation and genuine image failure.
- **Common regressions:** 99 passed, 0 failed, 892 assertions across workflow.test.ts and verdict.test.ts.
- **Real native smoke:** Public doctor, init, render, compile, run, validate and verdicts exercised. [Transition](../artifacts/evidence/fix-transition-0011/run.json) passed two native image assertions; report generated. [Unexpected confirmation](../artifacts/evidence/fix-unexpected-0011/run.json) returned 3/BLOCKED with no input side effect. [Unmet precondition](../artifacts/evidence/fix-precondition-0011/run.json) returned 3/BLOCKED and retained native diagnostics after cleanup. [Post-doctor capture failure](../artifacts/evidence/fix-capture-0011/run.json) returned 1/FAIL with capture-category failure and not-run assertion. All four sealed runs validate.
- **Original image inspection:** Both 1280×720 originals show Ready/Details, Selected item on the next 20 px line, purple bar and native background. Actual SHA-256 matches sealed assets: ready 2493a3a4e51d475e6f0bac03014d1c51e4e182d9526a78c6de677aa4cdbf5a6f; details b6c7cd3ce3061d69feb27c979bf960ed49c44f411734afb9219626e3aeb8ca5a.

### Remaining findings and limits

No consumed finding remains unresolved in this fix. Fresh independent review is still required. TypeScript LSP initialization failed because no valid TypeScript installation was available; no compiler check is claimed. Native support remains bounded to the prepared Linux CPU toolchain. Prompt detection is conservative, English/OCR-dependent, and does not establish arbitrary dialog support. Prior web failures remain unchanged and were not rerun. No tools were installed.

## Parent acceptance — fix-0012

[Parent completion](../events/fix-0012.yaml) accepts [fix-0011](../events/fix-0011.yaml) for clean source `acca2d29294e8c60bf8a97d0b98dbdbb4bb095aa`. All four sealed native runs validate. Parent inspected original Ready/Details images and retained precondition diagnostics. Typed delivery matched the authoritative event and was acknowledged. Completed fixer terminal `t56` was removed; the source worktree remains. Its empty desktop space closed automatically. No merge, push or ticket completion occurred. Next: fresh independent review of the new source; the previous FAILURE remains historical.

## Review attempt 2 — review-0015

[Independent review](../artifacts/reviews/review-review-0014.md), [result](../events/review-0014.yaml), and [parent completion](../events/review-0015.yaml). Verdict: FAILURE for `acca2d29294e8c60bf8a97d0b98dbdbb4bb095aa`. Standards: one Low non-blocking finding. Spec: one P2 blocking finding. Findings remain in the immutable review. Common regressions: 99 pass. Native suite: 5 pass, 1 timeout; isolated capture: 1 pass. Positive public native smoke passed; unexpected-confirmation smoke proved the remaining defect. No merge or push. Fix requires a fresh session.


## fix-0017 — SPEC-01 resolved

Source: a50eb7b56c79151c48abe4e5595b8da2b63eec98, tree 0aafea468291c367eac265ad883de220cd48b442. [Fix start](../events/fix-0016.yaml). [Child result](../events/fix-0017.yaml). Consumed [review-0014](../artifacts/reviews/review-review-0014.md). Parent acceptance, delivery acknowledgement and fresh independent review remain pending. No merge, rebase, push or ticket completion occurred.

### Implementation and changed files

Removed the before-input-only confirmation guard. Every inspected native screen now screens terminal text and OCR for unapproved confirmations. Only an explicitly approved input operation may permit the actual prompt named by its screen. Expect-only, precondition and wait cases block without input; approved prompt behavior remains covered.

- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/tui.md
- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json

The commit hook advanced the developer bundle to 0.2.17. Neither web driver changed.

### Validation

Final native suite: 9 pass, 0 fail, 90 assertions. Common workflow/verdict suites: 99 pass, 0 fail, 892 assertions. Public doctor/init/render/compile/run/validate/verdicts/report passed for the positive delayed transition. The expect-only Delete files? [y/N] fixture returned exit 3/BLOCKED with no approved input IDs and no submitted input. Both sealed runs validate after byte-preserving retention. Inspected original Ready, Details and prompt PNGs. Native colours, 20 px line spacing, dimensions, terminal identity and hashes remain intact. Owned resources were released. [Exact checks and initial test-authoring failures](../artifacts/snapshots/validation-fix-0017.json). [Public smoke commands and evidence](../artifacts/evidence/fix-0017-smoke/validation.json). [Retained smoke harness](../artifacts/snapshots/native-smoke-fix-0017.ts).

### Findings, limits and provenance

Resolved SPEC-01 (P2, NO ADR) from review-0014. STD-01 (Low, nonblocking, NO ADR) remains unresolved by explicit scope: the shell failure shim is unchanged. Latest reviewer verdict remains historical FAILURE on acca2d29294e8c60bf8a97d0b98dbdbb4bb095aa; it does not review this new source. Fresh review is required. No TypeScript compiler success is claimed; its prerequisite was previously unavailable. Linux CPU rendering, host font metrics, English/OCR prompt detection and unavailable native video remain limits.

fix-0016 records user-approved scoped takeover and source/terminal preservation. This independent fixer is run 78d50e8a-5487-4007-a610-0b15377d7ea3, terminal t5m. Existing Notes terminal t5c was not touched. Handoff approved only harmless throwaway fixture operations and private resources. Temporary smoke store and harness were removed after evidence retention. Parent owns completion, acknowledgement and terminal close.


## Parent acceptance — fix-0018

[Parent completion](../events/fix-0018.yaml) accepts [fix-0017](../events/fix-0017.yaml) at clean source `a50eb7b56c79151c48abe4e5595b8da2b63eec98`. Delivered payload matches the authoritative receipt; completion sequence 2 and transport acknowledgement verified. Public validate succeeds for both retained native runs: transition PASS and expect-only confirmation BLOCKED. Parent inspected the original prompt image. Only child terminal t5m was targeted for removal. No merge, push or ticket completion. Next: fresh independent review; STD-01 remains Low and nonblocking.


## Independent review attempt 3 — review-0021

[Review artifact](../artifacts/reviews/review-review-0020.md), [child result](../events/review-0020.yaml), [parent completion](../events/review-0021.yaml). Verdict FAILURE for `a50eb7b56c79151c48abe4e5595b8da2b63eec98`, tree `0aafea468291c367eac265ad883de220cd48b442`. Standards: one Low nonblocking finding. Spec: one High blocking finding, SPEC-02. Prior SPEC-01 is resolved. Native suite: 9 pass; common suites: 99 pass. Public credential fixture received harmless input at an API-token prompt. Parent verified unchanged clean source, artifact, matching delivered receipt and completion sequence 2, acknowledged delivery and closed only reviewer t5t. No fix, merge, push or ticket completion. Next: fresh fixer for the current blocking finding.
