---
title: Collect-evidence web implementation history
type: Projection
latest_receipt: implementation-0005
---

# Implementation history

Generated from append-only receipts. Earlier blocked evidence remains unchanged. No fix or review phase ran.

## implementation-0002 — blocked

[Authoritative receipt](../events/implementation-0002.yaml). Attempt 1; parent `start-0001`. Source commit `859341b01ef7be474a3128b7f94772aab731c2f7`; tree `c34aa8898329be9caf9b345685c8cecafaeba57d`.

Stopped at required driver preflight. No product source changes, source commits, captures, tool installation, credential entry, remote Git, formal review, submit, or finish. Preserve existing browser skill, both drivers, active callers, ticket claim, historical evidence and hk recovery journal.

### Changed paths

No source change paths recorded.

### Validation

- `mise exec -- bash -c 'command -v surf; command -v playwright-cli; command -v bun; surf doctor'`: exit 1. Surf executable available. Socket path does not exist; connection fails ENOENT. Manifest and executable native-host wrapper checks pass.
- `mise exec -- bash -c 'env -u SURF_SOCKET surf doctor --json; surf extension-path; surf tab.list'`: exit 1. Default socket is also /tmp/surf.sock. Doctor reports 7 pass and 2 fail. tab.list reports Socket not found.
- `playwright-cli --version`: exit 0. 0.1.22. Browser workflow not exercised.
- `/home/zenobius/.omp/agent/bundles/developer/skills/git/worktree/scripts/inspect.ts tracker/tickets/collect-evidence-feedback-01-web.md --json`: exit 0. Valid start receipt; source branch at initial commit/tree with dirty false.

## implementation-0005 — completed

[Authoritative receipt](../events/implementation-0005.yaml). Attempt 2; parent `start-0004`. Source commit `0acff3b4c45705336028263a0b20d41dbc1aee63`; tree `9480fa07ed2783674efa8f0d3efc6bc7daa81047`.

Create collect-evidence as the canonical skill with pinned CrustJS/mise Bun command contracts, versioned sealed records, actual asset metadata, shared-context routing and immutable publication. Preserve both typed Surf and Playwright drivers, attended stops, preconditions, cleanup, verdicts, read-only reports and generated comments. After both real driver checks passed, migrate active callers and skill-authoring rules and remove obsolete active browser-only entrypoints.

### Changed paths

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

### Validation

Final suite: 11 passed, 0 failed, 70 expectations; scoped TypeScript passed. Both real drivers, failure/blocked paths, actual screenshots, report playback and borrowed-resource cleanup were exercised. [Exact command history and native output](../artifacts/evidence/implementation-0005/index.md).

## Recovery and ownership

Start-complete-0003 records the blocked first attempt. Start-0004 authorizes the existing-worktree takeover after Surf connectivity was restored. Attempt 2 retained the same branch, claim, worktree and historical records. The shared-base coordination hold was released before the tracker commit. No reset, rebase or unrelated staging was performed. Existing hook checks used `--stash none`; no stash operation was issued.

## Unresolved questions

- The cause of the initial owned-preview tab invalidation is unknown; fresh owned-preview and borrowed-resource checks passed.
- The tracker graph labels implemented as COMPLETED despite the canonical implemented state; this out-of-scope presentation mismatch was reported.

Independent review, parent phase completion and integration remain pending; the ticket is implemented, not completed.

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
