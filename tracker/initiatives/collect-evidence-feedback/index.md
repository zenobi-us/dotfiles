---
id: collect-evidence-feedback
schema: tracker-initiative/v1
title: Collect native evidence and persistent visual feedback
type: Index
---

# Collect native evidence and persistent visual feedback

## Problem Statement

The current evidence skill focuses on web browsers. TUI and GUI collection use separate procedures and records. This makes captures difficult to compare and reuse.

Earlier TUI captures did not match the user's display. Some captures lost colour or damaged line spacing. A text assertion could identify the intended screen while the captured terminal still showed an earlier frame. A report must not present these images as accurate visual proof.

The current feedback process makes the user expand controls and select dropdown values. The user wants to mark an image directly, write a comment beside the mark, and select a coloured priority badge.

Evidence also needs clear ownership, consistent names, versioned records and durable feedback. Collection must not cause remote Git credential prompts, approve unintended actions, overwrite earlier captures or close the user's sessions.

## Solution

Create collect-evidence as the common evidence skill. Refactor the existing browser-acceptance-evidence skill into it. Keep the existing typed browser plan and driver model. Add reference driver playbooks for web, TUI and GUI collection. Capture native images. Record video when the selected driver and permissions support it.

Create the user-invocable collect-feedback skill. It selects the correct collector playbook, creates a feedback session, copies and validates the selected immutable evidence, and starts a local feedback server.

Use the approved Option A interface. The user draws a box or places a point pin on an image. A comment editor opens beside the pin. Labelled P1 Blocker, P2 Friction and P3 Polish badges replace the severity dropdown. Saved comments remain available after a page reload or server restart.

Use mise shebang Bun CLIs built with CrustJS. Build the feedback interface into one HTML file before distribution. Follow DESIGN.md. Keep evidence and feedback in the existing shared-context evidence store. Do not add a second routing configuration or a second capture model.

## User Stories

