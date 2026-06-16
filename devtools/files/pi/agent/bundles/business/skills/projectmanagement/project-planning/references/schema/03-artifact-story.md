### [Story] Picoschema Definition

```yaml
---
title: Story
type: schema
entity: story
version: 1
schema:
  id?: string, optional body observation mirror of artifact id
  project_id?: string, optional body observation mirror of planning project identifier
  title?: string, optional body observation mirror of story title
  epic?: Epic, optional parent epic wiki-link relation
  status?(enum, optional body observation mirror of lifecycle status): [draft, approved, in-progress, in-review, completed, blocked, cancelled]
  priority?(enum, optional body observation mirror of priority level): [critical, high, medium, low]
  story_points?(enum, optional body observation mirror of estimate): [1, 2, 3, 5, 8, 13]
  test_coverage?(enum, optional body observation mirror of coverage state): [none, partial, full]
  tasks?(array, optional implementation task wiki-link relations): Task
settings:
  validation: strict
  frontmatter:
    id: string, artifact id matching filename id segment
    project_id: string, planning project identifier
    title: string, story title
    epic: string, canonical memory:// machine link for parent epic
    status(enum, lifecycle status): [draft, approved, in-progress, in-review, completed, blocked, cancelled]
    priority(enum, priority level): [critical, high, medium, low]
    story_points?(enum, estimate): [1, 2, 3, 5, 8, 13]
    test_coverage(enum, coverage state): [none, partial, full]
    tasks?(array, canonical memory:// machine links for implementation tasks): string
---
```

Required sections in note body:
- User Story
- Acceptance Criteria
- Context
- Out of Scope
- Tasks
- Test Specification
- Notes
