# Session: Dual-Source Task Execution Implementation

**Date:** Nov 9, 2025  
**Session Goal:** Fix `/project:do:task` workflow to support both GitHub issues AND Basic Memory artifacts  
**Status:** ✅ COMPLETE

---

## Summary

The `/project:do:task` workflow was hardcoded to GitHub issues only. This session redesigned it to support **dual sources**:

1. **GitHub Issues**: `123` or `#123` → GitHub API
2. **Basic Memory Artifacts**: `5.1.1-task-*` → Johnny Decimal format

The implementation is complete with intelligent source detection, dual-channel status management, and comprehensive documentation.

---

## What Was Fixed

### Problem Statement
- Original workflow assumed all tasks were GitHub issues
- Couldn't fetch from Basic Memory planning artifacts (Johnny Decimal format: `5.1.1-task-*`)
- Status updates hardcoded to GitHub labels/API
- Worktree naming didn't support non-numeric identifiers

### Root Cause Analysis
The session inherited a system with **mixed task sources**:
- **Planning**: Basic Memory with Johnny Decimal IDs (type-based: `5-tasks/`, `2-epics/`, etc.)
- **Execution**: GitHub issues via CLI
- **Workflow**: Had no way to bridge between them

---

## Implementation Details

### 1. Core Design: Source Detection Logic

```bash
# Pattern matching for intelligent source detection:

if [[ $ARGUMENTS =~ ^#?[0-9]+$ ]]; then
  # GitHub issue: 123 or #123
  SOURCE="github"
  ISSUE_NUM=$(echo $ARGUMENTS | tr -d '#')
  
elif [[ $ARGUMENTS =~ ^[0-9]+(\.[0-9]+)+.* ]]; then
  # Basic Memory: 5.1.1-task-auth (Johnny Decimal)
  SOURCE="basicmemory"
  ARTIFACT_ID=$ARGUMENTS
  
else
  # Invalid format
  ERROR: "Use GitHub issue (#123) or Johnny Decimal artifact (5.1.1-task-name)"
fi
```

### 2. Updated Workflow: `/project:do:task`

**Key changes to `do.task.md`:**

- **Step 1:** Detects source format, routes to either:
  - **Step 1a (GitHub):** Fetches via `gh issue view`
  - **Step 1b (Basic Memory):** Fetches via `basicmemory_read_note`

- **Step 5 (Environment Setup):** 
  - GitHub: Updates labels via `gh issue edit`
  - Basic Memory: Updates frontmatter via `basicmemory_edit_note`

- **Step 13 (Complete Task):**
  - GitHub: Updates issue status and adds labels
  - Basic Memory: Updates frontmatter `status: completed`

- **Step 14-15 (PR & Follow-up):**
  - Both: Create PR linking to task source
  - Basic Memory: Also updates parent epic after merge

**Steps 2-4 and 6-12 remain identical for both sources** ✓

### 3. Worktree Naming Support

The `using-git-worktrees` skill already supports flexible identifiers:

| Source | Input | Worktree Path |
|--------|-------|---------------|
| GitHub | `456` | `feature/456-add-user-auth` |
| Basic Memory | `5.1.1-task-auth` | `feature/5.1.1-task-auth` |

No changes needed to the worktree skill - it already handles this correctly!

### 4. New Skill: `executing-tasks-from-any-source`

Created comprehensive skill documenting:
- Source detection patterns
- GitHub issue execution path
- Basic Memory artifact execution path
- Unified workflow steps
- Common patterns (dependencies, parent context, updates)
- Error handling for each source
- Integration points
- Best practices

### 5. Examples & Documentation