1. As an agent, I want to use one evidence skill for web, TUI and GUI work, so that I can use one evidence contract.
2. As an agent, I want to select a driver playbook from the requested surface, so that I can use the correct capture tools.
3. As an agent, I want to check required tools and permissions before collection, so that I can stop before an unsafe or incomplete run.
4. As an agent, I want to use the existing typed browser plan, so that I do not maintain separate human and executable instructions.
5. As an reviewer, I want to see the purpose and steps for each case, so that I can understand how each screen is used.
6. As an reviewer, I want to see the expected and observed result for each step, so that I can distinguish an observation from a verified result.
7. As an reviewer, I want to see native TUI screenshots with correct colour and line spacing, so that I can compare them with my terminal.
8. As an agent, I want to control and capture the same terminal session, so that I can prove which session produced each image.
9. As an agent, I want to wait for the visible screen before capture, so that I do not record an earlier screen.
10. As an reviewer, I want to see the browser URL, viewport and capture details, so that I can reproduce a web case.
11. As an agent, I want to capture a selected GUI window or display, so that I can keep collection within the approved scope.
12. As an reviewer, I want to play a real recording when the driver supports video, so that I can inspect a sequence of actions.
13. As an reviewer, I want to see an explicit video limitation when recording is unavailable, so that I do not mistake a still image for a recording.
14. As an agent, I want to store runs and cases in one consistent structure, so that I can find and process evidence without custom rules.
15. As an agent, I want to use stable run, case, step and asset IDs, so that I can change labels without breaking references.
16. As an reviewer, I want to see the capture time, tool version and source image hash, so that I can identify the exact evidence under review.
17. As an agent, I want to keep retries as separate captures, so that I do not overwrite earlier evidence.
18. As an reviewer, I want to see capture failures separately from assertion failures, so that I do not mistake a screenshot for proof of success.
19. As an agent, I want to stop when a credential prompt or an unapproved confirmation appears, so that I do not enter secrets or approve an unintended action.
20. As an operator, I want to collect evidence without remote Git operations, so that I do not receive unexpected GitHub credential prompts.
21. As an operator, I want to retain terminal sessions and windows that collection did not create, so that I do not lose my work during cleanup.
22. As an agent, I want to finalize captures outside an active watched source tree, so that I do not cause reloads while I collect evidence.
23. As an user, I want to invoke collect-feedback for a requested workflow, so that I can obtain evidence and a feedback page through one workflow.
24. As an user, I want to reuse an explicitly selected historical evidence run, so that I can review it without pretending it shows the current application.
25. As an user, I want to browse a session, case and asset in inspector columns, so that I can keep the current evidence in view.
26. As an user, I want to draw a box on an image, so that I can identify the exact area that needs a change.
27. As an user, I want to place a point pin on an image, so that I can comment on a small target without drawing a box.
28. As an user, I want to write a comment beside its pin, so that I do not need to expand a separate feedback form.
29. As an user, I want to select labelled P1, P2 and P3 colour badges, so that I do not need a severity dropdown.
30. As an user, I want to create and adjust annotations with the keyboard, so that I can provide feedback without a pointing device.
31. As an user, I want to cancel a draft or save it with a keyboard shortcut, so that I can control the comment editor quickly.
32. As an user, I want to retain drafts when I change an asset or reload the page, so that I do not lose unfinished comments.
33. As an user, I want to see Saved only after the server confirms the write, so that I can distinguish a saved note from a draft.
34. As an user, I want to keep my draft after a failed save, so that I can retry without writing the comment again.
35. As an user, I want to edit a saved comment, so that I can correct my feedback.
36. As an user, I want to delete an annotation and undo the deletion, so that I can recover from an accidental deletion.
37. As an user, I want to open a saved annotation without making it dirty, so that I can inspect notes without blocking navigation or export.
38. As an user, I want to keep annotations attached while I zoom, pan or resize the page, so that I can inspect small details without moving their targets.
39. As an user, I want to keep the selected pin visible beside the comment editor, so that I can compare my comment with its target.
40. As an user, I want to attach a video comment to a paused timestamp, so that I can identify the relevant moment.
41. As an reviewer, I want to export comments with asset IDs, hashes and image coordinates, so that I can act on the feedback without guessing its target.
42. As an user, I want to resolve unfinished drafts before a complete export, so that I do not silently omit feedback.
43. As an user, I want to receive a conflict message when another editor changes a note, so that I do not overwrite newer feedback.
44. As an user, I want to receive an error when the source asset changes, so that I do not attach a comment to the wrong image.
45. As an operator, I want to serve feedback on an explicit loopback port, so that I can control access without exposing a general file server.
46. As an operator, I want to reject cross-origin writes and unsafe asset paths, so that I can keep local feedback and files private.
47. As an user, I want to use the style from DESIGN.md, so that I can use a compact and consistent feedback interface.
48. As an user, I want to use a page with its scripts, styles and fonts bundled, so that I do not need a CDN or a frontend build at server startup.
49. As an developer, I want to run the installed CLIs from another directory, so that I do not depend on the current repository directory.
50. As an agent, I want to receive versioned JSON output and clear exit codes, so that I can distinguish failure, invalid input and a blocked prerequisite.
51. As an developer, I want to validate evidence and feedback through public commands, so that I can detect broken references before a report or export.
52. As an reviewer, I want to read reports that consume the same evidence records, so that I do not receive a second conflicting account of the run.
53. As an maintainer, I want to replace the old browser-only skill and migrate its active callers, so that I do not maintain two capture conventions.
54. As an maintainer, I want to keep earlier reports and user feedback unchanged, so that I do not lose the record of earlier work.

## Implementation Decisions

### Skill ownership

1. Replace browser-acceptance-evidence with collect-evidence. Migrate all active skill links, commands and callers. Remove the obsolete skill and its active aliases after the cutover. Preserve historical artifacts.
2. Add collect-feedback with user-invocable set to true. It owns feedback session setup, evidence selection, annotation service startup, validation and export. It invokes collect-evidence rather than implementing a second capture system.
3. Give collect-evidence reference playbooks for web, TUI and GUI drivers. Keep the main skill focused on the common procedure and contracts. Put driver commands and platform limits in the playbooks.
4. Keep one authored typed plan. Generate the executable plan, human procedure and report records from it. Reuse the current browser Plan and Driver boundaries where they fit.
5. Make writing-reports a read-only consumer of the common evidence contract. Do not give it another capture implementation or annotation database.
6. Update the skill authoring rules to permit the schema and user-invocable frontmatter fields used by these skills. Update affected references with the same cutover.

### Commands and execution

