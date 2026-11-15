---
schema: worktree-review/v1
title: Independent video worktree review
type: Review
verdict: FAILURE
---

# Independent video worktree review

Review frozen video collection and timestamped feedback for the parent workflow owner.

Date: 2026-11-15T23:41:44.284Z. Reader: maintainer and parent review session. Verdict: FAILURE.

## Overview

STD-01 blocks approval: a valid long video comment expands the asset inspector beyond the viewport. Bound and wrap timestamp selection rows, then rebuild the distributed viewer. RV-01 undo restoration passed the new browser checks. No source change was made during this review.

Navigate: [Review identity and scope](#review-identity-and-scope), [Producer and consumer contracts](#producer-and-consumer-contracts), [Standards](#standards), [Spec](#spec), [Validation and limitations](#validation-and-limitations), [Concurrency and resources](#concurrency-and-resources).

## Review identity and scope

- **Ticket:** tracker/tickets/collect-evidence-feedback-08-video.md; full specification: tracker/initiatives/collect-evidence-feedback/index.md, stories 12, 13, 40 and shared invariants.
- **Source branch:** feature/collect-evidence-feedback-08-video; base branch: master.
- **Source commit:** 2f9a632c590a3b2a19a462415c31aa8f79e3fe36.
- **Source tree:** 5967c9f852f13696a5cdb514871481a26405d61c.
- **Review base:** 9dda756eaa8fa7766e384a13b8ce6ae92d7da198.
- **Diff command:** git diff 9dda756eaa8fa7766e384a13b8ce6ae92d7da198...2f9a632c590a3b2a19a462415c31aa8f79e3fe36.
- **Context checkout:** /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles. The source checkout is /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video.
- **Authority:** review-start-0010, attempt 2, follows fix-complete-0009 and fix-0008. The old review-review-0005 verdict covers an older source. It is not the current verdict.
- **Source cleanliness:** git status --porcelain=v1 returned no entries. HEAD and tree matched the frozen identities.

changed_scope contains exactly these 19 paths:

- **Path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/web.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/server.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/video-workflow.test.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/drafts.tsx`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/types.ts`.

## Producer and consumer contracts

The collector produces sealed media. Feedback imports verified bytes, serves registered media and stores source-bound notes. The bundled viewer consumes those same records.

- **Recording capability and playable media metadata:** doctor probes an owned Playwright recorder. Assets retain WebM format, timing, dimensions, driver provenance and source hash. Native optional-video limits remain explicit.
- **Source-bound timestamp annotations and drafts:** annotation creation accepts finite mediaTimeSeconds and positive displayedWidth/displayedHeight. Source identity and timing cannot change through PATCH. Drafts retain these bindings across reload.
- **HTTP byte-range media serving:** the registered-media route returns verified bytes, 206 ranges or 416 invalid-range results. Changed bytes reject serving and saves.
- **Bundled feedback viewer:** the committed HTML contains the player, timestamp selection, paused-frame annotation tools and undo seek. Startup does not rebuild it.

affected_contracts and integration_checks are copied without changes from phase-start into review-0011. No integration candidate or moving-base compatibility approval is part of this source review. NO ADR applies; the indexed Pi Ink trust-boundary ADR is unrelated.

## Standards

The independent Standards session inspected all 19 paths. It reported one documented-standard breach and one nonblocking naming heuristic.

### STD-01: Long video comments widen the inspector

- **Severity:** P2; blocking; open; NO ADR.
- **File and line:** [annotation-image.tsx:358](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx#L358).
- **Description:** The timestamp-note button renders the full comment without wrapping. DESIGN.md requires long content to wrap within its column. Actual bundled-browser smoke at 1400×1000 with a valid 780-character saved comment produced a 6176.234375 px button and a 6223 px asset inspector. The inspector and video expanded beyond the viewport. The comment did not remain within the inspector column.
- **Standard:** DESIGN.md Typography says, “Long model names, prompts, and metadata must wrap instead of widening a column.” Responsive Behavior says, “Allow long names and metadata to wrap within a column rather than forcing page-wide overflow.”
- **Cause:** the timestamp row uses the shared Button whitespace-nowrap and shrink-0 classes. It does not use the existing wrapping selection-row style.
- **Required_change:** Use a bounded, wrapping Base Nova selection row for timestamp notes. Preserve the full accessible comment and keyboard activation. Rebuild viewer/index.html.
- **Validation_command:** after seeding the same long saved video comment and opening its video in an owned Playwright session, run:

```sh
playwright-cli --raw run-code 'async page => { await page.setViewportSize({width:1400,height:1000}); const width = await page.locator(".asset-column").evaluate(e => e.getBoundingClientRect().width); if (width > 1400) throw Error("Video timestamp comments widen the inspector: " + width); }'
```

Repeat the visible check at 390×844. Keep normal horizontal column navigation; do not let one comment enlarge the column or video.

Judgement only: possible Mysterious Name at annotation-image.tsx:23,26. AnnotationImage now owns images and video. AnnotationMedia would be clearer. This is not a documented violation or blocker.

## Spec

The independent Spec session checked all changed paths against the complete ticket. It found no additional implementation defect or unasked feature. It initially reported SPEC-01, a verification gap in the permanent browser test.

### SPEC-01: Browser creation and draft reload coverage

- **Original severity:** P2; NO ADR; resolved by review validation, not a remaining blocker.
- **File and line:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/video-workflow.test.ts:73.
- **Requirement:** ticket: “Verify decoded content, the intended sequence and timestamped notes.” Initiative Testing Decisions 10: “Navigate between cases with an unfinished draft and reload the page. Check draft recovery.”
- **Description:** the permanent video test creates its note through HTTP and uses the browser for undo. It does not create or reload a video draft through the viewer.
- **Required_change proposed by axis:** Extend the bundled-browser workflow to draw and save a paused-frame note. Reload an unfinished video draft and verify its paused timestamp, geometry, displayed dimensions and source hash. Verify that these browser-created bindings survive restart and export.
- **Validation_command proposed by axis:** PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/video-workflow.test.ts
- **Parent assessment:** The parent exercised keyboard Point creation at 3.199 s, typed a draft, reloaded, reopened the video, observed recovery, saved it and compared all annotations after server restart. Timestamp 3.199, displayed dimensions 656×369, normalized geometry and source hash survived export. This closes the stated acceptance-verification gap. The permanent browser test does not cover this creation/reload path; added coverage remains a recommendation, not an unverified behavior blocker.

RV-01 is resolved for the reviewed source: undo while playing paused and sought to 3.199 s before selecting the restored pin. Reload and export retained its bound identity. Keep-draft restoration remains separate from saved-note selection.

## Validation and limitations

The axes ran no builds, lint, tests or formatters. The parent ran one scoped validation batch after both findings were available. No generated file was rebuilt.

```sh
PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts
```

Result: 2 pass, 28 skip, 0 fail, 146 expect calls; 30 tests across 3 files, 77.11 s. The real recorder/public HTTP/bundled-player video workflow passed. Native tests are opt-in and were skipped because RUN_NATIVE_EVIDENCE_TESTS was unset. This review does not claim new native-recorder or Surf verification.

The parent also served a private copy of retained video-undo-fix-0008 at http://127.0.0.1:49387. The current committed viewer ran in an owned Chromium tab at 1400×1000.

- **Decoded content:** 800×450, 3.2 s. At 0.8086 s, sampled RGBA was [241,20,22,255]. At 3.199 s, it was [21,20,241,255]. Screens showed the red scene followed by the blue final scene.
- **Undo restoration:** delete, seek Home, Play, then Undo deletion produced paused=true, seeking=false and time=3.199. The restored dialog reported revision 7. Reload retained the note.
- **Draft creation:** Point created a video draft at 3.199 s. Reload retained the comment. Reopening the video restored its timestamp. Save created ddd83db7-7581-44d0-96e6-a54e0df406f3, displayed dimensions 656×369 and normalized point [0.5,0.5,0,0].
- **Restart and export:** after service shutdown and restart on the same port, every exported annotation matched the pre-restart records. The browser-created note retained source hash b469d5b0dff38c729bbf6212a48ce1b9e402a44e1dbb84ea6c74fd64d0cb1659 and timestamp 3.199.
- **Overflow reproduction:** a valid saved comment repeated “Long timestamp note for layout review. ” twenty times. The button measured 6176.234375 px and the inspector 6223 px. The actual video and inspector extended beyond the viewport. This confirms STD-01; it is not an inferred visual risk.
- **Evidence limits:** the copied source video was historical. The scoped test exercised a new real recorder separately. Playback timestamps do not claim exact-frame accuracy or object tracking. No new evidence run was created or retained evidence modified.

## Concurrency and resources

User selected Authorize review ownership in parent session 01a1e184-62c5-7042-83aa-6a9dca7f1cc4. Fresh independent review only; no fixing or merging.

The canonical checkout remains authoritative. Coordination inventory is incomplete because of historical unrelated goal diagnostics and stale linked tracker copies. Direct prerequisites 02-tui,03-gui,05-pins were recorded complete. No concrete contested resource was identified. Unknown scopes are not claimed compatible. This review did not fix, merge, commit, push, mutate the tracker or change projections.

- **Standards session:** run 11f62cfc-6c71-4bff-aad9-c5d616b8f521, terminal t17q. Typed result verified and acknowledged. Terminal removed; resource observer confirmed shutdown.
- **Spec session:** run 5b31d7d4-e041-4bb7-9974-0bb7086324c9, terminal t17p. Typed result verified and acknowledged. Terminal removed; resource observer confirmed shutdown.
- **Browser resources:** both owned Chromium tabs were closed with kill=true. No borrowed browser or user terminal was closed.
- **Service resources:** owned server PIDs 3018568 and 3025521 received SIGTERM and exited 0. Port 49387 refused connections afterward. The copied session writer lock was absent. Temporary copied data was removed after checks.
- **Reviewer session:** run ee0e6ec2-efa1-4237-9e86-1f857de4e481, terminal t17k, remains live only to deliver this result. The parent owns its final shutdown observation.

Standards: one open P2 blocker and one naming heuristic. Spec: one coverage observation resolved by runtime verification, no remaining blocker. Overall verdict: FAILURE until STD-01 is fixed and independently reviewed on a new frozen source.

