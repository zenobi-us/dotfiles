---
id: pi611r01
title: Pi 0.61.1 Migration Impact Audit for Local Extensions
created_at: 2026-03-24T09:02:06+10:30
updated_at: 2026-03-24T09:02:06+10:30
status: completed
epic_id: pi611e01
---

# Pi 0.61.1 Migration Impact Audit for Local Extensions

## Research Questions
- Which extension-facing changes in `pi` 0.61.1 (and required 0.61.0 migration) affect `./devtools/files/pi/agent/extensions/`?
- Which local extensions contain concrete migration risks?
- What migration tasks should be planned, grouped by extension?

## Summary
Primary actionable migration risk is **stale keybinding ids** from pre-0.61.0 API (`selectConfirm`, `selectUp`, etc.) in `files.ts` and `pi-fzf/src/selector.ts`. Pi 0.61.0 introduced namespaced keybinding ids and explicitly requires extension authors to migrate these ids. Pi 0.61.1 adds typed `tool_call` return values (`ToolCallEventResult`) but no local extension currently registers a `tool_call` handler, so this is an audit/watch item, not a blocking code migration.

## Findings
1. **Changelog evidence (pi 0.61.0/0.61.1):**
   - `0.61.1` adds typed `tool_call` handler return value support via `ToolCallEventResult` exports.
   - `0.61.0` breaking change: keybinding ids are namespaced; migration examples include old ids (`selectConfirm`) to new ids (`tui.select.confirm`).
   - Source: `badlogic/pi-mono` coding-agent `CHANGELOG.md`, sections `## [0.61.1]` and `## [0.61.0]`.

2. **Local extension scan evidence:**
   - `./devtools/files/pi/agent/extensions/files.ts` uses old ids:
     - `kb.matches(data, "selectUp")`
     - `kb.matches(data, "selectDown")`
     - `kb.matches(data, "selectConfirm")`
     - `kb.matches(data, "selectCancel")`
   - `./devtools/files/pi/agent/extensions/pi-fzf/src/selector.ts` uses old ids:
     - `kb.matches(data, "selectUp")`
     - `kb.matches(data, "selectDown")`
     - `kb.matches(data, "selectPageUp")`
     - `kb.matches(data, "selectPageDown")`
     - `kb.matches(data, "selectConfirm")`
     - `kb.matches(data, "selectCancel")`
     - `editorKey("selectUp")`, `editorKey("selectDown")`, `editorKey("selectConfirm")`, `editorKey("selectCancel")`
   - Search methods used: `grep` and `sg` AST pattern `$KB.matches($DATA, $ID)`.

3. **No direct 0.61.1 `tool_call` typing migration needed yet:**
   - `grep` for `tool_call` event handlers in extensions found no `pi.on("tool_call", ...)` usage.
   - Existing event hooks are mostly `session_start`, `tool_result`, `turn_*`, `agent_end`.

## References
- `badlogic/pi-mono` repository: `packages/coding-agent/CHANGELOG.md` (`0.61.1`, `0.61.0` sections). Credibility 9/10 (authoritative upstream source for runtime API changes).
- Local code scan:
  - `./devtools/files/pi/agent/extensions/files.ts`
  - `./devtools/files/pi/agent/extensions/pi-fzf/src/selector.ts`
  Credibility 10/10 (direct project source of truth).
