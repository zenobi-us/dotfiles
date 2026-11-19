---
title: Inspection blockers
type: Concept
---

# Inspection blockers

Run `scripts/inspect.ts <canonical-ticket-ref> --json` from the target repository. Omit `--json` for human output. Both forms use the same recovery decision. Inspection does not claim tickets, launch phases, or write receipts.

## Report contract

The additive top-level `blockers` array contains `code`, `receiptRefs`, `evidence`, `missingEvidence`, `requiredApproval`, and `recoveryActions`. Receipt references can be empty when no usable receipt identifies the source.

`recoveryActions` copies only the shared decision action and its alternatives. Each entry contains `action`, `mode`, and `requiredApproval`. These are workflow recommendations, not separate repairs for each blocker. A blocked or complete decision has no recovery actions. An active owner has no phase action. Approval fields describe the selected decision; `false` on a blocked decision does not authorize repair or takeover. Reinspect and apply normal execution gates before mutation.

## Stable codes

| Code | Observation | Required evidence |
| --- | --- | --- |
| `path_inconsistency` | Source paths, repository identity, or workflow route failed validation | Consistent absolute source roots and validated repository/store identity |
| `source_unavailable` | A recorded or retained source cannot be inspected | Source worktree, branch, commit, tree, and preserved uncommitted work |
| `missing_parent_completion` | A child result has no linked parent completion | Validated child outcome, artifacts, exact source, and shutdown |
| `unusable_review_evidence` | Review verdict or source-bound artifact is unusable | Usable verdict and readable source-bound review artifact |
| `unknown_ownership` | Source ownership is unknown | Session liveness, reservations, and scoped ownership or takeover approval |

Existing error diagnostics retain their codes and receipt references. `invalid_history`, `inspection_unavailable`, and `recovery_blocked` cover observations without a more specific diagnostic. Historical warnings remain diagnostics, not blockers. Verified finish cleanup does not become an unavailable-source blocker. Reporting does not change v1 or v2 receipt acceptance or production phase selection.

## Verification

Affected regression suite: 62 tests passed across `inspect.test.ts`, `recovery.test.ts`, `receipt-diagnostics.test.ts`, and `inspection-blockers.test.ts`. The CLI regression covers all five codes and compares receipt bytes, event inventory, source status, and Git index bytes before and after both output forms.

A separate CLI smoke run used `/tmp/blocker-cli-smoke-N6iaIO`. It exercised inconsistent paths, missing source, and missing review artifacts. The first two decisions remained blocked with no recovery actions. The review decision remained `review`/`retry` with approval required. The report also exposed missing parent completion and unknown ownership. Receipt bytes, event inventory, source status, and index bytes did not change. No receipt was created. Temporary fixtures were removed.

