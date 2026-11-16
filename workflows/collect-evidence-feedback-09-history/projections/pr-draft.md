---
title: Current historical evidence implementation
type: Concept
---

# Historical evidence review

## Ticket

[collect-evidence-feedback-09-history](../../../tracker/tickets/collect-evidence-feedback-09-history.md) implements explicit reuse of earlier sealed evidence.

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

See [validation records](../artifacts/snapshots/history-validation-implementation-0002.json), [preservation proof](../artifacts/snapshots/history-preservation-implementation-0002.json), [cleanup proof](../artifacts/snapshots/history-cleanup-implementation-0002.json), [resource observation](../artifacts/snapshots/history-resources-implementation-0002.json), [saved export](../artifacts/snapshots/history-export-implementation-0002.json), [viewer screenshot](../artifacts/snapshots/history-viewer-implementation-0002.webp), [report screenshot](../artifacts/snapshots/history-report-implementation-0002.webp) and [HTML report](../artifacts/snapshots/history-report-implementation-0002.html).

## Review history

No review phase has run. Latest reviewer verdict: none. Resolved findings: none. Remaining findings: none recorded. Open questions: none.

## Merge status

Not merged or pushed. The ticket remains claimed. The parent must validate the implementation result before it starts an independent review.

## Supporting records

- [Phase start](../events/start-0001.yaml)
- [Implementation result](../events/implementation-0002.yaml)
- [Original earlier-run manifest](../../collect-evidence-feedback-06-edits/artifacts/evidence/edits-source-0001/run.json)

