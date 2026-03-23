---
id: pi611s01
title: Keybinding ID Migration for Selector Extensions
created_at: 2026-03-24T09:02:06+10:30
updated_at: 2026-03-24T09:02:06+10:30
status: todo
epic_id: pi611e01
priority: critical
story_points: 3
test_coverage: none
---

# Keybinding ID Migration for Selector Extensions

## User Story
As a Pi extension user, I want selector navigation and confirm/cancel actions to respect current namespaced keybindings so that local extensions behave consistently on Pi 0.61.x.

## Acceptance Criteria
- [ ] `files.ts` no longer uses legacy keybinding ids (`selectUp`, `selectDown`, `selectConfirm`, `selectCancel`).
- [ ] `pi-fzf/src/selector.ts` no longer uses legacy keybinding ids for navigation and help labels.
- [ ] Selector interactions remain functionally equivalent after migration.
- [ ] Migration mapping is documented in task outcomes.

## Context
Pi 0.61.0 introduced a breaking change requiring namespaced keybinding ids for extension keybinding helpers. Current code still uses legacy ids in `files.ts` and `pi-fzf/src/selector.ts`.

## Out of Scope
- New selector features.
- Non-selector command behavior changes.
- Styling/UI redesign.

## Tasks
- [task-pi611t01-migrate-files-extension-keybinding-ids](./task-pi611t01-migrate-files-extension-keybinding-ids.md)
- [task-pi611t02-migrate-pi-fzf-keybinding-ids](./task-pi611t02-migrate-pi-fzf-keybinding-ids.md)
- [task-pi611t03-validate-shortcuts-and-selector-regressions](./task-pi611t03-validate-shortcuts-and-selector-regressions.md)

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
| --- | --- | --- | --- |
| AC1 | files.ts migrated key ids | extensions/files.e2e.ts :: namespaced-selector-nav | planned |
| AC2 | pi-fzf selector migrated key ids | extensions/pi-fzf.e2e.ts :: namespaced-selector-nav | planned |
| AC3 | behavior preserved | extensions/selector-regression.e2e.ts :: nav-confirm-cancel-parity | planned |
| AC4 | mapping documented | memory/task outcomes for pi611t01/pi611t02 | planned |

### Unit Test Coverage (via Tasks)
- Task `pi611t01`: verifies files extension keybinding id migration paths → satisfies AC1, AC3.
- Task `pi611t02`: verifies pi-fzf keybinding id migration + help label keys → satisfies AC2, AC3.
- Task `pi611t03`: verifies command/shortcut regression expectations post-migration → satisfies AC3, AC4.

## Notes
Reference migration source: `badlogic/pi-mono` changelog `0.61.0` breaking-change section for namespaced keybinding ids.
