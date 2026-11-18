---
schema: collect-feedback/v1
kind: changelog
---
# Changelog

## Unreleased

- **Write for people using coding agents:** Replace CLI-heavy human guides with prompt-led capture, approval, annotation, handoff, export, and reopening steps. Explain required skills and optional ticket/session integrations.
- **Consolidate guide discovery:** Keep one feedback how-to, retain its real screenshots, move the manual collector example into technical references, update backlinks, and remove the dedicated topbar links. Browser checks verified both guide routes, loaded screenshots, and navigation without the removed item.

- **Illustrate the how-to:** Add real original-asset and saved-box-note screenshots from the controlled public workflow. Keep descriptive alternative text beside the review steps.
- **Document the complete workflow:** Add `howto.md`, a separate CLI reference, and a storage/system explanation. Cover approved collection, explicit historical review, saved notes, drafts, validation, export, and shutdown.
- **Connect the existing website:** Include canonical `howto.md` guides in content discovery and static routes. Add evidence navigation and README links. Correct skill source links to the repository default branch, `master`.
- **Exercise public procedures:** Run installed Playwright capture, fresh and historical feedback requests, browser box save, restart, validation, report, and export with temporary resolved stores. Record unavailable Surf, native TUI, and native GUI prerequisites separately.


- **Stop mixed blocked requests:** Give any BLOCKED verdict precedence over assertion FAIL. Return exit 3 with the sealed diagnostic source and no feedback import or server. Keep assertion-only failures reviewable. The opt-in public request regression uses real private terminal captures (`RUN_NATIVE_EVIDENCE_TESTS=1`) to cover both outcomes.

- **Collect one workflow request:** Run the installed collector from an approved compiled workspace, validate and import sealed evidence, then serve through the existing loopback server. Return its actual URL and saved-record references.
- **Keep request branches explicit:** Reuse earlier runs only with `request --historical`. Stop blocked capture before import. Retain sealed assertion failures for review without relabelling them as passes. Keep dry-run free of capture, writes and server startup.
- **Preserve capture safety:** Select the web, TUI or GUI playbook before preparation. Forward interruptions to owned collection and retain normal server shutdown. Keep user resources and publication boundaries unchanged.

- **Preserve manifest read failures:** Keep filesystem errors from shared run and session validation as operation failures (exit/code 1). Keep malformed JSON, unsupported schemas and invalid record shapes at exit/code 2. Restore exact file modes in public report permission regressions.

- **Preserve annotation read failures:** Keep filesystem errors separate from invalid saved JSON and annotation schemas. Feedback reports return exit/code 1 for unreadable annotations and exit/code 2 for invalid input. Keep bounded reads and path safety checks unchanged.

- **Wrap timestamp notes:** Keep full saved video comments within the inspector using native keyboard-selectable Base Nova rows.

- **Restore video moments:** Undo deletion pauses and seeks to the restored note before selecting its pin. Keep image selection and retained conflict drafts unchanged.

- **Review recorded video:** Play and seek registered WebM assets. Draw paused timestamp pins with displayed frame dimensions. Retain timing through draft recovery, revision-checked saves, restart and export.
- **Serve seekable media:** Validate original bytes before each full or partial response. Support single byte ranges without exposing other files.

- **Recover browser drafts:** Retain versioned, identity-bound drafts across case and asset navigation and reload in the same browser tab. Keep starting revisions and frozen retry payloads. Show memory-only warnings when browser storage fails.
- **Resolve complete exports:** Require save or explicit discard of every unfinished browser draft. Keep unchanged saved-note selection clean. Keep CLI and direct API exports limited to authoritative saved records.
- **Verify failure recovery:** Exercise real disk-write failures, browser storage failures, concurrent revisions after reload, retry identity and correct source hashes through public commands and the bundled page.

- **Recover deleted-note conflicts:** Undo the displayed tombstone while keeping the draft and its identity. A stale undo refreshes the conflict without adopting its revision. Save the retained draft explicitly after restoration.

- **Edit and undo notes:** Select saved pins without a draft. Edit comments, priorities and geometry. Delete with reversible tombstones and restore the same identity after reload or restart.
- **Reject stale edits:** Require revision ETags for PATCH and DELETE. Return 428 for missing If-Match and 412 for stale revisions. Keep conflicting drafts in memory. Show the newer saved version and require explicit revision adoption before replacement. Recover a lost PATCH acknowledgement without changing note identity or geometry. Recheck source records, hashes and write authorization before mutations.

- **Explain rejected saves:** Show the server message, including source-change and new-import guidance. Keep the draft and retry ID; use the HTTP status when a response is malformed.
- **Keep selected pins visible:** Reveal the pin through image and ancestor scrolling at enlarged zoom. Reveal the inspector before the pin so narrow-screen column snapping cannot hide it.

- **Save screenshot pins:** Create point and box notes with pointer or keyboard controls, near-pin comments and labelled priority badges. Keep normalized and rounded-edge original-pixel geometry attached through zoom and scroll.
- **Acknowledge durable writes:** Store stable-ID annotations atomically, return revision ETags, verify source hashes and enforce write authorization. Drain saves on shutdown.
- **Export saved feedback:** Read annotations and source references through the installed CLI and JSON API without modifying the session.
- **Preserve feedback Markdown:** Write and flush schema frontmatter, headings and notes as raw bytes. Cover both human-readable records through public init.

- **Keep controls readable:** Use the shared 13px control typography for Session and Cases navigation. Rebuild the distributed viewer.

- **Honour plain output:** Format init, validate and both serve entrypoints as labelled text with --plain. Preserve versioned --json output and --quiet suppression.

- **Restore asset focus:** Back and ArrowLeft return keyboard focus to the originating asset button while revealing the case column, including narrow viewports.

## 1.0.0

- **Import sealed evidence:** Create versioned sessions through the existing evidence route. Retain the complete source snapshot and immutable case media with original hashes and capture times.
- **Browse original media:** Open a prebuilt Base Nova inspector with independent session, case and asset columns. Keep horizontal drill-down on narrow screens.
- **Serve bounded reads:** Use one explicit-port loopback service for both entrypoints. Enforce registered paths, Host, Origin, request limits and an exclusive session writer lock.
- **Keep capability explicit:** Support init, validate and read-only serve. Annotation editing, draft recovery and export are not part of this release.


## Historical review

- Add explicit `init --historical` selection with a persistent viewer and export label.
- Keep original capture dates, unknown dates, provenance and immutable media unchanged.
- Support read-only writing-reports exports from the same validated evidence and saved feedback.

