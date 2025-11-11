---
title: { Decision Title }
projectId: { ProjectId }
epicId: { 1 }
status: { Pending | Decided | Unresolved | Superseded }
decisionDate: { YYYY-MM-DD or null if pending }
createdDate: { YYYY-MM-DD }
updatedDate: { YYYY-MM-DD }
researchBasis: { 1.2.1-research-title } # Optional: Link to research that informed this decision
links:
  - "[[{ 1-epic-name }|epic]]"
  - "[[{ 1.2.1-research-title }|influenced_by_research]]"
  - "[[{ 1.1.1-spec-title }|spec]]"
  - "[[{ 1.4.1-story-title }|story]]"
  - "[[{ 1.5.1-task-title }|task]]"
---

## Decision Context

What is the situation that requires a decision? Why is this decision important to the project?

## Problem Statement

Clearly define the problem or choice that needs to be addressed.

## Options Evaluated

### Option 1: { Option Name }

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

**Pros:**
- Advantage 1
- Advantage 2

**Cons:**
- Disadvantage 1
- Disadvantage 2

**Effort/Cost:** { Estimation }

### Option 3: { Option Name }

**Pros:**
- Advantage 1

**Cons:**
- Disadvantage 1

**Effort/Cost:** { Estimation }

## Decision Rationale

### Recommended Option

{ State which option is recommended and why }

### Key Factors

- Factor 1: Why this matters
- Factor 2: Business or technical rationale
- Factor 3: Risk mitigation

### Trade-offs

- What are we gaining?
- What are we losing or deferring?
- Are there acceptable compromises?

## Risks and Mitigation

- Risk 1: { Potential risk } → Mitigation: { How we'll address it }
- Risk 2: { Potential risk } → Mitigation: { How we'll address it }

## Implementation Plan

- How will this decision be implemented?
- What is the rollout strategy?
- Are there dependencies on other decisions?

## Review and Approval

- Approved by: { Name/Role }
- Approval date: { YYYY-MM-DD }
- Stakeholders consulted: { List }

## Reopening Criteria

- Under what circumstances should this decision be revisited?
- What metrics or outcomes would trigger reconsideration?

## Notes

- Any additional context
- If status is "Unresolved", explain why and when this should be revisited in the Retrospective

---

## VALIDATION (CRITICAL - Complete before using Decision)

**Validation Checklist:**

- [ ] Decision context clearly explains why this decision is needed
- [ ] All options have been documented with pros/cons
- [ ] Recommended option has clear rationale
- [ ] Key factors and trade-offs are documented
- [ ] Risks and mitigations are identified
- [ ] [OPTIONAL] Research basis linked in frontmatter (if this decision was informed by Research)
- [ ] Approval documented with name and date (if decision has been made)
- [ ] Stakeholders who were consulted are listed
- [ ] If status is "Unresolved", criteria for reopening are documented

**If any item is not checked, decision is incomplete. Complete before linking from other artifacts.**

**Research Basis Check:**

If this decision was informed by research, link it in the `researchBasis:` field in frontmatter:
```yaml
researchBasis: { 1.2.1-research-oauth-providers }
```

This creates traceability from decision back to the investigation that informed it.
