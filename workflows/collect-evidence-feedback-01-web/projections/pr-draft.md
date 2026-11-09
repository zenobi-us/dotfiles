---
title: Collect-evidence web PR draft
type: Projection
latest_receipt: fix-0014
---
# Preserve Surf and Playwright in collect-evidence

REVIEW_FAILED. One blocking Spec finding remains on the current clean source.

Source commit 3d1b282520a74db5409457f83ed0f766670b86cb; tree 0c68cbc0d31e344ea2071352e81ca33c13c31b9f. Branch feature/collect-evidence-feedback-01-web.

[Immutable fix draft](../artifacts/snapshots/pr-draft-fix-0014.md) records the changed files, exact fixes, checks and limits. [Prior implementation draft](../artifacts/snapshots/pr-draft-implementation-0005.md) preserves the original cutover. [New evidence](../artifacts/evidence/fix-0014/index.md) preserves both real drivers.

## Problem

The browser-only collector lacked common versioned evidence records and storage rules. The cutover must preserve both web drivers. Its review found defects in plan validation, confirmation approval, watched-tree exclusion and missing-media handling.

## Implementation

collect-evidence provides the canonical mise Bun CrustJS commands, typed browser plans, versioned records, routed immutable evidence, verdicts, read-only reports and generated comments. Surf and Playwright remain active. The original cutover and its caller migration are recorded in the immutable implementation draft.

## Changed files

This list covers the original cutover and the selected fix. It includes old and new paths where a rename occurred.

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

## Fixes and validation

- **STD-001:** loadPlan calls the same checkPlan used by finalization and record reading. Case IDs, precondition IDs and declared references fail before driver execution. Authoring-only TODO and human-step checks remain in the loader.
- **SPEC-001:** Both drivers guard Enter, Space, Spacebar and literal-space activation before dispatch. The real public workflow checks BLOCKED and zero unapproved HTTP operations while preserving approved Space activation.
- **SPEC-002:** The watched-tree guard recognizes only exact .. or a parent-directory separator prefix as traversal. A repository descendant named ..captures is rejected.
- **SPEC-003:** Surf retains expected references for successful screenshot commands. The public collector checks those files after saving native logs and rejects missing media before finalization.

Final public suite: 14 passed, 0 failed, 93 expectations. Scoped TypeScript passed. Both real drivers blocked unapproved Space and allowed approved Space, with one approved HTTP operation per driver. The native screenshots were inspected. Transferred sealed runs validated.

## Review history

Implementation attempt 1 was blocked. Attempt 2 completed at 0acff3b4c45705336028263a0b20d41dbc1aee63. Review attempt 1 failed before launch. Review attempt 2 recorded FAILURE for that old source. The verdict is now historical and stale, not current SUCCESS.

- [First review start](../events/review-start-0008.yaml).
- [Review launch failure](../events/review-aborted-0009.yaml).
- [Second review start](../events/review-start-0010.yaml).
- [Review result](../events/review-0011.yaml).
- [Immutable full review](../artifacts/reviews/review-review-0011.md).
- [Parent review completion](../events/review-complete-0012.yaml).
- [Fix authorization](../events/fix-start-0013.yaml).
- [Fix result](../events/fix-0014.yaml).

Review attempt 3 checked the full source at `3d1b282520a74db5409457f83ed0f766670b86cb`. [review-0017](../events/review-0017.yaml) confirms the four prior blocking fixes. It records FAILURE for one remaining blocking Spec finding, SPEC-R3-001, and retains one advisory, STD-R3-001. [The immutable review](../artifacts/reviews/review-review-0017.md) contains both axis reports. [review-complete-0018](../events/review-complete-0018.yaml) records parent validation, publication, acknowledgement and closure.

## Resolved findings

Review-0017 confirms STD-001, SPEC-001, SPEC-002, SPEC-003 corrected at source `3d1b282520a74db5409457f83ed0f766670b86cb`. SPEC-R3-001 is a distinct remaining blocker.

## Latest reviewer verdict

FAILURE for source `3d1b282520a74db5409457f83ed0f766670b86cb`, recorded in [review-0017](../events/review-0017.yaml). The earlier review remains historical for its old source.

