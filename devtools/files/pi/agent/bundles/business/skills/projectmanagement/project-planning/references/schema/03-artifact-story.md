### [Story] Picoschema Definition

```yaml
---
title: Story
type: schema
entity: Story
version: 1
schema:
  id: string, artifact id matching filename id segment
  project_id: string, planning project identifier
  title: string, story title
  epic: Epic, parent epic
  status(enum): [draft, approved, in-progress, in-review, completed, blocked, cancelled], lifecycle status
  priority(enum): [critical, high, medium, low], priority level
  story_points?(enum): [1, 2, 3, 5, 8, 13], estimate
  test_coverage(enum): [none, partial, full], coverage state
  tasks?(array): Task, implementation tasks
settings:
  validation: strict
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
