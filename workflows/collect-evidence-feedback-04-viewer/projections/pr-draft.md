---
schema: worktree-artifact/v1
title: Viewer PR draft
type: Concept
---

# Evidence viewer fix

## Fix attempt 3 — fix-0028 (current)

STANDARDS-01 is resolved. Remove the Back-button font-size override so Session and Cases inherit the shared 13px control rule. The distributed HTML was rebuilt (318122 bytes); its only generated content difference removes ;font-size:10.

Source: 86535914fad9d152835049a5374284a772449281; tree: ce207d4d61add19ebb49181932bfa769a184672a. Branch: feature/collect-evidence-feedback-04-viewer; base: master. Source clean after commit. Commit hooks updated matching bundle registrations.

### Changed files in this fix

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/styles.css

### Verification and limits

Build passed. Existing public workflow regression passed once: 1 test, 58 assertions, 0 failures. Actual served distributed viewer returned ["13px", "13px"] at 1440x900 and 390x844. Desktop Back and narrow ArrowLeft restored asset focus; the narrow case column remained revealed (left=0, scrollLeft=390).

The public serve command ran from /tmp on an owned copy of the immutable smoke session, port 18828. Owned browser tab and server were closed; the disposable copy was removed. Forced service stop retained its lock before copy removal; this smoke does not claim graceful shutdown validation. Original evidence remained untouched. These are browser smoke artifacts, not a new sealed collector run.

[Browser checks](../artifacts/evidence/fix-0028/browser-checks.json), [validation](../artifacts/evidence/fix-0028/validation.json), [desktop](../artifacts/evidence/fix-0028/desktop.webp), [narrow focus](../artifacts/evidence/fix-0028/narrow-focus.webp), [narrow inspector](../artifacts/evidence/fix-0028/narrow-inspector.webp).

### Findings, authorization and next phase

Consumed [review-0021](../events/review-0021.yaml) and its [immutable finding](../artifacts/reviews/review-review-0021.md). Resolved: STANDARDS-01. Unresolved findings: none. Latest reviewer verdict remains historical FAILURE for the previous source; this fix requires fresh independent review. No review, merge, push or ticket mutation performed.

[Approval](../events/fix-approval-0024.yaml), [exact authorized approval repair](../artifacts/snapshots/fix-approval-0024-repair.json), [phase start](../events/fix-start-0025.yaml), [launch identity](../events/fix-launch-0027.yaml), [fix result](../events/fix-0028.yaml). Parent owns phase completion and workflow commit. No open questions.

## Retained historical record (superseded by fix-0028)

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



## Parent completion — fix-complete-0029

[Parent completion](../events/fix-complete-0029.yaml) validates fix-0028 against the exact clean source 86535914fad9d152835049a5374284a772449281 and tree ce207d4d61add19ebb49181932bfa769a184672a. The delivered envelope matches the authoritative receipt and all outputs exist. Desktop and narrow screenshots and computed 13px controls were inspected. Delivery acknowledged; native completion sequence 2 confirmed; only fixer terminal t8g was closed. Source worktree remains available.

Fresh independent review is required because source changed. No merge or push occurred. Workflow artifacts remain local and uncommitted.

## Review attempt 5 — current outcome

[Independent review](../events/review-0032.yaml) returned **FAILURE** for source `86535914fad9d152835049a5374284a772449281`, tree `ce207d4d61add19ebb49181932bfa769a184672a`. Standards: one P2 blocking finding, STD-001. Spec: no findings. [Immutable review](../artifacts/reviews/review-review-0032.md) holds the finding and required change. Earlier verdicts remain historical.

Public regression passed: 1 test, 58 assertions. Real viewer, image identity, focus, typography, unsafe-request refusal and server lifecycle passed. Fresh public import reproduced STD-001. Parent public validation and tracker schema check passed.

[Parent completion](../events/review-complete-0033.yaml) verifies delivery, exact frozen source and artifact. Owned review terminals and resources are closed. Source is unchanged. No fixes, merge, push or ticket completion occurred. Next phase: fix STD-001 in a fresh session.

## Fix attempt 4 — fix-0038 (latest)

STD-001 is resolved. Write Markdown into Bun's stdin sink before closing it; use raw mq output to preserve frontmatter, headings, notes and trailing newline. Keep the public init regression for both human-readable records. No validator or UI expansion.

