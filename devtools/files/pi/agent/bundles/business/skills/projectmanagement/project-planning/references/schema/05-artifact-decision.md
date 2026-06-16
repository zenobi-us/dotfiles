### [Decision] Picoschema Definition

```yaml
---
title: Decision
type: schema
entity: decision
version: 1
schema:
  id?: string, optional body observation mirror of artifact id
  project_id?: string, optional body observation mirror of planning project identifier
  title?: string, optional body observation mirror of decision title
  status?(enum, optional body observation mirror of lifecycle status): [pending, decided, unresolved, superseded]
  research?(array, optional supporting research wiki-link relations): Research
  epic?: Epic, optional affected epic wiki-link relation
  story?: Story, optional affected story wiki-link relation
  task?: Task, optional affected task wiki-link relation
  supersedes?: Decision, optional replaced decision wiki-link relation
settings:
  validation: strict
  frontmatter:
    id: string, artifact id matching filename id segment
    project_id: string, planning project identifier
    title: string, decision title
    status(enum, lifecycle status): [pending, decided, unresolved, superseded]
    research?(array, canonical memory:// machine links for supporting research): string
    epic?: string, canonical memory:// machine link for affected epic
    story?: string, canonical memory:// machine link for affected story
    task?: string, canonical memory:// machine link for affected task
    supersedes?: string, canonical memory:// machine link for replaced decision
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
