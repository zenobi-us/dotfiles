---
schema: worktree-draft/v1
title: Web fix fix-0020
type: PRDraft
---

# Preserve Surf and Playwright in collect-evidence

FIXED. Waiting for fresh independent review. Parent completion and base publication are pending.

## Source

Ticket: tracker/tickets/collect-evidence-feedback-01-web.md. Branch: feature/collect-evidence-feedback-01-web.

Commit: 12b6345ac32f4ae30b078e5344fb5bae7a1ee244. Tree: 77e90021870efcf8c8d8cb1f8dc36ac0cc0107f6.

## Problem and implementation

Accepted hyphenated case IDs reached unsafe Surf substitutions. Encoded Surf-internal step identities as UTF-8 hex under the existing fixed prefixes. This makes substitutions safe and keeps a-b, a.b and a_b distinct. Public IDs and accepted grammar are unchanged.

The original collect-evidence cutover retains both drivers, typed plans, preconditions, attended operation, approval safety, native logs, immutable routed records, reports and generated comments. This fix preserves STD-001, SPEC-001, SPEC-002 and SPEC-003 from fix-0014.

## Changed files

- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/drivers/surf-cli.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts

## Verification

- Test-first regression failed at approved-space.1 with SyntaxError: Unexpected token %. After the fix, the focused real Surf workflow passed 57 expectations.
- Both real-driver smokes passed approved-space, a-b, a.b and a_b through the installed CLI from /tmp, with temporary resolved stores and owned controlled pages.
- Public case and step IDs remained unchanged. Native screenshots show Case approved-space and Submitted. The HTTP endpoint observed one approved submission per driver. Session lists matched before and after each run.
- Final scoped suite: 14 passed, 0 failed, 116 expectations, 60.44 seconds. Both real drivers ran.
- Scoped TypeScript and transferred sealed evidence validation passed. Source commit hooks passed with --stash none.

[Actual command records and earlier failures](../evidence/fix-0020/validation.json). [Native evidence](../evidence/fix-0020/index.md).

## Findings and review history

Resolved by this fix: SPEC-R3-001. Prior resolved findings: STD-001, SPEC-001, SPEC-002, SPEC-003. Remaining: STD-R3-001 (P3 advisory, unselected).

No review verdict covers the new source. review-0017 FAILURE applies only to 3d1b282520a74db5409457f83ed0f766670b86cb and is historical.

[Latest consumed review](../reviews/review-review-0017.md). [Prior fix draft](pr-draft-fix-0014.md). [Original implementation draft](pr-draft-implementation-0005.md). [Fix start](../../events/fix-start-0019.yaml). [Fix result](../../events/fix-0020.yaml). [Consumed review receipt](../../events/review-0017.yaml). [Prior fix receipt](../../events/fix-0014.yaml).

## Limits and merge status

An earlier scoped suite attempt had one Playwright failure in the existing pass case. A targeted diagnostic copy then passed without source changes. The final unchanged suite passed 14/14. The original failure cause is unknown; it is not suppressed. The first post-fix regression used the wrong native-log path; corrected runs/ to native/runs/. TypeScript LSP was unavailable; the scoped compiler used existing base-checkout dependencies. No installation, remote Git operation, stash operation, merge, push, formal review or ticket completion occurred. No existing changelog was present, as recorded in the prior draft. STD-R3-001 remains advisory and untouched, including cleanupRow hooks.

Source fix is committed locally. Base-store artifacts are not staged or committed. No merge or push. Ticket remains implemented. The parent owns publication, tracker changes, typed acknowledgement, pane closure and phase completion. The child workspace remains open.

