---
title: Historical evidence implementation log
type: Concept
---

# Implementation log

## implementation-0002

Parent: [start-0001](../events/start-0001.yaml). Source commit: 710abe78428a93c4d22f2981d71614f598bf82f5. Source tree: 49c19b9e9e19178bb21d826ae558d460e9035221.

The implementation added explicit historical session selection, persistent historical labels and read-only common-record reporting.

Changed files:

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/commands.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/records.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-fixture.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/case.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/events.jsonl`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/index.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/media/step-002-step-original-002-original--capture-001--capture-001.png`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/cases/original/media/step-002-step-original-002-original--capture-002--capture-002.png`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/index.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/report/shots/step-original-002-original--capture-001.png`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/report/shots/step-original-002-original--capture-002.png`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/runs/case-original.log`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/native/workflows/smoke-test-original.js`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/plan.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/historical-run/run.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts`

Validation: viewer build and typecheck passed. The initial suite passed 100 checks and failed two because the default Chrome executable was absent. Both failed checks passed with installed Chromium configured. The real earlier-run browser workflow and read-only hash comparisons passed. No open questions remain.

See the [immutable draft and validation links](../artifacts/snapshots/pr-draft-implementation-0002.md). The ticket remains claimed. No review, merge or push occurred.


## Review review-0005

[Review result](../events/review-0005.yaml) records FAILURE for source `710abe78428a93c4d22f2981d71614f598bf82f5`. The source did not change. Standards found no issues. Spec found one blocking finding, SPEC-01. The historical workflow regression passed with 48 assertions. The public browser workflow preserved source and saved feedback. The reviewer and both axis sessions stopped. See the [immutable review](../artifacts/reviews/review-review-0005.md) and [parent completion](../events/review-complete-0006.yaml). No fix phase ran.


## Fix fix-0008

[Fix result](../events/fix-0008.yaml) consumes [review-0005](../events/review-0005.yaml) through [fix-start-0007](../events/fix-start-0007.yaml). SPEC-01 is resolved by the fix, pending fresh review. No new review verdict is claimed.

Source commit: 9f744831bc9a5edee5ab7a37aa2c089dd82fbf7f. Source tree: 00625a17e78c1b5728098f45a41c5ec7239c8cd7.

The evidence router now catches Crust parser errors through public middleware. It emits one collect-evidence/v1 error for --json and exits 2. Other commands keep their existing error behavior.

