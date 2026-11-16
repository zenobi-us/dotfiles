---
schema: worktree-review/v1
title: Independent video source review
type: Review
verdict: SUCCESS
---

# Independent video source review

Verdict: SUCCESS. No blocking finding remains. Review timestamp: 2026-11-16T04:07:14.968Z.

## Identity and authority

- Canonical ticket: tracker/tickets/collect-evidence-feedback-08-video.md. Full specification: tracker/initiatives/collect-evidence-feedback/index.md, including all common implementation and testing decisions, not only stories 12, 13 and 40.
- Source branch: feature/collect-evidence-feedback-08-video; base branch: master.
- Source commit: 5b639183c884d2ee6061860609cbc6c7a09633c3; source tree: c4a3c3d56c8a6c39e97c89a87673e3caa7cf9638.
- review_base_commit: 30cb456ac6ae9977b337656b11675e259effaf5e.
- Source workspace: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-08-video. Canonical context checkout: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.
- Diff: git diff 30cb456ac6ae9977b337656b11675e259effaf5e...5b639183c884d2ee6061860609cbc6c7a09633c3. Commits: 479f8301 recording probes; 2a14e32e video notes; 2f9a632c undo seek; 5b639183 wrapping.
- Authority: review-start-0016, attempt 3, parent fix-complete-0015. Parent herdr-core-t186 owns workflow and source. Reviewer run 42d278bb-e7f5-46d9-9e76-82b0f5bbdcb7, terminal t18v.
- Source check returned no porcelain entries, then the exact frozen commit and tree. Git common directory: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/.git. No edits, commit, rebuild, merge or rebase occurred.

## Specification under review

Preserve retained web recording. Add native recording only when a supported recorder and permission exist. Doctor reports actual capability. Real playable media retains format, timing, dimensions, driver provenance and source hash. Optional-video failure records its reason and retains valid image evidence; required image prerequisites remain blocking.

The viewer must play registered video. A paused timestamp note binds comment, geometry and displayed frame dimensions to unchanged source media. Save, reload, restart and export retain timing and source identity. Do not claim tracking or exact-frame accuracy. Exercise an actual recorder, decoded sequence, browser notes and explicit unsupported-driver path.

Shared requirements apply: installed public CLIs; resolved stores; immutable versioned records; stable IDs and hashes; atomic revision-checked saves; draft recovery; delete/undo; guarded export; loopback registered-media service; ownership-safe cleanup; DESIGN.md; bundled React/Base Nova and fonts; keyboard focus; wrapping inspector columns and narrow-screen horizontal navigation. No new permanent tests are required solely to duplicate proved public-surface acceptance.

## Full changed scope

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

## Producer and consumer contracts

- recording capability and playable media metadata: collector doctor probes an owned WebM recorder; asset metadata preserves recording start, format, duration, dimensions, provenance and SHA-256. Optional unsupported native video remains explicit.
- source-bound timestamp annotations and drafts: validator accepts registered WebM with finite in-duration timestamps and positive displayed dimensions; source/timing bindings remain immutable through PATCH. Drafts preserve the same fields.
- HTTP byte-range media serving: verified registered bytes support full and single-range responses; malformed or unsatisfiable ranges return 416. No arbitrary file route is added.
- bundled feedback viewer: image/video share the existing annotation path; paused notes, keyboard timestamp selection and undo seek use the committed single HTML distribution.

The receipt preserves changed_scope, affected_contracts and integration_checks exactly from review-start-0016. No integration candidate or moving-base compatibility approval is included. NO ADR applies. The only indexed Pi Ink cleanup ADR is unrelated.

## Standards

No documented-standard breaches found in the 19 product paths. The changes retain the existing driver, annotation, draft, revision and source-validation paths. Distribution versions agree, and the viewer remains prebuilt with bundled fonts and Base Nova buttons. One nonblocking naming heuristic remains (STD-01). The public workflow test exercises recorder output, byte ranges, timestamp binding, browser undo, restart and tampered media. No new permanent-test requirement is raised. This was a static review; no runtime result is claimed.

