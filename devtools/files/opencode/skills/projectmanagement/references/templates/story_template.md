---
title: { Story Title }
type: Story
projectId: { ProjectId }
epicId: { Parent Epic ID }
specId: { Parent Spec ID }
status: { To Do | In Progress | In Review | Done | Cancelled }
storyPoints: { Number of points or estimate }
priority: { Critical | High | Medium | Low }
createdDate: { YYYY-MM-DD }
updatedDate: { YYYY-MM-DD }
links:
  - type: epic
    itemId: { Linked Epic ID }
  - type: spec
    itemId: { Linked Spec ID }
  - type: contains_task
    itemId: { Task ID 1 }
  - type: contains_task
    itemId: { Task ID 2 }
  - type: informed_by_research
    itemId: { Research ID }
  - type: influenced_by_decision
    itemId: { Decision ID }
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

- Story Points: { Based on Fibonacci sequence: 1, 2, 3, 5, 8, 13 }
- Rationale: Why this estimate?
