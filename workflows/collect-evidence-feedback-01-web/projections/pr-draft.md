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

No formal review has run. Attempt 1 was blocked by missing Surf connectivity; the restored connection enabled attempt 2. Parent acknowledgement of this child result remains pending.

## Resolved findings

None: no review findings exist.

## Remaining findings and questions

No persisted review findings. Independent review and integration remain pending.

- The cause of the initial owned-preview tab invalidation is unknown; fresh owned-preview and borrowed-resource checks passed.
- The tracker graph labels implemented as COMPLETED despite the canonical implemented state; this out-of-scope presentation mismatch was reported.

## Latest reviewer verdict

Null. No review success is claimed.

## Merge and publication status

Not merged or pushed. Ticket work_status is implemented, not completed. Source and tracker commits are separate; tracker commit `e089ab179408aef2f9ed335bcc4f128e950db508`. This projection and its supporting event are published by their containing scoped workflow commit. The child worktree and workspace remain available.

## Limits

- Independent review, submit, merge, push and ticket completion were not performed. The feature worktree remains available.
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
