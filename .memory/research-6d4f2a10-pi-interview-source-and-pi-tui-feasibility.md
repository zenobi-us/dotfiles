---
id: 6d4f2a10
title: pi-interview source and pi-tui feasibility
created_at: 2026-02-20T19:31:00+10:30
updated_at: 2026-02-20T19:39:55+10:30
status: completed
epic_id: 9c7e21ab
phase_id: 3a5f1c8d
related_task_id: 7e3f4a91
---

# Research: pi-interview source and pi-tui feasibility

## Research Questions
1. Where is authoritative `pi-interview` source?
2. What is the runtime architecture and request/response flow?
3. Which parts should be reused vs redesigned for a pi-tui-native questionnaire in Pi?

## Summary
Authoritative source was verified in **GitHub repo `nicobailon/pi-interview-tool`**, cloned to `/tmp/pi-interview-tool`.

Architecture is split into:
- Pi extension tool registration (`index.ts`)
- Local HTTP server/session manager (`server.ts`)
- Schema and validation (`schema.ts`)
- Browser UI app (`form/index.html`, `form/script.js`, `form/styles.css`)

A pi-tui version should keep schema + response contracts but replace HTTP/browser/session heartbeats with an in-process `ctx.ui.custom(..., { overlay: true })` flow.

## Findings

### 1) Source of truth verified
- `package.json` confirms package name `pi-interview` and extension entry `./index.ts`.
- Repository: `https://github.com/nicobailon/pi-interview-tool`
- Local audit path: `/tmp/pi-interview-tool`

### 2) Control-plane flow (tool + server)
- `index.ts`
  - Registers `interview` tool with TypeBox parameters.
  - Validates/loads questions via `validateQuestions` from `schema.ts`.
  - Starts server via `startInterviewServer(...)` from `server.ts`.
  - Opens browser, handles queued interviews, and returns final status (`completed|cancelled|timeout|aborted|queued`) with structured responses.
- `server.ts`
  - Serves interview HTML/CSS/JS and theme assets.
  - Owns session registry (`~/.pi/interview-sessions.json`) and stale detection.
  - Endpoints: `GET /`, `/health`, `/sessions`, `/styles.css`, `/theme-*.css`, `/script.js`, `/media`; `POST /heartbeat`, `/cancel`, `/submit`, `/save`.
  - Persists recovery files (`~/.pi/interview-recovery`) and snapshot HTML bundles (`~/.pi/interview-snapshots`).

### 3) Data model + validation
- `schema.ts` defines `Question` types: `single`, `multi`, `text`, `image`, `info`.
- Supports recommendation metadata (`recommended`, `conviction`, `weight`), code blocks, and rich media blocks (`image`, `table`, `chart`, `mermaid`, `html`).
- Validation enforces type-option compatibility and recommendation integrity.

### 4) Browser UX state machine (form/script.js)
- Client state handles:
  - Keyboard-first navigation across questions/options
  - Timeout countdown + heartbeat refresh
  - Queue toast for concurrent interviews
  - LocalStorage restore keyed by question hash
  - File/image handling (upload/paste/path), attachment support
  - Submit/cancel/save snapshot interactions
- Practical takeaway: most complexity is UI interaction and media rendering, not the question schema itself.

### 5) Feasibility for pi-tui version
**Directly reusable now:**
- Question schema contract (`schema.ts` semantics)
- Response object shape (`{ id, value, attachments? }`)
- Cancellation/timeout status semantics

**Must be redesigned in pi-tui:**
- Browser/HTTP/session-token machinery
- Rich media rendering parity (chart/mermaid/html)
- Drag-drop/paste image workflows
- Snapshot HTML generation

## Recommended pi-tui implementation slice
1. **MVP (ship first):** `single`, `multi`, `text`, `info`; no rich media rendering except textual placeholders.
2. **State machine component:** one overlay component with question index, answer map, validate-next, submit/cancel.
3. **Parity phase:** add `image` path capture and attachment list support.
4. **Optional advanced:** add markdown code block panel + table rendering; defer chart/mermaid/html to fallback links.

## References
- `nicobailon/pi-interview-tool` (GitHub)
- `/tmp/pi-interview-tool/index.ts`
- `/tmp/pi-interview-tool/server.ts`
- `/tmp/pi-interview-tool/schema.ts`
- `/tmp/pi-interview-tool/form/script.js`
- `/tmp/pi-interview-tool/README.md`
