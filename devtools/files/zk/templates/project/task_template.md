---
title: {{ title }}                          # immutable
type: task                                  # immutable
storyId: {{ extra.storyId }}
epicId: {{ extra.epicId }}
status: {{ extra.status | default("todo") }}
storyPoints: {{ extra.storyPoints }}
priority: {{ extra.priority }}
assignee: {{ extra.assignee }}
dueDate: {{ extra.dueDate }}
createdDate: {{ format-date now "%Y-%m-%d" }}
updatedDate: {{ format-date now "%Y-%m-%d" }}
---

<!--
[INSTRUCTIONS]

This is a template for documenting specific, atomic work tasks that decompose user stories into executable units.

1. Read each [INSTRUCTION], [EVENT: <event>] and [REPLACE: <instructions>] comment block carefully.
2. [EVENT: <event>] blocks indicate when to take action (e.g., on generation, during execution, on completion).
3. [REPLACE: <instructions>] blocks indicate where to add content.

Reference: @devtools/files/zk/templates/project/issue-links.md for link relationship context.

[EVENT: On Generation (Phase 3 Planning)]
- Replace each comment block annotated with [REPLACE: <instructions>], following instructions within.
- Leave comment blocks that are annotated with [INSTRUCTION] intact.
- Ensure task is atomic and cannot be broken down further.
- Change status from `todo` to `ready` when task planning is complete.

[EVENT: On Start (Execution)]
- Change status from `ready` to `in-progress` when work begins.
- Update assignee field if not already assigned.
- Begin documenting progress in Work Log section.

[EVENT: On Update (During Execution)]
- Every edit to this file must also update the `updatedDate` field (using format "%Y-%m-%d").
- Update Work Log with progress, blockers, and next steps.
- Review all links throughout the page and in the Links section.
- Ensure link targets still exist and remain relevant.
- Document any newly discovered blockers or dependencies.

[EVENT: On Completion]
- Change status from `in-progress` to `done` when all Definition of Done criteria are met.
- Update Work Log with final entry marking completion.
- Verify all VALIDATION checklist items are satisfied.
-->

## Task Description

<!--
[REPLACE: with a detailed description of the specific work to be completed]

- What is the deliverable?
- What specific problem or requirement does this task address?
- Why is this task necessary to complete the parent story?
- What makes this task atomic (cannot be broken down further)?
-->

## Implementation Steps

<!--
[REPLACE: with logical, manageable steps for completing this task]

Break the work into clear, sequential steps with sub-steps where helpful.
Each step should be actionable and provide sufficient detail for the assignee.
-->

1. Step 1: { Specific, actionable step }
   - Sub-step 1a: { More detail or specific action }
   - Sub-step 1b: { More detail or specific action }

2. Step 2: { Next logical step }
   - Sub-step 2a: { More detail }

3. Step 3: { Continue as needed }

## Out of Scope

<!--
[REPLACE: with work explicitly NOT included in this task]

Clearly delineate what is out of scope to prevent scope creep.
Explain why these items are excluded and where they belong (other tasks, future work, etc.).
-->

- Feature or work item 1 (deferred or part of another task)
- Feature or work item 2
- Why these items are out of scope

## Definition of Done

The task is complete when:

- [ ] All implementation steps have been completed
- [ ] Code follows the team's coding standards and conventions
- [ ] Code has been reviewed and approved
- [ ] All automated tests pass (unit, integration, e2e as applicable)
- [ ] No console errors or warnings remain
- [ ] Performance meets documented requirements (if applicable)
- [ ] Accessibility requirements are met (if applicable)
- [ ] Documentation and code comments have been updated
- [ ] No known bugs or issues remain

## Work Log

<!--
[INSTRUCTION] Update this section throughout task execution to document progress, blockers, and decisions made.

Format each entry with the date and a clear status summary.
Include what was accomplished, challenges encountered, and next steps.
Final entry should confirm completion and link to any related artifacts created.
-->

### Entry 1: { YYYY-MM-DD } - { Status }

- What was worked on
- Progress made
- Any blockers or challenges encountered
- Next steps

### Entry 2: { YYYY-MM-DD } - { Status }

<!--
[REPLACE: with additional entries as work progresses, or remove template if no work has begun]
-->

## QA Testing Steps

<!--
[REPLACE: with specific testing procedures to verify task completion]

Define test setup, prerequisites, and clear test cases with expected results.
Include both happy path and edge case testing if applicable.
-->

### Setup

- Prerequisites for testing
- Environment, data, or tools needed
- Any configuration or dependencies

