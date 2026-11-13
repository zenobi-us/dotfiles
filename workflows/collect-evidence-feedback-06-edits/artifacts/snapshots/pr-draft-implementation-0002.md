---
title: "Implementation: saved feedback edits"
type: Concept
---

# Edit and undo feedback without lost changes

## Ticket

[collect-evidence-feedback-06-edits](../../../../tracker/tickets/collect-evidence-feedback-06-edits.md). Parent initiative: collect-evidence-feedback.

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

## Source

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

Latest workflow reviewer verdict: none. Independent workflow review remains the parent's next phase. These checks do not approve merge.

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

- **Start receipt:** [start-0001](../../events/start-0001.yaml).
- **Implementation receipt:** [implementation-0002](../../events/implementation-0002.yaml).
- **Source capture:** [validated sealed source copy](../evidence/edits-source-0001/run.json). Original run identity and capture bytes are unchanged.
- **Restored session:** [revision-4 session snapshot](../evidence/edits-review-0001/session.json).
- **Final session:** [revision-8 recovery snapshot](../evidence/edits-recovery-0001/session.json).
- **Conflict proof:** [final conflict screenshot](browser-recovery-conflict-implementation-0002.webp).
- **Recovery proof:** [saved recovery screenshot](browser-recovered-save-implementation-0002.webp).
- **Undo proof:** [undo screenshot](browser-undo-implementation-0002.webp).
- **Restart proof:** [restart screenshot](browser-restart-implementation-0002.webp).
- **Exports:** [restored export](export-implementation-0002.json) and [final recovery export](export-recovery-implementation-0002.json).
- **Standards check:** [review result](standards-review-implementation-0002.json).
- **Specification check:** [review result](spec-review-implementation-0002.json).

