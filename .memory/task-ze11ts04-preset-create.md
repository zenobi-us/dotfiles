---
id: ze11ts04
title: Implement Preset Creation Command
created_at: 2026-01-23T13:05:00+10:30
updated_at: 2026-01-23T13:05:00+10:30
status: todo
epic_id: ze11ij01
phase_id: ze11ph02
assigned_to: unassigned
---

# Task: Implement Preset Creation Command

## Objective

Create `/zellij preset create <name>` command with interactive prompts.

## Steps

1. Implement `handlePresetCreate(args: string, ctx: ExtensionCommandContext)`

2. Parse preset name from args
   - Validate name is provided
   - Check if preset already exists (confirm overwrite)

3. Interactive prompts (using `ctx.ui.input()` and `ctx.ui.select()`):
   - **Layout name**: "Enter Zellij layout file name (from ~/.config/zellij/layouts/):"
     - Validate file exists using `validateLayoutExists()`
   - **Number of panes**: "How many panes in this layout?"
   - For each pane:
     - **Pane ID**: "Enter pane identifier (e.g., 'main', 'sidebar'):"
     - **Command**: "Enter command to run in this pane:"
     - **Args**: "Enter command arguments (space-separated, or empty):"
     - **CWD**: "Enter working directory (or empty for default):"

4. Build `ZellijPreset` object from inputs

5. Validate using `validatePreset()`

6. Save using `setPreset(name, preset)`

7. Show success message with preset summary

## Expected Outcome

- Users can create presets interactively
- All fields validated before saving
- Existing presets can be overwritten with confirmation

## Acceptance Criteria

- [ ] Command parses name correctly
- [ ] All prompts display properly
- [ ] Layout file existence checked
- [ ] Preset saved to JSON file
- [ ] Success message shows preset details

## Lessons Learned

(To be filled after completion)
