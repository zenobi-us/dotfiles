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

No formal review started. No reviewer verdict exists. No resolved or remaining review findings exist. The parent must start an independent review of this exact source commit.

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