Changed files:
- `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/test/report-cli.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/CHANGELOG.md`
- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`

Validation: seven public-command and historical-workflow regressions passed with 72 assertions. From /tmp, both required invalid argument lists emitted one versioned error and exited 2. The actual historical-run report succeeded with historical true, case original and 60228 HTML bytes. The existing historical workflow also checked unchanged source and saved-feedback hashes. No new evidence capture was created.

The commit hook changed only the developer bundle version manifests to 0.2.46. Integration must assess overlap with other streams.

Latest reviewer verdict: FAILURE for the prior source only. Remaining findings: none from review-0005; fresh review is required for this new source. Open questions: none. Not merged or pushed. The ticket remains claimed. Parent owns phase completion and terminal closure. No owned service or browser tab remains; muxer process shutdown is pending while the child and harness remain active.


## Review review-0011

[Review result](../events/review-0011.yaml) records FAILURE for `9f744831bc9a5edee5ab7a37aa2c089dd82fbf7f`. Standards found no issues. SPEC-01 is resolved. SPEC-02 remains blocking. Invalid saved annotation schemas and malformed JSON return code 1 instead of code 2. Seven regressions passed with 72 assertions. The actual historical viewer/report workflow preserved source and saved feedback. See the [immutable review](../artifacts/reviews/review-review-0011.md). No source fix, merge or push ran.

The [parent completion](../events/review-complete-0012.yaml) records the review outcome. The later [cleanup approval](../events/cleanup-approval-0013.yaml) records confirmed shutdown of the retained specification-axis process. All owned review resources stopped.

## Fix fix-0016 — current source, pending fresh review

[Fix receipt](../events/fix-0016.yaml) consumes [review-0011](../events/review-0011.yaml) through [fix-start-0015](../events/fix-start-0015.yaml). [Review artifact](../artifacts/reviews/review-review-0011.md) remains FAILURE for the earlier source. No new review verdict is claimed.

Source commit: 7b52145875c1935340592d4f82e63edc5c00b931. Source tree: 74491d21ffd2c4e2736a49928da06ef703d48502.

SPEC-02 is resolved by the fix, pending fresh review. SPEC-01 remains resolved by fix-0008. No unresolved finding remains in this fix scope. The prior review verdict does not cover this source.

The report boundary reuses the feedback CLI pattern: AnnotationError with status 400 is invalid input (exit 2). Other annotation errors retain operation-failure classification. The parser middleware is unchanged.

### Changed files in fix-0016

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/CHANGELOG.md
- mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts

The two manifest version changes came from the repository commit hook. Integration must assess them later.

### Validation in fix-0016

The scoped Bun command passed 7 tests and 83 assertions, with zero failures. It covers SPEC-01, help, legacy commands, historical metadata, valid report/export equality, source immutability, and copied malformed/unsupported annotations.

The separate public runtime smoke invoked absolute commands from /tmp. Unsupported saved schema collect-feedback/v999 and malformed JSON each emitted exactly one collect-evidence/v1 error with success false, code 2, and exit 2. Valid saved-feedback report matched export before and after both invalid copies. Original source, valid feedback and copied invalid sessions remained unchanged by reports. No new capture was made.

[Runtime command/output evidence](../artifacts/snapshots/spec02-runtime-fix-0016.json). The first smoke setup omitted required ticket routing and failed during init (exit 3); completing the temporary repository route table allowed the public runtime proof to pass. The temporary harness and temporary sessions were removed.

[Owned-resource observation](../artifacts/snapshots/resources-fix-0016.json) reports shutdown pending because the current agent/harness remains active. No persistent service or browser tab was created by the smoke. The scoped historical test stopped its owned viewer. Parent owns terminal shutdown.

### Current merge status and questions

Not merged, rebased, pushed or ticket-completed. Fix result awaits parent completion and fresh review. Open question: assess hook-generated manifest version changes during integration.


## Review review-0019 — current state

FAILURE for source `7b52145875c1935340592d4f82e63edc5c00b931`, tree `74491d21ffd2c4e2736a49928da06ef703d48502`. [Immutable review](../artifacts/reviews/review-review-0019.md); [receipt](../events/review-0019.yaml). SPEC-01 and SPEC-02 are resolved. STD-01 remains blocking: unreadable valid annotation is classified as invalid input rather than an operation failure. Seven regressions passed with 83 assertions. Public CLI and actual browser paths exercised; source and saved feedback preserved. Source unchanged. All three review terminals removed; operator-approved remaining worker and browser processes confirmed exited. No push or merge. Next phase: fix.


## Fix fix-0022 — current source

[Fix result](../events/fix-0022.yaml) consumes [review-0019](../events/review-0019.yaml) and its [immutable review](../artifacts/reviews/review-review-0019.md), through [fix-start-0021](../events/fix-start-0021.yaml).

Source commit: 5e1ba904a178a7076aa556225beb4aff3288c65e. Source tree: f691de272e6f2a040eb594438236000de451f40a. Source checkout is clean.

STD-01 is resolved: bounded annotation reads preserve filesystem errors; only JSON syntax failures become malformed-input errors. The explicit report boundary is unchanged. SPEC-01 and SPEC-02 remain resolved. No unresolved findings from the consumed review. Latest reviewer verdict remains FAILURE for the prior source; fresh review is pending.

Changed files:

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts

Verification: scoped suite ran once, exit 0, 7 tests and 89 assertions. UID 1000 public-command smoke from /tmp: unreadable annotation exit/code 1; permission restored exit 0; malformed JSON and unsupported schema exit/code 2; original bytes restored exit 0. Source and session hashes unchanged. [Exact commands and cleanup](../artifacts/snapshots/runtime-fix-0022.json).

[Immutable draft](../artifacts/snapshots/pr-draft-fix-0022.md). Temporary stores and smoke script removed. No browser workers started. Regression-owned server stopped. Child terminal t1f3 remains for parent closure. LSP references unavailable because TypeScript could not initialize; no signatures changed.

Merge status: not merged, rebased or pushed. No tracker or publication commit. Parent completion and fresh review pending.


## Parent completion fix-complete-0023

Parent verified exact clean source 5e1ba904a178a7076aa556225beb4aff3288c65e and authoritative fix-0022 payload. Seven tests passed with 89 assertions; public historical report succeeded. Fixer t1f3 removed and owned runtime shutdown confirmed. [Completion](../events/fix-complete-0023.yaml); [shutdown observation](../artifacts/snapshots/resources-fix-0022.json). Source remains available for fresh review. No merge or push.
