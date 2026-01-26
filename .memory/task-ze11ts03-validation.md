---
id: ze11ts03
title: Add Preset Validation Logic
created_at: 2026-01-23T13:05:00+10:30
updated_at: 2026-01-23T13:05:00+10:30
status: completed
epic_id: ze11ij01
phase_id: ze11ph01
assigned_to: unassigned
---

# Task: Add Preset Validation Logic

## Objective

Validate preset structure before saving to catch errors early.

## Steps

1. Implement `validatePreset(preset: unknown): preset is ZellijPreset`
   - Check `layout` is a non-empty string
   - Check `panes` is an array
   - For each pane:
     - `id` is a non-empty string
     - `command` is a non-empty string
     - `args` is optional string array
     - `cwd` is optional string

2. Implement `validateLayoutExists(layoutName: string): boolean`
   - Check if `~/.config/zellij/layouts/${layoutName}.kdl` exists
   - Return true/false
   - Used during preset creation/validation

3. Update `setPreset()` to use validation
   - Call `validatePreset()` before saving
   - Throw descriptive error if invalid

4. Add helpful error messages:
   - "Invalid preset structure: <details>"
   - "Layout file not found: ~/.config/zellij/layouts/<name>.kdl"
   - "Preset must have at least one pane"

## Expected Outcome

- Invalid presets are rejected before saving
- Users get clear error messages about what's wrong
- Layout file existence can be checked

## Acceptance Criteria

- [ ] `validatePreset()` catches all structural errors
- [ ] `validateLayoutExists()` checks filesystem correctly
- [ ] Error messages are actionable and clear
- [ ] Validation integrated into save flow

## Lessons Learned

(To be filled after completion)
