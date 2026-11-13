# Screenshot feedback pins

## Ticket

[collect-evidence-feedback-05-pins](../../../tracker/tickets/collect-evidence-feedback-05-pins.md) adds persistent screenshot feedback.

## Problem

The existing viewer could inspect source evidence but could not save comments against a precise image target.

## Implementation

Implemented screenshot point and box annotations, near-pin priority/comment editor, keyboard adjustment, zoom attachment, durable retry-safe JSON storage, protected create/list API, read-only CLI/API export, and graceful pending-save shutdown. Rebuilt the distributed viewer and updated skill docs.

Source commit: f634dccda509f084959a364258bcaa7c602e4492.
Source tree: f134852d15e9fe3a458ba30e7dedbcdb44338912.

## Changed files

- **File:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/commands.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/records.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/server.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/ui/button.tsx`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/styles.css`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts`

## Validation

- **passed:** Typecheck passed; rebuilt single HTML, 332479 bytes, bundled scripts/styles/fonts.
- **passed:** 100 passed, 3 opt-in real-driver tests skipped, 0 failed; 972 assertions. Includes installed feedback import, HTTP, source-change safety, retry, restart and export.
- **passed:** Final invalid-annotation exit-code regression: 1 passed, 0 failed; 84 assertions.
- **passed:** Point, forward/reverse box, labelled priorities, keyboard adjustment/cancel/Ctrl+Enter/Meta+Enter, durable Saved, source-conflict retry, zoom/narrow viewport, reload/restart and offline export on unchanged 1001x701 original pixels.
- **passed:** All eight returned 201 and matching durable records; clean exit 0 and lock removed.

The full combined run skipped three opt-in collector-driver tests. This ticket exercised real Chromium capture, the bundled feedback browser, HTTP and stored files separately. Initial checks found missing default Chrome configuration, a ref typing issue and a delayed focus race. Installed Chromium configuration and source fixes resolved these; final checks passed.

## Review history

Review review-0007: FAILURE at commit 10f8f120cd4b796354984a9c561117ad4701dfb5. [Immutable review](../artifacts/reviews/review-review-0007.md), [result](../events/review-0007.yaml), [parent completion](../events/review-complete-0009.yaml).

## Resolved findings

STD-01 and SPEC-01 are resolved by fix-0015. See the fix verification below.

## Remaining findings and questions

No unresolved finding remains. Independent review review-0019 passed. Editing, deletion and persisted unfinished drafts remain outside this ticket.

## Latest reviewer verdict

SUCCESS for commit 0fcfd5dd0c3f03d7ed65dffd3127aa3883da6de2 and tree 3f4145d7c9d7da7239f02a61a9d0a73b57aee5a8. [review-0019](../artifacts/reviews/review-review-0019.md) supersedes the historical FAILURE for the earlier source.

## Merge status

Not merged or pushed. Ticket remains claimed.

## Supporting records

- **Start receipt:** [start-0001](../events/start-0001.yaml).
- **Launch receipt:** [launch-0002](../events/launch-0002.yaml).
- **Implementation receipt:** [implementation-0003](../events/implementation-0003.yaml).
- **Runtime checks:** [verification.json](../artifacts/evidence/pins-browser-20261113/verification.json).
- **Export:** [export.json](../artifacts/evidence/pins-browser-20261113/export.json).
- **Shutdown:** [shutdown-drain.json](../artifacts/evidence/pins-browser-20261113/shutdown-drain.json).
- **Final browser:** [forward box saved](../artifacts/evidence/pins-browser-20261113/final-forward-box-saved.png).
- **Narrow viewport:** [selected edge pin at 400% zoom](../artifacts/evidence/pins-browser-20261113/narrow-zoom-edge.png).

## Parent validation

The parent verified the delivered receipt, source hash and all 13 exported annotation geometries. The installed export matched the retained export exactly. Terminal t99 is closed. The source worktree remains clean. At implementation completion no review, merge or push had run. Independent review now reports FAILURE; no merge or push ran.

[Parent implementation completion](../events/implementation-complete-0005.yaml) records clean review target 10f8f120cd4b796354984a9c561117ad4701dfb5.

## fix-0015

Source fix commit: e7f45cabcd07ad71627b22aa4245f4c4af168983. Tree: a2c224d5a63f12c5c6d6eb95e8bab0912220b0e6.

STD-01 now displays the server message with an HTTP fallback. SPEC-01 reveals the selected pin during image and ancestor scroll, and reveals the inspector first to avoid narrow-screen column snapping. The commit hook also updated the developer plugin and marketplace versions.

### Changed files

- **File:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx`

