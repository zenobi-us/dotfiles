### [Epic] Content Structure

**Frontmatter:**
```yaml
---
title: { Epic Title }
projectId: { ProjectId }
status: { planning | active | on-hold | completed | cancelled }
---
```

Frontmatter `id` MUST match the `<id>` segment in the filename.
For full naming rules, see [Filename Conventions](../filename-conventions.md).

**Links:**
- optionally from [Idea]
- to one or more [Story]
- to phase task lists represented as inline phase sections
- optionally to [Research], [Decision], [Learning]

**Sections:**
- **Vision/Goal**
- **Success Criteria**
- **Stories** (phase-agnostic WHAT)
- **Phases** (WHEN buckets with task checklists)
- **Dependencies**
