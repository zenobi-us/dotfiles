# Phase 5: Execution

**Goal:** Implement assigned [Task] artifacts according to priorities and dependencies.

**Prerequisite:** Phase 4 (Delegation) must be complete. (Usually executed by subagents assigned to specific tasks.)

## Overview

This phase is about doing the work. Each team member (or subagent) works on their assigned [Task] in the context established by earlier phases.

## For Each Task

### Starting a New Task

If you're starting a new [Task]:

1. Read the [Task] artifact completely:
   - Understand what needs to be done (task description)
   - Review implementation steps
   - Know the Definition of Done
   - Understand dependencies

2. Review related artifacts:
   - Parent [Story] - understand user value
   - Parent [Epic] - understand broader context
   - Linked [Research] - understand investigation that shaped this work
   - Linked [Decision] - understand choices made
   - Blocking/dependent tasks - understand impact

3. Create a git worktree for this task:
   - Use `skills_superpowers_using-git-worktrees`
   - Worktree name should be based on task ID (e.g., `0001.5.0001`)
   - Keep work isolated until completion

4. Update [Task] status to "In Progress"

5. Document work as you go:
   - Update [Task] "Work Log" section with progress
   - Document decisions made in [Decision] artifacts
   - Link to any research/exploration done

### During Execution

- **Work in phases:**
  1. Implement according to implementation steps
  2. Test according to QA testing steps
  3. Document according to Definition of Done

- **Update status regularly:**
  - "To Do" → "In Progress" when starting
  - "In Progress" → "In Review" when ready for review
  - "In Review" → "Done" when approved
  - "In Progress" → "Blocked" if something stops progress

- **If you encounter unexpected information:**
  - **New requirements emerge:** Stop and discuss "[WARNING] EDGE CASE DISCOVERED"
  - **Unresolved decisions needed:** Create [Decision] artifact with status "Unresolved"
  - **Blockers encountered:** Update status to "Blocked", document what's blocking, discuss with manager
  - **Design issues discovered:** Create [Decision] artifact, link from [Task]

- **Document decisions made:** All decisions should be recorded as [Decision] artifacts and linked from the [Task]

### Continuing a Task

If continuing work on existing [Task]:

1. Read the [Task] artifact and review [Work Log]
2. Check current status and what was last done
3. Switch to the existing git worktree:
   - Use `skills_superpowers_using-git-worktrees`
   - Reference existing worktree by name
4. Continue from where previous work left off

## Managing Blockers

If blocked:

1. **Update [Task] status to "Blocked"**
2. **Document the blocker:** What exactly is blocking progress?
3. **Link to blocking task** (if another task is blocking you)
4. **Escalate:** Discuss with manager "[WARNING] BLOCKED"
5. **Don't just wait:** Look for other unblocked work to do

## Validation Checklist (CRITICAL - Complete Task Definition of Done)

Each [Task] has a Definition of Done in its template. Before marking a task Done:

**The following MUST be true:**

- [ ] All implementation steps from [Task] are complete
- [ ] All code follows team standards and conventions
- [ ] Code has been reviewed and approved
- [ ] All automated tests pass (unit, integration)
- [ ] No console errors or warnings
- [ ] Performance meets requirements (if specified)
- [ ] Accessibility requirements met (if specified)
- [ ] Documentation/code comments updated
- [ ] No known bugs or issues remain
- [ ] Definition of Done criteria met
- [ ] [Work Log] in [Task] has been updated with final status

**If any item is not checked, task is NOT done. Continue work.**

## Project-Level Validation (Before Phase 6)

**When all team members have completed their tasks:**

- [ ] All assigned [Task] are marked as "Done"
- [ ] All work completed meets Definition of Done criteria
- [ ] Any [Decision] artifacts with status "Unresolved" are documented
- [ ] No [Task] remain in "Blocked" status without resolution plans
- [ ] All team members confirm their assigned work is complete

**If any item is not checked, return to execution.**

## Common Pitfalls to Avoid

- ❌ **Starting before understanding context** → Build wrong thing
- ❌ **Not reading linked artifacts** → Miss critical context/decisions
- ❌ **Skipping Definition of Done** → Incomplete work ships
- ❌ **Not updating Work Log** → Next person has no idea what was done
- ❌ **Ignoring blockers** → Wasted effort on unblockable work
- ❌ **Not documenting decisions** → Future maintenance is hard
- ❌ **Not creating git worktree** → Changes get mixed up
- ❌ **Assuming you know the requirement** → Build wrong thing

## Tips for Success

- ✅ Read the entire [Task] before starting (saves time downstream)
- ✅ Review parent [Story] to understand user value
- ✅ Check linked [Research] and [Decision] for context
- ✅ Be honest about blockers early (don't wait)
- ✅ Update [Work Log] frequently (helps next person)
- ✅ Create [Decision] artifacts for architectural choices
- ✅ Test thoroughly according to QA testing steps
- ✅ Ask questions if acceptance criteria are unclear
- ✅ Remember: your work unblocks other people's work (don't leave them hanging)

## Next Step

Once all tasks are completed → **Phase 6: Monitoring and Controlling**

See: `references/phase-06-monitoring.md`
