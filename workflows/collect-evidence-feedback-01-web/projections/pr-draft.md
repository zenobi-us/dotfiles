---
title: Collect-evidence web PR draft
type: Projection
latest_receipt: implementation-0005
---

# Preserve Surf and Playwright in collect-evidence

[Canonical ticket](../../../tracker/tickets/collect-evidence-feedback-01-web.md) · [Initiative](../../../tracker/initiatives/collect-evidence-feedback/index.md)

## Problem

The browser-only skill needs common versioned evidence records, routed immutable publication and consistent commands without losing either real browser driver or existing verdict and comment capabilities.

## Implementation

Create collect-evidence as the canonical skill with pinned CrustJS/mise Bun command contracts, versioned sealed records, actual asset metadata, shared-context routing and immutable publication. Preserve both typed Surf and Playwright drivers, attended stops, preconditions, cleanup, verdicts, read-only reports and generated comments. After both real driver checks passed, migrate active callers and skill-authoring rules and remove obsolete active browser-only entrypoints.

## Changed paths

Old and new rename paths are listed. Source commit `0acff3b4c45705336028263a0b20d41dbc1aee63`; tree `9480fa07ed2783674efa8f0d3efc6bc7daa81047`.

- `mise/conf.d/devtools-agent/bundles/agent-core/skills/writing-skills/references/skill-anatomy.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/writing-skills/references/skill-checklist.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/writing-skills/references/testing-methodology.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/drivers/playwright-cli.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/drivers/surf-cli.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/evidence-schema.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/playbooks/1-context.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/playbooks/2-test-plan.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/playbooks/3-confirm.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/playbooks/4-collect-evidence.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/references/playbooks/5-publish-evidence.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/acceptance.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/comment.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/compile.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/init.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/render.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/report.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/run.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/commands/verdicts.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/drivers/driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/drivers/playwright-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/drivers/surf-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/evidence.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/load-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/render-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/report-dir.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/report.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/results.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/sh.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/test/fixture.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/test/playwright-driver.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/test/results.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/test/surf-driver.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/test/verdict.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/browser-evidence/verdict.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/browser-acceptance-evidence/scripts/plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/drivers/playwright-cli.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/drivers/surf-cli.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/web.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/evidence.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/load-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/render-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/results.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/sh.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/fixture.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/playwright-driver.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/verdict.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/verdict.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/types/versioned-imports.d.ts`

## Validation

- Real Surf and Playwright controlled-page workflows passed; actual screenshots and selected-project state were inspected.
- Final real-driver suite: 11 passed, 0 failed, 70 expectations. Scoped TypeScript check passed.
- Real WebM playback completed in the browser report. Four durable sealed runs validated.
- Assertion failures, partial/no-assertion captures, blocked approvals/credentials, missing assets/versions, dry-run and real-navigation interruption were exercised.
- Borrowed-resource sentinels survived; the user’s original Chrome tab remained open.
- Installed CLI commands ran from an unrelated directory with a temporary resolved test store.

Exact commands, directories, results and media are linked in the evidence index below and recorded in the authoritative implementation result. One stale owned-preview navigation failed before a fresh owned preview succeeded; both attempts remain recorded.

## Review history

At implementation completion, no formal review had run. Implementation attempt 1 was blocked by missing Surf connectivity; the restored connection enabled attempt 2. The parent verified and acknowledged implementation-0005. [start-complete-0006](../events/start-complete-0006.yaml) records the completed start phase. The child pane is closed. Independent review was pending at that point.

Review attempt 1 failed before a reviewer started; [review-aborted-0009](../events/review-aborted-0009.yaml) records that launch failure. A fresh independent reviewer completed attempt 2 at source `0acff3b4c45705336028263a0b20d41dbc1aee63`. [review-0011](../events/review-0011.yaml) records FAILURE: Standards has one blocking finding and one advisory finding; Spec has three blocking findings. [The immutable review](../artifacts/reviews/review-review-0011.md) holds the complete reports. [review-complete-0012](../events/review-complete-0012.yaml) records parent validation and closure. No finding was fixed.

## Resolved findings

None: no review findings exist.

## Remaining findings and questions

Open blocking findings: STD-001, SPEC-001, SPEC-002, SPEC-003. Advisory finding: STD-002. The immutable review holds the details. Integration remains pending.

- The cause of the initial owned-preview tab invalidation is unknown; fresh owned-preview and borrowed-resource checks passed.
- The tracker graph labels implemented as COMPLETED despite the canonical implemented state; this out-of-scope presentation mismatch was reported.

## Latest reviewer verdict

FAILURE for source `0acff3b4c45705336028263a0b20d41dbc1aee63`. [review-0011](../events/review-0011.yaml) records the verdict.

## Merge and publication status

