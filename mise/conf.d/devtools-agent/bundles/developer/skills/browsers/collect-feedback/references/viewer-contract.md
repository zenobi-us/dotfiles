---
schema: collect-feedback/v1
kind: reference
---
# Image and video feedback contract

Use the [how-to](../howto.md) for review procedures, the [CLI reference](cli.md) for commands,
and the [system explanation](system.md) for routing and record authority.

## Storage and identity

Import sealed evidence through the existing shared-context evidence route. Preserve the source snapshot and immutable media. Each case stores annotations in `cases/<case-id>/annotations/<annotation-id>.json`. Each record uses `collect-feedback/v1`, kind `annotation`, stable annotation/session/case/asset IDs, source SHA-256, original dimensions, priority, comment, revision and creation/update timestamps.

Geometry uses normalized top-left `{x,y,width,height}` coordinates. A point has zero width and height. A box has positive width and height. Round the left, top, right and bottom original-pixel edges once. Derive pixel width and height from the rounded edges. Source identity changes require a new import.

## HTTP API

| Route | Result |
|---|---|
| GET / | Prebuilt React/Base Nova viewer with bundled CSS and JetBrains Mono fonts. |
| GET /api/v1/session | Session plus the current in-memory writeToken. |
| GET /api/v1/cases | Ordered cases and registered assets. |
| GET /api/v1/assets/:id | Verified original bytes and hash ETag. Single byte ranges return 206; invalid ranges return 416. |
| GET /api/v1/annotations | Saved annotations. |
| POST /api/v1/annotations | Durable saved annotation and revision ETag. |
| PATCH /api/v1/annotations/:id | Revision-checked edit or undo and a new ETag. |
| DELETE /api/v1/annotations/:id | Reversible tombstone and a new ETag. |
| GET /api/v1/export | Verified session, cases, source assets and annotations. |

JSON responses have schema, kind and success. Errors include a message. Every mutation requires Content-Type application/json, the exact same Origin and X-Write-Token from the session response. Tokens stay in memory and never appear in readiness output or logs.

The creation payload contains exactly schema, kind, id, sessionId, caseId, assetId, sourceSha256, originalWidth, originalHeight, geometry, priority and comment. Priority is P1, P2 or P3. The comment must contain text. A saved annotation adds revision 1, createdAt, updatedAt and pixelGeometry. Its ETag is `"<id>:1"`. Retrying an identical ID and payload returns the original record. Different content for that ID returns 409.

PATCH requires schema collect-feedback/v1 and kind annotation, plus one or more of comment, priority or geometry. Source identity fields cannot change. DELETE requires exactly schema and kind. Undo uses PATCH with only schema, kind and deletedAt: null. PATCH and DELETE require If-Match containing the last acknowledged ETag, such as "note-id:1". A missing precondition returns 428; a stale revision returns 412. Successful mutations increment revision and update updatedAt. DELETE sets deletedAt while retaining all annotation content; undo clears deletedAt. Older creation records without deletedAt remain valid. Export includes tombstones.

The service checks source records and bytes before every mutation and export. It checks Host, Origin, Fetch Metadata, registered IDs, payload schema, geometry and request size before mutation. A changed source returns 409. Invalid payloads return 400. Authorization failures return 403. Unsupported content types return 415. Oversized requests return 413. Unknown routes return 404 and unsupported methods return 405.

## Safety and shutdown

Bind only to 127.0.0.1 on an explicit port. Refuse a second session writer and occupied ports without fallback. Reject encoded paths, query strings and symlink components. Use non-following descriptors and Linux /proc/self/fd checks for registered reads and annotation publication.

Limit URLs to 2048 characters, headers to 8192 characters and request bodies to 65536 bytes. Allow at most 16 concurrent requests. Keep idle timeout at 10 seconds. Registered assets are limited to 128 MiB and session records to 4 MiB.

Publish complete annotation JSON atomically after syncing file data. Sync the containing directory before acknowledgement. Keep the same stable ID after a failed save. On SIGINT or SIGTERM, stop accepting work, drain active saves and responses, then release only the owned lock inode. A crash can retain a writer lock; the CLI does not steal it.

## UI and export

