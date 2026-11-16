## Current review review-0017

Verdict: SUCCESS for source `5b639183c884d2ee6061860609cbc6c7a09633c3`, tree `c4a3c3d56c8a6c39e97c89a87673e3caa7cf9638`. Review base: `30cb456ac6ae9977b337656b11675e259effaf5e`.

[Immutable review](../artifacts/reviews/review-review-0017.md), [result](../events/review-0017.yaml), and [parent completion](../events/review-complete-0018.yaml) record two independent axes. No blocking findings remain. STD-H01 is a nonblocking naming heuristic. STD-01 and RV-01 passed fresh browser checks.

The parent ran `video-workflow.test.ts`: 1 pass, 0 fail, 30 expectations. Independent browser checks passed long-comment wrapping and keyboard selection at desktop/mobile sizes, decoded red/blue video, undo while playing, reload, restart and export. Source stayed unchanged.

Delivery acknowledged. Review and axis terminals closed. Owned-resource shutdown confirmed. Ticket comment records the exact verdict and source. No merge or push. Next action from the shared inspector: finish, because SUCCESS matches the current clean source. Finish still requires its safety mapping and integration checks.

## Retained implementation and review history

## Parent completion fix-complete-0015

[Verified completion](../events/fix-complete-0015.yaml) records matched authoritative delivery, inspected desktop/mobile screenshots, confirmed shutdown of all 27 owned processes, and closed terminal t189. Source remains frozen at 5b639183c884d2ee6061860609cbc6c7a09633c3. Ticket remains claimed; no merge or push. Next: fresh review because source changed.

# Fix fix-0014 — bounded timestamp notes

Ticket: tracker/tickets/collect-evidence-feedback-08-video.md. Source: 5b639183c884d2ee6061860609cbc6c7a09633c3; tree c4a3c3d56c8a6c39e97c89a87673e3caa7cf9638. Branch: feature/collect-evidence-feedback-08-video; base: master.

## Problem and implementation

STD-01: long timestamp comments widened the inspector. Reuse the existing Base Nova selection-list/selection-row pattern, retain the full comment and native button keyboard activation, and expose selected state. Rebuilt distributed viewer/index.html. No rename or undo-path change.

## Changed files

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/video-workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx

Bundle metadata changed through the repository commit hook.

## Validation

- Viewer typecheck and build passed; 345671-byte embedded HTML.
- Existing real video workflow: 1 pass, 0 fail, 30 expectations. Regression covers long-comment wrapping and Enter selection at 1400×1000 and 390×844, retaining undo/restart/range checks.
- Actual rebuilt browser: full 780-character saved comment; desktop inspector 760px, row 713px, row client/scroll 711/711px. Mobile inspector 390px, row 343px, row client/scroll 341/341px.
- Both keyboard selections paused and sought to 3.199s, selected the pin and decoded real 800×450 video. Displayed player: 656×369 desktop and 286×161 mobile; sampled blue pixel [20,20,241,255].
- Mobile ArrowLeft returned focus to the originating video asset and revealed Cases at x=0; Enter reopened inspector. Horizontal column navigation remains intact.
- Public feedback validate passed. React Doctor: 66/100, two existing warnings at unchanged lines 82/86; no unrelated refactor.

## Review history and findings

Consumed [review-0011](../events/review-0011.yaml), [review artifact](../artifacts/reviews/review-review-0011.md). Latest formal verdict remains FAILURE for old source 2f9a632; it does not cover this commit. STD-01 resolved by this fix; SPEC-01 already resolved by review validation; RV-01 remains resolved. No unresolved blocking findings. New independent review required.

Earlier history: implementation-0002; review-0005 (FAILURE, RV-01); fix-0008 (RV-01 resolved); review-0011 (FAILURE, STD-01). Earlier records remain unchanged.

## Evidence and shutdown

[Observations](../artifacts/evidence/video-wrap-fix-0014/observations.json), [desktop](../artifacts/evidence/video-wrap-fix-0014/desktop.png), [mobile](../artifacts/evidence/video-wrap-fix-0014/mobile.png), [resource observations](../artifacts/evidence/video-wrap-fix-0014/resources-after.json).

Historical real recording imported unchanged from video-undo-fix-0008/source. These are new viewer screenshots, not a new recording. Browser closed; owned service PID 3386250 exited 0; port 49184 closed and writer lock absent. Port 43147 startup failed because occupied; unrelated listener preserved. Parent owns child terminal closure and final all-process shutdown observation.

## Status and supporting records

Ticket remains claimed. Not merged, rebased, pushed or submitted. No unresolved implementation questions. [Fix result](../events/fix-0014.yaml), [authorization](../events/fix-start-0013.yaml), [earlier fix](../events/fix-0008.yaml), [implementation](../events/implementation-0002.yaml).

