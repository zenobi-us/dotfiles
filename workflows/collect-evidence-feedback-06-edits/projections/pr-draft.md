---
title: Implementation PR draft
type: Concept
---

# Edit and undo feedback without lost changes

## Ticket

[collect-evidence-feedback-06-edits](../../../tracker/tickets/collect-evidence-feedback-06-edits.md). Parent initiative: collect-evidence-feedback.

## Problem

The service only created notes. Saved notes could not be edited, deleted or restored.

## Implementation

- **Conditional mutations:** PATCH and DELETE require the exact revision ETag. Missing If-Match returns 428. Stale revisions return 412. Serialized checks and atomic replacement prevent lost updates.
- **Stable records:** Edits preserve annotation ID and source binding. Deletion stores a tombstone. Undo clears it without changing comment, priority, geometry or source. Legacy creation records remain readable.
- **Mutation safety:** Each mutation validates the session and source bytes. Authorization, payload limits, schemas and registered paths remain enforced. Invalid requests leave records unchanged.
- **Viewer controls:** Saved-pin selection creates no draft or write. Edit note changes comment, priority or geometry. Delete note and Undo deletion work across reload and restart.
- **Conflict recovery:** Keep the draft and starting revision. Show the current saved comment, priority, geometry and deletion state. Require explicit revision adoption before replacement.
- **Uncertain acknowledgements:** A retry checks the saved record. If its content exactly matches the submitted edit, re-save it with the current If-Match for a durable acknowledgement. A different concurrent edit remains a conflict.
- **Exact geometry:** Comment-only edits do not reclamp saved geometry. This prevents floating-point changes at image edges.
- **Distribution:** Rebuild the single HTML artifact. Commit hooks updated developer bundle metadata to 0.2.34.

## Original implementation source

Branch: feature/collect-evidence-feedback-06-edits. Base: master.

Commit: 250dd929e45d26787c169b8567fc755a945d3838. Tree: 8ee708c34ce98c304203c79edd6c5efd695d00fc. Source worktree is clean.

Commits: 93d993e4 and 250dd929. No merge or push. Ticket remains claimed.

## Changed files

- **Source:** mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- **Source:** mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/server.ts
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts

## Validation

- **Public regression:** PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test. Passed: 1 test, 116 Bun assertions, plus real-browser assertions inside playwright-cli run-code.
- **Browser regressions:** Two actual browser pages verified stale conflict, retained textarea content and explicit revision adoption. A real PATCH committed before an intercepted response was aborted. Retry recovered the same annotation. Exact normalized geometry remained unchanged.
- **API regressions:** Concurrent same-revision edits produced one 200 and one 412. Missing preconditions produced 428. Unauthorized, malformed, unsupported-schema and changed-source mutations failed without partial writes. Tombstones and undo preserved the full note. CLI and HTTP export agreed after restart.
- **Build:** From viewer/, mise exec -- bun run typecheck and mise exec -- bun run build passed. Final artifact: 335947 bytes.
- **React Doctor:** mise exec -- bunx react-doctor@latest --verbose --scope changed reported 69/100 and no issues. Score did not change from the earlier scan. No diagnostic suppressions or configuration changes.
- **Installed smoke:** Copied the skill into an isolated installed layout under /tmp. Invoked absolute mise-shebang commands from /tmp. Collected a real screenshot through collect-evidence, imported it through collect-feedback, and served at http://127.0.0.1:18963. Two managed Chromium tabs exercised edit, conflict, delete, reload, undo, restart and export.
- **Observed identity:** Annotation 9170d7da-9696-46bd-b795-5350cf15e8d6 retained source SHA-256 40d80e8833bafd3907bb068ff6993da3684be21f94c724bf6ce3e82d7fffdb5f. Revision 4 survived reload/restart; final recovery smoke reached revision 8 with the same ID and geometry.
- **Shutdown:** Closed only owned browser tabs and reviewer terminals. Stopped every owned feedback server. Verified .writer.lock removal and successful rebinding of port 18963.

## Review history

Two independent implementation-time reviews ran against the worktree. Standards and specification each found one P2 retry-recovery gap. Both describe the same defect. The explicit conflict panel, conditional reconciliation and permanent browser regression resolve it.

Latest formal reviewer verdict: FAILURE in review-0005, against the old source. Fix-0009 resolves both consumed findings; fresh review must cover the new source.

## Resolved findings

