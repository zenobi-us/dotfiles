---
title: {{ title }}                          # immutable
type: prd                                   # immutable
status: {{ extra.status | default("Draft") }}  # Draft | In Review | Approved | Superseded
projectId: {{ projectId }}                  # Project identifier
createdDate: {{ format-date now "%Y-%m-%d" }}
updatedDate: {{ format-date now "%Y-%m-%d" }}
links:
  epic: []                                  # References to Epic artifacts this PRD spawns
---

<!--
[INSTRUCTIONS]

This is a template for documenting Product Requirements Documents (PRDs) to define strategic vision, business objectives, and success metrics for projects.

1. Read each [INSTRUCTION], [EVENT: <event>], and [REPLACE: <instructions>] comment block carefully.
2. [EVENT: <event>] blocks indicate when to take action (e.g., on generation, update).
3. [REPLACE: <instructions>] blocks indicate where to add content.

[EVENT: On Generation]
- Replace each comment block annotated with [REPLACE: <instructions>], following the instructions within.
- Leave comment blocks annotated with [INSTRUCTION] intact.
- Change status from `Draft` to `In Review` when ready for feedback.
- Change status from `In Review` to `Approved` only after all [NEEDS CLARIFICATION] tags are resolved.
- Change status to `Superseded` if this PRD is replaced by a newer version.

[EVENT: On Update]
- Every edit to this file must also update the `updatedDate` field (using format "%Y-%m-%d").
- Review all links throughout the document, especially in the Links section.
- Ensure link targets still exist and remain relevant.
- Verify that all [NEEDS CLARIFICATION] tags are addressed before moving to Approved status.
- If this PRD is Approved and subsequent changes are needed, change status back to In Review and document the change.
-->

## Preamble

<!--
[REPLACE: with a high-level overview of what this PRD defines]

- What is the product/feature being defined?
- Why are we building it?
- Who are the primary beneficiaries?
- What is the expected impact?
-->

## Executive Summary

<!--
[REPLACE: with a concise one-paragraph summary]

This should answer: "What are we building and why?" in a way that a stakeholder who only reads this section understands the essence of the PRD.

Example: "We are building a real-time notification system to reduce customer response time from hours to seconds, enabling support teams to proactively address critical issues before customers escalate."
-->

## Market / User Problem

<!--
[REPLACE: with the problem we are solving]

Structure this section clearly:

### The Problem
- What specific pain point exists?
- Who experiences this problem? (target user/segment)
- How prevalent or severe is the problem?

### Current State
- How are users currently solving this problem?
- What are the limitations of existing solutions?
- Why isn't the current approach sufficient?

### Opportunity
- What is the business or user opportunity?
- What would improved state look like?
-->

## Vision Statement

<!--
[REPLACE: with an aspirational vision of the desired future state]

This should paint a picture of where we want to be, typically 6-12 months out. It should inspire teams and stakeholders.

Example: "Support teams will proactively manage customer issues, resolving problems before customers experience impact, creating an experience of seamless, anticipatory service."

Keep it concise (2-3 sentences) but vivid.
-->

## Key Objectives

<!--
[REPLACE: with 3-5 specific, measurable business goals]

Each objective should be:
- Specific (not vague)
- Measurable (tied to Success Metrics below)
- Aligned with the Vision Statement

Format:
- **Objective 1:** [Clear statement of what success looks like]
- **Objective 2:** [Clear statement of what success looks like]
- ... (max 5 objectives)

Example objectives:
- Reduce customer support response time from 4 hours to 15 minutes
- Enable support team to handle 2x volume without hiring
- Improve customer satisfaction score from 6.5 to 8.0 / 10
-->

## Success Metrics

<!--
[REPLACE: with measurable indicators tied to Key Objectives]

For each metric, specify:
- Metric name
- Current baseline (if known)
- Target value
- Which Objective(s) it measures
- How it will be tracked

Format:
| Metric | Baseline | Target | Objective | Tracking Method |
|--------|----------|--------|-----------|-----------------|
| Customer Response Time | 4 hours | 15 min | Obj 1 | Support ticket system |
| Team Throughput | 50 tickets/day | 100 tickets/day | Obj 2 | Analytics dashboard |
| CSAT Score | 6.5 / 10 | 8.0 / 10 | Obj 3 | Post-interaction survey |

At minimum, you should have 1-2 metrics per Key Objective.
-->

## Timeline & Phasing

<!--
[REPLACE: with phased delivery plan and major milestones]

Provide a rough timeline, not a detailed project schedule.

Example:
- **Phase 1 (Q1 2025):** Core notification infrastructure and basic email delivery
- **Phase 2 (Q2 2025):** SMS and push notification channels, user preference settings
- **Phase 3 (Q3 2025):** Advanced scheduling, analytics dashboard, A/B testing
- **Phase 4 (Q4 2025):** Enterprise integrations, compliance features

Major milestones:
- Milestone 1: [Date] - [What is ready]
- Milestone 2: [Date] - [What is ready]
- Milestone 3: [Date] - [What is ready]