### Test Case 1

**Scenario:** { What is being tested }

**Steps:**
1. Step 1: { Specific action }
2. Step 2: { Specific action }
3. Verification: { How to verify the result }

**Expected Result:** { What should happen }

### Test Case 2

<!--
[REPLACE: with additional test cases as needed, or remove if not applicable]
-->

**Scenario:** { What is being tested }

**Steps:**
1. Step 1
2. Step 2

**Expected Result:** { Expected outcome }

## Technical Considerations

<!--
[REPLACE: with any technical requirements, constraints, or considerations specific to this task]

- Technology stack or dependencies to use?
- Code patterns or architectural decisions?
- Performance targets or optimization requirements?
- Security, accessibility, or scalability constraints?
- Known technical debt or workarounds to be aware of?
-->

## Dependencies and Blockers

<!--
[REPLACE: with explicit dependencies or blocking conditions]

- Other tasks that must be completed first?
- External dependencies or third-party integrations?
- Resource or data requirements?
- Document if no dependencies exist
-->

## Notes and Questions

<!--
[REPLACE: with additional context, implementation notes, or clarifications needed]

Use [NEEDS CLARIFICATION] tags for items requiring team discussion or stakeholder input.
Include references to design documents, API specs, or other relevant materials.
-->

## Links

<!--
[INSTRUCTION] Keep this section updated as the task evolves.

Use relationship types to clarify how artifacts relate to this task:

[EVENT: OnGenerate, OnUpdate]
- [implements] Parent story this task decomposes from
- [part_of_epic] Epic this task ultimately contributes to
- [blocks] Other tasks waiting on this task's completion
- [dependent_on] Other tasks that must be completed first
- [related_to] Related tasks or work items
- [influenced_by_decision] Decisions that inform this task's approach
- [dependent_on_research] Research that informs this task's implementation

Example:
- [implements] [1.4.1 User Login Story](../1.4.1-user-login.md)
- [part_of_epic] [1.0 User Authentication Epic](../1.0-user-auth-epic.md)
- [dependent_on] [1.5.1 Database Schema Task](../1.5.1-database-schema.md)
- [influenced_by_decision] [1.3.1 JWT vs Sessions Decision](../1.3.1-jwt-decision.md)
-->

---

## VALIDATION (CRITICAL - Phase 3 Planning & Execution)

### PHASE 3 PLANNING VALIDATION (Complete before Delegation)

**This section must be completed when the task is created during Phase 3 Planning.**

See: `references/phase-03-planning-tasks.md` for detailed Planning phase guidance.

**Planning Checklist:**

- [ ] [Task] is atomic and cannot be broken down further
- [ ] [Task] is linked to parent [Story] (storyId in frontmatter)
- [ ] [Task] is linked to parent [Epic] (epicId in frontmatter)
- [ ] Story points are assigned (1, 2, 3, 5, or 8)
- [ ] No task has > 8 story points (break down if larger)
- [ ] Implementation steps are clear and actionable
- [ ] Out of Scope section prevents scope creep
- [ ] Definition of Done criteria are specific and measurable
- [ ] All dependencies are documented (blocking/dependent relationships)
- [ ] All [NEEDS CLARIFICATION] items have been resolved
- [ ] Task is ready for assignment and execution

**If any item is not checked, return to planning phase refinement.**

### EXECUTION VALIDATION (Complete when work is done)

**This section MUST be completed for a [Task] to be marked "Done".**

See: `references/phase-05-execution.md` for detailed Execution phase guidance.

**Execution Definition of Done Checklist:**

- [ ] All implementation steps have been completed
- [ ] Code follows the team's coding standards and conventions
- [ ] Code has been reviewed and approved by team
- [ ] All automated tests pass (unit, integration, e2e as applicable)
- [ ] No console errors or warnings remain
- [ ] Performance meets documented requirements (if any)
- [ ] Accessibility requirements are met (if applicable)
- [ ] Documentation and code comments have been updated
- [ ] No known bugs or issues remain
- [ ] Work Log has been updated with final status and completion date
- [ ] Task status in frontmatter is updated to "Done"
- [ ] QA Testing Steps have been executed and passed

**If any item is not checked, this task is NOT done. Continue working.**

**Project Closure Verification (Phase 7 - Closing):**

Before closing the project, verify:

- [ ] Task status is marked "Done"
- [ ] All work artifacts (code, documentation) have been linked
- [ ] No unresolved blockers or dependencies remain
- [ ] Task has been reviewed in retrospective (if applicable)
