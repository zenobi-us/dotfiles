
## [Task] Frontmatter Schema

Every [Task] uses the following expanded frontmatter schema:

```markdown
---
title: { Task Title }
projectId: { ProjectId }
storyId: { Parent Story ID (e.g., 4.3.1-story-template-extraction) }
epicId: { Parent Epic ID (e.g., 2.1.1-epic-separate-cli-tool) }
status: { To Do | In Progress | In Review | Done | Blocked }
storyPoints: { 1, 2, 3, 5, 8 (1-8 range for tasks) }
links:
  - "[[4.3.1-story-template-extraction|story]]"
  - "[[2.1.1-epic-separate-cli-tool|epic]]"
  - "[[5.1.2-task-database-schema|blocking]]"
  - "[[6.1.1-decision-jwt-vs-session|influenced_by_decision]]"
---

{Task Body}
```

**Key Fields:**
- **title**: Task title for quick identification
- **projectId**: The project this task belongs to (required for basicmemory organization)
- **storyId**: Parent story identifier in Johnny Decimal format (e.g., 4.3.1-story-template-extraction)
- **epicId**: Parent epic identifier in Johnny Decimal format (e.g., 2.1.1-epic-separate-cli-tool)
- **status**: Current state of the task (see `references/status-flow.md` for Task status flow)
- **storyPoints**: Fibonacci points (1, 2, 3, 5, 8) - Tasks should NOT exceed 8 points
- **links**: Relationships to parent artifacts and other tasks (see Link Types section above)

---

## Artifact Content Structure
