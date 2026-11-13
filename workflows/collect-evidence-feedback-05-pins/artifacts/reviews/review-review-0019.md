# Review review-0019

## Verdict

SUCCESS. Standards: 0 findings. Spec: 0 findings. No blocking finding remains for the frozen source.

## Identity and scope

Timestamp: 2026-11-13T00:39:56.862Z. Reviewer: hc:t9q. Run: 170e8a57-c44f-4d14-884e-5ba4d8b02dda. Operation: pins-review-0019.

Ticket: tracker/tickets/collect-evidence-feedback-05-pins.md. Backend: local-markdown. Initiative: tracker/initiatives/collect-evidence-feedback/index.md.

Source branch: feature/collect-evidence-feedback-05-pins. Base branch: master.

Reviewed source: 0fcfd5dd0c3f03d7ed65dffd3127aa3883da6de2. Reviewed tree: 3f4145d7c9d7da7239f02a61a9d0a73b57aee5a8.

review_base_commit: c85a54d9afe78597db28b2e93950703d7d8f53a2.

Comparison: git diff c85a54d9afe78597db28b2e93950703d7d8f53a2...0fcfd5dd0c3f03d7ed65dffd3127aa3883da6de2. The merge-base comparison includes the complete committed ticket05 product slice. Reverse base-only workflow changes are not product changes.

changed_scope:
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json

affected_contracts:
- **Affected contract:** collect-feedback/v1 annotation create/list/export API
- **Affected contract:** source SHA-256 and normalized/original pixel geometry
- **Affected contract:** bundled viewer keyboard/pointer/zoom/pan editor
- **Affected contract:** atomic durability and writer-lock lifecycle
- **Affected contract:** developer plugin and marketplace versions

The review covers create/list/export, stable annotation identity, SHA-256 source binding, geometry, writer durability, shutdown, the bundled editor and distribution versions. Both developer manifests advance together to 0.2.29. Editing, deletion, persistent unfinished drafts and video notes belong to later tickets.

## Standards

No actionable standards, security, correctness or maintainability findings in the ticket05 slice at 0fcfd5dd0c3f03d7ed65dffd3127aa3883da6de2, compared with c85a54d9afe78597db28b2e93950703d7d8f53a2. Reviewed repository context, DESIGN.md, ticket05, the initiative, viewer contract, annotation storage, HTTP guards, viewer controls and changed workflow coverage. The server-message and selected-pin fixes are present. Later-ticket draft recovery, editing and deletion are outside scope. Static read-only review only; no tests, build or runtime checks were run.

Independent fresh session hc:t9r; run dbdb299d-c3ca-47aa-90ea-d9bc04acfd61. The axis result was verified and acknowledged. Its terminal was closed; resource shutdown is confirmed.

## Spec

No actionable specification findings in the ticket05 slice at 0fcfd5dd0c3f03d7ed65dffd3127aa3883da6de2 against c85a54d9afe78597db28b2e93950703d7d8f53a2. Static review covered pointer and keyboard creation, near-pin editing, priorities, normalized and rounded geometry, selected-pin visibility, source identity, request safety, durable publication, retry identity, revisions and ETags, shutdown, reload/restart persistence, and CLI/API export. The server error message reaches the editor, and selected-pin visibility responds to scroll and viewport changes. Editing, deletion, persistent drafts and video notes belong to later tickets and are not missing scope here. No tests, builds, runtime checks, repository edits or review artifacts were created. Browser behaviour and shutdown timing remain for the parent runtime checks.

Independent fresh session hc:t9s; run e23a86ea-1950-4b06-b6c8-cb6297e63e09. The axis result was verified and acknowledged. Its terminal was closed; resource shutdown is confirmed.

## Context and prior findings

Read the complete ticket and initiative through mq-query. Read CONTEXT-MAP.md, CONTEXT.md, domain configuration, the ADR index and the viewer contract. The index lists only the unrelated Pi Ink cleanup decision. NO ADR applies to this slice.

Consumed authoritative base receipts fix-0015, fix-complete-0017, review-0007, review-complete-0009 and review-start-0018, plus the latest fix snapshot and retained fix browser verification. Prior evidence is input, not replacement runtime proof.

STD-01 is resolved: the actual bundled page shows the server source-change/new-import message. SPEC-01 is resolved: the selected pin remains visible during real wheel pan and ancestor scroll at 400%, including 390×701.

## Reviewer runtime proof

All checks used the frozen source. No build or source write ran. Public source-worktree CLIs ran from /tmp against a temporary repository with the standard shared-context evidence route. A real Chromium capture produced a 1001×701 source image. Its SHA-256 was 6b838ab14cb9259bd0efe1d7f0bcc6bbd40849809a1223f0a09250c33c46c5d2. The public init command imported it into a separately resolved feedback session. Both public serve entrypoints served the committed viewer on dedicated loopback port 43137.

