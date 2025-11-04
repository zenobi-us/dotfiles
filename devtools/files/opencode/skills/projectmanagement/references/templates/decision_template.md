---
title: { Decision Title }
projectId: { ProjectId }
epicId: { 0001 }
status: { Pending | Decided | Unresolved | Superseded }
decisionDate: { YYYY-MM-DD or null if pending }
createdDate: { YYYY-MM-DD }
updatedDate: { YYYY-MM-DD }
links:
  - type: epic
    itemId: { 0001 }
  - type: influenced_by
    itemId: { 0001.2.0001 }
  - type: influences_spec
    itemId: { 0001.1.0001 }
  - type: influences_story
    itemId: { 0001.4.0001 }
  - type: influences_task
    itemId: { 0001.5.0001 }
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