7. Use executable mise shebang Bun entrypoints and versioned CrustJS imports. Follow the existing command structure. Resolve resources relative to the installed skill, not the caller's current directory.
8. Expose collect-evidence commands doctor, init, render, compile, run, validate and report. Keep browser plan compilation and driver execution separate from verdict evaluation.
9. Expose collect-feedback commands init, serve, validate and export. The direct serve entrypoint and the serve subcommand must use the same CrustJS command definition and server implementation.
10. Use Bun.serve for the feedback HTTP API. A static file server alone cannot save annotations.
11. Support help, version, machine-readable JSON, plain output, quiet output, no colour and non-interactive operation where applicable. Honour NO_COLOR and TERM=dumb. Keep machine-readable results on stdout. Send progress and diagnostics to stderr.
12. Give flags precedence over documented non-secret environment defaults. Keep store selection in shared-context. Do not add a separate store configuration system.
13. Keep dry-run free of driver execution and writes. Allow force only for explicitly selected generated outputs. It must not override permissions, scope approval, asset hashes, schema checks or edit conflicts.
14. Use exit code 0 for a completed command, 1 for a failed operation, 2 for invalid arguments or schemas, and 3 for a blocked required prerequisite. An unavailable optional video feature does not fail an otherwise complete image case.
15. On Ctrl-C or SIGTERM, stop new work, finish or fail pending saves explicitly, and release owned resources. Do not claim that an interrupted operation completed.
16. Do not run remote Git commands, commit, push or open credential dialogs during capture or serving. A first Bun dependency installation can require network access. Report that setup requirement separately from capture and publication.

### Records, identity and storage

17. Resolve evidence stores through shared-context from the repository in scope. Use the existing evidence route for both evidence runs and feedback sessions. Use separate stable IDs. Do not invent a feedback resolver or assume that evidence must be outside the repository.
18. Collect temporary media outside an active watched source tree. Finalize it into the resolved evidence store after collection. Report an incomplete finalization rather than presenting a partial run as sealed evidence.
19. Use schema collect-evidence/v1 on each first-party evidence JSON file and JSONL record. Use a kind field to distinguish run, plan, case, asset, event and error records. Use the same schema in the frontmatter of the skill's owned Markdown records and documents.
20. Use schema collect-feedback/v1 on each first-party feedback JSON file and JSONL record. Use kind to distinguish session, case, annotation and other record roles. Use the same schema in the frontmatter of its owned Markdown records and documents.
21. Preserve third-party originals and tool-native output bytes. Put JSON diagnostics that need the common contract in a versioned envelope. Do not rewrite third-party data to insert the skill's schema field.
22. Give each run and case a manifest and human-readable notes. Give each case ordered steps, events and media. Give each feedback case immutable media copies and separate annotation records. Generate indexes and notes from the authoritative records where possible.
23. Keep run, case, step, asset and annotation IDs stable when titles change. Use a capture sequence that increases within a step. A retry creates a new media file. It never overwrites a prior capture.
24. Name media for the visible scene and capture sequence. Do not put an unverified success claim in a filename.
25. Record purpose, preconditions, actions, expected result, observed result, capture time, surface, driver, tool version, dimensions and relevant viewport or terminal details. Record limits and side effects. Record the source commit only when it is known without extra remote inspection.
26. Compute a SHA-256 hash from the actual media bytes. Store the asset ID, hash, dimensions and media type. Keep capture completion separate from assertion results. Process exit code 0 or a file on disk is not enough for a passing assertion.
27. Seal completed evidence and its media. Do not modify sealed assets under an existing identity. Serve the verified asset identified by the session. Check asset hashes before accepting annotations and before export. If an asset changes, invalidate the reference and require an explicit new import.
28. Make canonical feedback records authoritative. Browser storage holds drafts, not the only saved copy. Use one server writer per session, atomic file replacement and revision checks. Do not report Saved before the write is durable and acknowledged.
29. Support explicit reuse of an existing run. Preserve original capture times and provenance. Mark historical evidence as historical. If a capture time is unknown, report it as unknown. Do not substitute import time or file modification time.
30. Do not migrate earlier reports or feedback automatically. Any import creates a new versioned record with a source reference. Keep the earlier report and its user data unchanged. Reject unsupported explicit schemas before writes.

### Capture drivers and safe operation