- **Public workflow:** mise exec -- env PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome PLAYWRIGHT_MCP_VIEWPORT_SIZE=1001x701 bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts passed: 1 test, 84 assertions, 0 failures. This exercised authorization, Host/Origin, payload bounds, registered assets, source changes, schemas, retry, ETags, stored records, export, restart and graceful lock release.
- **TypeScript check:** mise exec -- bun run --cwd mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer typecheck passed. No rebuild ran.
- **Actual browser creation:** Saved a keyboard box after ArrowRight and Shift+ArrowRight, a reverse pointer box, a forward pointer box and a pointer point. Exercised Ctrl+Enter, Meta+Enter, Escape and labelled P1/P2/P3 controls. New drafts started at P2; empty comments disabled save. The floating editor and focus styling were visible on the actual page.
- **Geometry boundaries:** Keyboard box original-pixel bounds were x=401, y=280, width=202, height=141. Reverse box bounds were 300,245,401,211. A keyboard-expanded right-edge box ended at exactly x+width=1001, with bounds 401,280,600,141. The pointer point retained zero extents. Stored JSON equalled API annotation records.
- **Real save failure:** Changed only the temporary imported image after page load. Save returned 409 and displayed “Registered source image changed or is unsafe; import a new session”. The full comment remained. Restoring the temporary original bytes allowed retry to save. Retained repository evidence was not modified.
- **Malformed transport replies:** Injected HTTP 502 text and null JSON responses through browser request interception. Both displayed the HTTP fallback and retained the full draft. All three POST bodies, including the eventual real retry, were byte-identical with ID bc41e1dc-ef77-4792-a74a-0ddbef3a2934. While the real request was paused, the page showed Saving and no Saved acknowledgement. Saved appeared after the real 201 response.
- **Wide wheel pan:** At 1600×1000 and 400%, real horizontal, vertical and reverse wheel events moved image scroll offsets through [1702,602], [1702,1207] and [852,602]. Ancestor wheel scroll also ran. Every measured pin intersected all clipping ancestors; every editor stayed inside the usable viewport. A real screenshot confirmed the selected pin beside the editor.
- **Narrow wheel pan:** At 390×701 and 400%, resize, horizontal, vertical, reverse and ancestor wheel actions retained visible selected pins and clamped editors. The reverse action moved the pin from x=17,y=111.0625 to x=315,y=513.0625; ancestor scroll returned it to y=111.0625. A real screenshot confirmed the narrow surface. These checks are not a full accessibility audit.
- **Identity preservation:** Normalized geometry and complete records remained unchanged through zoom, pan and resize. The source SHA-256 still matched the original bytes. Browser reload restored five existing notes; a later server restart restored all seven notes created before shutdown.
- **Read-only export:** CLI and API exports matched exactly, including identities, source references, priorities, comments, revisions, timestamps and both geometries. Repeated CLI exports were identical. Offline export after the first graceful shutdown matched the prior API export.
- **Pending-save shutdown:** Started eight concurrent real POSTs. Sent SIGTERM after the first response. All eight returned 201; offline export contained all eight exact IDs and 15 total notes. The process exited 0 and removed its writer lock. This is actual graceful shutdown proof, not a service-kill/exit143 inference.

## Integration checks and coordination

integration_checks:
- **Required argv:** `["mise","exec","--","bun","test","mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts"]`
- **Required argv:** `["mise","exec","--","bun","run","--cwd","mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer","typecheck"]`

Run these again against the actual integration candidate. The source review does not approve an unreviewed resolution or a future merged tree. Reassess create/list/export schema compatibility, image geometry consumers, writer lifecycle and developer version coordination against the current base. The parent inventory was incomplete, with no hard blockers and no target reservations. Unknown scopes are not proof of global compatibility.

## Provenance and cleanup

The parent explicitly corrected publication routing to the separate base context checkout. Installed write-result.ts rejects v2 repository publication into the reviewed source checkout. workflow.root is the independently resolved base store root, not the workflow directory. The sole immutable review is authored directly at workflows/collect-evidence-feedback-05-pins/artifacts/reviews/review-review-0019.md. No duplicate authored review exists. Axis reports are transport records only.

Source HEAD and tree matched the frozen identities; porcelain was empty. The inspector reported historyValid=true and a clean matching source. Its interrupted-review recommendation describes this live authorized dispatch; no duplicate phase was launched.

Both reviewer services exited 0. Both writer locks were absent. The owned browser tab was closed. Axis terminals t9r and t9s were removed, and their process registries confirmed shutdown. The temporary resolved store, scripts and screenshots were removed. No new durable evidence run is claimed. Prior workflow history, tracker, source, tests and generated viewer were left unchanged. No commit, merge, rebase or push ran. The reviewer terminal remains open for parent validation.

## Next step

Parent: verify and acknowledge review-0019, close hc:t9q, append review completion and update tracker/projections. Reassess integration compatibility before finish. Standards: 0 findings. Spec: 0 findings.

