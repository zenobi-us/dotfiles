### [Task] Picoschema Definition

```yaml
---
title: Task
type: schema
entity: task
version: 1
schema:
  id?: string, optional body observation mirror of artifact id
  project_id?: string, optional body observation mirror of planning project identifier
  title?: string, optional body observation mirror of task title
  epic?: Epic, optional parent epic wiki-link relation
  story?: Story, optional related story wiki-link relation when requirement work
  phase_id?: string, optional body observation mirror of required phase id within epic
  status?(enum, optional body observation mirror of lifecycle status): [todo, in-progress, in-review, completed, blocked, cancelled]
  story_points?(enum, optional body observation mirror of estimate): [1, 2, 3, 5, 8]
  assigned_to?: string, optional body observation mirror of owner session-id or human
  depends_on?(array, optional task dependency wiki-link relations): Task
settings:
  validation: strict
  frontmatter:
    id: string, artifact id matching filename id segment
    project_id: string, planning project identifier
    title: string, task title
    epic: string, canonical memory:// machine link for parent epic
    story?: string, canonical memory:// machine link for related story when requirement work
    phase_id: string, required phase id within epic
    status(enum, lifecycle status): [todo, in-progress, in-review, completed, blocked, cancelled]
    story_points?(enum, estimate): [1, 2, 3, 5, 8]
    assigned_to?: string, owner session-id or human
    depends_on?(array, canonical memory:// machine links for task dependencies): string
---
```

Required sections in note body:
- Objective
- Related Story
- Related Phase
- Steps
- Unit Tests
- Expected Outcome
- Actual Outcome
- Lessons Learned