31. For web evidence, reuse the existing Surf and Playwright driver patterns. Record the URL, viewport, device scale and capture method. Use a supported browser recording method when video is available.
32. For TUI evidence, use termscope for interaction and state inspection. Capture actual terminal pixels for visual proof. Text dumps, ANSI reconstructions and SVG terminal renders are not native screenshots.
33. Provide the proven Linux native-terminal method in the TUI playbook. Use a CPU-rendered foot terminal, a private terminal session, a private Cage/wlroots display and grim capture where those tools are available. Attach termscope to that same session. Do not force an unsupported graphics version as a fallback.
34. Synchronize capture with the visible frame. Check that the actual captured image shows the expected screen. A matching text buffer alone does not prove that the rendered frame is current.
35. For GUI evidence, select the approved window or display and use a platform-native capture tool. Check display access and capture permissions first. Record which window or display produced the evidence.
36. Make doctor report real capabilities for the selected surface. If a required tool or permission is missing, block the affected case with a useful reason. Do not install tools, request sudo or silently replace native evidence with a reconstruction.
37. Record real video only when a supported recorder is available. Record its format and timing. If video is unavailable, record the limit and keep valid image evidence. Do not create empty or simulated recordings.
38. Before Enter or a confirmation action, check the current screen and the approved action scope. Stop an affected case when a credential prompt or an unapproved operation appears. Never fill a credential prompt.
39. Clean up only resources created by the collector. Release borrowed resources without closing or killing them. Record an unintended side effect even if collection later recovers.
40. Keep publication separate and explicit. Check the selected evidence and its access boundary before sharing. Local collection and serving do not authorize publication.

### Annotation behaviour

41. Implement Option A only. A drag creates a rectangular region. A click creates a point pin. The floating comment editor opens beside the selected pin. Do not require expanded forms or severity dropdowns.
42. Provide labelled P1 Blocker, P2 Friction and P3 Polish badge controls. Use P2 as the initial priority for a new draft. Keep the chosen label visible. Never depend on colour alone.
43. Require a comment before saving. Support creation, selection, editing, deletion and undo. Treat deletion as a reversible tombstone. Keep stable annotation IDs through edits and undo.
44. Support keyboard creation and adjustment of a pin or box. Support arrow-key movement, Shift plus arrow-key resizing, Ctrl or Meta plus Enter to save, and Escape to cancel. Show visible focus and usable target sizes.
45. Preserve drafts across case changes, asset changes and page reloads. Version persisted drafts with collect-feedback/v1 and bind them to the session, asset ID, source hash and starting annotation revision. Opening an unchanged saved note does not create a dirty draft. A failed save keeps the draft and offers retry. If browser storage fails, explain that the draft is memory-only. Do not claim persistence that did not occur.
46. Before a complete export, require the user to save or explicitly discard unfinished drafts. Do not silently omit them. Export saved annotations, source references, revisions, priorities, comments, timestamps and deletion state.
47. Store annotation geometry in normalized top-left image coordinates with the original dimensions and source hash. Derive original-pixel bounds by rounding each edge once. Derive width and height from those rounded edges. A point pin has zero width and height.
48. Keep geometry stable through zoom, pan, responsive sizing and image reload. Do not scale, crop, redraw or recolour the source image to make it look correct. Keep the selected pin visible and clamp the comment editor to the usable viewport.
49. Attach a video note to a paused media timestamp and the displayed frame dimensions. Do not claim object tracking or exact frame accuracy unless the recorder and player prove it. Keep the source video unchanged.

### Feedback service and API

50. Serve the single HTML interface at GET /. Expose GET /api/v1/session, GET /api/v1/cases, GET /api/v1/assets/:id and GET /api/v1/annotations.
51. Expose POST /api/v1/annotations, PATCH /api/v1/annotations/:id and DELETE /api/v1/annotations/:id. Return the saved annotation and its new revision after a successful mutation. Keep the annotation ID stable when a user retries a failed save. Do not create a duplicate note. Use the same mutation contract to undo a tombstone.
52. Expose GET /api/v1/export. Return a collect-feedback/v1 export that includes the session, cases, source asset identities and annotations. Give JSON API responses a schema, kind and explicit success or error result.
53. Return an ETag for each saved annotation. Require If-Match revision preconditions for edits and deletions. Reject a missing precondition with HTTP 428 and a stale revision with HTTP 412. Reject a source hash mismatch with HTTP 409. Preserve the client's draft after a conflict. Do not silently apply last-write-wins.
54. Bind to loopback and use an explicit port. If the port is in use, stop with a clear error. Do not select another port or expose the server on all interfaces.
55. Check Host and Origin. Require a per-server, in-memory write token. Bound request size. Validate payloads and registered asset IDs. Do not put comments or tokens in logs. Do not pass secrets through command-line flags.
56. Serve only registered assets. Prevent path traversal and symlink escapes. Do not turn a media route into an arbitrary file server. Reject malformed input and unsupported schemas without a partial write.
57. Validate the session and immutable asset copies before serving. Acquire a session writer lock. A second writer must fail clearly. Read-only export must not mutate the session.

