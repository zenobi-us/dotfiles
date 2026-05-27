### [Task] Content Structure

**Frontmatter:**
```yaml
---
title: { Task Title }
projectId: { ProjectId }
epic_id: { Epic ID }
story_id: { Story ID, optional for infra/exploratory }
phase_id: { Phase ID, REQUIRED }
status: { todo | in-progress | in-review | completed | blocked | cancelled }
story_points: { 1 | 2 | 3 | 5 | 8, optional }
assigned_to: { session-id or human }
---
```

Frontmatter `id` MUST match the `<id>` segment in the filename.
For full naming rules, see [Filename Conventions](../filename-conventions.md).

**Links:**
- to exactly one [Epic]
- to exactly one phase section within Epic (via phase_id)
- to [Story] when implementing requirement work
- optionally to [Research], [Decision], other [Task]

**Sections:**
- **Objective**
- **Related Story**
- **Related Phase**
- **Steps**
- **Unit Tests**
- **Expected Outcome**
- **Actual Outcome**
- **Lessons Learned**
