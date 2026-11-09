---
latest_receipt: review-complete-0024
title: Collect-evidence web PR draft
type: Projection
---

# Preserve Surf and Playwright in collect-evidence

REVIEW_FAILED. Two blocking Spec findings remain on the current clean source.

Ticket: tracker/tickets/collect-evidence-feedback-01-web.md. Branch: feature/collect-evidence-feedback-01-web.

Source commit: 12b6345ac32f4ae30b078e5344fb5bae7a1ee244. Tree: 77e90021870efcf8c8d8cb1f8dc36ac0cc0107f6.

## Problem

The browser-only collector lacked common versioned records and storage rules. The cutover must preserve both existing web drivers.

## Implementation

collect-evidence provides mise Bun CrustJS commands, typed browser plans, preconditions, approval checks, attended operation, routed immutable evidence, verdicts, read-only reports and generated comments. Surf and Playwright remain available. Active callers move to the new skill in the same cutover.

Surf-internal step identities now use UTF-8 hex under fixed prefixes. Public case and step IDs and their accepted grammar remain unchanged. The IDs a-b, a.b and a_b stay distinct.

## Changed files

This list covers the original cutover and both fixes. It includes old and new paths for renames.

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

## Fixes

- **STD-001:** loadPlan calls the same checkPlan used by finalization and record reading. Case IDs, precondition IDs and declared references fail before driver execution. Authoring-only TODO and human-step checks remain in the loader.
- **SPEC-001:** Both drivers guard Enter, Space, Spacebar and literal-space activation before dispatch. The real public workflow checks BLOCKED and zero unapproved HTTP operations while preserving approved Space activation.
- **SPEC-002:** The watched-tree guard recognizes only exact .. or a parent-directory separator prefix as traversal. A repository descendant named ..captures is rejected.
- **SPEC-003:** Surf retains expected references for successful screenshot commands. The public collector checks those files after saving native logs and rejects missing media before finalization.
- **SPEC-R3-001:** Encoded Surf-internal step identities as UTF-8 hex under the existing fixed prefixes. This makes substitutions safe and keeps a-b, a.b and a_b distinct. Public IDs and accepted grammar are unchanged.

## Validation

- Fresh review suite: 14 passed, 0 failed, 116 expectations. Both real drivers ran. The prior fix-phase scoped TypeScript check passed.
- Both owned driver workflows passed approved-space, a-b, a.b and a_b. Public IDs stayed unchanged. Session lists matched before and after collection. The owned endpoint recorded one approved submission per driver.
- The parent validated both retained sealed runs. Actual native PNGs show Case approved-space and Submitted. Surf images are 1984x1068. Playwright images are 1280x720.
- The parent ran init, compile, run and validate from /tmp with an unchanged approved-space case. All commands exited 0. The run returned PASS and sealed records with the original public ID. The actual PNG shows Parent Surf identity proof and approved-space. The owned server stopped and the temporary fixture was removed.
- The parent validated transport identity, receipt equality, source ancestry, clean source, exact three-file fix scope, the canonical-ticket commit title and the retained review hash. Scoped publication hooks passed.

[Current evidence](../artifacts/evidence/fix-0020/index.md) records the native runs. [Validation history](../artifacts/evidence/fix-0020/validation.json) preserves earlier failures. [Parent completion](../events/fix-complete-0021.yaml) records independent checks.

## Review and implementation history

| Record | Source | Outcome |
|---|---|---|
| [implementation-0002](../events/implementation-0002.yaml) | Initial source | Blocked because required Surf was unavailable. |
| [implementation-0005](../events/implementation-0005.yaml) | 0acff3b4 | Implemented the cutover. |
| [review-aborted-0009](../events/review-aborted-0009.yaml) | 0acff3b4 | Launch failed before review. No verdict. |
| [review-0011](../events/review-0011.yaml) | 0acff3b4 | FAILURE. Four blocking findings and one advisory. |
| [fix-0014](../events/fix-0014.yaml) | 3d1b2825 | Corrected the four selected blockers. |
| [review-0017](../events/review-0017.yaml) | 3d1b2825 | Confirmed the earlier fixes. FAILURE for SPEC-R3-001. STD-R3-001 remained advisory. |
| [fix-0020](../events/fix-0020.yaml) | 12b6345a | Corrected SPEC-R3-001. Parent validation is complete. |

