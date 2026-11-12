# Review review-0007

Verdict: FAILURE. Standards: 1 P2 finding. Spec: 1 P2 finding.

## Identity and scope

Timestamp: 2026-11-12T22:32:49.855Z. Reviewer: hc:t9g, OMP, herdr-app.
Ticket: tracker/tickets/collect-evidence-feedback-05-pins.md. Backend: local-markdown.
Source branch: feature/collect-evidence-feedback-05-pins. Base: master.
Reviewed commit: 10f8f120cd4b796354984a9c561117ad4701dfb5.
Reviewed tree: 32b3e835e04439239c5afae56d664b72ec44e8ff.
Comparison: git diff master...10f8f120cd4b796354984a9c561117ad4701dfb5.

Scope includes ticket 05, the complete collect-evidence-feedback initiative, the committed viewer, HTTP service, durable records and export. Editing, deletion, persisted drafts and video are later tickets. Source, tests, generated files, tracker and projections remain unchanged. No build, fixes, commit, merge or push ran.

Read CONTEXT-MAP.md, CONTEXT.md, docs/agents/domain.md and docs/adr/index.md through mq. NO ADR applies: the only indexed ADR concerns Pi Ink cleanup.

## Standards

P2 — Hard contract mismatch: save failures discard the actionable server message.

Source: mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx:171–174. The code reads body.error, but server.ts:40–41,92 returns {schema,kind,success:false,message}. Consequently, source-change rejection becomes only “Save failed: HTTP 409”, followed by instructions to retry the same note. The actual response explains that the registered source changed and requires a new import; retrying cannot repair it.

Standard: references/viewer-contract.md, HTTP API: “Errors include a message.” Initiative, Testing Decisions 14: “Check useful failure results”. This is a documented error-contract failure, not a heuristic smell.

Required change: parse and display the response message while retaining the draft and stable retry identity. Keep an HTTP-status fallback for malformed responses. Rebuild the committed viewer/index.html.

Validation command (not executed): mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts. Also use the bundled browser page: change its registered source after loading, attempt a save, and verify that the visible error states the source-change/new-import reason without showing Saved.

Reviewed commit 10f8f120cd4b796354984a9c561117ad4701dfb5, tree 32b3e835e04439239c5afae56d664b72ec44e8ff, against master. Scope: ticket 05. No evidence-backed consumer-visible heuristic smells found. Static review only; no tests, builds or browser actions executed.

Independent session: hc:t9h; run 848a01dc-babf-4048-8217-805a46b502e6. Finding ID: STD-01.

## Spec

P2 — Selected pins can disappear during pan.

Location: mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx:114–120 (scroll handling:101).

Hard requirement: ticket 05 says, “Keep pins attached through zoom, pan and viewport changes. Keep the selected pin visible and clamp the comment editor.” Initiative decision 48 repeats, “Keep the selected pin visible and clamp the comment editor to the usable viewport.”

The reveal effect runs only for selection, geometry, zoom and window resize. Scroll events only reposition the floating editor. At enlarged zoom, scrolling the image viewport can therefore move the selected pin outside its clipping area while the editor remains visible. The reviewer loses the target beside the comment. This is a source-backed control-flow finding, not a browser reproduction.

Required change: maintain selected-pin visibility within the image viewport during pan and ancestor scrolling, while preserving normalized geometry and editor clamping.

Validation command (not executed): `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/serve.ts <session> --port 43117 --json`. Open the viewer, zoom to 400%, select a pin, then pan horizontally and vertically and scroll the asset inspector. Confirm that the selected pin remains visible beside the editor.

Scope: ticket 05 only. Editing, deletion, persisted drafts and video remain outside this review. No heuristic smells reported. Tests, builds and browser checks were not run, as instructed.

Independent session: hc:t9j; run 8dd65b1a-9e4f-4309-9091-2f4932a5a87c. Finding ID: SPEC-01.

## Reviewer runtime verification

The reviewer ran the installed public commands from /tmp against a new shared-context-resolved temporary session. It imported the prior sealed 1001×701 PNG run, not a simulated image. Original SHA-256: 362d02d21634ea2535310823a0ce303404dc8c1d71e50afb92da2c0fc33950cf. Chromium executable: /home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome. Served the committed single HTML without rebuilding.

- **Public workflow test:** mise exec -- env PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome PLAYWRIGHT_MCP_VIEWPORT_SIZE=1001x701 bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts. Result: 1 pass, 0 fail, 84 assertions. This does not cover the two browser defects.
- **Real browser saves:** Saved a keyboard-created box after ArrowRight and Shift+ArrowRight, selected P1, and used Ctrl+Enter. Saved forward and reverse pointer boxes at P2. Saved a P3 point with Meta+Enter. Required comments, labelled controls, Escape and durable Saved acknowledgements were exercised.
- **Stored geometry:** Keyboard box ID 4e1f52b8-03c5-48e0-8864-24e39bba1a5c retained pixel bounds x=401, y=280, width=202, height=141. Forward box bounds: 150,105,501,281. Reverse box bounds: 300,245,451,246. Stored JSON matched API records.
- **Reload and restart:** Browser reload retained the first note. SIGTERM exited 0 and removed the writer lock. Restart preserved the exact exported identities, hashes, geometry and timestamps. CLI export matched API export. Offline export also succeeded.
- **STD-01 reproduced:** Changed only the temporary session image after page load. Save returned a visible “Save failed: HTTP 409” plus same-note retry instructions. It hid the server source-change/new-import diagnostic. The unsaved comment remained and Saved did not appear. Restored the exact image bytes before further checks.
- **SPEC-01 reproduced:** Selected the saved box at 400% and used real wheel pan on both axes. Pin bounds became x=125.016, y=-552.875, width=28, height=28. Image viewport bounds were x=656, y=241, width=913, height=650. The selected pin was fully clipped. The editor remained visible at x=165.016, y=8. A screenshot confirmed the blank image viewport and detached editor.
- **Narrow surface:** Inspected the actual 390×701 viewport and floating editor. Horizontal inspector navigation remained. This is not a blanket responsive-accessibility pass.
- **Pending saves:** Sent eight concurrent POSTs and SIGTERM after the first response. All eight returned 201 and had durable records. Exit 0; writer lock absent. Offline export contained 12 saved annotations.

## Evidence and shutdown

Inspected the implementation verification.json, export.json, shutdown-drain.json and final-forward-box-saved.png. Their prior claims were inputs, not substituted for reviewer runtime checks. No new evidence run is retained. Screenshots and the new temporary session were disposable verification data. Both axis results passed delivery schema/identity/hash verification and were acknowledged. Both axis terminals were removed. The reviewer closed its browser and server; hc:t9g remains for parent cleanup.

Parent provenance: absolute base-repository events/review-start-0006.yaml and events/implementation-complete-0005.yaml were read without copying or modifying them. The worktree inspector sees only older local events and proposes start reconciliation; the parent start record establishes the approved review dispatch. Preserve parent_receipt review-start-0006.

## Verdict

FAILURE for the exact commit and tree above. Standards: 1 finding, worst P2. Spec: 1 finding, worst P2. Correct both consumer-visible defects and run a fresh review of the new commit.

