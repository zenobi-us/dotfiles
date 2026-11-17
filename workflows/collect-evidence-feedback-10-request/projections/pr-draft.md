# Collect feedback from one workflow request

## Ticket and problem

[Ticket](tracker/tickets/collect-evidence-feedback-10-request.md) requires collection safety before feedback import. A mixed FAIL/BLOCKED collector run previously passed the assertion-failure exception and started a feedback server despite the blocked case.

## Implementation history

Implementation-0003 introduced installed collector orchestration, explicit historical reuse and existing importer/server composition. Its immutable draft and receipts remain unchanged. Review-0007 returned FAILURE with one P2 finding R-001; review-complete-0009 closed that phase. Fix-0011 addresses that finding. No fresh reviewer verdict is claimed.

## Remaining questions

Fresh web/video acceptance remains unavailable on this host as documented in the implementation. No new unresolved finding. Not merged, pushed or ticket-completed.

## Fix fix-0011

State: FIXED, awaiting fresh exact-source review. Resolved: R-001 (P2, NO ADR). Unresolved findings: none. Latest reviewer verdict remains FAILURE from review-0007; that verdict applies to the old source, not this fix.

Source: 9768929cd6bc5f47170d0b6f329b788369b16ea2. Tree: 8e21baccc631faae5bf37a3b90191eb194776fad. Branch: feature/collect-evidence-feedback-10-request. Base: master.

### Change

Any BLOCKED case now stops request before import, even when collector exit 1 also reports FAIL. Exit 3 retains the sealed diagnostic source. Assertion-only FAIL remains reviewable through the unchanged importer and server.

### Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/request.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/request.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/request-workflow.test.ts`

The normal commit hook updated both plugin manifests. No hook was bypassed.

### Validation

- Real public CLI request from /tmp: before fix, mixed FAIL/BLOCKED opened a feedback session and HTTP server. SIGTERM exited 0. [Before](workflows/collect-evidence-feedback-10-request/artifacts/evidence/fix-0011/before.json).
- Real fresh compiled TUI plan after fix: exit 3; FAIL and BLOCKED retained; sealed run validates with exit 0; no session.json and no listener. [After](workflows/collect-evidence-feedback-10-request/artifacts/evidence/fix-0011/after.json).
- Real assertion-only run: served actual HTTP session with FAIL; SIGTERM exited 0, removed writer lock and released port. [Assertion-only](workflows/collect-evidence-feedback-10-request/artifacts/evidence/fix-0011/assertion-only.json).
- Focused request-workflow.test.ts run: existing test passed (25 expectations); new test initially failed because its temporary repository lacked origin. After fixing setup, filtered new test reached serving but expected an omitted fresh historical field to be false. Replaced that incidental assertion with source run identity. Final filtered new test passed, 20 expectations, 0 failures. All attempts retained: [initial](workflows/collect-evidence-feedback-10-request/artifacts/evidence/fix-0011/regression.json), [setup-corrected](workflows/collect-evidence-feedback-10-request/artifacts/evidence/fix-0011/mixed-regression.json), [final](workflows/collect-evidence-feedback-10-request/artifacts/evidence/fix-0011/mixed-regression-final.json).
- Original 1280 × 720 native PNG inspected: Ready screen and Selected item are visible. Expected width 1281 deliberately fails; missing required screen blocks the second case. No reconstructed image or mocked collector.
- Initial GUI precondition plan was rejected before capture; no GUI mixed-run proof claimed. Prepared native PATH was then explicitly passed. [Commands](workflows/collect-evidence-feedback-10-request/artifacts/evidence/fix-0011/commands.json).
- TypeScript language server failed to start. No passing diagnostics claim. Known missing-Chrome full-suite failures were not rerun. Web/video limits from implementation remain unchanged.

### Cleanup and publication

Owned services stopped. Real run Cage/foot PIDs are absent; private runtime directories removed. Both feedback locks absent and port refuses connections. Owned X11 fixture stopped, temporary workspace removed; user resources retained. [Cleanup](workflows/collect-evidence-feedback-10-request/artifacts/evidence/fix-0011/cleanup.json). Fixer pane t1h7 remains alive for parent closure.

Source committed locally. No merge, rebase, fetch, push, remote Git operation, tracker completion or automatic publication. Canonical workflow writes remain local and uncommitted; parent owns phase-complete and final acknowledgement.

### Supporting records

- [Fix start](workflows/collect-evidence-feedback-10-request/events/fix-start-0010.yaml)
- [Fix result](workflows/collect-evidence-feedback-10-request/events/fix-0011.yaml)
- [Failed review](workflows/collect-evidence-feedback-10-request/events/review-0007.yaml)
- [Review completion](workflows/collect-evidence-feedback-10-request/events/review-complete-0009.yaml)
- [Immutable review](workflows/collect-evidence-feedback-10-request/artifacts/reviews/review-review-0007.md)
- [Implementation](workflows/collect-evidence-feedback-10-request/events/implementation-0003.yaml)
- [Implementation draft](workflows/collect-evidence-feedback-10-request/artifacts/snapshots/pr-draft-implementation-0003.md)

Next: fresh review of 9768929cd6bc5f47170d0b6f329b788369b16ea2; no integration authorized.


## Parent completion fix-complete-0013

[Fix completion](workflows/collect-evidence-feedback-10-request/events/fix-complete-0013.yaml) validates the exact source and delivery. Parent scoped regression: 2 pass, 0 fail, 45 expectations with the prepared native PATH. The first parent attempt lacked native tools on PATH; corrected environment passed. Retained diagnostic run validated and original PNG inspected. Fixer tab closed, delivery acknowledged, and process shutdown confirmed after approved exact-identity cleanup. [Checks](workflows/collect-evidence-feedback-10-request/artifacts/snapshots/parent-fix-check-0012.json). [Shutdown](workflows/collect-evidence-feedback-10-request/artifacts/snapshots/fix-shutdown-0012.json). Source committed locally; workflow records remain uncommitted. Not merged, pushed or ticket-completed. Next: fresh exact-source review.


## Current review: REVIEW_PASSED

Review-0015: SUCCESS for source 9768929cd6bc5f47170d0b6f329b788369b16ea2 and tree 8e21baccc631faae5bf37a3b90191eb194776fad. Standards: 0 findings. Spec: 0 findings. Prior FAILURE review-0007 and resolved R-001 remain historical records. [Immutable review](workflows/collect-evidence-feedback-10-request/artifacts/reviews/review-review-0015.md). [Parent completion](workflows/collect-evidence-feedback-10-request/events/review-complete-0017.yaml). Parent public regression: 2 passed, 45 expectations. Real historical request, HTTP export and shutdown passed. [Runtime smoke](workflows/collect-evidence-feedback-10-request/artifacts/snapshots/review-public-smoke-0016.json). Review delivery acknowledged; all three reviewer tabs removed and processes confirmed stopped after approved axis cleanup. [Shutdown](workflows/collect-evidence-feedback-10-request/artifacts/snapshots/review-shutdown-0016.json). Tracker review comment committed locally as 63912398. Workflow records remain local and uncommitted. No merge or push. Integration against the current base still requires compatibility checks; shared manifest overlap and incomplete unrelated coordination inventory remain limits.