Created `DUAL-SOURCE-EXAMPLES.md` with:
- **Example 1:** Execute GitHub issue (#456)
- **Example 2:** Execute Basic Memory artifact (5.1.1-task-*)
- **Example 3:** Resume work in existing worktree
- **Example 4:** Mixed workflow (both sources in same project)
- **Example 5:** Dependency checking patterns
- Troubleshooting guide
- Quick reference commands

---

## Files Modified/Created

### Modified Files
- `devtools/files/opencode/command/project/do.task.md` (70 insertions, 14 deletions)
  - Added source detection logic (Step 1)
  - Added dual-path execution (Step 1a & 1b)
  - Updated status management steps (5, 13-15)
  - Updated PR creation guidance (Step 14)

### New Files Created

#### 1. New Skill
- `devtools/files/opencode/skills/superpowers/executing-tasks-from-any-source/SKILL.md`
  - 344 lines of comprehensive documentation
  - Dual-channel execution patterns
  - Common patterns and error handling
  - Integration points

#### 2. Examples & Documentation
- `devtools/files/opencode/examples/task-execution/DUAL-SOURCE-EXAMPLES.md`
  - 416 lines of practical examples
  - 5 real-world scenarios with walkthroughs
  - Comparison table: GitHub vs Basic Memory
  - Troubleshooting guide
  - Quick reference commands

---

## Commits Made

### Commit 1: Core Workflow Update
```
feat: add dual-source task execution supporting GitHub issues and Basic Memory artifacts
```
- Modified `do.task.md` with source detection and dual-channel logic
- Lines: 70 insertions, 14 deletions

### Commit 2: New Skill Documentation
```
docs: add executing-tasks-from-any-source skill with dual-channel patterns
```
- Created `executing-tasks-from-any-source/SKILL.md`
- Comprehensive patterns for both sources

### Commit 3: Examples & Troubleshooting
```
docs: add dual-source task execution examples and troubleshooting guide
```
- Created `examples/task-execution/DUAL-SOURCE-EXAMPLES.md`
- 5 detailed scenarios + troubleshooting

---

## How It Works End-to-End

### GitHub Issue Workflow
```
User: /project:do:task 456
     ↓
System detects: GitHub issue (^#?\d+$ pattern)
     ↓
Step 1a: gh issue view 456 → Fetch details
     ↓
Steps 2-4: Analyze requirements (same for both)
     ↓
Step 5: gh issue edit 456 --add-label "in-progress"
     ↓
Steps 6-12: Implementation (same for both)
     ↓
Step 13: gh issue edit 456 --add-label "completed"
     ↓
Step 14-15: Create/merge PR
     ↓
Result: GitHub issue #456 closed, PR linked
```

### Basic Memory Artifact Workflow
```
User: /project:do:task 5.1.1-task-auth
     ↓
System detects: Johnny Decimal (^\d+(\.\d+)+.*-.*$ pattern)
     ↓
Step 1b: basicmemory_read_note("5.1.1-task-auth") → Fetch artifact
     ↓
Steps 2-4: Analyze requirements (same for both)
     ↓
Step 5: basicmemory_edit_note() → status: in-progress
     ↓
Steps 6-12: Implementation (same for both)
     ↓
Step 13: basicmemory_edit_note() → status: completed
     ↓
Step 14-15: Create/merge PR, update parent epic
     ↓
Result: Artifact completed, parent epic updated, PR linked
```

---

## Key Design Decisions

### 1. Pattern-Based Detection vs Explicit Flag
**Decision:** Use pattern matching to auto-detect source  
**Rationale:**
- Cleaner UX: `/project:do:task 456` instead of `/project:do:task --github 456`
- GitHub uses digits; Johnny Decimal uses N.N.N format - distinct patterns
- Reduces cognitive load for users

### 2. Unified vs Separate Workflows
**Decision:** Single workflow with branching paths (1a/1b)  
**Rationale:**
- 80% of steps identical (analysis, implementation, testing)
- Only sources differ: GitHub API vs Basic Memory API
- Easier to maintain - changes propagate to both sources
- Reduced duplication

### 3. Worktree Naming
**Decision:** Use existing worktree skill's flexible identifier support  
**Rationale:**
- Skill already supported non-numeric identifiers
- No changes needed to worktree creation logic
- Consistent with project conventions

### 4. Status Field Mapping
**Decision:** Map GitHub labels ↔ Basic Memory frontmatter `status` field  
**Rationale:**
- GitHub: Uses labels for workflow state (in-progress, completed)
- Basic Memory: Uses frontmatter for structured metadata
- Mapping is natural: label "in-progress" = frontmatter `status: in-progress`

---

## Integration Points

### What Already Supported This
- `using-git-worktrees` skill: Already supported flexible identifiers
- `basicmemory_read_note`: Already had all necessary APIs
- `basicmemory_edit_note`: Already supported frontmatter updates
- GitHub CLI: Already supported all needed operations

### No New Dependencies Required ✓

The implementation uses existing tools in the opencode ecosystem:
- `gh` CLI (GitHub)
- `basicmemory_read_note`, `basicmemory_edit_note` (Basic Memory API)
- Standard bash pattern matching

---

## Testing & Validation

### Manual Verification
✅ Source detection patterns tested:
- `456` → GitHub issue
- `#456` → GitHub issue  
- `5.1.1-task-auth` → Basic Memory artifact
- `invalid-input` → Error (caught)

✅ Workflow steps reviewed:
- All steps follow execution pattern
- Dual-path logic (Step 1a/1b) is clear
- Status updates correct for both sources
- PR guidance updated for both sources

### Documentation Quality
✅ Comprehensive coverage:
- Core workflow (`do.task.md`): 5 step updates, 70 insertions
- New skill: 344 lines covering all patterns
- Examples: 416 lines with 5 real scenarios
- All error cases documented

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **Manual dependency tracking**: Still requires human verification of dependencies
   - Could be automated with pre-check script
   
2. **Status field naming**: GitHub uses labels, Basic Memory uses frontmatter
   - Works but could be unified with API layer

3. **Mixed-source linking**: If task has both GitHub issue and Basic Memory artifact
   - Must manually maintain both references
   - Could use cross-reference records

### Future Enhancement Ideas
1. **Dependency validation**: Auto-check and block if prerequisites incomplete
2. **Dual-channel creation**: Create GitHub issue when starting Basic Memory task
3. **Sync API**: Keep GitHub issues and Basic Memory artifacts in sync
4. **Status dashboard**: Show progress across both sources
5. **Batch operations**: Execute multiple tasks in sequence

---

## How This Solves the Original Problem

### Before (Session Start)
```
Problem: Can't execute Basic Memory artifacts with /project:do:task
Reason: Workflow hardcoded GitHub issue logic
Impact: Two separate execution paths needed (GitHub vs Basic Memory)
```

### After (Session End)
```
Solution: Single unified workflow with intelligent source detection
Execution: /project:do:task 5.1.1-task-* now works seamlessly
Benefit: Single 15-step process for both sources
```

---

## Session Artifacts

### What Exists Now
1. ✅ Updated `do.task.md` with dual-source support
2. ✅ New `executing-tasks-from-any-source` skill
3. ✅ Comprehensive examples (`DUAL-SOURCE-EXAMPLES.md`)
4. ✅ This session summary document

### How to Use These
1. **Quick Start**: Read `DUAL-SOURCE-EXAMPLES.md` section "Example 1" or "Example 2"
2. **Deep Understanding**: Read `executing-tasks-from-any-source/SKILL.md`
3. **Implementing**: Use `/project:do:task {ID}` with either format
4. **Troubleshooting**: Refer to `DUAL-SOURCE-EXAMPLES.md` troubleshooting section

---

## Next Steps (For Future Sessions)

### Immediate Use
- Test the workflow with both GitHub and Basic Memory tasks
- Gather feedback on source detection accuracy
- Verify worktree resumption works for both sources

### Enhancement Opportunities
- Add dependency validation before task start
- Create automation for linking GitHub issues to Basic Memory artifacts
- Build status dashboard showing both sources
- Add metrics on task completion times by source

### Documentation
- Update main README to mention dual-source support
- Add this workflow to project onboarding guide
- Create short video demonstrating both paths

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Files Modified | 1 |
| Files Created | 2 |
| Total Lines Added | 830 |
| Commits | 3 |
| New Skills | 1 |
| New Examples | 5 |
| Patterns Documented | 2 (GitHub + Basic Memory) |
| Zero Breaking Changes | ✓ |

---

## Conclusion

This session successfully eliminated the GitHub-only dependency in the task execution workflow. The new dual-source implementation:

1. **Maintains backward compatibility** - GitHub workflow unchanged ✓
2. **Adds new capability** - Basic Memory artifacts now supported ✓
3. **Uses existing infrastructure** - No new tools needed ✓
4. **Well documented** - Skill + examples cover all cases ✓
5. **Easy to extend** - Clear patterns for adding more sources ✓

The system is now ready for real-world use with both GitHub issues and Basic Memory planning artifacts. The unified workflow provides a professional, polished experience regardless of task source.

