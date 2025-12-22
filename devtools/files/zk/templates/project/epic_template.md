---
title: {{ title }}                          # immutable
type: epic                                  # immutable
status: {{ extra.status | default("todo") }}
createdDate: {{ format-date now "%Y-%m-%d" }}
updatedDate: {{ format-date now "%Y-%m-%d" }}
---

<!--
[INSTRUCTIONS]

This is a specification template for planning an epic (large body of work).

1. Read each [INSTRUCTION], [EVENT: <event>] and [REPLACE: <instructions>] comment block carefully.
2. [EVENT: <event>] blocks indicate when to take action (e.g., on generation, update).
3. [REPLACE: <instructions>] blocks indicate where to add content.

[EVENT: On Generation]
- Replace each comment block annotated with [REPLACE: <instructions>], following instructions within.
- Leave comment blocks that are annotated with [INSTRUCTION] intact.
- Change status from `todo` to `in-review` when ready for review.

[EVENT: On Update]
- Every edit to this file must also update the `updatedDate` field (using format "%Y-%m-%d").
- Review all links throughout the page and in the Links section.
- Ensure link targets still exist and remain relevant.
- Update link descriptions if related artifacts' status/scope changed.
- If new plans/stories/tasks are created, add them to the Links section.
-->

## Preamble

<!--
[REPLACE: a high-level overview describing what this epic is about and why it matters]

- Provide a comprehensive overview of this epic.
- Explain the problem being solved, the business value, and how this epic relates to the broader project vision.
- Give readers quick understanding of scope and strategic importance.
-->

## Objectives

<!--
[REPLACE: with a list of high-level, measurable objectives for this epic]

- Clear, measurable objective 1
- Clear, measurable objective 2
- Clear, measurable objective 3
-->

## Scope

### In Scope

<!--
[REPLACE: with features/capabilities included in this epic]

- Feature/capability 1
- Feature/capability 2
- Feature/capability 3
-->

### Out of Scope

<!--
[REPLACE: with work explicitly NOT included in this epic]

- What is explicitly NOT included and why
- Related work that is deferred to future epics
-->

## Success Criteria

<!--
[REPLACE: with measurable success indicators for this epic]

- [ ] Criterion 1: Specific and measurable success indicator
- [ ] Criterion 2: Related to the objectives defined above
- [ ] Criterion 3: Can be validated and verified
-->

## Links

<!--
[INSTRUCTION] Keep this section updated as the epic evolves.
Use relationship types to clarify how artifacts relate:

[EVENT: OnGenerate, OnUpdate]
- [related_to] Other epics connected to this work
- [implements] Child stories that fulfill this epic
- [blocks] Tasks or work that depends on this epic
- [dependent_on] Research or analysis required by this epic
- [influenced_by_decision] Decisions that shaped this epic's direction

Example:
- [implements] [1.4.1 User Login Story](../1.4.1-user-login.md)
- [dependent_on] [1.2.1 OAuth Research](../1.2.1-oauth-options.md)
- [influenced_by_decision] [1.3.1 JWT vs Sessions Decision](../1.3.1-jwt-decision.md)
-->

## Timeline and Resources

<!--
[REPLACE: with resource and timeline information for this epic]

- **Estimated Duration**: { High-level estimate, e.g., 4-6 weeks }
  - *Note: This is a rough timeline estimate. Actual duration will be determined by the sum of story point estimates for all [Story] artifacts, team velocity, and parallelization opportunities.*
- **Team Size**: { e.g., 3-4 engineers }
- **Key Stakeholders**: { List by role or name }
-->

## Notes

<!--
[REPLACE: with any additional context or important notes relevant to this epic]

- Strategic considerations for this epic
- Known constraints or special considerations
- Implementation notes for the planning phase
-->

---

## VALIDATION (CRITICAL - Complete before proceeding to Phase 2 Planning)

**This section must be completed before moving to Phase 2.**

See: `references/phase-01-initiation.md` for detailed Initiation phase guidance.

**Validation Checklist:**

- [ ] [Epic] clearly defines the large body of work
- [ ] [Epic] objectives are measurable and achievable
- [ ] Scope clearly defines In Scope and Out of Scope
- [ ] Success criteria are specific and verifiable
- [ ] Related [Plan] artifact exists and is linked in Links section
- [ ] All stakeholders understand and agree with epic scope
- [ ] Timeline and resource estimates are documented
- [ ] [Epic] is ready for breakdown into [Story] artifacts

**If any item is not checked, DO NOT proceed to Phase 2 Planning. Return to Initiation phase.**
