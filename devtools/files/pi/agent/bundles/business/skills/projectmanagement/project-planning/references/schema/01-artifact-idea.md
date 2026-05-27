### [Idea] Content Structure

**Frontmatter:**
```yaml
---
title: { Idea Title }
projectId: { ProjectId }
status: { triaged | incubating | promoted | rejected }
horizon: { now | next | later }
promote_criteria: { criteria text }
related_epic_id: { epic-id, optional }
---
```

Frontmatter `id` MUST match the `<id>` segment in the filename.
For full naming rules, see [Filename Conventions](../filename-conventions.md).

**Links:**
- optionally to [Research]
- when promoted: to exactly one [Epic]

**Sections:**
- **Problem/Opportunity**
- **Expected Impact**
- **Unknowns**
- **Promotion Decision**
