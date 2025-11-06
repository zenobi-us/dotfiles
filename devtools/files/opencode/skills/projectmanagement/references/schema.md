# Artifact Schemas and Content Structure

This document defines the schema and content structure for each artifact type in the project management framework.

## [Task] Relationship Schema

Every [Task] uses the following frontmatter schema for organizing relationships and metadata:

```markdown
---
title: { Task Title }
projectId: { ProjectId }
storyId: { Parent Story ID }
epicId: { Parent Epic ID }
status: { To Do | In Progress | Done | Blocked }
storyPoints: { Number of story points }
links:
  - type: blocking | dependent_on | related_to | duplicate_of
    ItemItem: { Linked Task ID }
  - type: influenced_by
    ItemItem: { Research or Decision ID }
---

{Task Body}
```

**Key Fields:**
- **title**: Task title for quick identification
- **projectId**: The project this task belongs to (required for basicmemory organization)
- **storyId**: Parent story identifier (0001.4.0001, etc.)
- **epicId**: Parent epic identifier (0001, 0002, etc.)
- **status**: Current state of the task (To Do, In Progress, In Review, Done, Blocked)
- **storyPoints**: Fibonacci points (1, 2, 3, 5, 8, 13) for effort estimation
- **links**: Relationships to other artifacts:
  - `blocking`: This task blocks another task
  - `dependent_on`: This task is blocked by another task
  - `related_to`: This task is related but not blocked
  - `duplicate_of`: This task is a duplicate
  - `influenced_by`: This task was shaped by research/decision

---

## Artifact Content Structure

The body of each artifact type follows a consistent pattern with specific sections.

### [Epic] Content Structure

**Links:**
- to a single [Spec]
- to one or more [Story]
- to one or more [Task] via linked [Story]

**Sections:**
- **Preamble**: High-level description of the epic
- **Objectives**: What the epic aims to achieve
- **Scope**: What is included and excluded
- **Success Criteria**: How we'll know the epic is complete

---

### [Spec] Content Structure

**Links:**
- to a single [Epic]
- to one or more [Story]
- to one or more [Research]
- to one or more [Decision]

**Sections:**
- **Detailed Preamble**: Comprehensive description of requirements
- **Requirements**: Specific functional and non-functional requirements
- **Objectives**: Goals the spec aims to achieve
- **Constraints**: Technical, business, or organizational constraints
- **Assumptions**: Underlying assumptions made
- **Success Criteria**: Specific, measurable completion criteria

---

### [Story] Content Structure

**Links:**
- to a single [Epic]
- to a single [Spec]
- to one or more [Task]
- to one or more [Research]
- to one or more [Decision]

**Sections:**
- **Scenario Description**: Context and user scenario
- **User Stories** (in BDD format): "As a [user], I want [feature], so that [benefit]"
- **Acceptance Criteria**: Specific, testable criteria for story completion

---

### [Task] Content Structure

**Links:**
- to a single [Story]
- to a single [Epic]
- to other [Task] (blocking, dependent on, related to, duplicate of)
- to one or more [Research]
- to one or more [Decision]

**Sections:**
- **Work Item Description**: Specific implementation work required
- **Implementation Steps**: Concrete steps to complete the task
- **Out of Scope**: What is explicitly NOT included in this task
- **Definition of Done**: Checklist items that must be completed
- **Notes**: Additional context, gotchas, or implementation hints
- **Work Log**: To be filled during execution (current status, progress notes)
- **QA Testing Steps**: To be filled during execution (test cases, verification steps)

---

## Relationship Patterns

### Epic → Spec → Story → Task Hierarchy

Every artifact maintains clear parent-child relationships:

```
[Epic]
  ├→ [Spec] (1:1 relationship)
  └→ [Story] (1:many)
      └→ [Task] (1:many)
```

**Important:** Tasks must always link to both their parent Story AND parent Epic for full traceability.

### Cross-cutting Relationships

Research and Decisions can be linked to any artifact type:

```
[Research] → can inform → [Spec], [Story], [Task]
[Decision] → can guide → [Spec], [Story], [Task]
```

Use `influenced_by` links in Task relationships to trace decisions made.

---

## Link Types Summary

| Link Type | Direction | Usage |
|-----------|-----------|-------|
| `blocking` | Task A → Task B | "This task blocks that task" |
| `dependent_on` | Task A → Task B | "This task is blocked by that task" |
| `related_to` | Task A ↔ Task B | "Similar work in same area" |
| `duplicate_of` | Task A → Task B | "This task is a duplicate" |
| `influenced_by` | Task → Research/Decision | "This task was shaped by this decision" |

---

## Obsidian Linking in Artifacts

Use wiki-style linking within artifact bodies:

```markdown
This task is part of [[0001-user-authentication]] epic.
It implements [[0001.4.0001-story-user-login-flow]].
Based on [[0001.3.0001-decision-jwt-vs-session]] decision.
```

Links enable navigation and relationship discovery in basicmemory.
