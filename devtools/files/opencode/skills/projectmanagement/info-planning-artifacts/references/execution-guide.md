# Quick Reference: Task Execution

## One-Liner Format

```bash
/project:do:task {ARTIFACT_ID}
```

## Input Format

Use Johnny Decimal artifact ID format:

```bash
/project:do:task 5.1.1-task-user-auth
/project:do:task 5.2.1-task-payment-system
```

## What Happens

### Artifact Execution Flow
```
Input: 5.1.1-task-auth
  ↓
Fetch: basicmemory_read_note("5.1.1-task-auth")
  ↓
Status: frontmatter status → "in-progress"
  ↓
Worktree: feature/5.1.1-task-auth
  ↓
Implement: 15-step process
  ↓
Status: frontmatter status → "completed"
  ↓
PR: Links to artifact 5.1.1-task-auth
```

## Resume Work

Same command resumes existing worktree:
```bash
/project:do:task 5.1.1-task-auth  # Resumes if worktree exists
```

## Check Dependencies

```bash
basicmemory_read_note("5.1.1-task-auth")
# Look for: dependencies field and "depends_on [[...]]"
```

## Update Status Manually

### Start Work
```bash
basicmemory_edit_note("5.1.1-task-auth", "find_replace", 
  "status: \"To Do\"", "status: \"In Progress\"")
```

### Mark Complete
```bash
basicmemory_edit_note("5.1.1-task-auth", "find_replace",
  "status: \"In Review\"", "status: \"Done\"")
```

## Check Task Details

```bash
basicmemory_read_note("5.1.1-task-auth")
# Shows: title, content, frontmatter (status, epic_id, priority)
```

## Common Commands

| Task | Command |
|------|---------|
| Search artifacts | `basicmemory_search_notes("authentication")` |
| Find artifact folder | Read `5-tasks/` folder structure |
| Check worktree | `git worktree list` |
| Delete worktree | `git worktree remove ../<project>.worktrees/{id}` |

## Error Messages

| Error | Fix |
|-------|-----|
| "Invalid task format" | Use `5.1.1-task-*` (Johnny Decimal format) |
| "Artifact not found" | Verify artifact ID in `5-tasks/` folder |
| "Worktree exists" | Resume work (same command) or delete first |

## File Locations

| Item | Path |
|------|------|
| Task workflow | `devtools/files/opencode/command/project/do.task.md` |
| Planning artifacts info | `devtools/files/opencode/skills/projectmanagement/info-planning-artifacts/SKILL.md` |
| Templates | `devtools/files/opencode/skills/projectmanagement/info-planning-artifacts/references/templates/` |

## Documentation Links

- **Workflow Details**: See `do.task.md` (15-step process)
- **Artifact Information**: See `../SKILL.md` (planning artifacts guide)
- **Templates**: See `templates/` directory
- **Status Workflow**: See `STATUS_WORKFLOW_CONTROL_ANALYSIS.md` (project root)

## Key Takeaways

✓ Simple Johnny Decimal format for task specification  
✓ Automatic worktree creation and resumption  
✓ Status management in artifact frontmatter  
✓ Full integration with planning artifacts system  
✓ Support for blocking and dependencies  

## Pro Tips

1. **Always check dependencies** before starting work
2. **Update status immediately** when starting and completing
3. **Use consistent artifact IDs** (Johnny Decimal format)
4. **Link tasks to stories and epics** in frontmatter
5. **Resume with same command** - no duplication needed
6. **Review task templates** for proper structure

