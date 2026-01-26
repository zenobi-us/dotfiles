---
id: ze11ts06
title: Implement Preset Deletion
created_at: 2026-01-23T13:05:00+10:30
updated_at: 2026-01-23T13:05:00+10:30
status: todo
epic_id: ze11ij01
phase_id: ze11ph02
assigned_to: unassigned
---

# Task: Implement Preset Deletion

## Objective

Create `/zellij preset delete <name>` command to remove presets.

## Steps

1. Implement `handlePresetDelete(args: string, ctx: ExtensionCommandContext)`

2. Parse preset name from args
   - Validate name is provided
   - Check if preset exists

3. Show confirmation prompt:
   - `ctx.ui.confirm("Delete preset '<name>'?", "This cannot be undone.")`

4. If confirmed:
   - Call `deletePreset(name)`
   - Show success message: "✓ Preset '<name>' deleted"

5. If cancelled:
   - Show "Deletion cancelled"

6. If preset doesn't exist:
   - Show error: "Preset '<name>' not found"

## Expected Outcome

- Users can delete presets safely with confirmation
- Non-existent presets handled gracefully
- Clear feedback on success/failure

## Acceptance Criteria

- [ ] Command parses name correctly
- [ ] Confirmation prompt works
- [ ] Preset deleted from JSON file
- [ ] Success/error messages appropriate
- [ ] Non-existent preset handled

## Lessons Learned

(To be filled after completion)
