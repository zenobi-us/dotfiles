---
title: {{ title }}                          # immutable
type: story                                 # immutable
epicId: {{ extra.epicId }}
specId: {{ extra.specId }}
status: {{ extra.status | default("todo") }}
storyPoints: {{ extra.storyPoints }}
priority: {{ extra.priority }}
createdDate: {{ format-date now "%Y-%m-%d" }}
updatedDate: {{ format-date now "%Y-%m-%d" }}
---

<!--
[INSTRUCTIONS]

This is a template for documenting user stories that deliver specific capabilities within a spec and epic.

1. Read each [INSTRUCTION], [EVENT: <event>] and [REPLACE: <instructions>] comment block carefully.
2. [EVENT: <event>] blocks indicate when to take action (e.g., on generation, update).
3. [REPLACE: <instructions>] blocks indicate where to add content.

Reference: @devtools/files/zk/templates/project/issue-links.md for link relationship context.

[EVENT: On Generation]
- Replace each comment block annotated with [REPLACE: <instructions>], following instructions within.
- Leave comment blocks that are annotated with [INSTRUCTION] intact.
- Change status from `todo` to `in-review` when ready for review.
- Ensure story points are estimated using Fibonacci sequence (3, 5, 8, 13).

[EVENT: On Update]
- Every edit to this file must also update the `updatedDate` field (using format "%Y-%m-%d").
- Review all links throughout the page and in the Links section.
- Ensure link targets still exist and remain relevant.
- Update link descriptions if related artifacts' status/scope changed.
- If new tasks/decisions are created from this story, add them to the Links section.
-->

## Scenario Description

<!--
[REPLACE: with context describing this story and its purpose]

- What feature or capability does this story deliver?
- How does it fit into the parent spec and epic?
- What problem does this story solve?
- Who are the primary users/stakeholders for this story?
-->

## User Stories

<!--
[REPLACE: with one or more user stories in BDD (Behavior-Driven Development) format]

Each user story should follow: As a { type of user }, I want { capability or feature }, So that { business value or benefit }

Include multiple user stories if this story covers distinct user perspectives or scenarios.
-->

### User Story 1

As a { type of user },
I want { capability or feature },
So that { business value or benefit }.

### User Story 2

<!--
[REPLACE: with additional user stories as needed, or remove if not applicable]
-->

As a { type of user },
I want { capability or feature },
So that { business value or benefit }.

## Acceptance Criteria

<!--
[REPLACE: with specific, measurable conditions that define story completion]

Define acceptance criteria that can be tested and verified. Use Given/When/Then format or specific testable scenarios.
Each criterion should be independent and measurable.
-->

### Criterion 1

- Scenario: { Given/When/Then format or specific condition }
- Expected Result: { What should happen or how it can be verified }

### Criterion 2

- Scenario: { Specific testable behavior }
- Expected Result: { Verification method or expected outcome }

### Criterion 3

<!--
[REPLACE: with additional acceptance criteria as needed, or remove if not applicable]
-->

## Definition of Done

The story is considered complete when:

- [ ] All acceptance criteria are met
- [ ] Code has been reviewed and approved
- [ ] Tests are written and passing (unit, integration, e2e as applicable)
- [ ] Documentation has been updated
- [ ] No known bugs or issues remain
- [ ] Product owner has accepted the work

## Technical Considerations

<!--
[REPLACE: with any technical requirements, constraints, or considerations for this story]

- Architectural decisions needed for this story?
- Technology stack or dependencies to consider?
- Performance requirements or targets?
- Security, accessibility, or scalability considerations?
-->

## Dependencies

<!--
[REPLACE: with explicit dependencies that block or relate to this story]

- Other stories this story depends on (blocking)
- External system dependencies
- Data or resource requirements
- Clarify if no dependencies exist
-->

## Notes and Questions

<!--
[REPLACE: with additional context, clarifications needed, or important notes]

Use [NEEDS CLARIFICATION] tags for items requiring product owner or stakeholder input.
Include design notes, references to mockups, or known limitations.
-->

## Effort Estimation

<!--
[REPLACE: with story point estimate and rationale]

- Estimate using Fibonacci sequence: 3, 5, 8, 13
- Provide clear rationale for the estimate
- Reference similar stories if applicable
-->

- **Story Points:** { 3 | 5 | 8 | 13 }
- **Rationale:** { Why this estimate? Complexity, dependencies, unknowns? }

## Links

<!--
[INSTRUCTION] Keep this section updated as the story evolves.

Use relationship types to clarify how artifacts relate to this story:

[EVENT: OnGenerate, OnUpdate]
- [implements] Parent epic or plan this story fulfills
- [part_of_spec] Specification this story implements
- [depends_on] Other stories that must be completed first
- [dependent_on] Research or decisions that inform this story
- [influenced_by_decision] Decisions that shaped this story's direction
- [broken_into] Tasks that decompose this story (created in Phase 3)

Example:
- [implements] [1.0 User Authentication Epic](../1.0-user-auth-epic.md)
- [part_of_spec] [1.1.1 Login Specification](../1.1.1-login-spec.md)
- [depends_on] [1.4.0 User Profile Story](../1.4.0-user-profile.md)
- [dependent_on] [1.2.1 OAuth Research](../1.2.1-oauth-research.md)
- [influenced_by_decision] [1.3.1 JWT vs Sessions Decision](../1.3.1-jwt-decision.md)
-->

---

## VALIDATION (CRITICAL - Complete before Phase 3 Task Breakdown)

**This section must be completed for every [Story] before proceeding to Phase 3.**

See: `references/phase-02-planning-stories.md` for detailed Planning phase guidance.

**Validation Checklist:**

- [ ] [Story] is linked to parent [Epic] and [Spec] in Links section
- [ ] Scenario description clearly explains purpose and context
- [ ] Contains one or more user stories in BDD format (As a..., I want..., So that...)
- [ ] Each user story is specific and focused (not vague like "improve performance")
- [ ] Acceptance criteria are defined and measurable
- [ ] Acceptance criteria can be tested and verified
- [ ] Definition of Done checklist is clear and achievable
- [ ] Technical considerations are identified and documented
- [ ] Dependencies (or lack thereof) are explicitly stated
- [ ] Story points are estimated using Fibonacci sequence
- [ ] All [NEEDS CLARIFICATION] tags have been resolved
- [ ] Product owner has reviewed and approved this story

**If any item is not checked, DO NOT proceed to Phase 3. Return to refinement.**

**Ready for Task Breakdown:**

When this checklist is complete, this [Story] is ready to be broken down into [Task] artifacts in Phase 3.
