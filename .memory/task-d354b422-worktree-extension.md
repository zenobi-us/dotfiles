---
id: d354b422
title: Worktree Extension Implementation
created_at: 2026-01-21T14:28:00+10:30
updated_at: 2026-01-21T14:50:00+10:30
status: completed
epic_id: standalone
phase_id: standalone
assigned_to: session-current
---

# Worktree Extension Implementation

## Objective

Create a Pi-mono extension that codifies the git worktree workflow from the `using-git-worktrees` skill into an interactive slash command.

## Design Decisions (via Q&A)

1. **Directory Strategy**: Config-first with smart default
   - Default: `../<projectname>.worktrees/`
   - Override via `~/.pi/settings.json` → `worktree.parentDir`

2. **Project Setup**: None - user handles manually

3. **Test Verification**: None - user runs manually

4. **Gitignore Handling**: Smart exclusion
   - If worktree dir inside repo: add to `.git/info/exclude`
   - Otherwise: no action needed

5. **Commands**: All 6 subcommands
   - `create`, `list`, `remove`, `status`, `cd`, `prune`

6. **Post-Create Hook**: Flexible API
   - `onCreate: string | ((ctx: WorktreeCreatedContext) => Promise<void>)`
   - String: shell command with template vars, cwd=worktree path
   - Function: full context object

7. **UI**: Slash commands only (no keyboard shortcuts)

## Implementation

**File**: `devtools/files/pi/agent/extensions/worktree/index.ts`

### Features Implemented

- [x] `/worktree create <name>` - Create worktree with new branch
- [x] `/worktree list` (alias: `ls`) - List all worktrees
- [x] `/worktree remove <name>` (alias: `rm`) - Remove worktree safely
- [x] `/worktree status` - Show current worktree info
- [x] `/worktree cd <name>` - Print path for shell integration
- [x] `/worktree prune` - Clean stale references
- [x] Settings support via `~/.pi/settings.json`
- [x] Template variables: `{{path}}`, `{{name}}`, `{{branch}}`, `{{project}}`
- [x] onCreate hook (string or function)
- [x] Smart `.git/info/exclude` management
- [x] Confirmation dialogs for destructive operations

### Configuration

```json
// ~/.pi/settings.json
{
  "worktree": {
    "parentDir": "~/.local/share/worktrees/{{project}}",
    "onCreate": "mise setup"
  }
}
```

### Template Variables

| Variable | Description |
|----------|-------------|
| `{{path}}` | Full worktree path |
| `{{name}}` | Feature/worktree name |
| `{{branch}}` | Branch name (e.g., `feature/auth`) |
| `{{project}}` | Project name |

## Expected Outcome

- [x] Extension compiles without errors
- [x] All 6 commands implemented
- [x] Flexible configuration via settings.json
- [x] onCreate hook supports both string and function forms

## Actual Outcome

Extension fully implemented with all planned features. TypeScript compiles successfully. Ready for testing.

## Lessons Learned

1. **Q&A skill effective** for design validation before coding
2. **Dual API pattern** (string | function) provides flexibility without complexity
3. **Template variables** keep string config simple while allowing customization
4. **`.git/info/exclude`** better than `.gitignore` for local-only exclusions
