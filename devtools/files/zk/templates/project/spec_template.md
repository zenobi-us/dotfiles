---
title: {{ title }} # immutable
type: plan         # immutable
status: {{ extra.status | default("todo") }} 
createdDate: {{ format-date now "%Y-%m-%d" }}
updatedDate: {{ format-date now "%Y-%m-%d" }} 
---

<!--
[INSTRUCTIONS]

This is a specification template for planning a feature or project.

1. Read each [INSTRUCTION], [EVENT: <event>] and [REPLACE: <instructions>] comment block carefully.
2. [EVENT: <event>] blocks indicate when to take action (e.g., on generation, review, or update).
3. [REPLACE: <instructions>] blocks indicate where to add content.
-->

<!--
[EVENT: On Generation]

- Replace each comment block annotated with [REPLACE: <instructions>], following instructions within.
- Leave comment blocks that are annotated with [INSTRUCTION] intact.
- Change status from `todo` to `in-review` when ready for review.

[EVENT: On Review]

- Ensure all sections are complete and accurate.
- Verify that all [NEEDS CLARIFICATION] tags have been addressed.
- Confirm that all functional requirements are specific and measurable.
- Use clear, concise language suitable for both technical and non-technical stakeholders.

[EVENT: OnUpdate]

- Every edit to this file must also update the `updatedDate` field (using format "%Y-%m-%d").
-->

## Preamble

<!--
[REPLACE: a detailed preamble that describes the purpose and context of this specification]

- Provide a comprehensive overview of this specification.
- Explain the problem being solved, the business value, and how this spec relates to the broader epic and project.
-->

## Requirements

### Functional Requirements

<!--
[REPLACE: with a list of functional requirements.]

- [REQ-1] Specific, measurable functional requirement
- [REQ-2] Include acceptance criteria 
- [REQ-3] Each requirement should be independently verifiable
//-->

### Non-Functional Requirements

<!--
[REPLACE: with a list of non-functional requirements.]

- [NF-1] "Performance" { Performance targets and constraints }
- [NF-2] "Security"" { Security requirements and constraints }
-->

## Objectives

<!--
[REPLACE: with a list of high-level objectives for this specification.]

- [O-1] "Objective 1" What we want to achieve
- [O-2] "Objective 2" Business or user-focused goal
- [O-3] "Objective 3" Measurable outcome
-->

## Constraints

<!--
[REPLACE: with a list of constraints that impact the specification.]

- [C-1] Technical constraints (e.g., must use existing infrastructure)
- [C-2] Resource constraints (budget, timeline, team size)
- [C-3] External constraints (compliance, third-party dependencies) [NEEDS CLARIFICATION]
-->

## Assumptions and Bias

<!--
[REPLACE: with a list of assumptions made in this specification.]

- [A-1] Assumption Title: What we assume to be true
- [A-2] Assumption Title: Impact if assumption is false
- [A-3] Assumption Title: Basis for the assumption
-->

## Success Criteria

<!--
[REPLACE: with a list of success criteria for this specification.]

- [SC-1] Specific, measurable success indicator
- [SC-2] Validatable against the requirements
- [SC-3] Related to the overall epic objectives
-->

## Open Questions

<!--
[REPLACE: with a list of open questions that need to be resolved.]

- [x] [Q-1] Question 1 that needs resolution [NEEDS CLARIFICATION]
- [ ] [Q-2] Question 2 to be answered [NEEDS CLARIFICATION]
- [ ] [Q-3] Question 3 pending discussion [NEEDS CLARIFICATION]

-->
## Notes

<!--
[REPLACE: with any additional notes relevant to this specification.]
- Additional context or implementation notes
- Important considerations for the development team
-->

<!-- [INSTRUCTION] Keep this section updated as Updates are made to this plan -->

## Links
<!--
INSTRUCTION:
- Initial generation of this document won't have any links.
- As you create related documents (research, designs, etc.), add links here.
- Use the format: - [type] [Title](path/to/document.md)
- `type` muse be a valid zk group type.

- [research] [A research document](2-research/abc123-a-research-document.md)

-->

---

## VALIDATION (CRITICAL - Complete before Phase 2 Planning)

**This section must be completed before moving to Phase 2.**

See: `references/phase-01-initiation.md` for detailed Initiation phase guidance.

**Validation Checklist:**

- [ ] Has clear, detailed preamble explaining the problem and value
- [ ] All functional requirements are specific and measurable
- [ ] Non-functional requirements (performance, security, accessibility, scalability) are documented
- [ ] Constraints are clearly defined
- [ ] Assumptions are explicitly stated
- [ ] Success criteria are specific and verifiable
- [ ] All [NEEDS CLARIFICATION] tags have been resolved
- [ ] No open questions remain

**If any item is not checked, DO NOT proceed to Phase 2 Planning. Return to refinement.**

## RESEARCH COMPLETION CHECKLIST (CRITICAL - Must complete before Spec Approval)

For each `[NEEDS CLARIFICATION]` tag created during spec writing:

- [ ] Research artifact created (or research not needed). ()
- [ ] Research status is "Complete" or "Superseded" (NOT "In Progress").
- [ ] Research findings referenced in this plan.
- [ ] If no research was needed, document why the clarification was resolved without research.

**If any [NEEDS CLARIFICATION] cannot be traced to completed research, DO NOT approve the Spec.**

---
