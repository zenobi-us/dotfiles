---
title: Projects implementation and checkoutless fix draft
type: Concept
---

# Projects implementation and fix draft

## Ticket summary

The [canonical ticket](../../../tracker/tickets/pi-shared-context-ux-01-projects.md) adds project selection to the shared-context modal. The ticket remains implemented. This fix does not change ticket state or comments.

## Problem statement

Stored GitHub projects used a lossy slug as their remote identity. The current entry rejected a removed checkout even when shared records survived. Canonical deduplication then hid the stored entry.

## Implementation summary

The initial implementation added focusable and clickable Projects navigation, canonical deduplication, route-owned reads, independent cached workspaces, watcher replacement and fresh-chat safeguards.

SPEC-001 now resolves hosted trackers from stored canonical project identity. SPEC-002 now recovers surviving shared context for the current entry and refreshes cached capability, action restrictions, execution roots, Files roots and watcher targets.

Project selection changes only the modal context. No repository scan, cloning, tracker hierarchy change or new feature slice was added.

## Source identity

| Field | Value |
| --- | --- |
| Source branch | feature/pi-shared-context-ux-01-projects |
| Base branch | master |
| Latest source commit | f4dffcaebf159cb857eb6008fad80dfb03e214fc |
| Latest source tree | 76467ed6e58b3a364a74a19c7f85bcd69c8975bb |
| Stored-origin commit | f44a1ea9a75837f1bb19181e174e3df5a166c9bb |
| Reviewed predecessor | afb6b874f70afb2035ed76288140daf1ff589691 |
| Fixer | omp pi-context-projects-fix-0001; herdr w79:p1 |
| Session | 01a17af3-d731-73e4-be63-a6b9f7f0e10a |

The source worktree was clean after both source commits. Canonical workflow records are published in the parent phase commit.

## Changed files

The fix changes six files:

- **Fix source:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts`.
- **Fix source:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/index.ts`.
- **Fix source:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts`.
- **Fix source:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/modal.ts`.
- **Fix source:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/projects.test.ts`.
- **Fix source:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`.

The original implementation also changed actions.ts, actions.test.ts and data.ts. Those three files are intentionally unchanged by this fix.

## Validation results

| Check | Result | Evidence |
| --- | --- | --- |
| Extension and shared-context contracts | 120 pass, 0 fail | [Final log](../artifacts/evidence/fix-0008/focused-tests-final.txt) |
| Scoped TypeScript | Exit 0 | [Compiler log](../artifacts/evidence/fix-0008/scoped-typecheck.txt) |
| Checkoutless GitHub probe | Canonical repository and issue 42 loaded | [Runtime output](../artifacts/evidence/fix-0008/github-runtime.txt) |
| Actual Pi modal | Current checkout removal, disabled actions, live tracker and Files updates | [Observations](../artifacts/evidence/fix-0008/terminal-acceptance.md) |

Actual terminal captures cover 120x40, 80x24 and 40x12. The launch set NO_COLOR=1. The GitHub probe substitutes remote responses and needs no credentials or network. No model request ran.

The [original acceptance](../artifacts/evidence/implementation-0002/terminal-acceptance.md) retains the earlier colour/monochrome and fresh-chat evidence. It is historical evidence, not a new fix-phase claim. Known unrelated broader bundle typecheck failures were not repeated.

## Review history and latest verdict

The [implementation code review](../artifacts/evidence/implementation-0002/implementation-review.md) records the original internal review and corrections.

The [formal review artifact](../artifacts/reviews/review-review-0005.md), [review result](../events/review-0005.json) and [parent review completion](../events/review-complete-0006.json) remain immutable. That review returned FAILURE for the predecessor source. Standards had no blocking findings. Spec reported SPEC-001 and SPEC-002, both P2 and NO ADR.

Review-0011 returned FAILURE for the current source. The earlier review and fix claims remain historical evidence.

## Resolved findings

