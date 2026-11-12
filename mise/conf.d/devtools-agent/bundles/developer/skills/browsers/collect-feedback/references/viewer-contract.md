---
schema: collect-feedback/v1
kind: reference
---
# Read-only viewer contract

## Storage

`init` resolves `shared-context resolve evidence --workflow <workflow> --run <session> --json` from the repository in scope. Session IDs and evidence run IDs share the existing evidence namespace; use distinct IDs. The CLI never adds store configuration.

A session has `session.json`, `index.md`, `source/` and `cases/<id>/`. `source/` is a byte-preserving sealed evidence snapshot, including its collector-native output. Each feedback case has `case.json`, `notes.md` and read-only `media/` copies. This deliberate duplication permits independent case media and full offline validation through the existing evidence validator. Allow disk space for both copies.

Each feedback JSON record has `schema: collect-feedback/v1` and a `kind`. `session.json` contains a stable ID, creation time, ordered case references and the original run record plus `runId` and the copied `run.json` SHA-256. Each feedback case replaces the evidence header with the feedback header, retains its case ID and stores `sessionId` plus `source: {runId, caseId}`. Original asset records remain unchanged inside the case. Their IDs, times, hashes, dimensions, paths and driver provenance identify the original capture.

Validation checks every feedback case against the sealed source case. It rejects unsupported schemas, missing cases or assets, changed hashes, writable media and symlink components. The complete source run uses the existing `collect-evidence/v1` validator. Nothing executes imported `plan.ts`. Publication reserves a new destination and atomically renames a validated private staging tree. An interrupted staging tree is not a valid public session.

## Command output

Use `--plain` for uncoloured, line-based `field.path: value` results from init, validate and both serve entrypoints. Nested fields use dotted paths and arrays use zero-based indices. Newlines in values are escaped. Empty collections emit no leaf lines.

Use `--json` for the complete versioned collect-feedback/v1 event. It takes precedence over `--plain`. Without either format flag, commands retain indented JSON. `--quiet` suppresses all successful output, including when combined with either format flag. Diagnostics and exit codes remain unchanged.

## HTTP API

| GET path | Response |
|---|---|
| `/` | Prebuilt self-contained HTML with React, Base Nova, CSS and JetBrains Mono 400/500. |
| `/api/v1/session` | `{schema, kind: "session", success: true, session}` |
| `/api/v1/cases` | `{schema, kind: "cases", success: true, cases}` |
| `/api/v1/assets/:id` | Exact registered media bytes with original media type and hash ETag. |

Errors use `{schema, kind: "error", success: false, message}`. Other routes return 404. Non-GET requests return 405. Host must be the exact `127.0.0.1:<port>` authority. A supplied Origin must equal the returned origin. Cross-site and same-site Fetch Metadata requests are refused. The service never enables CORS.

Encoded paths, query strings, unsafe asset IDs and symlink components are refused. Asset responses read and hash the same descriptor bytes. Linux `/proc/self/fd` verifies the opened file's resolved location. The service is not an arbitrary file server. It exposes neither the source snapshot nor session files as static paths.

Requests have a 2048-character URL limit, an 8192-character header limit, a 1024-byte Bun body limit and no permitted body. At most 16 requests run concurrently; idle timeout is 10 seconds. Feedback records are at most 4 MiB, registered assets 128 MiB, and bundled HTML 8 MiB. Sessions allow at most 1000 cases and 10000 distinct assets. The sealed source validator has its own evidence bounds.

The service acquires `.writer.lock` exclusively before validation. A busy port fails without fallback and releases the owned lock. Signals stop the owned server and release only the matching lock inode. A crash can retain a lock; no automatic takeover occurs. No comments, tokens or request payloads enter service logs. There are no mutation routes or write tokens in this read-only slice.

## Distribution

The maintained frontend lives under installed `viewer/`. Use `mise exec -- bun install --frozen-lockfile`, then `mise exec -- bun run build` from that directory when changing it. Commit the built `viewer/index.html`. Startup reads that file; it never builds the frontend or requests a CDN. Upstream component and font provenance lives in `viewer/upstream/provenance.json`. Keep the upstream licences.

The public workflow regression is `scripts/collect-feedback/test/workflow.test.ts`. Run it with Bun from the repository. It captures real browser media through the installed collector and exercises the installed feedback commands from an unrelated temporary directory. Configure an existing browser with `PLAYWRIGHT_MCP_EXECUTABLE_PATH` when required. Browser screenshots remain separate visual evidence.

