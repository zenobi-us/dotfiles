---
schema: worktree-pr-draft/v1
type: PullRequestDraft
title: Web evidence blocking fixes
receipt: fix-0014
---
# Preserve Surf and Playwright in collect-evidence

FIXED, awaiting a fresh independent review. No review verdict or ticket completion is claimed.

## Source

- Branch: feature/collect-evidence-feedback-01-web.
- Commit: 3d1b282520a74db5409457f83ed0f766670b86cb.
- Tree: 0c68cbc0d31e344ea2071352e81ca33c13c31b9f.
- Worktree: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web.
- Ticket: tracker/tickets/collect-evidence-feedback-01-web.md in the canonical base store.
- Parent: fix-start-0013. Consumed review: review-0011.

## Selected fixes

- **STD-001:** loadPlan calls the same checkPlan used by finalization and record reading. Case IDs, precondition IDs and declared references fail before driver execution. Authoring-only TODO and human-step checks remain in the loader.
- **SPEC-001:** Both drivers guard Enter, Space, Spacebar and literal-space activation before dispatch. The real public workflow checks BLOCKED and zero unapproved HTTP operations while preserving approved Space activation.
- **SPEC-002:** The watched-tree guard recognizes only exact .. or a parent-directory separator prefix as traversal. A repository descendant named ..captures is rejected.
- **SPEC-003:** Surf retains expected references for successful screenshot commands. The public collector checks those files after saving native logs and rejects missing media before finalization.

## Changed files

- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/web.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/load-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts`

## Validation

Final public suite from /tmp: 14 passed, 0 failed, 93 expectations. Scoped TypeScript: exit 0. No dependencies were installed. The source commit hooks passed with the supplied no-stash override.

Both real drivers ran against a new owned loopback page. Unapproved Space was BLOCKED. Approved Space was PASS and submitted exactly one HTTP request per driver. Preconditions passed. Actual native PNGs show Submitted once: Surf 1984×1068; Playwright 1280×720. Both sealed runs validated after byte-preserving transfer.

The public missing-media regression runs real Surf, removes successful native screenshots at the filesystem boundary, and verifies exit 2, unchanged native diagnostics and no sealed run. Early invalid-plan and watched-tree regressions verify exit 2 without generated output.

[Exact commands, cwd, environment, results and limits](../evidence/fix-0014/validation-results.json). [Smoke command history and native results](../evidence/fix-0014/smoke-results.json). [Evidence index](../evidence/fix-0014/index.md).

## Review history

Implementation attempt 1 was blocked; attempt 2 completed at 0acff3b4c45705336028263a0b20d41dbc1aee63. Review attempt 1 failed before launch. Review attempt 2 produced [review-0011](../reviews/review-review-0011.md), with FAILURE for that old source. [review-complete-0012](../../events/review-complete-0012.yaml) preserves parent validation.

That FAILURE is historical and stale for the new source. It is not a current SUCCESS. All four selected findings are fixed by this source commit, subject to fresh independent review. STD-002 remains unresolved and unselected; cleanupRow hooks remain unchanged.

## Limits and ownership

- STD-002 remains unresolved and outside the selected fix scope; cleanupRow hooks remain unchanged.
- No new review verdict, remote Git, merge, push, tracker mutation or ticket completion. Parent owns publication and acknowledgement.
- TypeScript LSP initialization failed because the source worktree has no installed TypeScript. References used scoped source search; final compiler check used existing base-checkout dependencies.
- The first smoke script expected exit 1 for a BLOCKED/PASS run; the CLI correctly returned 3. Corrected the throwaway expectation; retained the first log under /tmp/ce-fix-0014-smoke-mZ4FQp.
- A hyphenated test fixture case ID exposed an existing Surf variable substitution error. The fixture now uses an alphanumeric case ID; no unrelated production fix was made.

No existing changelog was present in the source root or collect-evidence skill. Updated the two existing evidence reference documents. The source worktree is clean after its scoped commit. The child pane and workspace remain open. The parent owns base publication commits, tracker updates, result acknowledgement, pane closure and phase completion.
