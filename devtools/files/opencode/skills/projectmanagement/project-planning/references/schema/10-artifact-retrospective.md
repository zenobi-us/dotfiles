
### [Retrospective] Content Structure

**Frontmatter:**
```yaml
---
title: { Retrospective Title }
projectId: { ProjectId }
status: { In Progress | Complete }
links:
  - "[[2.1.1-epic-separate-cli-tool|epic]]"
  - "[[6.1.1-decision-cli-framework|decision]]"
---
```

**Links:**
- to a single [Epic] or [PRD] (the closed-out work package)
- to all unresolved [Decision] artifacts from that epic (MANDATORY)

**Sections:**
- **Meeting Date & Attendees**: When and who participated
- **Successes**: What went well? (team accomplishments, positive outcomes)
- **Challenges**: What was difficult? (obstacles, surprises, pain points)
- **Lessons Learned**: What should we remember for next time? (patterns, anti-patterns)
- **Action Items**: What will we change/improve? (prioritized list)
- **Unresolved Decisions Review**: Review of all unresolved [Decision] artifacts from this epic
  - Status: Were they resolved? Still pending?
  - Impact: What was the impact of uncertainty?
  - Next Steps: Revisit during planning phase?
- **Team Feedback**: Open feedback from team members
- **Stakeholder Feedback**: Any feedback from product/business stakeholders

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

### Artifact-Type Links (Cross-artifact relationships)
Used to link between different artifact types:

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

### Task-to-Task Relationship Links
Used for relationships between [Task] artifacts only:

| Link Type | Direction | Usage |
|-----------|-----------|-------|
| `blocking` | Task A → Task B | "This task blocks that task" |
| `dependent_on` | Task A → Task B | "This task is blocked by that task" |
| `related_to` | Task A ↔ Task B | "Similar work in same area" |
| `duplicate_of` | Task A → Task B | "This task is a duplicate" |

### Influence Links

| Link Type | Usage |
|-----------|-------|
| `influenced_by_research` | "This artifact was shaped by investigation" |
| `influenced_by_decision` | "This artifact was created based on a decision" |

---

## Obsidian Linking in Artifacts

Use wiki-style linking within artifact bodies. Links must match the exact Johnny Decimal filename (without `.md`):

```markdown
This epic is part of [[1.1.1-prd-user-authentication]] PRD.
It includes [[4.1.1-story-user-login-flow]] story.
The design was influenced by [[3.2.1-research-oauth-alternatives]] research.
Implemented based on [[6.1.1-decision-jwt-vs-session]] decision.
After completion, see [[9.1.1-retrospective-epic-1-closeout]] retrospective.
```

### Linking Examples by Category

- **PRD**: `[[1.1.1-prd-user-authentication]]` or `[[1.2.1-prd-dayz-modding]]`
- **Epic**: `[[2.1.1-epic-separate-cli-tool]]` or `[[2.2.1-epic-user-auth-system]]`
- **Spec**: `[[2.1.1-spec-cli-requirements]]` or `[[2.2.1-spec-auth-requirements]]`
- **Research**: `[[3.1.1-research-jwt-best-practices]]` or `[[3.2.1-research-oauth-alternatives]]`
- **Decision**: `[[6.1.1-decision-jwt-vs-session]]` or `[[6.2.1-decision-cli-framework]]`
- **Story**: `[[4.1.1-story-user-login-flow]]` or `[[4.3.1-story-template-extraction]]`
- **Task**: `[[5.1.1-task-database-schema]]` or `[[5.3.1-task-extract-files]]`
- **Retrospective**: `[[9.1.1-retrospective-epic-1-closeout]]`

Links enable navigation and relationship discovery in basicmemory. All frontmatter links should use the `target:` field with the same format as wiki-style links (without brackets).
