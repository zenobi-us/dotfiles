---
id: ze11ts08
title: Apply Presets to Tabs
created_at: 2026-01-23T13:05:00+10:30
updated_at: 2026-01-23T13:05:00+10:30
status: todo
epic_id: ze11ij01
phase_id: ze11ph03
assigned_to: unassigned
---

# Task: Apply Presets to Tabs

## Objective

After tab creation with layout, execute commands in each pane according to preset.

## Steps

1. Research how to target specific panes in Zellij:
   - Options: pane index, pane ID, pane name
   - Test: `zellij action focus-pane-by-index <n>`
   - Or: `zellij action write <pane-id> <text>` if supported

2. Implement `applyPresetToTab(preset: ZellijPreset, tabName: string)`
   - Wait briefly for layout to initialize (e.g., 100ms)
   - For each pane in `preset.panes`:
     - Focus pane (by ID or index)
     - Build command string from `command + args`
     - Change directory if `cwd` specified: `cd <cwd> && <command>`
     - Execute: `zellij action write <command>\n`

3. Update `handleTabNew()` to call `applyPresetToTab()` after tab creation

4. Handle edge cases:
   - Pane doesn't exist in layout
   - Command execution fails
   - Timing issues (layout not ready)

5. Add optional delay configuration for layout initialization

## Expected Outcome

- Commands execute in correct panes
- CWD changes work per pane
- Reliable execution despite timing

## Acceptance Criteria

- [ ] Pane targeting works reliably
- [ ] Commands execute in correct panes
- [ ] CWD changes applied
- [ ] Timing handled properly

## Notes

This may require experimentation with Zellij's pane targeting mechanisms. Consider fallback strategies if direct pane ID targeting isn't available.

## Lessons Learned

(To be filled after completion)
