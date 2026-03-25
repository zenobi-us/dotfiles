# Project Summary

## Current Epic
- **Active Epic**: [epic-pi611e01-update-extensions-for-pi-0-61-1](./epic-pi611e01-update-extensions-for-pi-0-61-1.md)
- **Status**: in-progress
- **Current Phase**: Phase 3 validation in progress

## Active Phases
- **Phase 1: Source Audit and Planning** — completed
- **Phase 2: Keybinding Migration** — completed
- **Phase 3: Validation and Guardrails** — in-progress

## Next Milestones
1. Re-test `/files` and `pi-fzf` selector navigation/confirm/cancel in live TUI after dependency upgrade.
2. If pass, complete `task-pi611t03`, close story `pi611s01`, and set test coverage to full.

## Evidence Snapshot
- Upstream migration source: `badlogic/pi-mono` `CHANGELOG.md` (`0.61.0` namespaced keybindings, `0.61.1` `ToolCallEventResult`).
- Root cause discovered during runtime validation: extension workspace dependencies were stale (`@mariozechner/pi-tui@0.56.2`), incompatible with namespaced key IDs.
- Fixes applied:
  - Upgraded extension workspace deps to `@mariozechner/pi-coding-agent@0.61.1` and `@mariozechner/pi-tui@0.61.1`.
  - Migrated keybinding manager usage from `getEditorKeybindings()` to `getKeybindings()` in:
    - `./devtools/files/pi/agent/extensions/files.ts`
    - `./devtools/files/pi/agent/extensions/pi-fzf/src/selector.ts`
- Static verification:
  - zero legacy selector ids found across `./devtools/files/pi/agent/extensions/**`
  - zero `pi.on("tool_call", ...)` handlers found
