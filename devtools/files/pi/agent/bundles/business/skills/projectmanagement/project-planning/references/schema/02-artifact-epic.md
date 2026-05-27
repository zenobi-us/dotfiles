### [Epic] Picoschema Definition

```yaml
---
title: Epic
type: schema
entity: Epic
version: 1
schema:
  id: string, artifact id matching filename id segment
  project_id: string, planning project identifier
  title: string, epic title
  status(enum): [planning, active, on-hold, completed, cancelled], lifecycle status
  idea?: Idea, source idea
  stories?(array): Story, linked stories
  research?(array): Research, supporting research links
  decisions?(array): Decision, decision links
  learnings?(array): Learning, learning links
settings:
  validation: strict
---
```

Required sections in note body:
- Vision/Goal
- Success Criteria
- Stories
- Phases
- Dependencies