### Visual design and distribution

58. Follow DESIGN.md. Use background #191521, card #241d33, foreground #e6e1f2, primary #c9a6ff, destructive #f58b92 and success #9ccfd8. Derive muted from 85% card and 15% foreground. Derive muted foreground from 70% foreground and 30% background. Derive border from 22% foreground and 78% background. Do not add a light theme.
59. Bundle JetBrains Mono weights 400 and 500. Use 13 px body and control text. Use 10 px uppercase section labels at weight 500 with 0.1 em letter spacing.
60. Use square corners, thin 1 px borders and no decorative shadows. Follow the 4 px spacing base and the specified 8, 12, 16 and 20 px spacing steps. Keep badges, pins and the comment editor square.
61. Use real shadcn Base Nova components in the maintained frontend source. Do not describe handwritten substitutes as shadcn. Build React, components, scripts, CSS and fonts into one HTML file before distribution. Server startup must not run a frontend build or fetch a CDN.
62. Keep session, case and asset navigation in Finder-style inspector columns with independent vertical scrolling. Keep horizontal drill-down on narrow screens. Do not replace the record inspector with stacked cards or a modal. The near-pin comment editor is a local annotation editor, not the record inspector.
63. Map P1 to destructive, P2 to primary and P3 to muted foreground. Reserve success for save acknowledgement. Use a 2 px primary focus ring with a 3 px offset. Check contrast and keyboard focus on the actual bundled page.
64. Keep images and videos as separate registered media assets. The interface is one HTML file; the complete evidence archive does not have to fit in that file. Do not copy unrelated benchmark charts, facets or ledger features from the design reference.

## Testing Decisions

The user approved public workflow tests as the main test boundary. Test the installed commands, HTTP service, browser interface and files that a consumer can observe. Do not add a separate internal-function test interface for this initiative.

1. Run the installed commands from an unrelated working directory with a temporary resolved store. Check help, machine-readable output, exit codes and resource resolution. Dry-run must not create files or start a driver.
2. Exercise one complete workflow: create a plan, collect a real image, validate the run, create a feedback session, start the server, draw a box, save a comment, restart the server and export the saved note. Compare the exported source hash and coordinates with the original asset.
3. Test the existing Surf and Playwright paths through their public command boundary when their prerequisites are available. Check actual page state and captured images, not generated script text.
4. Capture a real TUI workflow with termscope and the native-terminal playbook. Compare colour, spacing, screen identity and dimensions with the actual terminal. Exercise a screen transition that can expose a delayed frame.
5. Capture a real GUI case with the approved native tool when access is available. Record a required driver as blocked if its prerequisite is missing. Do not replace it with a fake passing case.
6. Test real recording when a driver supports it. Confirm that the media decodes and contains the intended sequence. Test the explicit unavailable-video result without inventing a file.
7. Use a real PNG with known dimensions for annotation checks. Cover point pins, forward and reverse drags, boxes at image edges, zoom and a narrow viewport. Include an odd-width image so rounding cannot move the last edge outside the image.
8. Use the actual browser page to check keyboard placement, adjustment, focus order, Escape and Ctrl or Meta plus Enter. Check labelled priority badges. Confirm that the page has no severity dropdown or required expanded feedback form.
9. Save, edit, delete and undo an annotation through the browser and API. Reload the browser and restart the server. Check that the same IDs, comments, priorities, geometry and deletion state remain.
10. Navigate between cases with an unfinished draft and reload the page. Check draft recovery. Open an unchanged saved note and confirm that it does not block navigation or export.
11. Cause a real save failure through the public service and store boundary. Check that the UI retains the draft and does not show Saved. Test browser storage failure separately and verify the memory-only warning.
12. Send concurrent edits with the same starting revision. Check that one succeeds and the stale edit fails without losing the saved version. Check that a missing revision is rejected.
13. Change an asset copy after session setup. Check that annotation writes and export reject the changed source. Check that an old annotation never moves to a replacement image.
14. Validate missing media, invalid records, unsupported schemas and interrupted finalization. Check useful failure results and the absence of partial valid-looking output. Check that a capture without a valid assertion is not reported as a pass.
15. Exercise unsafe asset paths, symlink escapes, oversized or malformed requests, wrong Host, wrong Origin and missing write tokens through HTTP. Check that unrelated files and session data remain unchanged.
16. Start a second server for the same session and occupy the requested port. Check clear errors without a second writer or a fallback port.
17. Exercise the pre-confirmation boundary and a credential-dialog case without submitting credentials. Check that collection stops before the unapproved action. Check that cleanup closes owned resources and preserves borrowed resources.
18. Import an explicitly selected historical run. Check original capture times, source hashes and historical labels. Check that unknown dates remain unknown and that the original report and feedback remain unchanged.
19. Check the built HTML in the actual browser. Confirm that scripts, styles and fonts do not need a CDN or a startup build. Confirm the DESIGN.md colours, type, square controls, inspector columns, narrow-screen drill-down and visible pin placement.
20. Run validation, report generation and export against the same evidence records. Check that their asset IDs, hashes, case order and results agree. Run export twice without edits and check that it does not change the stored session.

