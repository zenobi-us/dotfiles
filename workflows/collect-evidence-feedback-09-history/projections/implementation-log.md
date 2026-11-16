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

