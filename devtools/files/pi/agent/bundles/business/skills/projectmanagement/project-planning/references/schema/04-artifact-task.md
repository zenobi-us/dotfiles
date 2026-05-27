### [Task] Picoschema Definition

```yaml
---
title: Task
type: schema
entity: Task
version: 1
schema:
  id: string, artifact id matching filename id segment
  project_id: string, planning project identifier
  title: string, task title
  epic: Epic, parent epic
  story?: Story, related story when requirement work
  phase_id: string, required phase id within epic
  status(enum): [todo, in-progress, in-review, completed, blocked, cancelled], lifecycle status
  story_points?(enum): [1, 2, 3, 5, 8], estimate
  assigned_to?: string, owner session-id or human
  depends_on?(array): Task, task dependencies
settings:
  validation: strict
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
