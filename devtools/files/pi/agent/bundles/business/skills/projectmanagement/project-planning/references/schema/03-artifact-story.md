### [Story] Content Structure

**Frontmatter:**
```yaml
---
title: { Story Title }
projectId: { ProjectId }
epic_id: { Epic ID }
status: { draft | approved | in-progress | in-review | completed | blocked | cancelled }
priority: { critical | high | medium | low }
story_points: { 1 | 2 | 3 | 5 | 8 | 13, optional }
test_coverage: { none | partial | full }
---
```

Frontmatter `id` MUST match the `<id>` segment in the filename.
For full naming rules, see [Filename Conventions](../filename-conventions.md).

**Links:**
- to exactly one [Epic]
- to one or more [Task]
- optionally to [Research], [Decision], [Learning]

**Sections:**
- **User Story**
- **Acceptance Criteria**
- **Context**
- **Out of Scope**
- **Tasks**
- **Test Specification**
  - **E2E Tests** (AC-to-test mapping)
  - **Unit Test Coverage (via Tasks)**
- **Notes**