# Retained history

## Current review review-0011

Verdict: FAILURE for source `2f9a632c590a3b2a19a462415c31aa8f79e3fe36`, tree `5967c9f852f13696a5cdb514871481a26405d61c`; base `9dda756eaa8fa7766e384a13b8ce6ae92d7da198`. Branch: `feature/collect-evidence-feedback-08-video`; base branch: `master`.

[Immutable review](../artifacts/reviews/review-review-0011.md) and [review result](../events/review-0011.yaml) record STD-01 as the only open blocker. RV-01 passed independent browser validation. SPEC-01 was closed by review-time browser creation, draft reload, restart and export checks. Full findings remain in the immutable review.

Validation: reviewer batch passed 2 tests and 146 assertions; 28 native opt-in tests skipped. Actual bundled-browser checks passed decoded red/blue sequence, paused undo, draft recovery and restart/export. Long-comment layout failed. Parent independently passed the configured real-recorder/browser public workflow (1 test, 30 assertions), doctor recording probe, and retained WebM decode. The unconfigured browser attempts failed because `/opt/google/chrome/chrome` is absent; configured Chromium passed.

No merge or push. Source unchanged. Review delivery acknowledged; reviewer and axis terminals closed; owned-resource shutdown confirmed. [Parent completion](../events/review-complete-0012.yaml). Next: fix current STD-01, then request a fresh review.

## Retained implementation and review history

## Parent completion fix-complete-0009

[Verified completion](../events/fix-complete-0009.yaml) records accepted delivery, inspected screenshots, valid retained feedback, closed terminal t14c and confirmed owned-resource shutdown. Source remains clean at 2f9a632c590a3b2a19a462415c31aa8f79e3fe36. Next: fresh independent review; no merge or push.

# Current fix status

## Fix fix-0008 — current source

Ticket: tracker/tickets/collect-evidence-feedback-08-video.md.
Source: 2f9a632c590a3b2a19a462415c31aa8f79e3fe36; tree 5967c9f852f13696a5cdb514871481a26405d61c. Branch: feature/collect-evidence-feedback-08-video. Base: master.

### Problem and fix

RV-01 restored selectedId without moving the video. Restore-and-select now uses the acknowledged note timestamp through the existing pause/seek path. The seeked event selects the pin. The keepDraft branch and image branch retain their existing behavior. The distributed viewer was rebuilt.

### Changed files

- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/video-workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx
- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json

### Validation

- mise exec -- bun run typecheck, from viewer/: passed.
- mise exec -- bun run build, from viewer/: passed; 345569-byte single HTML bundle.
- PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test: 2 passed, 0 failed, 146 assertions. This includes the new actual-browser undo regression while paused and playing, plus existing image and keepDraft conflict scenarios.
- Actual rebuilt browser player at http://127.0.0.1:18883: delete blue at 3.199s, select red at 0.8086s, close editor, undo. Both paused and playing cases returned paused=true, currentTime=3.199 and visible selected pin. Export retained original source hash, timestamp, dimensions and geometry.
- Public feedback validate: passed for video-undo-fix-0008. Historical video-acceptance-0001 stayed unchanged.
- React Doctor changed scope: 66/100; two existing warnings in unchanged seek/draft-effect lines (state adjustment and effect dependencies). No unrelated refactor.

### Review history and findings

Latest formal verdict remains FAILURE from review-0005, covering the previous source 2a14e32edcca02dc297cfd61c30e566982ec0b7c. That verdict is stale for the new source. RV-01 is fixed; no blocking findings remain unresolved by this fixer. ST-01 remains a non-blocking suggestion outside this fix. A fresh independent review is required. No SUCCESS verdict is claimed.

### Merge and resources

Not merged, rebased, submitted or pushed. Ticket remains claimed. Owned browser PID 1447649 and service PID 1444481 stopped; port 18883 closed and writer lock absent. Parent owns terminal t14c closure and phase completion.

### Supporting records

- [Fix result](../events/fix-0008.yaml)
- [Fix authorization](../events/fix-start-0007.yaml)
- [Consumed review](../artifacts/reviews/review-review-0005.md)
- [Observations](../artifacts/evidence/video-undo-fix-0008/observations.json)
- [Paused undo screenshot](../artifacts/evidence/video-undo-fix-0008/paused-undo-blue.webp)
- [Playing undo screenshot](../artifacts/evidence/video-undo-fix-0008/playing-undo-blue.webp)
- [Export](../artifacts/evidence/video-undo-fix-0008/export.json)
- [Shutdown](../artifacts/evidence/video-undo-fix-0008/resources-after.json)

