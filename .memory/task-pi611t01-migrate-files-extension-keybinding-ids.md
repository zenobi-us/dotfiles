---
id: pi611t01
type: task
title: Migrate files extension keybinding IDs
created_at: "2026-03-24T09:02:06+10:30"
updated_at: "2026-03-24T09:44:00+10:30"
status: completed
epic_id: pi611e01
phase_id: phase-2-keybinding-migration
story_id: pi611s01
assigned_to: Elf8ku0kc9KBBBtrhN2odZ83
---

# Migrate files extension keybinding IDs

## Objective
Replace legacy selector keybinding ids in `./devtools/files/pi/agent/extensions/files.ts` with Pi 0.61.x namespaced ids.

## Related Story
[story-pi611s01-keybinding-id-migration-for-selector-extensions](./story-pi611s01-keybinding-id-migration-for-selector-extensions.md) — contributes to AC1 and AC3.

## Related Phase
Phase 2: Keybinding Migration in [epic-pi611e01-update-extensions-for-pi-0-61-1](./epic-pi611e01-update-extensions-for-pi-0-61-1.md).

## Steps
- Locate all `kb.matches(data, "select*")` usages in `files.ts`.
- Map legacy ids to namespaced ids (`tui.select.*`).
- Update code paths for navigate/confirm/cancel checks.
- Re-scan file to verify no legacy ids remain.

## Unit Tests
- `extensions/files selector input handling`: verifies namespaced key ids route navigation and cancel correctly → supports AC1 of story `pi611s01`.

## Expected Outcome
`files.ts` uses only namespaced keybinding ids and remains behaviorally equivalent.

## Actual Outcome
Updated `files.ts` selector input handling to use `tui.select.up`, `tui.select.down`, `tui.select.confirm`, and `tui.select.cancel`. Verified with grep that no legacy selector ids remain in this file.

## Lessons Learned
Migration was mechanical and low risk; static grep verification is a fast guardrail before interactive validation.