Click an image for a point or drag in either direction for a box. Point and Box controls provide keyboard creation. Arrows move; Shift plus arrows resize a box. Escape cancels. Ctrl or Meta plus Enter saves a nonblank comment. Select a saved pin to inspect it without a draft or write. Use Edit note for a draft and Delete note for a tombstone. Undo deletion remains available after reload and restart. A conflict keeps the draft and its starting revision and shows the current saved content, priority, geometry and deletion state. Use saved revision for next save explicitly adopts the displayed live revision; a subsequent save still uses If-Match. If a retry finds exactly the submitted live content, it re-saves that content with its current precondition for a durable acknowledgement. A further concurrent change still fails safely. Start at P2 Friction. Label P1 Blocker and P3 Polish. Show Saved only after the server confirms a durable write. Failed saves retain the draft, starting revision, stable ID and frozen retry payload across navigation and reload. Saved server annotations remain authoritative.

Browser recovery records use `collect-feedback/v1`, kind `draft`, an `annotation` input, nullable `startingRevision`, optional frozen `submitted` input and optional error. New notes use a null starting revision. The input binds session, case, asset ID, source SHA-256 and original dimensions. Recovery requires an exact image identity match. It never adopts a newer saved revision automatically.

Drafts use tab-local `sessionStorage`, keyed by session ID and source run at the current origin. They survive navigation and reload, not tab closure or a port change. Browser storage failures retain in-memory drafts and show a memory-only warning. Unsupported or unreadable stored drafts block UI export until explicitly discarded.

The viewer export control checks all drafts, including drafts on unselected or unavailable images. Open a draft to save it, or explicitly discard it. Pending writes block export and discard. An unchanged saved-note selection creates no draft. CLI and direct API exports cannot inspect browser drafts and always contain saved records only.

Keep pins in image coordinates through zoom, scroll pan and viewport changes. Keep the selected pin visible and clamp its floating editor. Keep the original media bytes unchanged.

The installed `export <session> --json` command and GET export return the same saved data. Export validates immutable source bytes and does not alter session records, timestamps or annotations.

## Distribution and verification

Build from viewer/ with `mise exec -- bun install --frozen-lockfile` and `mise exec -- bun run build`. Commit viewer/index.html. Server startup reads this file without a build or CDN access.

Run scripts/collect-feedback/test/workflow.test.ts with Bun. Exercise the actual bundled browser page separately. Check point and reverse-box creation, keyboard controls, source hash binding, odd-width image bounds, case and asset navigation, reload, concurrent revisions, failed disk writes, failed browser storage, guarded UI export, server restart and read-only CLI export.


## Paused video notes

A video creation payload adds `mediaTimeSeconds`, `displayedWidth` and `displayedHeight` to the image annotation fields. The timestamp must be finite, non-negative and within the known recording duration. Displayed dimensions are positive CSS-pixel dimensions of the uncropped frame at creation. `originalWidth` and `originalHeight` remain the registered video-track dimensions. Geometry uses those original dimensions for pixel bounds. Image payloads reject video fields.

Timing and source bindings cannot change through PATCH. Edit comments, priority and geometry at the same timestamp. Create another note for another timestamp. The viewer locks playback and seeking while a draft exists, restores the draft timestamp after reload, and opens saved notes at their recorded position. Pins appear only at their bound paused timestamp, not during playback. Draft recovery, stable retries, revision conflicts, tombstones, export checks and original-byte validation use the existing annotation path.


Undo deletion of a video note pauses playback and seeks to its bound timestamp. The viewer selects the restored pin after seeking completes. Undo deletion and keep draft retains the existing draft and its timestamp instead of selecting the saved note. Image undo selects the restored pin without media seeking.

## Historical selection

`init <sealed-run> --historical` explicitly selects an earlier run for a new session. The versioned session adds optional `historical: true`. Existing sessions without this field remain readable and unchanged. The viewer, exports and writing-reports preserve this selection. `false`, strings and unknown session schema versions are invalid. The sealed source snapshot is not relabelled or rewritten.

Capture dates remain those in each asset. Null dates remain unknown. The import timestamp describes only session creation. Source schema checks run before store writes. No legacy format is inferred from filenames.
