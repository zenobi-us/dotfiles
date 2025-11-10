# Quick Reference: Dual-Source Task Execution

## One-Liner Format

```bash
/project:do:task {GITHUB_ISSUE_OR_ARTIFACT_ID}
```

## Input Formats

| Format | Example | Source |
|--------|---------|--------|
| Issue number | `123` | GitHub |
| Issue with # | `#123` | GitHub |
| Johnny Decimal | `5.1.1-task-name` | Basic Memory |

## Examples

### GitHub Issue
```bash
/project:do:task 456
/project:do:task #456
```

### Basic Memory Artifact
```bash
/project:do:task 5.1.1-task-user-auth
/project:do:task 5.2.1-epic-payment-system
```

## What Happens

### GitHub Issue Flow
```
Input: 456
  ↓
Fetch: gh issue view 456
  ↓
Status: in-progress label added
  ↓
Worktree: feature/456-{slug}
  ↓
Implement: 15-step process
  ↓
Status: completed label added
  ↓
PR: Links to issue #456
```

### Basic Memory Artifact Flow
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
/project:do:task 456          # Resumes if worktree exists
/project:do:task 5.1.1-task-auth  # Resumes if worktree exists
```

## Check Dependencies

### GitHub
```bash
gh issue view 456 --json linkedIssues
```

### Basic Memory
```bash
basicmemory_read_note("5.1.1-task-auth")
# Look for: dependencies field and "depends_on [[...]]"
```

## Update Status Manually

### GitHub (Start)
```bash
gh issue edit 456 --add-label "in-progress"
gh issue comment 456 -b "Implementation started"
```

### GitHub (Complete)
```bash
gh issue edit 456 --add-label "completed" --remove-label "in-progress"
gh issue comment 456 -b "Completed in PR #789"
```

### Basic Memory (Start)
```bash
basicmemory_edit_note("5.1.1-task-auth", "find_replace", 
  "status: \"pending\"", "status: \"in-progress\"")
```

### Basic Memory (Complete)
```bash
basicmemory_edit_note("5.1.1-task-auth", "find_replace",
  "status: \"in-progress\"", "status: \"completed\"")
```

## Check Task Details

### GitHub
```bash
gh issue view 456 --json title,body,labels,assignees
```

### Basic Memory
```bash
basicmemory_read_note("5.1.1-task-auth")
# Shows: title, content, frontmatter (status, epic_id, priority)
```

## Common Commands

| Task | Command |
|------|---------|
| List GitHub issues | `gh issue list` |
| Search Basic Memory | `basicmemory_search_notes("authentication")` |
| Find artifact folder | Read `5-tasks/` folder structure |
| Check worktree | `git worktree list` |
| Delete worktree | `git worktree remove ../<project>.worktrees/{id}` |

## Error Messages

| Error | Fix |
|-------|-----|
| "Invalid task format" | Use `456` or `#456` (GitHub) or `5.1.1-task-*` (Basic Memory) |
| "Issue not found" | Verify issue number exists |
| "Artifact not found" | Verify artifact ID in `5-tasks/` folder |
| "Worktree exists" | Resume work (same command) or delete first |

## File Locations

| Item | Path |
|------|------|
| Task workflow | `devtools/files/opencode/command/project/do.task.md` |
| Skill guide | `devtools/files/opencode/skills/superpowers/executing-tasks-from-any-source/SKILL.md` |
| Examples | `devtools/files/opencode/examples/task-execution/DUAL-SOURCE-EXAMPLES.md` |

## Documentation Links

- **Workflow Details**: See `do.task.md` (15-step process)
- **Patterns & Examples**: See `DUAL-SOURCE-EXAMPLES.md` (5 scenarios)
- **Full Skill Guide**: See `executing-tasks-from-any-source/SKILL.md`
- **Session Summary**: See `SESSION-DUAL-SOURCE-TASK-EXECUTION.md`

## Key Takeaways

✓ One command for both GitHub and Basic Memory  
✓ Intelligent source detection  
✓ Same 15-step workflow for both  
✓ Automatic worktree creation and resumption  
✓ Status management in appropriate channel  
✓ Full documentation and examples provided  

## Pro Tips

1. **Always check dependencies** before starting
2. **Update status immediately** when starting work
3. **Use consistent naming** across both channels
4. **Link artifacts to issues** in both directions
5. **Resume with same command** - no duplication
6. **Read the full SKILL.md** for advanced patterns

