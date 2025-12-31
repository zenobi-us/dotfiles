---
title: {{ title }}                          # immutable
type: decision                              # immutable
status: {{ extra.status | default("todo") }}
epicId: {{ extra.epicId }}
createdDate: {{ format-date now "%Y-%m-%d" }}
updatedDate: {{ format-date now "%Y-%m-%d" }}
decisionDate: {{ extra.decisionDate }}      # YYYY-MM-DD or null if pending
researchBasis: {{ extra.researchBasis }}    # Optional: Link to research that informed this decision
---

<!--
[INSTRUCTIONS]

This is a template for documenting architectural and strategic decisions made during project planning and execution.

1. Read each [INSTRUCTION], [EVENT: <event>] and [REPLACE: <instructions>] comment block carefully.
2. [EVENT: <event>] blocks indicate when to take action (e.g., on generation, update).
3. [REPLACE: <instructions>] blocks indicate where to add content.

Reference: @devtools/files/zk/templates/project/issue-links.md for link relationship context.

[EVENT: On Generation]
- Replace each comment block annotated with [REPLACE: <instructions>], following instructions within.
- Leave comment blocks that are annotated with [INSTRUCTION] intact.
- Change status from `todo` to `pending` when decision context is documented.
- Change status from `pending` to `decided`, `unresolved`, or `superseded` based on resolution.
- Update `decisionDate` when decision is finalized.

[EVENT: On Update]
- Every edit to this file must also update the `updatedDate` field (using format "%Y-%m-%d").
- Review all links throughout the page and in the Links section.
- Ensure link targets still exist and remain relevant.
- Update link descriptions if related artifacts' status changed.
- If new decisions/plans/stories/tasks are created based on this decision, add them to the Links section.
-->

## Decision Context

<!--
[REPLACE: with the situation requiring this decision and why it matters to the project]

- What is the situation that requires a decision?
- Why is this decision important to the project?
- How does this decision impact project outcomes, architecture, or strategy?
- Who are the key stakeholders affected by this decision?
-->

## Problem Statement

<!--
[REPLACE: with a clear definition of the problem or choice being addressed]

- Clearly define the problem to be solved or the choice to be made
- What triggered the need for this decision?
- What are the constraints or pressures driving the decision?
-->

## Options Evaluated

<!--
[REPLACE: with options considered for this decision]

For each option, document pros, cons, and effort/cost. Include at least 2-3 options to show due diligence.
If only one option exists, explain why alternatives weren't viable.
-->

### Option 1: { Option Name }

<!--
[REPLACE: with details for this option]
-->

**Pros:**
- Advantage 1
- Advantage 2
- Advantage 3

**Cons:**
- Disadvantage 1
- Disadvantage 2
- Disadvantage 3

**Effort/Cost:** { Estimation }

### Option 2: { Option Name }

<!--
[REPLACE: with details for this option]
-->

**Pros:**
- Advantage 1
- Advantage 2

**Cons:**
- Disadvantage 1
- Disadvantage 2

**Effort/Cost:** { Estimation }

### Option 3: { Option Name }

<!--
[REPLACE: with details for this option, or remove if not applicable]
-->

**Pros:**
- Advantage 1

**Cons:**
- Disadvantage 1

**Effort/Cost:** { Estimation }

## Decision Rationale

### Recommended Option

<!--
[REPLACE: with the recommended option and clear rationale for the recommendation]

- Which option is recommended and why?
- What specific factors drove this recommendation?
- How does this option best serve project objectives?
-->

### Key Factors

<!--
[REPLACE: with the key factors influencing this decision]

- Factor 1: Why this matters to the decision
- Factor 2: Business or technical rationale
- Factor 3: Risk mitigation or strategic alignment
-->

### Trade-offs

<!--
[REPLACE: with explicit trade-offs being made]

- What are we gaining with this decision?
- What are we losing or deferring?
- Are there acceptable compromises?
- What could we reconsider in the future?
-->

## Risks and Mitigation

<!--
[REPLACE: with identified risks and mitigation strategies]

For each risk, document the potential impact and how it will be addressed.
-->

- Risk 1: { Potential risk } → Mitigation: { How we'll address it }
- Risk 2: { Potential risk } → Mitigation: { How we'll address it }

## Implementation Plan

<!--
[REPLACE: with details on how this decision will be implemented]

- How will this decision be implemented?
- What is the rollout strategy (immediate, phased, experimental)?
- Are there dependencies on other decisions or external factors?
- What are the key milestones or checkpoints?
-->

## Review and Approval

<!--
[REPLACE: with approval documentation and stakeholder consultation]

- Who reviewed and approved this decision?
- When was the decision finalized?
- Which stakeholders were consulted or informed?
-->

- Approved by: { Name/Role }
- Approval date: { YYYY-MM-DD }
- Stakeholders consulted: { List }

## Reopening Criteria

<!--
[REPLACE: with conditions under which this decision should be revisited]

Document when and why this decision might need reconsideration.
This is especially important for "Unresolved" decisions.
-->

- Under what circumstances should this decision be revisited?
- What metrics or outcomes would trigger reconsideration?
- When should this decision be reviewed again?

## Notes

<!--
[REPLACE: with any additional context or important notes]

- Any additional context about the decision
- Implementation notes or considerations
- If status is "Unresolved", explain why and when this should be revisited in the Retrospective
-->

## Links

<!--
[INSTRUCTION] Keep this section updated as the decision impacts project artifacts.

Use relationship types to clarify how artifacts relate to this decision:

[EVENT: OnGenerate, OnUpdate]
- [related_to] Other decisions connected to this work
- [influences] Which plan/epic/story/task does this decision inform?
- [dependent_on] Research or analysis that informed this decision
- [supersedes] Previous decisions this decision replaces
- [superseded_by] Newer decisions that override this one

Example:
- [dependent_on] [1.2.1 OAuth Research](../1.2.1-oauth-research.md)
- [influences] [1.1 User Auth Plan](../1.1-user-auth-plan.md)
- [influences] [1.4.1 Login Flow Story](../1.4.1-login-flow.md)
- [related_to] [1.3.2 Session Management Decision](../1.3.2-session-decision.md)
-->

---

## VALIDATION (CRITICAL - Complete before using Decision)

**This section must be completed before this decision can be linked from other artifacts.**

See: `references/phase-01-initiation.md` for detailed decision validation guidance.

**Validation Checklist:**

- [ ] Decision context clearly explains why this decision is needed
- [ ] Problem statement is clear and specific
- [ ] All viable options have been documented with pros/cons/effort
- [ ] Recommended option has clear and compelling rationale
- [ ] Key factors driving the decision are documented
- [ ] Trade-offs are explicitly stated
- [ ] Risks and mitigation strategies are identified
- [ ] Implementation plan is specific and actionable
- [ ] Approval is documented with name and date (if decision is "Decided")
- [ ] Stakeholders who were consulted are listed
- [ ] If status is "Unresolved", reopening criteria are documented
- [ ] Related artifacts are linked in Links section

**If any item is not checked, decision is incomplete. Complete before linking from other artifacts.**

## RESEARCH BASIS VALIDATION (Conditional)

If this decision was informed by research:

- [ ] Research artifact is referenced in frontmatter: `researchBasis: { 1.2.1-research-title }`
- [ ] Research artifact is linked in Links section: `[dependent_on] [research title](...)`
- [ ] Research status is "Complete", "Inconclusive", or "Superseded" (NOT "In Progress")
- [ ] Research findings are referenced in the rationale or key factors

**If this decision lacks research basis but should have it, return to research phase.**
