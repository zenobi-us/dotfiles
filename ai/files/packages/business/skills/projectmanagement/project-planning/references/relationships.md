---
name: relationships
description: Use when you need to define or understand relationships between project planning artifacts like Tasks, Stories, Epics, Research, and Decisions.
---

# Artifact Relationships

Describing relationships between different project planning artifacts is crucial for traceability, impact analysis, and understanding dependencies. Below are common relationship types used in project planning.

There are 

## Parent-Child Relationships

- `[implements]` - Story/Task implements Epic/Spec

## Cross-cutting Relationships

- `[influenced_by_research]` - Artifact was shaped by research/investigation
- `[influenced_by_decision]` - Artifact was created based on a decision
- `[influences]` - Artifact that this research/decision informs
- `[dependent_on_research]` - Artifact depends on specific research
- `[dependent_on]` - General dependency relationship

## Task-Specific Relationships
- `[blocks]` - This task blocks another task
- `[dependent_on]` - This task is blocked by another task
- `[related_to]` - Related but not blocked

## Project Closure
- `[documents_closure]` - Retrospective closes out Epic/PRD
- `[related_to]` - Related artifacts from same project
- `[informed_by]` - Decision that shaped the artifact


# Link Types and Relationships


Throughout the project-planning instructions you will see often refernces to types in the form of [Epic], [Spec], [Story], [Task], [Research], and [Decision].
This is to reinforce to you the reader or agent that these are distinct artifact types with specific roles.


## Task-to-Task Relationship Links

Used for relationships between [Task] artifacts only:

| Link Type | Direction | Usage |
|-----------|-----------|-------|
| `blocking` | Task A → Task B | "This task blocks that task" |
| `dependent_on` | Task A → Task B | "This task is blocked by that task" |
| `related_to` | Task A ↔ Task B | "Similar work in same area" |
| `duplicate_of` | Task A → Task B | "This task is a duplicate" |

## Influence Links

| Link Type | Usage |
|-----------|-------|
| `influenced_by_research` | "This artifact was shaped by investigation" |
| `influenced_by_decision` | "This artifact was created based on a decision" |

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

## Link format in Artifact Bodiee

Use markdown linking within artifact bodies. 

Links must follow the format:

```md
[[artifact-id] title](relative-artifact-filepath-link)
```

For example: 

```markdown
This epic is part of [[abc123] User Authentication](../prd/abc123-user-authentication.md) PRD.
It includes [[def456] User Login Flow](../story/def456-user-login-flow.md) story.
The design was influenced by [[ghi789] OAuth Alternatives](../research/ghi789-research-oauth-alternatives.md) research.
Implemented based on [[jkl012] JWT vs Session](../decision/jkl012-decision-jwt-vs-session.md) decision.
After completion, see [[mno345] Epic 1 Closeout](../retrospective/mno345-retrospective-epic-1-closeout.md) retrospective.
```

## How are [Task] relationships described?

[Task] can be linked to other [Task] in interesting ways. Choose the relationship type that best describes the interaction:


**When to use "blocking":**

- THIS Task must finish BEFORE other Task can start
- Use: Document dependencies for critical path analysis
- Example: "Database schema design blocks API implementation"
- From Task perspective: "This task blocks: api-task-001"

**When to use "dependent_on":**

- THIS Task cannot start UNTIL another Task finishes
- Use: Identify what's blocking your progress
- Example: "API implementation depends on database schema design"
- From Task perspective: "This task is dependent_on: database-task-001"
- Note: "blocking" and "dependent_on" are the same relationship viewed from opposite directions

**When to use "related_to":**

- THIS Task is connected but does NOT have direct dependency
- Use: Track work in same area (e.g., similar components, same feature)
- Example: "Frontend auth task is related to backend auth task" (parallel, not blocking)
- Use sparingly - don't link everything

**When to use "duplicate_of":**

- THIS Task is a duplicate of another [Task]
- Use: When duplicate work is discovered, mark the duplicate and consolidate
- Example: "This task is duplicate_of: auth-task-002"
- Action: Cancel this task, redirect work to the original

**Linking to [Research] or [Decision]:**

- "influenced_by_research": This task was shaped by investigation/analysis
- "influenced_by_decision": This task was created based on a decision made
- Use: For traceability and understanding "why was this built this way?"

**Parent artifact links (MANDATORY):**

- Every [Task] MUST link to: parent [Story] AND parent [Epic]
- This establishes the hierarchy and enables queries like "all tasks in this epic"


