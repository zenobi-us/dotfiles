### [Decision] Picoschema Definition

```yaml
---
title: Decision
type: schema
entity: Decision
version: 1
schema:
  id: string, artifact id matching filename id segment
  project_id: string, planning project identifier
  title: string, decision title
  status(enum): [pending, decided, unresolved, superseded], lifecycle status
  research?(array): Research, supporting research links
  epic?: Epic, affected epic
  story?: Story, affected story
  task?: Task, affected task
  supersedes?: Decision, replaced decision
settings:
  validation: strict
---
```

Required sections in note body:
- Context
- Options Considered
- Decision
- Rationale
- Trade-offs
- Implications
- Review Schedule
