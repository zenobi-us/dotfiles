---
schema: worktree-artifact/v1
kind: pr-draft
---
# collect-evidence-feedback-02-tui

## Status

Fix attempt 4 resolves SPEC-01 at a50eb7b56c79151c48abe4e5595b8da2b63eec98. STD-01 remains nonblocking and outside selected scope. Prior review FAILURE is historical; fresh independent review and parent acceptance are required. No merge, push or ticket completion occurred.

## Ticket summary and problem

The [canonical ticket](../../../../tracker/tickets/collect-evidence-feedback-02-tui.md) requires real native TUI pixels from the controlled terminal. A matching text buffer cannot prove colour, line spacing or a current frame.

## Implementation

Preserved the original Plan/Driver implementation. Real native exercise found that single-block Tesseract OCR discarded readable sparse terminal text beside tmux padding. Changed native OCR to sparse-text mode. Kept native capture, stable-frame checks, dimensions, RGB probes, spacing and credential checks intact. Added an opt-in public regression with a genuine delayed terminal frame. Updated the playbook and capability claims only after actual image inspection.

Frozen implementation: d87d03613efcfbd9ff1b079d9cb90b8c6ca905b7, tree a5b300690ed096e654cc23f777377fc501304c72. Prior final source: 621ebb571da6a30274ed8b2cab387936f5d8dd02, tree a7d660233d6cf7a65297571a0f2273a57eba4270. The result receipt records the final HEAD including workflow artifacts.

## Changed files

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/tui.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts

The commit hook updated the developer bundle version to 0.2.15 in both metadata files. Attempt 1's complete changed-file list remains in its [immutable draft](../snapshots/pr-draft-implementation-0002.md).

## Validation

- **Native transition:** transition-02 passed both real PNG assertions. Inspected Ready screen and Details screen after a 1.5 second Loading screen. Both images are 1280 × 720. RGB probes matched. Text tops 11/31 px confirm 20 px spacing. Native media hashes and terminal/display identities match.
- **Safety stops:** unapproved-01 and credential-01 returned exit 3 and BLOCKED before forbidden input. The fixture recorded only approved n and c inputs.
- **Interruption:** SIGINT returned exit 1. No interrupt run was sealed. Owned runtime disappeared. The borrowed session retained pane PID 2220414.
- **Common consumers:** validate, verdicts, report and comment passed. All four retained native runs validate after byte-preserving copies from the temporary resolved store.
- **Regression suite:** 102 passed, three opt-in browser checks skipped, zero failed. The real native opt-in check ran.
- **Static-tool limit:** TypeScript/LSP remains unavailable. No compiler check is claimed.

[Exact validation](../snapshots/validation-implementation-0005.json). [Actual passing native run](../evidence/transition-02/run.json). [Initial native OCR failure](../evidence/transition-01/run.json). [Unapproved-input stop](../evidence/unapproved-01/run.json). [Credential stop](../evidence/credential-01/run.json). [Incomplete interruption diagnostics](../snapshots/interrupted-implementation-0005/).

## Review history and findings

Review attempt 1 returned FAILURE. [Sole immutable review](../reviews/review-review-0008.md), [result receipt](../../events/review-0008.yaml), and [parent completion](../../events/review-0009.yaml) retain both review axes. Standards: 2 findings, worst P2. Spec: 2 findings, worst P1. STD-01 and SPEC-2 refer to one defect. Open finding IDs: STD-01, STD-02, SPEC-1, SPEC-2. No finding has been fixed. Merge status: not merged. Resolved runtime defect: native sparse OCR. Native implementation acceptance passed; independent review identified three blocking defects. Private headless capture, host-specific font metrics and unavailable native video remain explicit limits. The original tmux border and unused-area dots remain in the pixels; no cropping or reconstruction occurred.

## Recovery and prior history

Attempt 1 [implementation-0002](../../events/implementation-0002.yaml) was blocked by missing tools. Parent [start-0003](../../events/start-0003.yaml) retained that outcome. Parent [start-0004](../../events/start-0004.yaml) authorized this fresh takeover after [separate provisioning](../snapshots/provisioning-start-0004.json). Existing source, dirty workflow outputs and older artifacts remain intact. The claim was not changed.

Prior web coverage gaps remain unchanged: Playwright Chrome is absent; Surf expected Submitted and observed Not submitted. Neither web driver changed, and those failed checks were not rerun. The historical [web diagnostic](../evidence/controlled/run.json) is not native proof.

## Approval and ownership

Parent approved the bounded local fixture and private resources. Exact command, cwd and input step IDs are recorded in the plan and validation snapshot. No credential entry, remote Git operation, installation or graphics-version override occurred during capture. Native images were collected before commits. Publication remains separate and unapproved.

## Handoff

Child terminal t4z, parent t4t, run a9b3db3b-2456-4b2a-ad85-babd66c2428b. [Result receipt](../../events/implementation-0005.yaml). Parent verified and acknowledged the result and closed child terminal t4z. [Parent acceptance](../../events/implementation-0006.yaml) records clean review target 68acd4074c636933fdf5e8645a09d1acf6abdf67 and its workflow-only advance. Keep the source worktree.

## fix-0011 — native review findings resolved

