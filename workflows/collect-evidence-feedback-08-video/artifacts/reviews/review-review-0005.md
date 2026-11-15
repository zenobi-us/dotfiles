---
title: Independent video review review-0005
type: Concept
---

# Independent video review

## Verdict

FAILURE

Reviewed at 2026-11-15T04:01:57.480Z. One blocking Spec finding remains. Standards has no hard violation and one non-blocking smell judgment.

## Scope

Ticket: tracker/tickets/collect-evidence-feedback-08-video.md. Initiative: tracker/initiatives/collect-evidence-feedback/index.md.

Source branch: feature/collect-evidence-feedback-08-video. Integration branch: master.

Frozen source: 2a14e32edcca02dc297cfd61c30e566982ec0b7c.
Frozen tree: 16676d6137a329fb7cde2a7d457df1f438f4c208.
Review base: 4f75059235bbff9d7ca79df9498bba9243d5e2ea.

Diff command: `git diff 4f75059235bbff9d7ca79df9498bba9243d5e2ea...2a14e32edcca02dc297cfd61c30e566982ec0b7c`.

The designated context checkout is /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles. The source checkout is /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video. Final read-only inspection found the exact source commit and tree, dirty=false, and no workflow diagnostics. No source file, generated bundle, ticket or projection was changed.

### Changed scope

- **Reviewed path:** mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/web.md
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/server.ts
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/video-workflow.test.ts
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/drafts.tsx
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx
- **Reviewed path:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts

### Affected contracts

- **Contract:** recording capability and playable media metadata
- **Contract:** source-bound timestamp annotations and drafts
- **Contract:** HTTP byte-range media serving
- **Contract:** bundled feedback viewer

The approved phase-start records incomplete unrelated coordination inventory. This review claims no compatibility for unknown streams. No integration or base movement was performed. Future integration must run the recorded checks against the combined candidate, with the installed Chromium path configured.

## Standards

Independent fresh session: e84a14a8-d04b-4eae-b414-7f75e71aaa1b, terminal t141. Result schema review-axis/v1 was validated and acknowledged.

No documented-standard violations found. One non-blocking judgment:

**ST-01, P3, NO ADR — Possible Duplicated Code.** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts:109–116 repeats the recorder start/stop commands and error classification in drivers/playwright-driver.ts:283–294. Protocol drift is an unproven maintenance risk, not an observed defect. Consider sharing those protocol operations inside the driver. Keep the doctor probe and case diagnostics at their callers. This does not block completion.

Standards sources include AGENTS.md, canonical docs/agents/domain.md, CONTEXT-MAP.md, CONTEXT.md, DESIGN.md and the source viewer contract. The ADR index contains only the unrelated Pi Ink trust-boundary decision. The smell baseline remains a heuristic, not a hard standard.

## Spec

Independent fresh session: 2adb65a4-774b-48ee-a4c6-8fca52f96aea, terminal t140. Result schema review-axis/v1 was validated and acknowledged.

**RV-01, P2, NO ADR — Undo selects a video note at the wrong playback moment.**

- **File and line:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx:242, and the Undo deletion caller at line 359.
- **Requirement:** Ticket: “Attach a comment and geometry to a paused timestamp and displayed frame dimensions.” Initiative stories 39–40 require a visible selected pin beside its editor and the relevant paused moment.
- **Observed failure:** Delete the blue note at 3.199 seconds. Select the red note at 0.8086 seconds. Close its editor. Select Undo deletion. The restored blue editor says “Paused at 3.199 s” while the actual player stays paused at 0.8086 seconds on the red frame. Only the red pins render; the selected blue pin is absent. The inspector floats the restored editor without its target. Browser screenshot was directly inspected.
- **Cause:** tombstone restores selectedId without calling seek. The ordinary saved-note action correctly pauses and seeks before selecting the note.
- **Required change:** On restore-and-select of a video note, use its bound mediaTimeSeconds and select it after the seek completes. Preserve the keepDraft conflict path and image behavior. Rebuild the distributed HTML in the implementation phase.
- **Validation:** Add a browser regression for delete, seek elsewhere, undo; repeat while playing. Assert paused=true, currentTime matches the restored note, the selected pin is visible, and export retains the original binding. Run the public video workflow test with PLAYWRIGHT_MCP_EXECUTABLE_PATH configured.

