---
id: ze11ph03
title: Phase 3 - Tab Creation with Presets
created_at: 2026-01-23T13:05:00+10:30
updated_at: 2026-01-23T13:05:00+10:30
status: todo
epic_id: ze11ij01
start_criteria: Phase 2 complete - preset management functional
end_criteria: Tab creation with preset application working
---

# Phase 3: Tab Creation with Presets

## Overview

Implement tab creation command that applies presets to configure panes and run commands.

## Deliverables

1. `/zellij tab new <tab-name> <cwd> [--preset <preset-name>]` command
2. Preset application logic (layout + pane commands)
3. Tab closing command (bonus)

## Tasks

- `.memory/task-ze11ts07-tab-creation.md` - Implement basic tab creation
- `.memory/task-ze11ts08-preset-application.md` - Apply presets to tabs
- `.memory/task-ze11ts09-pane-focusing.md` - Focus panes and run commands

## Dependencies

- Phase 2 must be complete
- Understanding of Zellij pane IDs/navigation

## Next Steps

After completion, move to Phase 4: Polish & Testing
