---
id: pi611t03
title: Validate shortcuts and selector regressions
created_at: 2026-03-24T09:02:06+10:30
updated_at: 2026-03-24T09:02:06+10:30
status: todo
epic_id: pi611e01
phase_id: phase-3-validation-and-guardrails
story_id: pi611s01
assigned_to: Elf8ku0kc9KBBBtrhN2odZ83
---

# Validate shortcuts and selector regressions

## Objective
Confirm no behavior regressions after keybinding-id migration in `files` and `pi-fzf` extensions.

## Related Story
[story-pi611s01-keybinding-id-migration-for-selector-extensions](./story-pi611s01-keybinding-id-migration-for-selector-extensions.md) — contributes to AC3 and AC4.

## Related Phase
Phase 3: Validation and Guardrails in [epic-pi611e01-update-extensions-for-pi-0-61-1](./epic-pi611e01-update-extensions-for-pi-0-61-1.md).

## Steps
- Run static grep check ensuring no legacy key ids remain.
- Exercise `/files` selector navigation and confirm/cancel paths.
- Exercise `pi-fzf` selector navigation, page nav, confirm/cancel, and key hint rendering.
- Record migration mapping and validation evidence in task outcomes.

## Unit Tests
- `legacy-id scan guard`: verifies no `selectConfirm/selectUp/selectDown/selectCancel/selectPageUp/selectPageDown` ids remain in migrated files → supports AC3/AC4 of story `pi611s01`.

## Expected Outcome
Migration is validated with no selector regressions and clear evidence trail.

## Actual Outcome
Pending.

## Lessons Learned
Pending.
