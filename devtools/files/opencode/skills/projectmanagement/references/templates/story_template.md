---
title: { Story Title }
projectId: { ProjectId }
epicId: { 0001 }
specId: { 0001.1.0001 }
status: { To Do | In Progress | In Review | Done | Cancelled }
storyPoints: { 3 | 5 | 8 | 13 }
priority: { Critical | High | Medium | Low }
createdDate: { YYYY-MM-DD }
updatedDate: { YYYY-MM-DD }
links:
  - type: epic
    itemId: { 0001 }
  - type: spec
    itemId: { 0001.1.0001 }
  - type: contains_task
    itemId: { 0001.5.0001 }
  - type: contains_task
    itemId: { 0001.5.0002 }
  - type: informed_by
    itemId: { 0001.2.0001 }
  - type: influenced_by
    itemId: { 0001.3.0001 }
---

## Scenario Description

Provide context for this story. What feature or capability does this story deliver? How does it fit into the epic and spec?

## User Stories

Describe the user stories in BDD (Behavior-Driven Development) format:

### User Story 1

As a { type of user },
I want { capability or feature },
So that { business value or benefit }.

### User Story 2

As a { type of user },
I want { capability or feature },
So that { business value or benefit }.

### User Story 3

Additional user stories as needed...

## Acceptance Criteria

Define the specific conditions that must be met for this story to be considered complete:

### Criterion 1

- Scenario: { Given/When/Then format or specific condition }
- Expected Result: { What should happen }

### Criterion 2

- Scenario: { Specific testable behavior }
- Expected Result: { Verification method }

### Criterion 3

- Additional criteria as needed

## Definition of Done

The story is considered complete when:

- [ ] All acceptance criteria are met
- [ ] Code has been reviewed and approved
- [ ] Tests are written and passing (unit, integration, e2e)
- [ ] Documentation has been updated
- [ ] No known bugs or issues remain
- [ ] Product owner has accepted the work

## Technical Considerations

- Any architectural decisions needed?
- Technology stack or dependencies?
- Performance requirements?
- Security considerations?
- Accessibility requirements?

## Dependencies

- List any other stories this story depends on
- External system dependencies
- Data or resource requirements

## Notes and Questions

- [NEEDS CLARIFICATION]: Any clarifications needed from the product owner or stakeholders
- Design notes or references to mockups
- Known limitations or future enhancements

## Effort Estimation

- Story Points: { Based on Fibonacci sequence: 3, 5, 8, 13 }
- Rationale: Why this estimate?

---

## VALIDATION (CRITICAL - Complete before Phase 3 Planning Tasks)

**This section must be completed for every [Story] before proceeding to Phase 3.**

See: `references/phase-02-planning-stories.md` for detailed Planning phase guidance.

**Validation Checklist:**

- [ ] [Story] is linked to parent [Epic] (itemId in links)
- [ ] [Story] is linked to parent [Spec] (itemId in links)
- [ ] [Story] contains one or more user stories in BDD format (As a..., I want..., So that...)
- [ ] Each user story is specific (not vague like "improve performance")
- [ ] Acceptance criteria are defined and measurable
- [ ] Acceptance criteria can be tested/verified
- [ ] No dependencies on other stories (or dependencies are documented)
- [ ] Story points/estimation is documented
- [ ] All [NEEDS CLARIFICATION] tags resolved
- [ ] Product owner has reviewed and approved this story

**If any item is not checked, DO NOT proceed to Phase 3. Return to refinement.**

**Ready for Task Breakdown:**

When this checklist is complete, this [Story] is ready to be broken down into [Task] artifacts in Phase 3.
