---
schema: worktree-artifact/v1
title: Viewer PR draft
type: Concept
---

# Evidence viewer fix

## Ticket and problem

[collect-evidence-feedback-04-viewer](../../../tracker/tickets/collect-evidence-feedback-04-viewer.md) provides the read-only local evidence inspector. Review found lost originating-asset focus and ignored plain CLI output.

## Implementation summary

Retain the asset selection button and restore focus for Back and ArrowLeft without losing horizontal case-column reveal. Format --plain as dotted field-path text; retain versioned --json and --quiet suppression. Rebuild distributed HTML and retain public CLI regression coverage. Existing import, registered-asset read API and read-only capability remain unchanged.

Branch: feature/collect-evidence-feedback-04-viewer. Base: master. Source commit: 9f9834003647d29efbc0ac19b49fd310ae1a1758. Tree: 431e49b346e6db78658a5a74cd85a76c2a77234f. Source clean at handoff. Commits: 4242a96d (STD-01), 9f983400 (SPEC-01). Commit hooks updated the matching bundle registrations.

## Changed files

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/commands.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx

The original implementation inventory remains in [implementation draft](../artifacts/snapshots/pr-draft-implementation-0003.md).

## Validation results

- **Build and types:** Passed; distributed HTML 318137 bytes.
- **Public regression:** 1 pass, 0 fail, 58 assertions.
- **Browser focus:** Back and ArrowLeft separately passed at 1440x900 and 390x844 for the second asset. Narrow case column remained horizontally revealed.
- **CLI formats:** Real init/validate imports and both live serve entrypoints passed plain, JSON and quiet checks. Six live serve checks released their locks and exited 0 on SIGTERM.
- **React diagnostics:** 71/100 both before and after; same three existing warnings.

[Exact validation and limits](../artifacts/evidence/fix-0014/validation.json); [focus observations](../artifacts/evidence/fix-0014/focus-checks.json); [desktop focus screenshot](../artifacts/evidence/fix-0014/desktop-focus.webp); [narrow focus screenshot](../artifacts/evidence/fix-0014/narrow-focus.webp); [init/validate output](../artifacts/evidence/fix-0014/cli-init-validate.json); [serve output](../artifacts/evidence/fix-0014/cli-serve.json). Initial sequential smoke readiness failed while the browser service still held the session. After stopping it, all sequential checks passed. No additional collector, native-platform or annotation capability is claimed.

## Review history

Attempt 1 produced an unusable empty review artifact; [failed parent completion](../events/review-complete-0008.yaml) preserves that attempt. Its SUCCESS claim is not valid. Attempt 2 returned FAILURE for 035fdd61b454eb9b9aa8b0f20fdd3b2ee33ab476: [immutable review](../artifacts/reviews/review-review-0010.md), [review result](../events/review-0010.yaml), [parent completion](../events/review-complete-0011.yaml).

Latest reviewer verdict: FAILURE on 9f9834003647d29efbc0ac19b49fd310ae1a1758 in review-0021. Resolved findings: STD-01 and SPEC-01. Current open finding: STANDARDS-01. See the current outcome below.

## Merge status

Not merged, pushed, submitted or ticket-completed. Parent owns phase completion and subsequent review. Source changes committed; new workflow records remain in the authoritative parent store, outside source.

## Supporting receipts and artifacts

- **Implementation:** [implementation-0003](../events/implementation-0003.yaml) and [original draft](../artifacts/snapshots/pr-draft-implementation-0003.md).
- **Authorization:** [fix approval](../events/fix-approval-0012.yaml), [retained original approval](../artifacts/snapshots/fix-approval-0012-original.yaml) and [authorized repair record](../artifacts/snapshots/fix-approval-0012-repair.json).
- **Fix:** [phase start](../events/fix-start-0013.yaml) and [fix-0014 result](../events/fix-0014.yaml).
- **Prior repair:** [review approval repair](../artifacts/snapshots/review-approval-0005-repair.json).

## Open questions

None. No merge authorized.



## Parent fix completion

[fix-complete-0015](../events/fix-complete-0015.yaml) validates the immutable fix result and exact clean source. Parent public validate checks passed for plain, JSON and quiet from /tmp. Delivery acknowledged; native completion sequence 2 confirmed; owned fixer terminal t87 removed. Source workspace remains available. No merge, push or ticket completion. Next action: fresh independent review.

## Review attempt 4 — current outcome

[Attempt 3](../events/review-0018.yaml) stopped before source assessment because the approval envelope had a null pane identity. [Blocked completion](../events/review-complete-0019.yaml) preserves it. The user authorized a narrow [pane identity repair](../artifacts/snapshots/review-approval-0016-repair.json); original bytes remain retained.

[Fresh review](../events/review-0021.yaml) returned **FAILURE** for commit `9f9834003647d29efbc0ac19b49fd310ae1a1758`, tree `431e49b346e6db78658a5a74cd85a76c2a77234f`. Standards: one low-severity blocking acceptance finding, STANDARDS-01. Spec: none. The [immutable review artifact](../artifacts/reviews/review-review-0021.md) owns the finding and required change. Earlier STD-01 and SPEC-01 are resolved.

Public regression passed: 1 test, 58 assertions. Real browser, image-byte identity, CLI formats, unsafe-request refusal, changed/symlinked asset rejection, port conflict, second-writer rejection and owned cleanup passed. Parent plain/JSON/quiet validation passed from `/tmp`. Screenshots were temporary, not retained evidence.

[Parent completion](../events/review-complete-0023.yaml) verifies the exact clean source, receipt/artifact and transport hash. Reviewer terminals are closed. Source is unchanged. No fixes, merge, push or ticket completion were authorized or performed. Next phase: fix in a fresh session if requested.
