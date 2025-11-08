---
title: { Spec Title }
projectId: { ProjectId }
epicId: { 1 }
status: { Draft | In Review | Approved | Superseded }
createdDate: { YYYY-MM-DD }
updatedDate: { YYYY-MM-DD }
links:
  - type: epic
    target: { 1-epic-name }
  - type: contains_story
    target: { 1.4.1-story-title }
  - type: informed_by
    target: { 1.2.1-research-title }
  - type: influenced_by
    target: { 1.3.1-decision-title }
---

## Preamble

Provide a comprehensive overview of this specification. Explain the problem being solved, the business value, and how this spec relates to the broader epic and project.

## Requirements

### Functional Requirements

- REQ-1: { Specific, measurable functional requirement }
- REQ-2: { Include acceptance criteria }
- REQ-3: { Each requirement should be independently verifiable }

### Non-Functional Requirements

- Performance: { Performance targets and constraints }
- Security: { Security requirements and constraints }
- Accessibility: { WCAG compliance level, screen reader support, etc. }
- Scalability: { Scalability requirements }

## Objectives

- Objective 1: What we want to achieve
- Objective 2: Business or user-focused goal
- Objective 3: Measurable outcome

## Constraints

- Technical constraints (e.g., must use existing infrastructure)
- Resource constraints (budget, timeline, team size)
- External constraints (compliance, third-party dependencies)
- [NEEDS CLARIFICATION]: Any uncertain constraints

## Assumptions

- Assumption 1: What we assume to be true
- Assumption 2: About technology, resources, or context
- Assumption 3: That may impact the specification

## Success Criteria

- [ ] SC-1: Specific, measurable success indicator
- [ ] SC-2: Validatable against the requirements
- [ ] SC-3: Related to the overall epic objectives

## Open Questions

- [NEEDS CLARIFICATION]: Question 1 that needs resolution
- [NEEDS CLARIFICATION]: Question 2 to be answered
- [NEEDS CLARIFICATION]: Any other unknowns

## Notes

- Additional context or implementation notes
- Important considerations for the development team

---

## VALIDATION (CRITICAL - Complete before Phase 2 Planning)

**This section must be completed before moving to Phase 2.**

See: `references/phase-01-initiation.md` for detailed Initiation phase guidance.

**Validation Checklist:**

- [ ] [Spec] has clear, detailed preamble explaining the problem and value
- [ ] All functional requirements are specific and measurable
- [ ] Non-functional requirements (performance, security, accessibility, scalability) are documented
- [ ] Constraints are clearly defined
- [ ] Assumptions are explicitly stated
- [ ] Success criteria are specific and verifiable
- [ ] All [NEEDS CLARIFICATION] tags have been resolved
- [ ] Linked to parent [Epic] (itemId in links)
- [ ] [Spec] has been formally approved with approver name and date
- [ ] All stakeholders have reviewed and agreed
- [ ] No open questions remain

**If any item is not checked, DO NOT proceed to Phase 2 Planning. Return to refinement.**

## RESEARCH COMPLETION CHECKLIST (CRITICAL - Must complete before Spec Approval)

For each `[NEEDS CLARIFICATION]` tag created during spec writing:

- [ ] Research artifact created (or research not needed): { 1.2.1-research-title }
- [ ] Research status is "Complete" or "Superseded" (NOT "In Progress")
- [ ] Research findings referenced in [Spec] body or Notes section
- [ ] If no research was needed, document why the clarification was resolved without research

**If any [NEEDS CLARIFICATION] cannot be traced to completed research, DO NOT approve the Spec.**

**Approval Gate:**
- Approved by: { Name/Role }
- Approval date: { YYYY-MM-DD }
- Approver signature/confirmation: { How approval was confirmed }
