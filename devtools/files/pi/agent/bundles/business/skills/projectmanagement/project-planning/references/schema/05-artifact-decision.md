### [Decision] Content Structure

**Frontmatter:**
```yaml
---
title: { Decision Title }
projectId: { ProjectId }
status: { pending | decided | unresolved | superseded }
---
```

Frontmatter `id` MUST match the `<id>` segment in the filename.
For full naming rules, see [Filename Conventions](../filename-conventions.md).

**Links:**
- to one or more [Research]
- to affected [Epic], [Story], [Task]
- if superseded: to replacement [Decision]

**Sections:**
- **Context**
- **Options Considered**
- **Decision**
- **Rationale**
- **Trade-offs**
- **Implications**
- **Review Schedule**
