---
title: Collect-evidence web implementation history
type: Projection
latest_receipt: fix-0014
---

# Implementation history

Generated from append-only receipts. Earlier entries preserve their recorded context. Current source is FIXED, awaiting a fresh independent review.

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

[start-complete-0006](../events/start-complete-0006.yaml) records parent validation, acknowledgement and child pane closure. Independent review and integration remain pending. The ticket is implemented, not completed.

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


## Workspace availability

The post-close check found that the source workspace was no longer open. The parent reopened the same worktree as Herdr workspace w71. No source change or new agent launch occurred. [workspace-restored-0007](../events/workspace-restored-0007.yaml) records the restoration. [start-complete-0006](../events/start-complete-0006.yaml) remains unchanged. Independent review is pending.


## Independent review attempt 1

The user requested an independent review. [review-start-0008](../events/review-start-0008.yaml) freezes source commit `0acff3b4c45705336028263a0b20d41dbc1aee63` and tree `9480fa07ed2783674efa8f0d3efc6bc7daa81047`. The comparison base is master at `7f981d2f47f24276159bec1719a50667a61494c6`; the merge base is `859341b01ef7be474a3128b7f94772aab731c2f7`. No reviewer verdict is available yet. The source remains unchanged.


## Independent review launch recovery

[review-aborted-0009](../events/review-aborted-0009.yaml) records a Herdr worktree lookup failure before a reviewer started. No verdict exists. Source commit `0acff3b4c45705336028263a0b20d41dbc1aee63` and its clean tree are unchanged. [review-start-0010](../events/review-start-0010.yaml) authorizes a fresh launch retry under the same user review request. No source, claim or unrelated service changed.


## Independent review completion

Review attempt 1 failed before a reviewer started; [review-aborted-0009](../events/review-aborted-0009.yaml) records that launch failure. A fresh independent reviewer completed attempt 2 at source `0acff3b4c45705336028263a0b20d41dbc1aee63`. [review-0011](../events/review-0011.yaml) records FAILURE: Standards has one blocking finding and one advisory finding; Spec has three blocking findings. [The immutable review](../artifacts/reviews/review-review-0011.md) holds the complete reports. [review-complete-0012](../events/review-complete-0012.yaml) records parent validation and closure. No finding was fixed.

The reviewer ran one scoped public suite after both axes returned: 11 passed, 0 failed, 70 expectations. The reviewer recorded public reproductions for four blocking findings. The parent independently validated the retained sealed Playwright run and exact clean source. Source commit `0acff3b4c45705336028263a0b20d41dbc1aee63` and tree `9480fa07ed2783674efa8f0d3efc6bc7daa81047` did not change. Review publication: `93233151`. The typed result is acknowledged; reviewer pane `w73:p2` is closed. Workspace `w73` remains open. Earlier implementation, review-launch and unresolved-question history remains unchanged.


## Fix attempt 1

The user requested a fresh independent fixer for STD-001, SPEC-001, SPEC-002, SPEC-003. [fix-start-0013](../events/fix-start-0013.yaml) consumes [review-0011](../events/review-0011.yaml) at source `0acff3b4c45705336028263a0b20d41dbc1aee63`. STD-002 remains advisory and is not selected. No fix result or new review verdict exists yet.


## fix-0014 — completed

FIXED, awaiting a fresh independent review. [Authoritative fix result](../events/fix-0014.yaml); parent [fix-start-0013](../events/fix-start-0013.yaml). Source commit 3d1b282520a74db5409457f83ed0f766670b86cb; tree 0c68cbc0d31e344ea2071352e81ca33c13c31b9f.

Selected and resolved: STD-001, SPEC-001, SPEC-002, SPEC-003. STD-002 remains unresolved and outside the fix scope. Its cleanupRow hooks remain unchanged.

Both preserved real drivers blocked unapproved Space and allowed approved Space. Exactly one approved HTTP submission occurred per driver. Native images were inspected. Public regressions rejected invalid plans before browser execution, excluded ..captures descendants, and rejected missing successful Surf media while preserving native logs and publishing no sealed run.

Final public suite: 14 passed, 0 failed, 93 expectations. Scoped TypeScript passed using installed base dependencies. Source hooks passed with the supplied --stash none override. No stash operation was issued.

[Immutable draft](../artifacts/snapshots/pr-draft-fix-0014.md) lists nine changed source/doc paths. [Evidence](../artifacts/evidence/fix-0014/index.md) records exact commands, cwd, environment, results and limits.

The FAILURE in review-0011 applies only to the old source and is historical/stale on this commit. No current SUCCESS or new verdict exists. Parent owns publication, acknowledgement, pane closure and phase completion. The child pane w73:p3 and workspace w73 remain open. No tracker update, remote Git, merge, push or ticket completion occurred.


## Parent fix completion

[fix-complete-0015](../events/fix-complete-0015.yaml) validates [fix-0014](../events/fix-0014.yaml), source `3d1b282520a74db5409457f83ed0f766670b86cb`, the immutable draft, selected findings and real driver evidence. The parent public init check accepted an external ..captures directory and rejected a repository descendant with exit 2 and no plan file. Both sealed runs validated and both native images showed Submitted once. Parent fixtures were removed.

The fix records were committed as `ace3f774`. The typed result is acknowledged and fixer pane `w73:p3` is closed. Workspace `w73` and the clean source worktree remain available. No tracker mutation, merge, push or ticket completion ran. STD-002 remains advisory and unselected. A fresh independent review is pending.

### Fix-phase changed source paths

- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/web.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/load-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts`


## Post-fix independent review

The user requested a fresh review. [review-start-0016](../events/review-start-0016.yaml) freezes source commit `3d1b282520a74db5409457f83ed0f766670b86cb` and tree `0c68cbc0d31e344ea2071352e81ca33c13c31b9f`. The full source comparison uses master at `4a66d0606604299d82d1bd5149c70828b9eef726`, not only the latest fix delta. No new verdict exists. Source changes are not authorized.