Note any dependencies on other projects or teams.
-->

## Assumptions

<!--
[REPLACE: with key assumptions underlying this PRD]

These are things we believe to be true but should validate. Format:

- **Assumption 1:** [What we're assuming]
  - Validation method: [How we'll confirm this is true]

- **Assumption 2:** [What we're assuming]
  - Validation method: [How we'll confirm this is true]

Examples:
- Users will adopt the new notification system if it's 50% faster than email
- The target market has 100k+ potential customers
- We can implement this within current team capacity (2 engineers)
- Existing auth system can support additional notification delivery
-->

## Constraints

<!--
[REPLACE: with technical, resource, or timeline constraints]

Be specific about limitations:

**Technical Constraints:**
- [Constraint and why it matters]

**Resource Constraints:**
- [Team capacity, budget, tool limitations]

**Timeline Constraints:**
- [Deadlines, phase gates, blocking dependencies]

Examples:
- Must integrate with existing MySQL database (cannot use new data stores)
- Team capacity: 2 engineers, 1 designer, limited to Q1 2025
- Must maintain backward compatibility with v1.0 API
-->

## Out of Scope

<!--
[REPLACE: with things this PRD explicitly does NOT cover]

Being clear about what we're NOT doing prevents scope creep and clarifies boundaries.

Examples:
- Mobile app development (web only in Phase 1)
- Machine learning / AI-powered recommendations (Phase 3+)
- Self-service notification dashboard for end users (Q2 2025+)
- Compliance with GDPR or CCPA (Phase 2)

Format as a simple bulleted list.
-->

## Links & References

<!--
[INSTRUCTION] Keep this section updated as the PRD evolves.

Link to:
- [informed_by] Research artifacts that informed this PRD
- [influenced_by] Decision artifacts that shaped this vision
- [spawn] Epic artifacts created from this PRD (populated after Epic creation)

Example:
- [informed_by] [Market Research: Notification Market Trends](../research/market-research-2024.md)
- [informed_by] [User Interview Synthesis](../research/user-interviews.md)
- [influenced_by] [Decision: Email-First vs Multi-Channel](../decisions/notification-strategy-decision.md)
- [spawn] [Notification System Epic](../epics/notification-epic.md)
-->

---

## Open Questions

<!--
[REPLACE: with questions that must be resolved before moving to Approved status]

Mark unresolved items with [NEEDS CLARIFICATION].

Format:
- [NEEDS CLARIFICATION] Question 1: [What needs to be clarified]
  - Related to: [Which section this affects]
  - To resolve: [What research/decision is needed]

- [NEEDS CLARIFICATION] Question 2: [What needs to be clarified]
  - Related to: [Which section this affects]
  - To resolve: [What research/decision is needed]

Example:
- [NEEDS CLARIFICATION] Will we support SMS in Phase 1 or Phase 2?
  - Related to: Timeline & Phasing, Success Metrics
  - To resolve: Engineering feasibility study (see Research artifact)

- [NEEDS CLARIFICATION] What is the realistic budget for this initiative?
  - Related to: Constraints, Timeline & Phasing
  - To resolve: Finance review and approval

DO NOT move to Approved status until all [NEEDS CLARIFICATION] tags are removed and resolved.
-->

---

## VALIDATION (CRITICAL - Before Approval)

**This PRD cannot move to Approved status until all items below are complete.**

**Pre-Approval Validation Checklist:**

- [ ] Executive Summary is clear and compelling (could be understood by executive who only reads this)
- [ ] Market/User Problem is well-defined and validated (not hypothetical)
- [ ] Vision Statement is aspirational but achievable
- [ ] All Key Objectives (3-5) are specific and measurable
- [ ] All Success Metrics have baseline and target values
- [ ] Success Metrics map back to Key Objectives (every objective has 1+ metric)
- [ ] Timeline & Phasing is realistic given Constraints
- [ ] All Assumptions are documented and include validation methods
- [ ] All Constraints are specific (not vague) and explain impact
- [ ] Out of Scope section clearly defines boundaries
- [ ] All [NEEDS CLARIFICATION] tags are resolved or researched
- [ ] All Open Questions have been addressed in main sections
- [ ] Links section references Research/Decision artifacts that informed this PRD
- [ ] Stakeholders who need to approve this PRD have reviewed and signed off

**Status progression:**

1. Draft → In Review: When PRD is ready for feedback
2. In Review → Approved: When validation checklist is 100% complete and stakeholders approve
3. Approved → Superseded: If a newer PRD replaces this one

**Blocking rule:** PRD must reach Approved status before Epic creation can begin.

**If any item is not checked, PRD is not ready for Approved status. Continue refining.**

---

## Notes

<!--
[INSTRUCTION] Use this space for any additional context, decisions, or notes that don't fit in formal sections above.

Examples:
- Historical context (why this initiative exists now)
- Known risks or mitigation strategies
- Dependencies on other teams or projects
- Stakeholder feedback or approvals
-->
