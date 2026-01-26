---
id: ze11ts05
title: Implement Preset Listing
created_at: 2026-01-23T13:05:00+10:30
updated_at: 2026-01-23T13:05:00+10:30
status: todo
epic_id: ze11ij01
phase_id: ze11ph02
assigned_to: unassigned
---

# Task: Implement Preset Listing

## Objective

Create `/zellij preset list` command to display all available presets.

## Steps

1. Implement `handlePresetList(args: string, ctx: ExtensionCommandContext)`

2. Load all presets using `loadPresets()`

3. Check if empty:
   - Show "No presets defined. Create one with /zellij preset create <name>"

4. Format output:
   ```
   Available Zellij Presets:
   
   preset-name
     Layout: layout-file-name
     Panes: 3
       - main: npm run dev (cwd: ~/project)
       - sidebar: nvim
       - terminal: zsh
   
   another-preset
     Layout: simple
     Panes: 1
       - main: zsh
   ```

5. Display using `ctx.ui.notify()`

## Expected Outcome

- All presets displayed in readable format
- Shows layout name and pane details
- Helpful message if no presets exist

## Acceptance Criteria

- [ ] Command loads presets correctly
- [ ] Format is clear and readable
- [ ] Empty state handled gracefully
- [ ] Shows all relevant preset details

## Lessons Learned

(To be filled after completion)
