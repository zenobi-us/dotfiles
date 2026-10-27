---
title: Projects workflow phase history
type: Concept
---

# Projects workflow history

## Current state

REVIEW_FAILED at 34e28395c83826cdf46e1f09b8ad7761df2be219. Latest reviewer verdict is FAILURE from review-0017 for the current source. STANDARDS-001 remains open; prior Spec findings are resolved. Parent phase completion and pane closure succeeded in fix-complete-0015. The ticket is unchanged.

## Append-only phase history

The table is generated from receipts. Earlier completion and finding-resolution claims are historical. Review-0011 superseded the earlier fix claims for SPEC-001 and added SPEC-003.

| Receipt | Phase event | Result | Source commit |
| --- | --- | --- | --- |
| [start-0001](../events/start-0001.json) | start phase-start | started | d458207915067db9d1a3699aebe198840cffb905 |
| [implementation-0002](../events/implementation-0002.json) | implementation phase-result | completed | afb6b874f70afb2035ed76288140daf1ff589691 |
| [implementation-complete-0003](../events/implementation-complete-0003.json) | implementation phase-complete | completed | afb6b874f70afb2035ed76288140daf1ff589691 |
| [review-start-0004](../events/review-start-0004.json) | review phase-start | started | afb6b874f70afb2035ed76288140daf1ff589691 |
| [review-0005](../events/review-0005.json) | review phase-result | FAILURE | afb6b874f70afb2035ed76288140daf1ff589691 |
| [review-complete-0006](../events/review-complete-0006.json) | review phase-complete | FAILURE | afb6b874f70afb2035ed76288140daf1ff589691 |
| [fix-start-0007](../events/fix-start-0007.json) | fix phase-start | started | afb6b874f70afb2035ed76288140daf1ff589691 |
| [fix-0008](../events/fix-0008.json) | fix phase-result | completed | f4dffcaebf159cb857eb6008fad80dfb03e214fc |
| [fix-complete-0009](../events/fix-complete-0009.json) | fix phase-complete | completed | f4dffcaebf159cb857eb6008fad80dfb03e214fc |
| [review-start-0010](../events/review-start-0010.json) | review phase-start | started | f4dffcaebf159cb857eb6008fad80dfb03e214fc |
| [review-0011](../events/review-0011.json) | review phase-result | FAILURE | f4dffcaebf159cb857eb6008fad80dfb03e214fc |
| [review-complete-0012](../events/review-complete-0012.json) | review phase-complete | FAILURE | f4dffcaebf159cb857eb6008fad80dfb03e214fc |
| [fix-start-0013](../events/fix-start-0013.json) | fix phase-start | started | f4dffcaebf159cb857eb6008fad80dfb03e214fc |
| [fix-0014](../events/fix-0014.json) | fix phase-result | completed | 34e28395c83826cdf46e1f09b8ad7761df2be219 |

## Immutable artifacts

- **Original draft:** [implementation-0002](../artifacts/snapshots/pr-draft-implementation-0002.md).
- **First review:** [review-0005](../artifacts/reviews/review-review-0005.md).
- **Prior fix draft:** [fix-0008](../artifacts/snapshots/pr-draft-fix-0008.md).
- **Latest review:** [review-0011](../artifacts/reviews/review-review-0011.md).
- **Current fix draft:** [fix-0014](../artifacts/snapshots/pr-draft-fix-0014.md).

## fix-0014 result

SPEC-003 and SPEC-001 are resolved by this fix, both NO ADR. SPEC-002 retains regression coverage. Source commits: c986abce69cbd347b5a7160d5c88cb3a191c482d, 34e28395c83826cdf46e1f09b8ad7761df2be219. Source tree: 47c38e3a6260f875f97fcba05e7f83c0be62b4ec.

[123 focused tests](../artifacts/evidence/fix-0014/focused-tests-final.txt), [scoped TypeScript](../artifacts/evidence/fix-0014/scoped-typecheck.txt), [actual CLI recovery](../artifacts/evidence/fix-0014/cli-runtime.txt) and [actual Pi surviving-project smoke](../artifacts/evidence/fix-0014/terminal-acceptance.md) passed. [Exact commands and harness corrections](../artifacts/evidence/fix-0014/validation.json) preserve initial fixture failures.

The actual Pi modal loaded B live tracker updates and Files after repository-only A was removed. Its session footer retained A. Captures cover 120x40, 80x24 and 40x12 with NO_COLOR=1. No model request ran. Complete-modal regressions use deterministic GitHub responses and exercise both explicit identity sources after checkout removal. No live GitHub or new colour audit is claimed.

No selected finding remains unresolved. Unknown hosted identity still requires an authoritative remote or verified checkout. The fixer did not merge, rebase, push, run a formal review, change tracker records, or commit canonical workflow records. The parent owns phase completion and pane closure.



## fix-complete-0015
[fix-complete-0015](../events/fix-complete-0015.json) records parent validation of the result receipt, source commit and tree, 123 passing tests, scoped compiler result, real recovery CLI, actual Pi runtime evidence and immutable snapshot. WORKTREE_FIX_DONE was observed; Herdr reported done with completion sequence 351. Pane w7A:p6 closed successfully. The workspace remains available. No selected finding remains unresolved by this fix; fresh review is required.
Next command: `review pi-shared-context-ux-01-projects`.


## review-start-0016
[review-start-0016](../events/review-start-0016.json) freezes source 34e28395c83826cdf46e1f09b8ad7761df2be219 and tree 47c38e3a6260f875f97fcba05e7f83c0be62b4ec against master at b22bda0eb4c56c618487092b7fca68fc212632e2.
## review-0017
[review-0017](../events/review-0017.json) records FAILURE. Standards: STANDARDS-001, P2, NO ADR. Spec: no supported blockers. SPEC-001, SPEC-002 and SPEC-003 are resolved. The [immutable third review](../artifacts/reviews/review-review-0017.md) holds the finding and both axis reports. No source files changed.
## review-complete-0018
[review-complete-0018](../events/review-complete-0018.json) records parent verification. Frozen source and clean worktree remained unchanged. [14 project tests passed](../artifacts/evidence/review-0017/parent-focused-validation.txt), zero failed. Herdr reported reviewer done, sequence 369; both axis panes and reviewer pane closed. The workspace remains available. The ticket contains the verdict and artifact link. No fix, merge, rebase or push ran.
Next command: `fix pi-shared-context-ux-01-projects`.