- **SPEC-001:** Shared initialization and route migration save the credential-free canonical remote in .context-project.json. Stored resolution validates its slug association and gives the GitHub loader its real remote identity.
- **SPEC-002:** The deduplicated current entry falls back to its existing shared directory. Cached activation refreshes checkout capability, action restrictions, Files roots and watcher targets. Commands use a surviving execution directory if the session checkout disappears.

## Remaining findings and risks

The fix claimed both selected findings resolved. Review-0011 keeps SPEC-001 open and adds SPEC-003; SPEC-002 is resolved for its reviewed scenario.

Older stores without identity metadata cannot reconstruct an unknown remote from their slug. Shared initialization from a checkout saves this metadata. The current project can also use its authoritative in-session origin. Local stored records need no hosted remote identity.

Known broader compiler errors, existing narrow title clipping and the host shortcut conflict remain outside this fix.

## Merge status

Not merged. Not rebased. Not pushed. The ticket remains implemented; its comments now include review-0011 verdict and artifact link. The parent completed result validation and pane closure. A fresh review remains required.

## Durable phase history

| Phase | Receipt | Record |
| --- | --- | --- |
| start-0001 | [start-0001](../events/start-0001.json) | Parent starts implementation. |
| implementation-0002 | [implementation-0002](../events/implementation-0002.json) | Implementation completes at afb6b874f70afb2035ed76288140daf1ff589691. |
| implementation-complete-0003 | [implementation-complete-0003](../events/implementation-complete-0003.json) | Parent validates implementation and closes its pane. |
| review-start-0004 | [review-start-0004](../events/review-start-0004.json) | Independent formal review starts. |
| review-0005 | [review-0005](../events/review-0005.json) | Formal verdict FAILURE; SPEC-001 and SPEC-002, P2, NO ADR. |
| review-complete-0006 | [review-complete-0006](../events/review-complete-0006.json) | Parent validates review and source preservation, then closes the reviewer pane. |
| fix-start-0007 | [fix-start-0007](../events/fix-start-0007.json) | Parent dispatches only SPEC-001 and SPEC-002 to this fresh session. |
| fix-0008 | [fix-0008](../events/fix-0008.json) | Both selected findings fixed; 120 tests, scoped TypeScript and runtime smoke pass. Fresh review is required. |

- **Original immutable draft:** [implementation-0002 snapshot](../artifacts/snapshots/pr-draft-implementation-0002.md).
- **Current immutable draft:** [fix-0008 snapshot](../artifacts/snapshots/pr-draft-fix-0008.md).
- **Original focused review validation:** [Parent review log](../artifacts/evidence/review-0005/parent-focused-validation.txt).
- **Current commands and results:** [fix-0008 validation](../artifacts/evidence/fix-0008/validation.json).

## Next command

`fix pi-shared-context-ux-01-projects`.



## Parent phase completion
[fix-complete-0009](../events/fix-complete-0009.json) validates the fix result, source identity, evidence and completion marker. Herdr reported done (sequence 324); pane w79:p1 closed successfully. The worktree workspace remains available. Review-0011 completed with FAILURE; a further fix is required.


## Latest formal review: review-0011
Verdict: FAILURE for source f4dffcaebf159cb857eb6008fad80dfb03e214fc. Standards: zero findings. Spec: two blocking P2 findings, SPEC-003 and remaining SPEC-001. SPEC-002 is resolved for the reviewed direct-current-entry scenario.
The [immutable second review](../artifacts/reviews/review-review-0011.md) holds the findings and reproduction program. The [review result](../events/review-0011.json) and [parent completion](../events/review-complete-0012.json) are authoritative. Both axis panes and the reviewer pane closed. Source commit and tree remained unchanged.
Parent validation: 11 project tests passed, zero failed; [validation log](../artifacts/evidence/review-0011/parent-focused-validation.txt). The passing suite does not cover both reproduced failures. The tracker contains the verdict and artifact link. No fix, merge or push ran.
Next command: `fix pi-shared-context-ux-01-projects`.
