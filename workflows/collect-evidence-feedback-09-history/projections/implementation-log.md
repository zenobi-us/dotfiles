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