This blocks completion because Undo presents a saved comment against an unrelated visible moment. No scope creep or other missing requirement was found by the Spec axis.

## Runtime validation

Commands ran from the frozen source unless a different directory is stated. No build ran.

| Check | Observed result |
|---|---|
| bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/video-workflow.test.ts | Initial run failed because default /opt/google/chrome/chrome was absent. |
| env PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/video-workflow.test.ts | Passed: 1 test, 30 assertions. Real recording, public import, valid and invalid ranges, invalid timing/dimensions/hash, immutable PATCH timing, restart/export, and changed-source rejection. |
| Same environment; bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test | Passed: 2 tests, 146 assertions. |
| /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts doctor --driver playwright --json, from /tmp with installed browser environment | Passed. Actual owned WebM recording probe reported video available. |
| /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts doctor --driver tui --json, from /tmp | Initial run blocked: native binaries absent from default PATH. |
| Same TUI doctor with prepared native-tools/fedora-45-x86_64/bin on PATH | Passed. Native image prerequisite probe succeeded; video explicitly unavailable. |
| /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts serve /tmp/video-independent-review-5i7jOD/feedback --port 18879 --json | Served the actual committed HTML against a separate copy of historical feedback. Restart on the same port succeeded. |
| /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts export /tmp/video-independent-review-5i7jOD/feedback --json, from /tmp | Passed after restart. Saved independent note preserved timestamp 0.8086, displayed dimensions 621 × 349.3125, source hash, original 800 × 450 dimensions and point geometry. |
| Actual Chromium player at http://127.0.0.1:18879 | Decoded 800 × 450 video with duration 3.2 seconds. Red initial scene and blue final scene were visually inspected. Playback reached the blue end frame. Saved-note seeking, point creation, draft reload/reselection, durable save, service restart and reopening passed. Browser error log was empty. Undo mismatch reproduced as RV-01. |

Screenshots were inspected directly during review. They are temporary browser diagnostics, not a new sealed evidence run. Historical video-acceptance-0001 stayed unchanged. Runtime operations used /tmp/video-independent-review-5i7jOD/feedback. The real-recorder test used its own temporary resolved store and removed it.

## Limitations

- **Coverage boundary:** No GUI capture or Surf runtime was run in this review. The native TUI check used doctor, not a new full capture workflow.
- **Timing boundary:** Observed playback timestamps do not establish exact-frame accuracy or object tracking.
- **Test boundary:** Passing public tests do not cover the reproduced Undo UI transition.
- **Publication boundary:** No remote operation, source commit, fix, build, ticket write or projection write ran.

## Resources

Both review-axis results were independently read, hash-validated and acknowledged. Their owned terminals t140 and t141 were closed and removed. Both resource observers report shutdown=confirmed.

Owned feedback server PIDs 1253749 and 1262875 exited with code 0 after SIGTERM. Port 18879 is closed. The copied session writer lock is absent. The owned browser tab was closed; this browser context has no managed tabs. The reviewer terminal t13z remains for parent-owned closure after delivery.

## Authoritative inputs

- **Phase start:** workflows/collect-evidence-feedback-08-video/events/review-start-0004.yaml.
- **Implementation:** workflows/collect-evidence-feedback-08-video/events/implementation-0002.yaml and events/start-complete-0003.yaml.
- **Snapshot:** workflows/collect-evidence-feedback-08-video/artifacts/snapshots/pr-draft-implementation-0002.md.
- **Historical evidence:** workflows/collect-evidence-feedback-08-video/artifacts/evidence/video-acceptance-0001, read-only; only a temporary copy was served.
- **Specification:** The canonical ticket and initiative named above.
- **Context:** CONTEXT-MAP.md, CONTEXT.md, docs/agents/domain.md, docs/agents/issue-tracker.md and docs/adr/index.md.

## Axis totals

Standards: 0 blocking violations; 1 P3 smell judgment. Spec: 1 blocking P2 finding, RV-01.