### STD-H01 — nonblocking naming heuristic

P3; NO ADR. File: mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx:23-27. main.tsx:51 routes both images and WebM through AnnotationImage. Its name does not describe its full media role. This is a Fowler Mysterious Name heuristic, not a documented standard breach. No required change. An optional future rename can use AnnotationMedia and annotation-media.tsx. Validate by checking that caller and component naming remain aligned. The axis used STD-01 for this heuristic; this review uses STD-H01 so it cannot reopen the old wrapping defect.

Standards sources: source DESIGN.md; loaded repository instructions; canonical CONTEXT-MAP.md, CONTEXT.md, docs/agents/domain.md and initiative design/distribution decisions. All 12 supplied Fowler smells were considered as heuristics only.

## Spec

No actionable specification findings in the 19-path slice. No missing requirement, wrong implementation or scope creep established. Read the complete canonical ticket and initiative, including common schema, command, storage, safety and public-testing rules.

The ticket requires “Report actual video capabilities through doctor” and “keep valid image evidence.” collect-evidence/scripts/browser-evidence/pipeline.ts:101-127 probes an owned recorder and reports optional command/output failure separately. drivers/playwright-driver.ts:279-304 retains recording-start provenance and command diagnostics. Existing records.ts:572-604 binds media format, dimensions, timing and hash.

The ticket requires notes bound to “a paused timestamp and displayed frame dimensions.” collect-feedback/viewer/src/components/annotation-image.tsx:167-176,326-358 captures that binding and guards playback. Its lines 242-245 restore the saved video moment on undo. scripts/collect-feedback/annotations.ts:119-137 validates the binding; lines 44-68 preserve it through edits and tombstones. server.ts:83-103 serves only verified registered bytes, including ranges. drafts.tsx:14-40 retains timestamp fields through recovery.

The public video workflow covers real recording, ranges, bound notes, undo, restart/export and changed-source rejection. Canonical fix-complete-0015 records actual rebuilt desktop/mobile playback evidence. Accept the caller-confirmed SPEC-01 draft/restart resolution; no duplicate permanent test requested.

NO ADR. Only the unrelated Pi Ink decision is indexed.

Spec findings: none. Prior SPEC-01 is resolved by the retained actual-browser creation, draft-reload, restart and export evidence in review-0011. It is not a new test requirement. RV-01 remains resolved by fresh undo-while-playing verification below. Historical STD-01 wrapping is resolved by the fresh desktop/mobile observations below.

## Axis transport and concurrency

Both axes ran in fresh parallel herdr-app/omp tabs at depth 2 in the source workspace. Each inspected the exact 19-path scope and ran no build, lint, tests or formatter. Their separate typed reports remain in immutable transport records:

- standards: file:///var/home/zenobius/.local/state/result-delivery/runs/2d0ac77d-1940-47a0-b861-07a9029cef6e/result.json; run 2d0ac77d-1940-47a0-b861-07a9029cef6e; SHA-256 245d19127cc7dfdb34e0c277638d0ef1a61a2612c87ccbcc8b16aba27fa58dff; terminal t18x.
- spec: file:///var/home/zenobius/.local/state/result-delivery/runs/69116a67-12ae-4806-a3d2-f0d8fb2163fa/result.json; run 69116a67-12ae-4806-a3d2-f0d8fb2163fa; SHA-256 7405280391071bad485010ac10caffa81acc600b4ce0863f2c731e272e65c0ac; terminal t18y.

The delivery reader verified schema, run, operation and hash. The reviewer checked source commit and exact ordered scope before acknowledgement. Both acknowledgements succeeded. Both terminals were killed and removed; herdr-app ls showed neither terminal. The first terminal close left suspended owned omp processes. The reviewer sent TERM to the recorded owned identities, then CONT to release their suspended state. Final resources observations report confirmed shutdown for both runs. No unrelated process was stopped.