Source: `14fbd057508ddb47540215fe9e8a0c43c6be574b`; tree: `c15cd53b5ff4fd386bb5760878a2dd137808d4f2`. Source committed clean. Branch: feature/collect-evidence-feedback-04-viewer; base: master. Commit hooks updated matching bundle registration versions.

### Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/records.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts`

### Validation

Fresh public init and validate ran from an unrelated temporary directory against the retained sealed capture and a new resolved temporary repository session. The generated index and case-1 notes exactly matched the complete expected raw Markdown through mq. The first raw-output-only smoke exposed an additional cause: FileSink.end(input) did not write stdin. The final correction explicitly writes and awaits end; a separate fresh session passed.

Existing workflow.test.ts ran once after final code changes: 1 pass, 0 fail, 60 assertions. No build or formatter ran. The temporary fixture was removed. Retained old proof was not modified.

### Review, findings and merge status

Consumed [review-0032](../events/review-0032.yaml), [review artifact](../artifacts/reviews/review-review-0032.md), [fix start](../events/fix-start-0035.yaml), [approval](../events/fix-approval-0034.yaml), [authorized repair](../events/fix-approval-repair-0036.yaml) and [live input-ready](../events/fix-input-ready-0037.yaml). Resolved: STD-001. Remaining findings: none. Latest reviewer verdict is historical FAILURE for the previous source; fresh review is required for this new commit.

[Fix result](../events/fix-0038.yaml), [exact command proof](../artifacts/evidence/fix-0038/public-init.json), [validation](../artifacts/evidence/fix-0038/validation.json), [generated index](../artifacts/evidence/fix-0038/index.md) and [case notes](../artifacts/evidence/fix-0038/notes.md).

Not merged, pushed or ticket-completed. Parent owns phase completion and later publication. Unresolved questions: none.

## Final handoff — fix-0038

This section supersedes the provisional fix-0038 source identity above. Parent requested contract-focused regression assertions instead of whole stock-prose equality. Required schema, kind, heading and notes content remain covered; exact-byte equality stays in the disposable public-init smoke proof.

Final source: `2f0018b9a37eb6ea2c6795d6779213bdbbdb95f3`; tree: `a0ceb121c1e9d04d3e18709c62d3260d075ece18`. The same scoped commit was amended; runtime writer is unchanged from the successful fresh public-init smoke. Source committed clean.

Re-ran only the changed workflow regression after the parent request: 1 pass, 0 fail, 66 assertions, 9.79s. The earlier single run passed 60 assertions before the assertion-only revision. No other tests, builds or formatters ran.

[Final validation](../artifacts/evidence/fix-0038/final-validation.json) and [fix result](../events/fix-0038.yaml) bind this final identity. Resolved STD-001; no unresolved findings or questions. Latest historical reviewer verdict remains FAILURE; a fresh independent review must cover the new source. Not merged, pushed or ticket-completed.


## Parent completion — fix-complete-0039

[Parent completion](../events/fix-complete-0039.yaml) verifies [fix-0038](../events/fix-0038.yaml), final source 2f0018b9a37eb6ea2c6795d6779213bdbbdb95f3 and tree a0ceb121c1e9d04d3e18709c62d3260d075ece18, clean source, immutable draft and proof, and matching typed delivery. Public init preserved schema, headings and notes; final workflow regression passed with 66 assertions. STD-001 resolved; no unresolved findings. Delivery acknowledged; native completion sequence 2 confirmed; only child terminal t8p removed. Source worktree retained.

Fresh independent review is required because source changed. No merge, push or ticket completion occurred. Receipt repair was explicitly authorized; original approval bytes and checksum remain preserved.

## Review attempt 6 — current outcome

[Independent review](../events/review-0042.yaml) returned **SUCCESS** for commit `2f0018b9a37eb6ea2c6795d6779213bdbbdb95f3`, tree `a0ceb121c1e9d04d3e18709c62d3260d075ece18`. Standards: 0 findings. Spec: 0 findings. [Sole review artifact](../artifacts/reviews/review-review-0042.md).

Public regression passed: 1 test, 66 assertions. Fresh init/validate, generated Markdown, 24 copied assets, served original image bytes and desktop/narrow viewer focus passed. Parent public validate passed JSON, plain and quiet. Tracker schema check passed.

[Parent completion](../events/review-complete-0043.yaml) verifies matching transport and authoritative event, frozen clean source, and native reviewer completion. Owned review pane closed; no explicit workspace close. No source fixes, merge, push or ticket completion occurred. Next phase: finish or submit, subject to fresh inspection.