### Validation

Typecheck and final build passed (332924-byte bundled HTML). Public workflow.test.ts passed: 1 test, 84 assertions. Actual bundled Chromium checks passed source-change/new-import message, stable full-comment retry, durable save after restoring temporary media, HTTP 502 fallback for injected non-JSON and null bodies, 400% real wheel pan on both axes, ancestor scroll and 390×701 resize. Stored geometry and original 1001×701 source SHA-256 remained unchanged.

No new permanent test was added. The existing public regression covers server behavior; the changed scroll and message display paths were exercised in the actual bundled browser.

### Recovery and review history

[review-0007](../events/review-0007.yaml) reported FAILURE with STD-01 and SPEC-01. [Review artifact](../artifacts/reviews/review-review-0007.md) and [review completion](../events/review-complete-0009.yaml) remain unchanged in the base workflow store. [fix-complete-0013](../events/fix-complete-0013.yaml) records the failed launch with no source changes. [fix-start-0014](../events/fix-start-0014.yaml) authorizes this fresh retry. Both findings are resolved by this fix; a fresh review is required.

### Unresolved questions

None in the authorized scope. No merge or push. Parent owns event reconciliation, final completion and review dispatch.

### Evidence and shutdown

[Browser verification](../artifacts/evidence/fix-0015-browser/verification.json), [export](../artifacts/evidence/fix-0015-browser/export.json), [narrow wheel screenshot](../artifacts/evidence/fix-0015-browser/narrow-400-wheel.png), [wide wheel screenshot](../artifacts/evidence/fix-0015-browser/wide-400-wheel.png), [source diagnostic](../artifacts/evidence/fix-0015-browser/source-change-message.png). Browser tab closed. Tool service stop exited 143 and retained a temporary writer lock; its process was absent. Removed the entire owned temporary session and lock. Existing workflow.test.ts separately passed graceful-shutdown checks.

[Fix result](../events/fix-0015.yaml), [snapshot](../artifacts/snapshots/pr-draft-fix-0015.md).


## Parent fix completion

[fix-complete-0017](../events/fix-complete-0017.yaml) validates [fix-0015](../events/fix-0015.yaml) and its immutable [snapshot](../artifacts/snapshots/pr-draft-fix-0015.md). Final clean review target: `0fcfd5dd0c3f03d7ed65dffd3127aa3883da6de2`, tree `3f4145d7c9d7da7239f02a61a9d0a73b57aee5a8`.

Both findings resolved. Parent verified the delivered payload against the authoritative event, source identity, screenshots, browser measurements and two exported geometries. Delivery acknowledged. Fresh fixer terminal `t9p` removed; worktree retained. The app automatically removed its empty source space. No merge or push. Fresh review required.


## Review review-0019

SUCCESS for `0fcfd5dd0c3f03d7ed65dffd3127aa3883da6de2`. Standards: 0 findings. Spec: 0 findings. Both prior findings are resolved. [Immutable review](../artifacts/reviews/review-review-0019.md), [review result](../events/review-0019.yaml), [parent completion](../events/review-complete-0021.yaml). The parent verified delivery, exact clean source and the sole artifact. Parent typecheck and public workflow passed: 1 test, 84 assertions. The reviewer exercised real browser saves, source-conflict retry, wide/narrow wheel pan, restart/export and eight-save graceful shutdown.

Delivery acknowledged. Reviewer and axis terminals closed. Source remains clean. No merge or push. Integration must validate the candidate against the current base and reassess affected contracts.