Source: acca2d29294e8c60bf8a97d0b98dbdbb4bb095aa, tree 1c5b4864e098d70b53519051d2df6d05184f5729. [Fix start](../../events/fix-0010.yaml). [Child result](../../events/fix-0011.yaml). [Exact validation](../snapshots/validation-fix-0011.json). Parent acceptance and a fresh independent review remain pending. Latest historical verdict: FAILURE on the previous commit; it does not review this source. No merge, rebase, push, publication or ticket completion occurred.

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
- **Real native smoke:** Public doctor, init, render, compile, run, validate and verdicts exercised. [Transition](../evidence/fix-transition-0011/run.json) passed two native image assertions; report generated. [Unexpected confirmation](../evidence/fix-unexpected-0011/run.json) returned 3/BLOCKED with no input side effect. [Unmet precondition](../evidence/fix-precondition-0011/run.json) returned 3/BLOCKED and retained native diagnostics after cleanup. [Post-doctor capture failure](../evidence/fix-capture-0011/run.json) returned 1/FAIL with capture-category failure and not-run assertion. All four sealed runs validate.
- **Original image inspection:** Both 1280×720 originals show Ready/Details, Selected item on the next 20 px line, purple bar and native background. Actual SHA-256 matches sealed assets: ready 2493a3a4e51d475e6f0bac03014d1c51e4e182d9526a78c6de677aa4cdbf5a6f; details b6c7cd3ce3061d69feb27c979bf960ed49c44f411734afb9219626e3aeb8ca5a.

### Remaining findings and limits

No consumed finding remains unresolved in this fix. Fresh independent review is still required. TypeScript LSP initialization failed because no valid TypeScript installation was available; no compiler check is claimed. Native support remains bounded to the prepared Linux CPU toolchain. Prompt detection is conservative, English/OCR-dependent, and does not establish arbitrary dialog support. Prior web failures remain unchanged and were not rerun. No tools were installed.

## Parent acceptance — fix-0012

[Parent completion](../../events/fix-0012.yaml) accepts [fix-0011](../../events/fix-0011.yaml) for clean source `acca2d29294e8c60bf8a97d0b98dbdbb4bb095aa`. All four sealed native runs validate. Parent inspected original Ready/Details images and retained precondition diagnostics. Typed delivery matched the authoritative event and was acknowledged. Completed fixer terminal `t56` was removed; the source worktree remains. Its empty desktop space closed automatically. No merge, push or ticket completion occurred. Next: fresh independent review of the new source; the previous FAILURE remains historical.

## Review attempt 2 — review-0015

[Independent review](../reviews/review-review-0014.md), [result](../../events/review-0014.yaml), and [parent completion](../../events/review-0015.yaml). Verdict: FAILURE for `acca2d29294e8c60bf8a97d0b98dbdbb4bb095aa`. Standards: one Low non-blocking finding. Spec: one P2 blocking finding. Findings remain in the immutable review. Common regressions: 99 pass. Native suite: 5 pass, 1 timeout; isolated capture: 1 pass. Positive public native smoke passed; unexpected-confirmation smoke proved the remaining defect. No merge or push. Fix requires a fresh session.


## fix-0017 — SPEC-01 resolved

Source: a50eb7b56c79151c48abe4e5595b8da2b63eec98, tree 0aafea468291c367eac265ad883de220cd48b442. [Fix start](../../events/fix-0016.yaml). [Child result](../../events/fix-0017.yaml). Consumed [review-0014](../reviews/review-review-0014.md). Parent acceptance, delivery acknowledgement and fresh independent review remain pending. No merge, rebase, push or ticket completion occurred.

### Implementation and changed files

Removed the before-input-only confirmation guard. Every inspected native screen now screens terminal text and OCR for unapproved confirmations. Only an explicitly approved input operation may permit the actual prompt named by its screen. Expect-only, precondition and wait cases block without input; approved prompt behavior remains covered.

- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/tui.md
- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json

The commit hook advanced the developer bundle to 0.2.17. Neither web driver changed.

### Validation

Final native suite: 9 pass, 0 fail, 90 assertions. Common workflow/verdict suites: 99 pass, 0 fail, 892 assertions. Public doctor/init/render/compile/run/validate/verdicts/report passed for the positive delayed transition. The expect-only Delete files? [y/N] fixture returned exit 3/BLOCKED with no approved input IDs and no submitted input. Both sealed runs validate after byte-preserving retention. Inspected original Ready, Details and prompt PNGs. Native colours, 20 px line spacing, dimensions, terminal identity and hashes remain intact. Owned resources were released. [Exact checks and initial test-authoring failures](../snapshots/validation-fix-0017.json). [Public smoke commands and evidence](../evidence/fix-0017-smoke/validation.json). [Retained smoke harness](../snapshots/native-smoke-fix-0017.ts).

### Findings, limits and provenance

Resolved SPEC-01 (P2, NO ADR) from review-0014. STD-01 (Low, nonblocking, NO ADR) remains unresolved by explicit scope: the shell failure shim is unchanged. Latest reviewer verdict remains historical FAILURE on acca2d29294e8c60bf8a97d0b98dbdbb4bb095aa; it does not review this new source. Fresh review is required. No TypeScript compiler success is claimed; its prerequisite was previously unavailable. Linux CPU rendering, host font metrics, English/OCR prompt detection and unavailable native video remain limits.

fix-0016 records user-approved scoped takeover and source/terminal preservation. This independent fixer is run 78d50e8a-5487-4007-a610-0b15377d7ea3, terminal t5m. Existing Notes terminal t5c was not touched. Handoff approved only harmless throwaway fixture operations and private resources. Temporary smoke store and harness were removed after evidence retention. Parent owns completion, acknowledgement and terminal close.


## Parent acceptance — fix-0018

[Parent completion](../../events/fix-0018.yaml) accepts [fix-0017](../../events/fix-0017.yaml) at clean source `a50eb7b56c79151c48abe4e5595b8da2b63eec98`. Delivered payload matches the authoritative receipt; completion sequence 2 and transport acknowledgement verified. Public validate succeeds for both retained native runs: transition PASS and expect-only confirmation BLOCKED. Parent inspected the original prompt image. Only child terminal t5m was targeted for removal. No merge, push or ticket completion. Next: fresh independent review; STD-01 remains Low and nonblocking.
