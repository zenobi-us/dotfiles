### [Research] Content Structure

**Frontmatter:**
```yaml
---
title: { Research Title }
projectId: { ProjectId }
status: { in-progress | complete | inconclusive | superseded }
related_task_id: { Task ID, optional }
---
```

Frontmatter `id` MUST match the `<id>` segment in the filename.
For full naming rules, see [Filename Conventions](../filename-conventions.md).

**Links:**
- to one or more [Idea], [Epic], [Story], [Task]
- optionally to [Decision]

**Sections:**
- **Research Questions**
- **Summary**
- **Findings**
- **Analysis**
- **Recommendations**
- **References**