## Remaining work and ownership

SPEC-R3-001 blocks completion. STD-R3-001 is advisory and continues the prior cleanupRow advisory. The four earlier blocking fixes passed this review. The post-fix review produced FAILURE. No source fix, remote Git operation, merge, push or ticket completion ran in this review phase. The clean source worktree and workspace w73 remain open. The acknowledged fixer pane w73:p3 is closed.

- The cause of the initial owned-preview tab invalidation is unknown; fresh owned-preview and borrowed-resource checks passed.
- The tracker graph labels implemented as COMPLETED despite the canonical implemented state; this out-of-scope presentation mismatch was reported.


## Merge and publication status

The source remains `3d1b282520a74db5409457f83ed0f766670b86cb` on the feature branch. Fix records were committed as `ace3f774`; the new review and canonical verdict comment were committed as `3dac61da`. No merge, push or ticket completion ran. The source worktree and workspace remain available.

## Limits

- The prior STD-002 advisory remains as STD-R3-001. No cleanup change ran.
- This review produced FAILURE. No source fix, merge, push or ticket completion ran in the review phase.
- TypeScript LSP initialization failed because the source worktree has no installed TypeScript. References used scoped source search; final compiler check used existing base-checkout dependencies.
- The first smoke script expected exit 1 for a BLOCKED/PASS run; the CLI correctly returned 3. Corrected the throwaway expectation; retained the first log under /tmp/ce-fix-0014-smoke-mZ4FQp.
- A hyphenated test fixture case ID exposed an existing Surf variable substitution error. The fixture now uses an alphanumeric case ID; no unrelated production fix was made.

## Supporting records

- [start-0001](../events/start-0001.yaml).
- [implementation-0002](../events/implementation-0002.yaml).
- [start-complete-0003](../events/start-complete-0003.yaml).
- [start-0004](../events/start-0004.yaml).
- [implementation-0005](../events/implementation-0005.yaml).
- [start-complete-0006](../events/start-complete-0006.yaml).
- [workspace-restored-0007](../events/workspace-restored-0007.yaml).
- [review-start-0008](../events/review-start-0008.yaml).
- [review-aborted-0009](../events/review-aborted-0009.yaml).
- [review-start-0010](../events/review-start-0010.yaml).
- [review-0011](../events/review-0011.yaml).
- [review-complete-0012](../events/review-complete-0012.yaml).
- [fix-start-0013](../events/fix-start-0013.yaml).
- [fix-0014](../events/fix-0014.yaml).
- [Original implementation draft](../artifacts/snapshots/pr-draft-implementation-0005.md).
- [Immutable fix draft](../artifacts/snapshots/pr-draft-fix-0014.md).
- [Fix evidence](../artifacts/evidence/fix-0014/index.md).
- [Fixer launch](../artifacts/snapshots/launch-fix-start-0013.json).


## Parent fix completion

[fix-complete-0015](../events/fix-complete-0015.yaml) records independent receipt, source, scope, evidence and publication validation. The parent accepted the external ..captures workspace, rejected the repository descendant before file creation, and removed the temporary fixture. Both sealed driver runs passed validation; their actual native PNGs show Submitted once. The acknowledged fixer pane `w73:p3` is closed. Workspace `w73` and the clean source worktree remain available. A fresh independent review is pending.


## Post-fix independent review

The user requested a fresh review. [review-start-0016](../events/review-start-0016.yaml) freezes source commit `3d1b282520a74db5409457f83ed0f766670b86cb` and tree `0c68cbc0d31e344ea2071352e81ca33c13c31b9f`. The full source comparison uses master at `4a66d0606604299d82d1bd5149c70828b9eef726`, not only the latest fix delta. No new verdict exists. Source changes are not authorized.


## Post-fix review completion

The fresh suite passed 14 tests and 93 expectations. The focused compile proof accepted a hyphenated case ID and emitted the affected Surf keys. The reported native failure was not rerun. The parent validated the authoritative receipt, immutable artifact, exact clean source, canonical comment and existing sealed Surf run. Reviewer pane `w73:p4` is acknowledged and closed. Workspace `w73` remains open. No source change ran.