Coordination assessment from phase-start: {"inventory_complete":false,"proposed_reservations":[],"ownership":"Canonical owner is herdr-core-t186, this same active parent session. It holds the user-authorized fix ownership and the user now explicitly requests review. Prior fixer t189 removed, shutdown confirmed. No terminal in source workspace.","direct_prerequisites":"Canonical dependency graph and tracker schema check pass. 02-tui, 03-gui and 05-pins completed.","hazards":"Inventory reports stale linked tracker copies and unrelated malformed historical goal events. No reservation for this ticket and no observed path overlaps. Unknown unrelated scopes not asserted compatible. Review frozen source read-only, no integration. Use unique owned temporary browser/service resources.","canonical_context":"/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles"}

Inventory remains incomplete because of stale linked tracker copies and unrelated historical goal diagnostics. Unknown unrelated scopes are not asserted compatible. Review stayed read-only against frozen source, with unique temporary stores and explicit port 49217. No integration or ownership claim occurred.

## Measured checks

The reviewer imported the historical real Playwright run from workflows/collect-evidence-feedback-08-video/artifacts/evidence/video-undo-fix-0008/source into a new temporary repository and resolved feedback store. Original capture start: 2026-11-14T23:38:31.873Z. Registered video capture: 2026-11-14T23:38:32.938Z. Asset sequence.video.capture-001; SHA-256 b469d5b0dff38c729bbf6212a48ce1b9e402a44e1dbb84ea6c74fd64d0cb1659. This is historical media, not a fresh capture or proof of current recorder execution. Original sealed evidence was not changed.

Public init and serve succeeded from /tmp. Actual Chromium loaded the committed bundled viewer without a build. Decoded video: 800 × 450, duration 3.2 seconds. At 0.800 s, the observed frame read RED: initial scene and pixel (5,5) was [241,20,22,255]. At 3.200 s, it read BLUE: final scene and pixel was [21,20,241,255]. Screenshots were observed, not inferred from DOM.

The reviewer used keyboard Point creation at paused 3.200 s, saved through the viewer, edited the comment to exactly 780 characters and saved revision 2. The entire timestamp row accessible name equals the timestamp prefix plus the full saved comment. Enter activated the note at both sizes, paused and sought playback, and selected a visible pin.

| Viewport | Inspector width | Row width | Row client / scroll | Paused | Timestamp | Selected pin |
|---|---:|---:|---|---|---:|---|
| 1400 × 1000 | 760 | 713 | 711 / 711 | true | 3.2 s | true |
| 390 × 844 | 390 | 343 | 341 / 341 | true | 3.2 s | true |

Actual screenshots: /tmp/omp-sshots-15cfeeda455611a2.webp (desktop), /tmp/omp-sshots-15cfeedaf79611a3.webp (mobile). Both show wrapping within the inspector, not a widened column. These are local review screenshots, not a new sealed evidence run.

Undo while playing returned paused=true, seeking=false, time=3.2 and selectedPin=true. Export retained annotation ID def8bac2-70e2-47de-ba2b-75e67f95364d, source hash, timestamp 3.2, displayed dimensions 656 × 369, normalized point {x:0.5,y:0.5,width:0,height:0}, original dimensions 800 × 450 and deletedAt=null. Reload retained the 780-character comment and bindings. After SIGTERM and same-port restart, exported annotations were byte-for-byte JSON-equivalent.

Owned server PIDs 3596631 and 3624010 exited 0. Owned browser PID 3598681 and its observed descendants stopped. Browser tab closed. Port 49217 refused connection; writer lock absent. Temporary resolved store removed after the service stopped. Reviewer terminal t18v remains for the parent to close; full reviewer-run shutdown is therefore pending parent closure.

## Limitations and verdict

No permanent test, build, typecheck, lint, formatter or native-driver batch was run by this review. The parent owns the one scoped video-workflow.test.ts run after this result. Earlier typecheck/build and 30 assertions in fix-0014 are prior evidence, not these checks. No fresh recorder, native recorder or Surf runtime claim is made here. No exact-frame, object-tracking or integration compatibility claim is made.

Standards: zero documented breaches; one P3 heuristic. Spec: zero findings. SUCCESS applies only to the frozen source commit/tree above. Parent owns receipt acceptance, scoped validation, tracker comment, publication and terminal closure.

