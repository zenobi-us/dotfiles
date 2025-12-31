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

## Frontmatter Link Format

All artifact links in frontmatter use this format:

```markdown
links:
  - "[[artifact-id|link-type]]"
```

### Example Task Links

```yaml
---
title: Task Title
projectId: ProjectId
status: To Do
storyPoints: 5
links:
  - "[[abc123-story-template-extraction|story]]"
  - "[[def456-epic-separate-cli-tool|epic]]"
  - "[[ghi789-task-database-schema|blocking]]"
  - "[[jkl012-decision-jwt-vs-session|influenced_by_decision]]"
---
```

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

