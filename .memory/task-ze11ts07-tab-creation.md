---
id: ze11ts07
title: Implement Basic Tab Creation
created_at: 2026-01-23T13:05:00+10:30
updated_at: 2026-01-23T13:05:00+10:30
status: todo
epic_id: ze11ij01
phase_id: ze11ph03
assigned_to: unassigned
---

# Task: Implement Basic Tab Creation

## Objective

Create `/zellij tab new <tab-name> <cwd> [--preset <preset-name>]` command for blank tabs.

## Steps

1. Implement `handleTabNew(args: string, ctx: ExtensionCommandContext)`

2. Parse arguments:
   - `tab-name` (required)
   - `cwd` (required)
   - `--preset <name>` (optional)

3. Validate:
   - Check in Zellij session using `isInZellijSession()`
   - Validate CWD exists

4. For blank tab (no preset):
   - Execute: `zellij action new-tab --name <tab-name> --cwd <cwd>`
   - Show success: "✓ Created tab '<tab-name>'"

5. For preset tab:
   - Load preset using `getPreset(name)`
   - Validate preset exists
   - Execute: `zellij action new-tab --name <tab-name> --cwd <cwd> --layout <preset.layout>`
   - Show success: "✓ Created tab '<tab-name>' with preset '<preset-name>'"
   - (Commands will be applied in next task)

6. Handle errors:
   - "Not in Zellij session"
   - "Directory not found: <cwd>"
   - "Preset not found: <name>"

## Expected Outcome

- Blank tabs created successfully
- Tabs with layouts created (without pane commands yet)
- Clear error messages

## Acceptance Criteria

- [ ] Command parses all arguments
- [ ] Blank tabs work
- [ ] Layout applied from preset
- [ ] Error handling complete

## Lessons Learned

(To be filled after completion)
