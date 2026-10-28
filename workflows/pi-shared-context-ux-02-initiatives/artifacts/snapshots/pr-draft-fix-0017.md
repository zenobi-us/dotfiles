---
title: pi-shared-context-ux-02-initiatives fix-0017
type: Report
---

# Initiative navigation: review-0014 corrections

## Current state
Ticket: [pi-shared-context-ux-02-initiatives](../../../../tracker/tickets/pi-shared-context-ux-02-initiatives.md).
Source: `d1ad6dbabb7131de2910334f2b750f8586a0e4ca`. Tree: `80f4559a9f6cbe6e51d2e102480714703eac160f`. Branch: `feature/pi-shared-context-ux-02-initiatives`.
State: FIXED, awaiting fresh independent review. Not merged or pushed. The old FAILURE applies only to the old source. No SUCCESS covers this revision.

## Problem and implementation
The review found stale child targets after reparenting, queue redirects after unrelated removal, hidden selection after reflow, and clipped narrow counts.
Reconcile child membership for reader/action return, preserve unrelated queues, reveal selection after reflow, and wrap narrow phase/count fields independently. Full affected suite and scoped types pass with temporary real-package ESM resolution. Actual Pi scenarios pass; source clean and committed. Fresh independent review required.


## Resolved findings
| Finding | Correction |
|---|---|
| UX02-SPEC-001 | Reconcile readers/actions to a nearby visible child or empty parent before another action. |
| UX02-SPEC-002 | Apply removed-initiative navigation only to views that depend on that initiative. |
| UX02-SPEC-003 | Reconcile pane geometry changes while retaining intentional paging on unchanged layouts. |
| UX02-SPEC-004 | Wrap narrow phase and Items independently. |
| VAL-001 | Use temporary external real-package ESM links; complete all 11 affected test files. |

## Changed files
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`

## Source commits
- `d360076d138b78ae48fa7b5cf113c85aaadd92de`: fix(pi): pi-shared-context-ux-02-initiatives navigation
- `a3c89c7b9686a0276f13426bc9e5936b923d1f26`: fix(pi): pi-shared-context-ux-02-initiatives layout
- `d1ad6dbabb7131de2910334f2b750f8586a0e4ca`: docs(pi): pi-shared-context-ux-02-initiatives corrections

## Validation
133 tests passed; 0 failed; 1809 expectations across 11 files. Scoped TypeScript passed. Actual Pi v1.1.0 loaded the worktree extension. Reparenting, safe empty parents, queue preservation, resize, title expansion and narrow phase/count paging passed. Colour and verified greyscale captures cover 40x12, 80x24 and 120x40. Number shortcuts retain Tracker/Files state. Files path insertion stays unsent.
[Commands and results](../evidence/fix-0017/validation.json). [Runtime scenarios and limits](../evidence/fix-0017/runtime-summary.json). [Actual input ledger](../evidence/fix-0017/pi-runtime-ledger.json).
[Wide colour fields](../evidence/fix-0017/rgb-children-120x40.png). [Narrow monochrome selection](../evidence/fix-0017/verified-mono-children-40x12.png). [Narrow phase](../evidence/fix-0017/verified-mono-long-phase-page-3-40x12.png). [Distinct Items count](../evidence/fix-0017/verified-mono-long-phase-page-4-40x12.png).
Actual Pi ran without skills. It exercised disabled action safety and action-menu reconciliation without dispatch. Public-modal regressions verify canonical dispatched targets. Native termscope SVG loses colour; PNGs use the recorded text and RGB spans at fixed terminal cells. Earlier incorrectly selected mono runs are exploratory only.

## Review history
[Single immutable review-0014 body](../reviews/review-review-0014.md). Latest historical verdict: FAILURE on `7c647581807920320efa191f946b8ce9183558b7`. Standards passed with advisory STD-J1; Spec and verification blocked. This fix claims no reviewer verdict.
STD-J1 remains an optional, nonblocking advisory. No blocking finding remains unresolved by this fix. Fresh independent review must validate the new commit and tree.

## Workflow history
| Receipt | Phase / event | Result | Source |
|---|---|---|---|
| [fix-start-0016](../../events/fix-start-0016.json) | fix / phase-start | started | `7c6475818079` |
| [implementation-0002](../../events/implementation-0002.json) | implementation / phase-result | blocked | `d621bd11bab5` |
| [implementation-0005](../../events/implementation-0005.json) | implementation / phase-result | completed | `7c6475818079` |
| [implementation-complete-0003](../../events/implementation-complete-0003.json) | implementation / phase-complete | blocked | `d621bd11bab5` |
| [implementation-complete-0006](../../events/implementation-complete-0006.json) | implementation / phase-complete | completed | `7c6475818079` |
| [review-0014](../../events/review-0014.json) | review / phase-result | completed / FAILURE | `7c6475818079` |
| [review-complete-0015](../../events/review-complete-0015.json) | review / phase-complete | completed / FAILURE | `7c6475818079` |
| [review-start-0007](../../events/review-start-0007.json) | review / phase-start | started | `7c6475818079` |
| [spec-complete-0013](../../events/spec-complete-0013.json) | review-spec / phase-complete | completed / FAILURE | `7c6475818079` |
| [spec-result-0011](../../events/spec-result-0011.json) | review-spec / phase-result | completed / FAILURE | `7c6475818079` |
| [spec-start-0009](../../events/spec-start-0009.json) | review-spec / phase-start | started | `7c6475818079` |
| [standards-complete-0012](../../events/standards-complete-0012.json) | review-standards / phase-complete | completed / SUCCESS | `7c6475818079` |
| [standards-result-0010](../../events/standards-result-0010.json) | review-standards / phase-result | completed / SUCCESS | `7c6475818079` |
| [standards-start-0008](../../events/standards-start-0008.json) | review-standards / phase-start | started | `7c6475818079` |
| [start-0001](../../events/start-0001.json) | start / phase-start | started | `d621bd11bab5` |
| [start-0004](../../events/start-0004.json) | start / phase-start | started | `d621bd11bab5` |
| [fix-0017](../../events/fix-0017.json) | fix / phase-result | completed; awaiting review | `d1ad6dbabb71` |

## Supporting artifacts
[Implementation snapshot](pr-draft-implementation-0005.md). [Implementation terminal evidence](../evidence/implementation-0005/runtime-report.md).
[Prior implementation accounting reconciliation](../evidence/implementation-0005/session-accounting-reconciled.json). The recorded prior overage remains historical; this fix does not reset allowances.
[Fix-start reservation](../../events/fix-start-0016.json). [Goal dispatch reservation](../../../goal-pi-shared-context-tui-ux-spec/events/dispatch-reserved-0024.yaml). [Goal checkpoint](../evidence/fix-0017/goal-checkpoint.json). [Source and scope audit](../evidence/fix-0017/final-source-audit.json). [Cleanup](../evidence/fix-0017/cleanup.json).

## Remaining questions and merge status
No open product question or unresolved blocking fix finding. Obtain a fresh independent review. Do not merge on the old verdict. No merge, rebase, push, tracker update or canonical artifact commit ran; the coordinator owns those operations. Temporary dependency links, fixture records and compiler configuration were removed.
Goal run: `ux-rest-7ec8ff00-4758-43aa-94fb-7baf30d40135`. Dispatch: `workflows/goal-pi-shared-context-tui-ux-spec/events/dispatch-reserved-0024.yaml`. Session: `01a17fd1-756b-75d6-89be-9841da1b6bab`.