[First immutable review](../artifacts/reviews/review-review-0011.md) and [latest consumed review](../artifacts/reviews/review-review-0017.md) retain both review axes. [Original implementation draft](../artifacts/snapshots/pr-draft-implementation-0005.md), [first fix draft](../artifacts/snapshots/pr-draft-fix-0014.md) and [current fix draft](../artifacts/snapshots/pr-draft-fix-0020.md) retain each source snapshot and its checks.

## Current verdict and remaining work

FAILURE covers source 12b6345a in review-0023. The two earlier FAILURE verdicts remain historical for their recorded commits. The inspector requires Fix review findings.

The fresh review confirms STD-001, SPEC-001, SPEC-002, SPEC-003 and SPEC-R3-001 corrected. SPEC-R4-001 and SPEC-R4-002 are current P2 blockers. STD-R3-001 remains an unselected P3 advisory. Its cleanupRow hooks are unchanged.

## Limits and open questions

- One earlier scoped-suite attempt failed in the existing Playwright pass case. A diagnostic copy and the final unchanged suite passed. The cause remains unknown. The earlier failure remains in the evidence.
- The first post-fix regression used runs/ instead of native/runs/. Only that regression log path was corrected.
- TypeScript LSP was unavailable. The compiler used existing base-checkout dependencies. No dependency installation ran.
- The cause of the earlier owned-preview tab invalidation remains unknown. Later owned-preview and borrowed-resource checks passed.
- The tracker graph labels implemented as COMPLETED despite the canonical implemented state. This out-of-scope presentation issue remains recorded.

## Publication and ownership

Fix-phase history: source fix 12b6345ac32f4ae30b078e5344fb5bae7a1ee244. Base fix records, draft and evidence: 41cf8b51. [fix-complete-0021](../events/fix-complete-0021.yaml) records parent completion. The typed result is acknowledged. Only fixer pane w73:p5 was closed. Workspace w73 and the source worktree remain available.

The canonical ticket remains implemented. This review added only its verdict comment. No remote Git operation, merge, push or ticket completion ran. Unrelated changes and the old hk pending stash were left unchanged.

## Supporting receipts

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
- [fix-complete-0015](../events/fix-complete-0015.yaml).
- [review-start-0016](../events/review-start-0016.yaml).
- [review-0017](../events/review-0017.yaml).
- [review-complete-0018](../events/review-complete-0018.yaml).
- [fix-start-0019](../events/fix-start-0019.yaml).
- [fix-0020](../events/fix-0020.yaml).
- [fix-complete-0021](../events/fix-complete-0021.yaml).



## Independent review attempt 4

[review-start-0022](../events/review-start-0022.yaml) freezes source 12b6345ac32f4ae30b078e5344fb5bae7a1ee244 and tree 77e90021870efcf8c8d8cb1f8dc36ac0cc0107f6. The full cutover comparison uses master at b7f84419e6242037c3b2e4e2e828ad84b9041aa6. The user authorized a fresh review only. At phase start, no new verdict existed. The earlier Playwright failure remains an explicit review input.

## Independent review attempt 4 completion

[review-0023](../events/review-0023.yaml) records FAILURE for source 12b6345ac32f4ae30b078e5344fb5bae7a1ee244 and tree 77e90021870efcf8c8d8cb1f8dc36ac0cc0107f6. [The immutable review](../artifacts/reviews/review-review-0023.md) keeps Standards and Spec separate. Two P2 Spec findings block completion: SPEC-R4-001 and SPEC-R4-002. STD-R3-001 remains an advisory. All five earlier selected fixes were confirmed.

The single fresh scoped suite passed 14 tests and 116 expectations. Focused public proofs confirmed the a/a.map private-file collision and rejection of the documented empty screenshot slug. A separate Playwright approved-space confirmation returned FAIL: expected Submitted once, observed Ready. The actual native PNG shows Ready. The cause remains unknown. No repeat or fixture change ran. Native diagnostics remain at /tmp/ce-review-0023-proof-2TiFur. The historical Playwright failure also remains unexplained.

[review-complete-0024](../events/review-complete-0024.yaml) records parent transport, artifact hash, source, canonical verdict, public validation, publication and closure checks. Review artifacts and the verdict-only ticket comment were committed as 799b6539. The typed result is acknowledged. Only reviewer pane w73:p6 is closed. Workspace w73 and the clean source worktree remain open. No source fix, merge, push or ticket completion ran.

The inspector requires Fix review findings. [Review start](../events/review-start-0022.yaml) and [launch identity](../artifacts/snapshots/launch-review-start-0022.json) retain this attempt.