- **Retry recovery:** Preserve the draft, show the competing version and adopt its revision only through explicit user action.
- **Lost acknowledgement:** Verify saved content and issue a fresh conditional write to obtain a durable acknowledgement.
- **Geometry regression:** Removed unnecessary reclamping from comment saves. The regression failed before this correction and passed afterward.

## Remaining findings

None from implementation-time review.

## Limits and open questions

No open implementation questions. Drafts remain memory-only by scope. Persistent drafts and video comments belong to tickets 07 and 08.

The first regression attempt lacked Chrome at the CLI default path. Setting the existing installed Chromium executable resolved it. No browser was installed during capture. The first deletion assertion incorrectly expected deletedAt to remain null; the corrected assertion checks the tombstone.

## Merge status

Not merged or pushed. No tracker completion. No unrelated files changed. Workflow records and evidence are local to the designated context checkout.

## Supporting records

- **Start receipt:** [start-0001](../events/start-0001.yaml).
- **Implementation receipt:** [implementation-0002](../events/implementation-0002.yaml).
- **Source capture:** [validated sealed source copy](../artifacts/evidence/edits-source-0001/run.json). Original run identity and capture bytes are unchanged.
- **Restored session:** [revision-4 session snapshot](../artifacts/evidence/edits-review-0001/session.json).
- **Final session:** [revision-8 recovery snapshot](../artifacts/evidence/edits-recovery-0001/session.json).
- **Conflict proof:** [final conflict screenshot](../artifacts/snapshots/browser-recovery-conflict-implementation-0002.webp).
- **Recovery proof:** [saved recovery screenshot](../artifacts/snapshots/browser-recovered-save-implementation-0002.webp).
- **Undo proof:** [undo screenshot](../artifacts/snapshots/browser-undo-implementation-0002.webp).
- **Restart proof:** [restart screenshot](../artifacts/snapshots/browser-restart-implementation-0002.webp).
- **Exports:** [restored export](../artifacts/snapshots/export-implementation-0002.json) and [final recovery export](../artifacts/snapshots/export-recovery-implementation-0002.json).
- **Standards check:** [review result](../artifacts/snapshots/standards-review-implementation-0002.json).
- **Specification check:** [review result](../artifacts/snapshots/spec-review-implementation-0002.json).


## Fix phase: fix-0009

Current source commit: c5091d44e6120ffc3339c8e5b3f5904643fe9e27. Tree: 059e74eba64364ece42193c3962ea1cde944843e. Branch: feature/collect-evidence-feedback-06-edits; base: master.

### Implementation

- **SPEC-001 resolved:** The deleted-version conflict panel offers Undo deletion and keep draft. It PATCHes only schema, kind and deletedAt: null using the displayed tombstone revision. Acknowledgement updates annotations and baseRevision, clears the submitted payload, and keeps draft identity, comment, priority and geometry. Saving remains explicit.
- **Stale restoration:** HTTP 412 refreshes the conflict panel without adopting a revision or changing the draft. The next restore uses the newly displayed tombstone revision.
- **STANDARDS-001 resolved:** Removed the obsolete editing/deletion restriction from viewer-contract.md. Rebuilt viewer/index.html and updated the changelog. API unchanged.

### Changed files

- **Source:** mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- **Source:** mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html
- **Source:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx

### Validation

- **Scoped public suite:** Passed, 1 test, 0 failures, 116 Bun assertions, 46.46 seconds. The embedded real-browser regression additionally verifies stale restoration 412, exact If-Match revisions 9 and 11, undo-only payloads, no automatic save, explicit save against acknowledged revision 12, and final revision 13 with stable ID/source/normalized and pixel geometry.
- **Viewer typecheck/build:** Both passed. Distributed HTML: 336762 bytes.
- **Real browser smoke:** Two owned Chromium tabs on port 19079 exercised edit versus deletion, stale restoration, refreshed revision 11, restoration to revision 12 without draft save, then explicit save to revision 13. Actual conflict, stale conflict, restored draft and saved UI screenshots were visually inspected. Export preserved ID 9170d7da-9696-46bd-b795-5350cf15e8d6, source hash and point geometry.
- **React Doctor:** 71/100 versus recorded 69/100; one large-component warning at annotation-image.tsx:22. No broad refactor or suppression.
- **Cleanup:** Both owned tabs closed. Service exited 0 after SIGINT; writer lock absent; port 19079 rebound successfully. Isolated temporary session removed; no throwaway scripts remain. Parent owns fixer terminal shutdown.

