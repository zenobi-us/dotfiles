---
id: pi611t02
type: task
title: Migrate pi-fzf keybinding IDs
created_at: "2026-03-24T09:02:06+10:30"
updated_at: "2026-03-24T09:44:00+10:30"
status: completed
epic_id: pi611e01
phase_id: phase-2-keybinding-migration
story_id: pi611s01
assigned_to: Elf8ku0kc9KBBBtrhN2odZ83
---

# Migrate pi-fzf keybinding IDs

## Objective
Replace legacy selector keybinding ids and `editorKey(...)` usages in `./devtools/files/pi/agent/extensions/pi-fzf/src/selector.ts` with namespaced ids.

## Related Story
[story-pi611s01-keybinding-id-migration-for-selector-extensions](./story-pi611s01-keybinding-id-migration-for-selector-extensions.md) — contributes to AC2 and AC3.

## Related Phase
Phase 2: Keybinding Migration in [epic-pi611e01-update-extensions-for-pi-0-61-1](./epic-pi611e01-update-extensions-for-pi-0-61-1.md).

## Steps
- Locate `kb.matches(data, "select*")` checks.
- Locate `editorKey("select*")` calls for help line rendering.
- Replace with namespaced ids (`tui.select.*`).
- Verify no legacy ids remain in `selector.ts`.

## Unit Tests
- `pi-fzf selector keyboard handling`: verifies namespaced key ids for up/down/page/confirm/cancel → supports AC2 of story `pi611s01`.
- `pi-fzf help key rendering`: verifies `editorKey(...)` output uses namespaced ids → supports AC2 of story `pi611s01`.

## Expected Outcome
`pi-fzf` selector uses namespaced keybinding ids across both behavior and displayed key hints.

## Actual Outcome
Updated `selector.ts` to namespaced ids in both `kb.matches(...)` and `editorKey(...)`: `tui.select.up/down/pageUp/pageDown/confirm/cancel`. Verified via grep that no legacy `select*` ids remain in this file.

## Lessons Learned
Help-text key hints must be migrated alongside behavior checks; otherwise the UI lies about active bindings.
