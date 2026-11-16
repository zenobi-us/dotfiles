---
title: Current historical evidence implementation
type: Concept
---

# Historical evidence review

## Ticket

[collect-evidence-feedback-09-history](../../../../tracker/tickets/collect-evidence-feedback-09-history.md) implements explicit reuse of earlier sealed evidence.

## Problem

Earlier-run imports preserved pixels but did not state that they showed an earlier application state. Report consumers lacked a public writing-reports command that reused feedback source validation.

## Implementation

- **Explicit selection:** Add collect-feedback init --historical. Keep the label on a new versioned session, without rewriting the source run.
- **Shared reporting:** Add writing-reports evidence with explicit run or --feedback selection. Reuse validated collector cases, assets and verdicts. Return verified saved feedback in JSON.
- **Historical labels:** Show the label in the bundled viewer, exports and HTML reports. Preserve capture times, null dates, provenance and immutable asset bytes.
- **Regression fixture:** Retain a real 2026-11-13 archive. Check unsupported versions, unknown dates, case order, asset identities, source bytes and saved-note immutability through public boundaries.

## Exact source

Branch: feature/collect-evidence-feedback-09-history

Commit: 710abe78428a93c4d22f2981d71614f598bf82f5

Tree: 49c19b9e9e19178bb21d826ae558d460e9035221

Source commits: 67c190e3 and 710abe78. Repository commit hooks updated the developer bundle version to 0.2.45. The source checkout is clean.

## Changed files

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

## Validation

- **Build and typecheck:** Both passed.
- **Public regressions:** The initial suite passed 100 checks and failed two existing browser checks because Chrome was absent. The two checks passed after selecting installed Chromium. No test was skipped.
- **Actual browser:** The earlier-run viewer displayed original pixels and the historical label. A saved note survived reload. The self-contained report displayed the same case and result.
- **Read-only checks:** Repeated reports and exports preserved all source and saved-session file hashes.
- **Cleanup:** The owned viewer stopped, its port closed, its writer lock disappeared and both owned browser tabs closed. The active child terminal and harness remain for parent shutdown.

See [validation records](../../artifacts/snapshots/history-validation-implementation-0002.json), [preservation proof](../../artifacts/snapshots/history-preservation-implementation-0002.json), [cleanup proof](../../artifacts/snapshots/history-cleanup-implementation-0002.json), [resource observation](../../artifacts/snapshots/history-resources-implementation-0002.json), [saved export](../../artifacts/snapshots/history-export-implementation-0002.json), [viewer screenshot](../../artifacts/snapshots/history-viewer-implementation-0002.webp), [report screenshot](../../artifacts/snapshots/history-report-implementation-0002.webp) and [HTML report](../../artifacts/snapshots/history-report-implementation-0002.html).

## Review history

[review-0005](../../events/review-0005.yaml): **FAILURE** for `710abe78428a93c4d22f2981d71614f598bf82f5`. Standards: 0 findings. Spec: 1 blocking finding, SPEC-01. [Review artifact](../../artifacts/reviews/review-review-0005.md). Resolved findings: none. Remaining findings: SPEC-01. Open questions: none.

## Merge status

Not merged or pushed. The ticket remains claimed. SPEC-01 is resolved by fix-0008, pending fresh review of the new source.

## Supporting records

- [Phase start](../../events/start-0001.yaml)
- [Implementation result](../../events/implementation-0002.yaml)
- [Original earlier-run manifest](../../../collect-evidence-feedback-06-edits/artifacts/evidence/edits-source-0001/run.json)



## Fix fix-0008

[Fix result](../../events/fix-0008.yaml) consumes [review-0005](../../events/review-0005.yaml) through [fix-start-0007](../../events/fix-start-0007.yaml). SPEC-01 is resolved by the fix, pending fresh review. No new review verdict is claimed.

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



