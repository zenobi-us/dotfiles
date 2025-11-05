---
title: { Task Title }
projectId: { ProjectId }
storyId: { 0001.4.0001 }
epicId: { 0001 }
status: { To Do | In Progress | In Review | Done | Blocked }
storyPoints: { 1 | 2 | 3 | 5 | 8 }
priority: { Critical | High | Medium | Low }
assignee: { Team member name or empty }
dueDate: { YYYY-MM-DD or empty }
createdDate: { YYYY-MM-DD }
updatedDate: { YYYY-MM-DD }
links:
  - type: story
    target: { 0001.4.0001-story-title }
  - type: epic
    target: { 0001-epic-name }
  - type: blocking
    target: { 0001.5.0002-task-title }
  - type: dependent_on
    target: { 0001.5.0001-task-title }
  - type: related_to
    target: { 0001.5.0003-task-title }
  - type: informed_by
    target: { 0001.2.0001-research-title }
  - type: influenced_by
    target: { 0001.3.0001-decision-title }
---

## Task Description

Provide a detailed description of the specific work to be completed. What is the deliverable? What makes this task complete and atomic?

## Implementation Steps

Break down the work into logical, manageable steps:

1. Step 1: { Specific, actionable step }
   - Sub-step 1a: { More detail }
   - Sub-step 1b: { More detail }

2. Step 2: { Next logical step }
   - Sub-step 2a: { More detail }

3. Step 3: { Continue as needed }

## Out of Scope

Clearly define what is NOT included in this task:

- Feature or work item 1 (deferred or part of another task)
- Feature or work item 2
- Why these items are out of scope

## Definition of Done

The task is complete when:

- [ ] All implementation steps have been completed
- [ ] Code follows the team's coding standards
- [ ] Code has been reviewed and approved
- [ ] All automated tests pass (unit, integration)
- [ ] No console errors or warnings
- [ ] Performance meets requirements (if applicable)
- [ ] Accessibility requirements met (if applicable)
- [ ] Documentation/code comments have been updated
- [ ] No known bugs or issues remain

## Work Log

### Entry 1: { Date } - { Status Update }

- What was worked on
- Progress made
- Any blockers or challenges
- Next steps

### Entry 2: { Date } - { Status Update }

- Continue as work progresses

## QA Testing Steps

### Setup

- Prerequisites for testing
- Environment or data needed

### Test Case 1

**Scenario:** { What is being tested }

**Steps:**
1. Step 1
2. Step 2
3. Expected Result

### Test Case 2

Continue with additional test cases...

## Notes

- Important implementation details
- Links to relevant documentation
- Technical considerations
- [NEEDS CLARIFICATION]: Any questions or clarifications needed

---

## VALIDATION (CRITICAL - Definition of Done)

**This section MUST be completed for a [Task] to be considered "Done".**

See: `references/phase-05-execution.md` for detailed Execution phase guidance.

**Task Definition of Done Checklist:**

- [ ] All implementation steps have been completed
- [ ] Code follows the team's coding standards and conventions
- [ ] Code has been reviewed and approved by team
- [ ] All automated tests pass (unit, integration, e2e if applicable)
- [ ] No console errors or warnings remain
- [ ] Performance meets documented requirements (if any)
- [ ] Accessibility requirements are met (if any)
- [ ] Documentation and code comments have been updated
- [ ] No known bugs or issues remain
- [ ] [Work Log] has been updated with final status
- [ ] Task status in frontmatter is updated to "Done"

**If any item is not checked, this task is NOT done. Continue working.**

**Phase 3 Planning Validation (before Delegation):**

When planning phase creates this task:

- [ ] [Task] is atomic (cannot be broken down further)
- [ ] [Task] is linked to parent [Story] (storyId in frontmatter)
- [ ] [Task] is linked to parent [Epic] (epicId in frontmatter)
- [ ] Story points are assigned (1, 2, 3, 5, 8, or 13)
- [ ] No [Task] has > 8 story points (break down if larger)
- [ ] Implementation steps are clear and actionable
- [ ] Definition of Done section is specific and measurable
- [ ] All dependencies are documented (blocking/dependent relationships)
- [ ] All [NEEDS CLARIFICATION] items resolved

**If any item is not checked during planning, return to planning phase refinement.**
