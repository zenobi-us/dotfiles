### [Learning] Picoschema Definition

```yaml
---
title: Learning
type: schema
entity: Learning
version: 1
schema:
  id: string, artifact id matching filename id segment
  project_id: string, planning project identifier
  title: string, learning title
  status(enum): [active, archived], lifecycle status
  tags?(array): string, best-practices or insight tags
  epics?(array): Epic, related epics
  stories?(array): Story, related stories
  tasks?(array): Task, related tasks
  research?(array): Research, related research
  decisions?(array): Decision, related decisions
  retrospectives?(array): Retrospective, related retros
settings:
  validation: strict
---
```

Required sections in note body:
- Summary
- Details
- Implications
