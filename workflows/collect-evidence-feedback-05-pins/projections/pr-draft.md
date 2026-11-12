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

No formal review findings exist. Integration fixed button ref typing, pointer-completion focus and invalid-annotation CLI exit codes.

## Remaining findings and questions

Open findings: STD-01 and SPEC-01. See the immutable review for required changes and validation. Editing, deletion and persisted unfinished drafts remain outside this ticket.

## Latest reviewer verdict

FAILURE for commit 10f8f120cd4b796354984a9c561117ad4701dfb5 and tree 32b3e835e04439239c5afae56d664b72ec44e8ff.

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