### Review history and status

Formal [review-0005](../events/review-0005.yaml) returned FAILURE for commit 250dd929e45d26787c169b8567fc755a945d3838, tree 8ee708c34ce98c304203c79edd6c5efd695d00fc at 2026-11-13T12:09:04.074Z. [Original review](../artifacts/reviews/review-review-0005.md) remains immutable. [review-complete-0007](../events/review-complete-0007.yaml) reconciled it after authorized takeover. [fix-start-0008](../events/fix-start-0008.yaml) dispatched this fresh fixer. The prior verdict does not cover the new source. Resolved: SPEC-001 and STANDARDS-001. Unresolved consumed findings: none. Fresh formal review required; no merge, rebase, push or ticket completion.

### Supporting records

- **Fix receipt:** [fix-0009](../events/fix-0009.yaml).
- **Authorization:** [takeover-approval-0006](../events/takeover-approval-0006.yaml); [preserved original bytes](../artifacts/snapshots/takeover-approval-0006-original.yaml). Repair already recorded by parent; no further historical mutation.
- **Conflict screenshots:** [deleted version](../artifacts/snapshots/omp-sshots-15cc9194da6d3645.webp), [stale undo](../artifacts/snapshots/omp-sshots-15cc919c982d3646.webp).
- **Recovery screenshots:** [restored draft](../artifacts/snapshots/omp-sshots-15cc91b159ad3647.webp), [explicit saved note](../artifacts/snapshots/omp-sshots-15cc91b1a02d3648.webp).
- **Export:** [final saved content](../artifacts/snapshots/export-fix-0009.json).
- **Immutable draft:** [pr-draft-fix-0009](../artifacts/snapshots/pr-draft-fix-0009.md).

## Parent completion

Fix phase completed in [fix-complete-0010](../events/fix-complete-0010.yaml). Typed delivery acknowledged; fixer tab closed and all observed owned processes stopped. Source remains clean. Fresh formal review required; no merge or push.


## Review attempt and history repair

[Review-0013](../events/review-0013.yaml) stopped at a workflow precondition and produced [one blocked artifact](../artifacts/reviews/review-review-0013.md), not a verdict. [Review-complete-0014](../events/review-complete-0014.yaml) records acknowledged delivery and confirmed reviewer shutdown. No product review or browser checks ran in that attempt; the parent viewer typecheck passed.

[History-repair-0015](../events/history-repair-0015.yaml) corrects the diagnosis: YAML parsing worked. The reader rejected a parent operator approval with a null pane. Parent operator records now permit a null pane only with a non-empty session ID. Child result pane requirements remain unchanged. The 20-test inspection suite passes; canonical inspection reports valid history. All 14 prior receipt files retain their original SHA-256.

Current source remains c5091d44e6120ffc3339c8e5b3f5904643fe9e27, tree 059e74eba64364ece42193c3962ea1cde944843e. Current review verdict: none. The old FAILURE remains historical and does not cover this source. Next action: fresh independent review, retry mode; the inspector requires scoped approval. No review dispatch, merge, push or tracker completion is authorized by this repair.

## Review attempt 3: current outcome

Latest formal reviewer verdict: SUCCESS for `c5091d44e6120ffc3339c8e5b3f5904643fe9e27`, tree `059e74eba64364ece42193c3962ea1cde944843e`. This supersedes the older blocked status without removing its history.

- **Standards:** One low, non-blocking duplication advisory; no hard violations.
- **Spec:** No findings. Prior SPEC-001 and STANDARDS-001 remain resolved.
- **Checks:** Public workflow regression passed: 1 test, 116 assertions. Independent two-client HTTP and two-tab browser smoke verified editing, tombstones, conflict draft retention, explicit restore, reload, restart and export. Parent viewer typecheck passed.
- **Review artifact:** [review-0018](../artifacts/reviews/review-review-0018.md).
- **Authoritative result:** [review-0018 receipt](../events/review-0018.yaml); [parent completion](../events/review-complete-0019.yaml).
- **Integration:** Not merged or pushed. Candidate-bound integration checks remain required.
- **Cleanup:** Owned review tabs, feedback servers and reviewer terminal closed. Shared managed browser broker/sandbox processes remain running; aggregate shutdown is pending. Preserve this runtime without scoped authorization to terminate it.
