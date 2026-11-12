# Implementation log

## implementation-0003

Source: f634dccda509f084959a364258bcaa7c602e4492. Tree: f134852d15e9fe3a458ba30e7dedbcdb44338912.

Implemented screenshot point and box annotations, near-pin priority/comment editor, keyboard adjustment, zoom attachment, durable retry-safe JSON storage, protected create/list API, read-only CLI/API export, and graceful pending-save shutdown. Rebuilt the distributed viewer and updated skill docs.

### Changed files

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

### Validation

- **Passed:** Typecheck passed; rebuilt single HTML, 332479 bytes, bundled scripts/styles/fonts.
  Command: `mise exec -- bun run typecheck && mise exec -- bun run build`
- **Passed:** 100 passed, 3 opt-in real-driver tests skipped, 0 failed; 972 assertions. Includes installed feedback import, HTTP, source-change safety, retry, restart and export.
  Command: `mise exec -- env PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome PLAYWRIGHT_MCP_VIEWPORT_SIZE=1001x701 bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/verdict.test.ts`
- **Passed:** Final invalid-annotation exit-code regression: 1 passed, 0 failed; 84 assertions.
  Command: `mise exec -- env PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome PLAYWRIGHT_MCP_VIEWPORT_SIZE=1001x701 bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts`
- **Passed:** Point, forward/reverse box, labelled priorities, keyboard adjustment/cancel/Ctrl+Enter/Meta+Enter, durable Saved, source-conflict retry, zoom/narrow viewport, reload/restart and offline export on unchanged 1001x701 original pixels.
  Command: `Actual browser + installed CLI + HTTP + stored JSON smoke`
- **Passed:** All eight returned 201 and matching durable records; clean exit 0 and lock removed.
  Command: `Eight concurrent POST saves; SIGTERM after first acknowledgement`

### Unresolved questions

None. No independent review or integration ran.

- **Receipt:** [implementation-0003](../events/implementation-0003.yaml).
- **Snapshot:** [PR draft](../artifacts/snapshots/pr-draft-implementation-0003.md).
- **Browser evidence:** [verification](../artifacts/evidence/pins-browser-20261113/verification.json).
