---
id: pi611t03
type: task
title: Validate shortcuts and selector regressions
created_at: "2026-03-24T09:02:06+10:30"
updated_at: "2026-03-24T11:06:00+10:30"
status: in-progress
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

Version drift can invalidate otherwise-correct migrations; verify runtime package versions before concluding behavior regressions.
Migration is validated with no selector regressions and clear evidence trail.

## Actual Outcome
Static regression scan passed (no legacy selector ids). Human runtime testing found selector nav/confirm/cancel broken. Root cause: extension workspace was still pinned to `@mariozechner/pi-tui@0.56.2` (legacy action ids), while migrated code used `tui.select.*` ids. Fix applied: upgraded extension deps to `@mariozechner/pi-coding-agent@0.61.1` + `@mariozechner/pi-tui@0.61.1`, and migrated code from `getEditorKeybindings()` to `getKeybindings()`. Awaiting human retest in live TUI.

## Lessons Learned
Static scans catch migration misses quickly, but they cannot prove interaction parity; a human runtime pass is required.