### Limitations

Playback timestamps do not establish exact frames or object tracking. No new Surf or native recording coverage. An initial custom smoke harness timed out; direct browser actions completed both scenarios. No open implementation questions.

# Retained implementation and review history

# Video evidence and timestamp feedback

Ticket: tracker/tickets/collect-evidence-feedback-08-video.md

## Problem

Doctor advertised recording without probing it. Feedback displayed video but accepted image notes only. The browser also could not seek reliably without byte ranges.

## Implementation

Preserve the existing real Playwright WebM recorder; probe actual recording capability and record start time. Extend the existing annotation path to immutable timestamp-bound video notes and displayed frame dimensions. Add verified byte-range media responses for browser seeking. Retain image behavior, drafts, conflicts, tombstones and export. Rebuild the distributed single HTML viewer.

Source: feature/collect-evidence-feedback-08-video at 2a14e32edcca02dc297cfd61c30e566982ec0b7c, tree 16676d6137a329fb7cde2a7d457df1f438f4c208. Base: master. Source workspace remains available and clean. Bundle metadata changes came from the required commit hook.

## Changed files

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/web.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/server.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/video-workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/drafts.tsx
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts

## Validation

- bun run typecheck — TypeScript typecheck passed.
- bun run build — Final single HTML bundle built: 345505 bytes, embedded React/CSS/fonts.
- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test — 103 passed, 32 skipped, 0 failed; 1040 assertions. Optional driver suites were then exercised separately. Final metadata/accessible-label adjustment was checked with a rebuilt actual browser surface.
- bun test --test-name-pattern playwright: capture /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts — 1 passed; real image capture, assertions, safety, sealing and read-only consumers; 28 assertions.
- bun test --test-name-pattern native sparse text /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts — 1 passed; 12 assertions. Real terminal images remain valid with video requested and explicit native-video-unavailable limit.
- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts — 1 passed; 60 assertions. Native image-only fixture visually inspected. Optional video unavailable; permission, identity, capture and scope failures preserved.
- /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts doctor --driver playwright --json — Actual owned WebM recording start/stop probe reported video available.
- ffmpeg -v error -i /tmp/ce-video-0dBCF5/repository/workflows/video/artifacts/evidence/recording/cases/sequence/media/step-001-case-recording--capture-001.webm -f null - — Real 800x450, 3.2 second WebM decoded. Browser pixels and headings showed red initial and blue final scenes.
- Actual bundled browser player at http://127.0.0.1:18871 — Playback and keyboard seeking; drawn paused box at 0.8086s; draft reload; durable save; edited note at 3.199s; restart; saved timestamp navigation; export identities/geometry preserved. Final bundle also opened saved note and created/cancelled keyboard point.
- /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/collect-evidence-feedback-08-video/artifacts/evidence/video-acceptance-0001/capture --json — Exit 0; source validation and saved export comparison succeeded.
- /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/collect-evidence-feedback-08-video/artifacts/evidence/video-acceptance-0001/feedback --json — Exit 0; source validation and saved export comparison succeeded.
- /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts export /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/collect-evidence-feedback-08-video/artifacts/evidence/video-acceptance-0001/feedback --json — Exit 0; source validation and saved export comparison succeeded.
- /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts doctor --driver surf --json — Unavailable coverage: Surf native-host socket /tmp/surf.sock absent. No Surf capture or passing Surf acceptance claimed.

## Review history

Review review-0005: FAILURE at 2026-11-15T04:03:13.575Z. Open finding: RV-01. No findings resolved. See [review artifact](../artifacts/reviews/review-review-0005.md), [result receipt](../events/review-0005.yaml), and [parent completion](../events/review-complete-0006.yaml). Source remains unchanged; fix is required before another review.

## Merge status

Not merged, submitted or pushed. The canonical ticket remains claimed.

## Limits and cleanup

Surf capture remains blocked by its absent native-host socket. Native video remains unavailable. Playback notes do not promise exact frames or object tracking. All owned capture, GUI fixture and feedback services stopped. Browser tabs closed. Port 18871 closed and writer lock absent. Unrelated context changes remain unstaged.

## Supporting records

- [Phase start](../events/start-0001.yaml)
- [Implementation result](../events/implementation-0002.yaml)
- [Acceptance observations](../artifacts/evidence/video-acceptance-0001/observations.json)
- [Final bundle smoke](../artifacts/evidence/video-acceptance-0001/final-bundle-smoke.json)
- [Saved export](../artifacts/evidence/video-acceptance-0001/export.json)
- [Shutdown observation](../artifacts/evidence/video-acceptance-0001/resources-final-bundle-after.json)

## Open questions

None.

