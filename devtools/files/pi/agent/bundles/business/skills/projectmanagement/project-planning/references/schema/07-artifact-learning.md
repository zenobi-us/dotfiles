### [Learning] Picoschema Definition

```yaml
---
title: Learning
type: schema
entity: learning
version: 1
schema:
  id?: string, optional body observation mirror of artifact id
  project_id?: string, optional body observation mirror of planning project identifier
  title?: string, optional body observation mirror of learning title
  status?(enum, optional body observation mirror of lifecycle status): [active, archived]
  tags?(array, optional body/insight tags): string
  epics?(array, optional related epic wiki-link relations): Epic
  stories?(array, optional related story wiki-link relations): Story
  tasks?(array, optional related task wiki-link relations): Task
  research?(array, optional related research wiki-link relations): Research
  decisions?(array, optional related decision wiki-link relations): Decision
  retrospectives?(array, optional related retrospective wiki-link relations): Retrospective
settings:
  validation: strict
  frontmatter:
    id: string, artifact id matching filename id segment
    project_id: string, planning project identifier
    title: string, learning title
    status(enum, lifecycle status): [active, archived]
    tags?(array, best-practices or insight tags): string
    epics?(array, canonical memory:// machine links for related epics): string
    stories?(array, canonical memory:// machine links for related stories): string
    tasks?(array, canonical memory:// machine links for related tasks): string
    research?(array, canonical memory:// machine links for related research): string
    decisions?(array, canonical memory:// machine links for related decisions): string
    retrospectives?(array, canonical memory:// machine links for related retrospectives): string
---
```

Required sections in note body:
- Summary
- Details
- Implications
