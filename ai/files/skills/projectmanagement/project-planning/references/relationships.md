---
name: relationships
description: Use when you need to define or understand relationships between project planning artifacts like Tasks, Stories, Epics, Research, and Decisions.
---


# Relationship Types

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

## Artifact-Type Links

Cross-artifact relationships for linking between different artifact types:

| Link Type | Usage |
|-----------|-------|
| `prd` | Link to a [PRD] |
| `epic` | Link to an [Epic] |
| `spec` | Link to a [Spec] |
| `research` | Link to [Research] |
| `decision` | Link to a [Decision] |
| `story` | Link to a [Story] |
| `task` | Link to a [Task] |
| `retrospective` | Link to a [Retrospective] |

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

## Obsidian Linking in Artifact Bodies

Use wiki-style linking within artifact bodies. Links must match the exact artifact ID (without `.md`):

```markdown
This epic is part of [[abc123-prd-user-authentication]] PRD.
It includes [[def456-story-user-login-flow]] story.
The design was influenced by [[ghi789-research-oauth-alternatives]] research.
Implemented based on [[jkl012-decision-jwt-vs-session]] decision.
After completion, see [[mno345-retrospective-epic-1-closeout]] retrospective.
```

### Linking Examples by Category

- **PRD**: `[[abc123-prd-user-authentication]]` or `[[def456-prd-dayz-modding]]`
- **Epic**: `[[ghi789-epic-separate-cli-tool]]` or `[[jkl012-epic-user-auth-system]]`
- **Spec**: `[[mno345-spec-cli-requirements]]` or `[[pqr678-spec-auth-requirements]]`
- **Research**: `[[stu901-research-jwt-best-practices]]` or `[[vwx234-research-oauth-alternatives]]`
- **Decision**: `[[yza567-decision-jwt-vs-session]]` or `[[bcd890-decision-cli-framework]]`
- **Story**: `[[efg123-story-user-login-flow]]` or `[[hij456-story-template-extraction]]`
- **Task**: `[[klm789-task-database-schema]]` or `[[nop012-task-extract-files]]`
- **Retrospective**: `[[qrs345-retrospective-epic-1-closeout]]`


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