Not merged or pushed. Ticket work_status is implemented, not completed. Source and tracker commits are separate; implementation tracker commit `e089ab179408aef2f9ed335bcc4f128e950db508` and review publication commit `93233151`. This projection and its supporting event are published by their containing scoped workflow commit. The child worktree and workspace remain available.

## Limits

- Fix, submit, merge, push and ticket completion were not performed. The feature worktree remains available.
- The default Playwright Chrome path is absent on this host. Real runs used the existing cached Chromium executable through PLAYWRIGHT_MCP_EXECUTABLE_PATH; no browser installation was performed.
- One owned preview tab was invalidated before its first navigation. A fresh owned preview, real playback and both borrowed-resource sentinel checks succeeded. The invalidation cause is unknown; no collector-caused defect or fix is claimed.
- The tracker graph displays implemented as COMPLETED, while its canonical work_status remains implemented. This existing tracker presentation mismatch was reported, not changed in this web ticket.
- The report screenshots have actual PNG dimensions 1984×1068. Native Surf output reported a narrower width. Their exact capture instants were not supplied; command start/end intervals are retained instead of invented timestamps.
- TUI, GUI and the feedback viewer/UI tickets remain out of scope. The HTML report is read-only.

## Supporting records

- [start-0001](../events/start-0001.yaml) — phase-start, start, started.
- [implementation-0002](../events/implementation-0002.yaml) — phase-result, implementation, blocked.
- [start-complete-0003](../events/start-complete-0003.yaml) — phase-complete, start, blocked.
- [start-0004](../events/start-0004.yaml) — phase-start, start, started.
- [implementation-0005](../events/implementation-0005.yaml) — phase-result, implementation, completed.
- [Immutable attempt 2 draft](../artifacts/snapshots/pr-draft-implementation-0005.md).
- [Immutable attempt 1 draft](../artifacts/snapshots/pr-draft-implementation-0002.md).
- [Attempt 1 Surf diagnostics](../artifacts/snapshots/surf-preflight-implementation-0002.txt).
- [Attempt 2 start inspection](../artifacts/snapshots/inspection-start-0004.json).
- [All evidence, commands, native logs and media](../artifacts/evidence/implementation-0005/index.md).


- [Review start attempt 1](../events/review-start-0008.yaml).
- [Failed launch](../events/review-aborted-0009.yaml).
- [Review start attempt 2](../events/review-start-0010.yaml).
- [Review result](../events/review-0011.yaml).
- [Review completion](../events/review-complete-0012.yaml).
- [Immutable review](../artifacts/reviews/review-review-0011.md).
- [Frozen review inspection](../artifacts/snapshots/inspection-review-start-0008.json).
- [Fresh reviewer launch](../artifacts/snapshots/launch-review-start-0010.json).

## Workspace availability

The post-close check found that the source workspace was no longer open. The parent reopened the same worktree as Herdr workspace w71. No source change or new agent launch occurred. [workspace-restored-0007](../events/workspace-restored-0007.yaml) records the restoration. [start-complete-0006](../events/start-complete-0006.yaml) remains unchanged. Independent review is pending.


## Independent review attempt 1

The user requested an independent review. [review-start-0008](../events/review-start-0008.yaml) freezes source commit `0acff3b4c45705336028263a0b20d41dbc1aee63` and tree `9480fa07ed2783674efa8f0d3efc6bc7daa81047`. The comparison base is master at `7f981d2f47f24276159bec1719a50667a61494c6`; the merge base is `859341b01ef7be474a3128b7f94772aab731c2f7`. No reviewer verdict is available yet. The source remains unchanged.


## Independent review launch recovery

[review-aborted-0009](../events/review-aborted-0009.yaml) records a Herdr worktree lookup failure before a reviewer started. No verdict exists. Source commit `0acff3b4c45705336028263a0b20d41dbc1aee63` and its clean tree are unchanged. [review-start-0010](../events/review-start-0010.yaml) authorizes a fresh launch retry under the same user review request. No source, claim or unrelated service changed.


## Review completion

The parent validated the authoritative result and artifact, exact clean source, typed transport and canonical ticket update. The public validator accepted the retained sealed Playwright run. Review records and the verdict comment were committed as `93233151`; no push ran. The acknowledged reviewer pane `w73:p2` is closed. Herdr workspace `w73` and the source worktree remain open. Four findings block completion; one is advisory. No fixes, merge, submit or ticket completion ran.


## Fix attempt 1

The user requested a fresh independent fixer for STD-001, SPEC-001, SPEC-002, SPEC-003. [fix-start-0013](../events/fix-start-0013.yaml) consumes [review-0011](../events/review-0011.yaml) at source `0acff3b4c45705336028263a0b20d41dbc1aee63`. STD-002 remains advisory and is not selected. No fix result or new review verdict exists yet.