Use the existing Bun test runner and temporary-store practice where they support these public tests. The existing browser evidence module provides the typed Plan and Driver seams. Its result and verdict tests provide prior coverage of human steps, media references and result separation. Some current tests inspect generated source text. Do not copy those assertions into the new workflow tests. Remove obsolete wiring assertions when their code is replaced.

Keep browser and native-driver checks at the same public workflow boundary. Report unavailable driver coverage as a gap. A successful unit test, process exit or text selector is not visual evidence.

## Out of Scope

- Changes to the pi-shared-context extension, its copy-reference modes, initiative tabs or query cache. Those belong to the existing TUI work.
- New executable child tickets, claims, work status or an execution plan. This operation publishes the initiative specification only.
- Automatic migration of legacy tracker records, evidence archives or saved user feedback.
- Remote hosting, public sharing, account management, team collaboration or real-time multi-user editing.
- Remote Git operations or credential entry during collection or serving.
- Automatic tool installation, privilege escalation or device-side execution.
- Guaranteed video support on every platform, reconstructed terminal video, object tracking or unsupported frame-accuracy claims.
- AI-generated screenshots, simulated visual evidence or automatic decisions about whether a screen is usable.
- Automated redaction, image editing or changing original evidence bytes to match a report.
- New store routing, a generic asset server, a database service or a second report data model.
- Broad internal-function test coverage or new low-level testing interfaces.
- The other annotation preview options and unrelated features from the design reference.

## Further Notes

### Accepted decisions and evidence

The user selected Option A, the near-pin comment editor. The user also approved public workflow tests as the main test boundary for this specification.

The native shared-context report and the annotation preview are prior evidence. They are not implementations of the new skills. The preview used a different visual style. The delivered interface must follow DESIGN.md instead.

- Native report: workflows/pi-shared-context-tui-ux-spec/artifacts/evidence/ux-review-20261108-native/index.html.
- Annotation preview: workflows/pi-shared-context-tui-ux-spec/artifacts/evidence/annotation-preview-20261109/site/index.html.
- Prototype verification: workflows/pi-shared-context-tui-ux-spec/artifacts/evidence/annotation-preview-20261109/verification.json.

The prototype already exposed an image-edge rounding error and a selected-pin visibility error. Use these observed failures as workflow regression cases. The preview also checked draft retention, failed browser storage, delete and undo, keyboard input and source hash binding. These checks inform the specification. They do not prove that the future server or skills work.

### Naming and record layout

Use collect-feedback consistently. The requested serve entrypoint is collect-feedback/scripts/collect-feedback/serve.ts. Do not use the misspelling collect-feebback.

Use the executable shebang `#!/usr/bin/env -S mise x -- bun --install=fallback`.

An evidence run contains run.json, plan.ts, plan.json and index.md. Each case contains case.json, index.md, events.jsonl and a media directory. For example, a media name is step-003-project-selected--capture-001.png. Use the actual recording extension for video.

A feedback session contains session.json and index.md. Each case contains case.json, notes.md, immutable media copies and one JSON record per annotation. The case retains its source evidence identity. Its own feedback records use collect-feedback/v1.

All physical roots come from shared-context resolution. These names describe the common structure. They do not override the configured store route.

### Publication and related work

This is a new initiative with no child tickets. Keep the existing pi-shared-context-tui-ux-spec initiative, its discussion and its children unchanged. No tracker migration or source-index change is required.

Use tracker-initiative/v1 for this specification. The local configuration maps triage readiness to tickets. It does not define an initiative readiness mapping. Do not add ticket work_status, blocked_by or an unsupported readiness field to this initiative.

The delivered skills must state their supported driver capabilities and limits. Do not describe an unexercised platform or recorder as verified.

## Tickets

No child tickets have been created.

## Comments

No discussion has been recorded.

