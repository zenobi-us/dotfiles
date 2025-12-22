---
title: {{ title }}                          # immutable
type: research                              # immutable
researchType: {{ extra.researchType }}
status: {{ extra.status | default("todo") }}
createdDate: {{ format-date now "%Y-%m-%d" }}
updatedDate: {{ format-date now "%Y-%m-%d" }}
---

<!--
[INSTRUCTIONS]

This is a template for documenting research conducted to inform project decisions and planning.

1. Read each [INSTRUCTION], [EVENT: <event>] and [REPLACE: <instructions>] comment block carefully.
2. [EVENT: <event>] blocks indicate when to take action (e.g., on generation, update).
3. [REPLACE: <instructions>] blocks indicate where to add content.

Reference: skill_reference('project-planning', 'status-flow.md')

[EVENT: On Generation]
- Replace each comment block annotated with [REPLACE: <instructions>], following instructions within.
- Leave comment blocks that are annotated with [INSTRUCTION] intact.
- Change status from `todo` to `in-progress` when research begins.
- Change status from `in-progress` to `complete`, `inconclusive`, or `superseded` when research concludes.

[EVENT: On Update]
- Every edit to this file must also update the `updatedDate` field (using format "%Y-%m-%d").
- Review all links throughout the page and in the Links section.
- Ensure link targets still exist and remain relevant.
- Update link descriptions if related artifacts' status/scope changed.
- If new plans/stories/decisions/tasks are created based on findings, add them to the Links section.
- Reference @devtools/files/zk/templates/project/issue-links.md for link relationship context.
-->

## Research Objective

<!--
[REPLACE: with the research question(s) being answered and context for why this research matters]

- What specific question(s) are we trying to answer?
- What problem or uncertainty does this research address?
- How does this research inform project decisions?
-->

## Research Methodology

### Approach

<!--
[REPLACE: with details on how the research was conducted]

- Research method(s) used (e.g., literature review, interviews, surveys, technical exploration, competitive analysis)
- Scope and boundaries of the research
- Time period or data range covered
- Any limitations in the research approach
-->

### Sources Consulted

<!--
[REPLACE: with sources used in this research]

- Source 1: [Title or Description](URL or reference)
- Source 2: [Title or Description](URL or reference)
- Source 3: [Title or Description](URL or reference)
-->

## Key Findings

<!--
[REPLACE: with research findings organized by theme or discovery]

Structure findings with subsections (e.g., ### Finding 1, ### Finding 2) for clarity.
Each finding should include:
- The finding itself
- Evidence or data supporting it
- Implications for the project
-->

### Finding 1

<!--
[REPLACE: with details about this finding]

- Details about this finding
- Evidence or data supporting this finding
- Implications for the project
-->

### Finding 2

<!--
[REPLACE: with details about this finding]

- Details about this finding
- Evidence or data supporting this finding
- Implications for the project
-->

## Analysis

<!--
[REPLACE: with deeper interpretation of the findings]

- What patterns emerge from the research?
- What trade-offs or competing priorities are revealed?
- What assumptions underlie these findings?
- What are the strategic implications?
-->

## Limitations

<!--
[REPLACE: with research limitations and caveats]

- What are the constraints or gaps in this research?
- What additional research might be needed?
- How confident are we in these findings?
- What assumptions should be revisited?
-->

## Recommendations

<!--
[REPLACE: with actionable recommendations based on findings]

- Recommendation 1: [Action] based on [Finding], prioritized by [Impact/Feasibility]
- Recommendation 2: [Action] based on [Finding], with conditions or caveats
- Recommendation 3: Additional recommendations as needed
-->

## Next Steps

<!--
[REPLACE: with follow-up actions or decisions that should result from this research]

- What decision or plan should follow from this research?
- Are there related research efforts needed?
- Who should review and validate these findings?
- When should findings be revisited or updated?
-->

## Appendix

<!--
[REPLACE: with supporting materials and detailed documentation]

- Detailed data tables or charts
- Interview notes or survey results
- Technical specifications or benchmarks
- Additional research artifacts or references
-->

## Links

<!--
[INSTRUCTION] Keep this section updated as research findings evolve.

Use relationship types to clarify how artifacts relate to this research:

[EVENT: OnGenerate, OnUpdate]

Reference: skill_use('project-planning', 'schema/link-types.md')

Example relationship types:
- [related_to] Other research or artifacts connected to this work
- [influences] Which plan/epic/decision/story/task does this research inform?
- [referenced_by] Which artifacts depend on or cite these findings?

Example:
- [influences] [1.1 User Auth Plan](../1.1-user-auth-plan.md)
- [influences] [1.3.1 JWT vs Sessions Decision](../1.3.1-jwt-decision.md)
- [influences] [1.4.1 Login Flow Story](../1.4.1-login-flow.md)
- [related_to] [1.2.2 JWT Best Practices Research](../1.2.2-jwt-best-practices.md)
-->

---

## VALIDATION (CRITICAL - Complete before research is approved)

**This section must be completed before research findings are considered valid for decision-making.**

See: `references/phase-01-initiation.md` for detailed research validation guidance.

**Validation Checklist:**

- [ ] Research objective clearly states the question(s) being answered
- [ ] Methodology is appropriate and transparently documented
- [ ] Sources are credible and properly referenced
- [ ] Key findings are supported by evidence
- [ ] Analysis addresses implications for the project
- [ ] Limitations are acknowledged and documented
- [ ] Recommendations are specific and actionable
- [ ] Status reflects research completion state (Complete/Inconclusive/Superseded)
- [ ] Related plan/epic/decision artifacts linked in Links section
- [ ] Research is ready to inform project decisions

**If any item is not checked, research is not ready for use. Return to research phase.**
