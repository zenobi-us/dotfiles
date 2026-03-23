---
id: pi611e01
title: Update Extensions for Pi 0.61.1
created_at: 2026-03-24T09:02:06+10:30
updated_at: 2026-03-24T09:02:06+10:30
status: planning
---

# Update Extensions for Pi 0.61.1

## Vision/Goal
Bring local extensions in `./devtools/files/pi/agent/extensions/` to full compatibility with Pi 0.61.1, including required 0.61.0 keybinding-id migration and explicit audit of 0.61.1 extension API additions.

## Success Criteria
- [ ] All extension UI keybinding id usage is namespaced and compatible with Pi 0.61.x.
- [ ] `files` extension selector navigation works using namespaced keybindings.
- [ ] `pi-fzf` selector navigation/help rendering works using namespaced keybindings.
- [ ] `tool_call` hook usage is audited and documented for `ToolCallEventResult` adoption.
- [ ] A regression validation pass is documented for command + shortcut behavior.

## Stories
- [story-pi611s01-keybinding-id-migration-for-selector-extensions](./story-pi611s01-keybinding-id-migration-for-selector-extensions.md)
- [story-pi611s02-tool-call-typing-audit-for-0-61-1](./story-pi611s02-tool-call-typing-audit-for-0-61-1.md)

## Phases

### Phase 1: Source Audit and Planning
- **Status**: completed
- **Start Criteria**: Epic created and changelog available
- **End Criteria**: Impacted extensions identified with evidence and migration plan
- **Tasks**:
  - [x] [research-pi611r01-pi-0-61-1-migration-impact-audit](./research-pi611r01-pi-0-61-1-migration-impact-audit.md)
- **Notes**: Blocking risk confirmed in old keybinding ids used by `files.ts` and `pi-fzf/src/selector.ts`.

### Phase 2: Keybinding Migration
- **Status**: todo
- **Start Criteria**: Story pi611s01 accepted
- **End Criteria**: All selector keybinding ids are namespaced and validated
- **Tasks**:
  - [ ] [task-pi611t01-migrate-files-extension-keybinding-ids](./task-pi611t01-migrate-files-extension-keybinding-ids.md)
  - [ ] [task-pi611t02-migrate-pi-fzf-keybinding-ids](./task-pi611t02-migrate-pi-fzf-keybinding-ids.md)

### Phase 3: Validation and Guardrails
- **Status**: todo
- **Start Criteria**: Phase 2 completed
- **End Criteria**: Regression validation + tool_call typing audit completed
- **Tasks**:
  - [ ] [task-pi611t03-validate-shortcuts-and-selector-regressions](./task-pi611t03-validate-shortcuts-and-selector-regressions.md)
  - [ ] [task-pi611t04-audit-tool-call-event-result-typing](./task-pi611t04-audit-tool-call-event-result-typing.md)

## Dependencies
- Upstream source of truth: `badlogic/pi-mono` changelog for `packages/coding-agent`.
- Existing local extension code in `./devtools/files/pi/agent/extensions/`.
- Pi 0.61.x keybinding-id migration rules from upstream documentation/changelog.
