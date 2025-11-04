# Phase 3: Planning - Break down Stories into Tasks

**Goal:** Create [Task] artifacts that break down each [Story] into specific, atomic work items.

**Prerequisite:** Phase 2 (Planning - Stories) must be complete.

## Steps

1. Read the [Spec] and each [Story] to identify specific work items
2. For each [Story], identify all work needed to implement it
3. Consider any [Research] or [Decision] artifacts that impact [Task] creation
4. Create a delivery schedule that outlines priorities for each [Task]
5. For each [Task]:
   - Create using `references/templates/task_template.md`
   - Link to parent [Story] (storyId in frontmatter)
   - Link to parent [Epic] (epicId in frontmatter)
   - Assign story points using Fibonacci sequence: 1, 2, 3, 5, 8, 13
   - Document implementation steps
   - Define clear acceptance/definition of done
6. Identify task dependencies:
   - Which tasks block other tasks? (blocking relationship)
   - Which tasks depend on other tasks? (dependent_on relationship)
   - Which tasks are related but independent? (related_to relationship)
7. Perform critical path analysis:
   - Identify the longest chain of dependent tasks
   - This determines minimum project duration
   - Flag any task with 3+ blockers/dependencies as high-risk

## Story Point Estimation (Fibonacci Sequence)

Use this sequence for task estimation: **1, 2, 3, 5, 8, 13**

Story points represent **relative complexity and effort**, NOT hours or days. They account for:
- Technical complexity
- Uncertainty and risk
- Dependencies and blockers
- Required testing and verification

**Guidelines for relative sizing:**
- **1 point:** Trivial work - minimal complexity, high confidence, well-understood
- **2 points:** Simple work - straightforward, low risk, standard patterns
- **3 points:** Moderate work - some complexity, some unknowns, requires testing
- **5 points:** Substantial work - notable complexity, moderate risk, good planning needed
- **8 points:** Large work - high complexity, multiple unknowns, significant risk (consider breaking down)
- **13 points:** Very large - should almost always be broken down into smaller tasks

**Atomicity Rule:**
- If task > 8 points → **MUST break it down** into smaller tasks
- If task < 3 points → **Consider combining** with related task (only if it makes sense and maintains atomicity)

An atomic task:
- ✅ Can be completed independently
- ✅ Has a single, well-defined deliverable
- ✅ Doesn't require waiting on external work (except documented blockers)
- ✅ Can be tested/verified independently

## Task Relationships

### Blocking
- This task MUST complete BEFORE other tasks can start
- Example: "Database schema design blocks API implementation"
- Use when work literally cannot start without your task done

### Dependent On
- This task relies on another task completing first
- Example: "Frontend integration depends on API implementation"
- Use when your task cannot start until other work is done
- **Note:** "Blocking" and "dependent_on" are the same relationship viewed from opposite ends

### Related To
- Connected but no direct dependency
- Example: "Frontend auth task is related to backend auth task" (parallel work)
- Use for work in same area but can proceed independently

## Critical Path Analysis

The critical path is the longest chain of dependent tasks. This identifies the minimum project timeline **in terms of task dependencies**, NOT in hours or calendar time.

**Steps:**
1. Map all blocking/dependent relationships
2. Find the longest chain from start to finish
3. Sum story points on that chain to understand complexity
4. Any task on critical path is high-risk if delayed (blocks downstream work)
5. Any task with 3+ blockers is high-risk due to dependency complexity

**Why this matters:** The critical path shows which tasks **cannot be delayed** without pushing the entire project timeline. Prioritize these for early completion and close monitoring.

**Example:**
```
Task 1 (5pts) → Task 2 (3pts) → Task 4 (8pts)
Task 1 (5pts) → Task 3 (2pts) → Task 4 (8pts)
Task 4 (8pts) → Task 5 (3pts)

Critical path: Task 1 → Task 2 → Task 4 → Task 5 
Total complexity: 5+3+8+3 = 19 story points
Duration impact: These 4 tasks cannot be parallelized; they must happen sequentially
```

**Note:** Story points indicate complexity, not hours. Actual calendar time depends on team velocity, team size, parallelization opportunities, and unknowns encountered.

## Validation Checklist (CRITICAL - Complete before Phase 4)

**The following MUST be true before moving to Delegation:**

- [ ] All [Story] have associated [Task] covering all implementation aspects
- [ ] Each [Task] is atomic (cannot be broken down further)
- [ ] Each [Task] is linked to its parent [Story] in frontmatter (storyId)
- [ ] Each [Task] is linked to its parent [Epic] in frontmatter (epicId)
- [ ] All [Task] have story points assigned (1, 2, 3, 5, 8, 13)
- [ ] No [Task] has > 8 story points (break down if needed)
- [ ] All blocking/dependent relationships are documented
- [ ] Critical path has been identified and duration documented
- [ ] No [Task] has unexplained 3+ blockers
- [ ] Task outputs don't interrupt user experience
- [ ] All dependencies are documented (external, other teams, resources)

**If any item is not checked, DO NOT proceed to Phase 4. Return to refinement.**

## Common Pitfalls to Avoid

- ❌ **Tasks that are too big** → Becomes impossible to estimate/execute
- ❌ **Tasks that are too small** → Overhead in tracking
- ❌ **Missing story points** → Can't plan capacity
- ❌ **Forgetting dependencies** → Surprises during execution
- ❌ **Not identifying critical path** → Miss high-risk items
- ❌ **Vague "Definition of Done"** → Team argues about completion
- ❌ **Not considering external blockers** → Blocked waiting on third parties

## Tips for Success

- ✅ Break down anything > 8 points immediately
- ✅ Combine small tasks only if they're in same area/flow
- ✅ Be conservative with estimates (better to underestimate work)
- ✅ Document ALL dependencies, even external ones
- ✅ Identify critical path early (focus management attention there)
- ✅ Have team review task breakdown before proceeding (they'll find issues)
- ✅ Create task descriptions that are clear enough for someone else to pick up
- ✅ Link to [Decision] and [Research] artifacts that shaped the task

## Next Step

Once validation checklist is complete → **Phase 4: Delegation**

See: `references/phase-04-delegation.md`
