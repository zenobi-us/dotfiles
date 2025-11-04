---
title: { Task Title }
type: Task
projectId: { ProjectId }
storyId: { Parent Story ID }
epicId: { Parent Epic ID }
status: { To Do | In Progress | In Review | Done | Blocked }
storyPoints: { Number of story points }
priority: { Critical | High | Medium | Low }
assignee: { Team member name or empty }
dueDate: { YYYY-MM-DD or empty }
createdDate: { YYYY-MM-DD }
updatedDate: { YYYY-MM-DD }
links:
  - type: story
    itemId: { Parent Story ID }
  - type: epic
    itemId: { Parent Epic ID }
  - type: blocking
    itemId: { Task ID that this task blocks }
  - type: dependent_on
    itemId: { Task ID that this task depends on }
  - type: related_to
    itemId: { Related Task ID }
  - type: informed_by_research
    itemId: { Research ID }
  - type: influenced_by_decision
    itemId: { Decision ID }
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
