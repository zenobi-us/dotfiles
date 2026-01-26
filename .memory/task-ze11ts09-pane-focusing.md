---
id: ze11ts09
title: Pane Focusing and Command Execution
created_at: 2026-01-23T13:05:00+10:30
updated_at: 2026-01-23T13:05:00+10:30
status: todo
epic_id: ze11ij01
phase_id: ze11ph03
assigned_to: unassigned
---

# Task: Pane Focusing and Command Execution

## Objective

Implement reliable pane focusing and command execution mechanism.

## Steps

1. Research Zellij pane identification:
   - Test `zellij action dump-layout` to see pane structure
   - Identify how panes are numbered/named in layouts
   - Determine best targeting method

2. Implement `focusPaneById(id: string): boolean`
   - Try focusing by pane ID from preset
   - Return true if successful, false otherwise

3. Implement `executeInPane(command: string, args: string[], cwd?: string): void`
   - Build full command: `cd <cwd> && <command> <args>`
   - Use `zellij action write <command>\n` to execute
   - Handle command escaping for special characters

4. Test command execution:
   - Simple commands: `ls`, `echo "test"`
   - Long-running: `npm run dev`, `nvim`
   - With args: `git status --short`
   - With CWD: Commands in specific directories

5. Add retry logic if pane focus fails initially

6. Document pane ID conventions for users:
   - How to name panes in layout files
   - How IDs in presets map to layout panes

## Expected Outcome

- Reliable pane focusing
- Commands execute correctly
- CWD changes work
- Long-running processes start properly

## Acceptance Criteria

- [ ] Pane focusing reliable
- [ ] Command execution works for all types
- [ ] CWD changes applied correctly
- [ ] Error handling for failed focus

## Lessons Learned

(To be filled after completion)
