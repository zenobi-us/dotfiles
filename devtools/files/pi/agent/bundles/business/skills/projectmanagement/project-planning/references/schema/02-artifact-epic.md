### [Epic] Picoschema Definition

```yaml
---
title: Epic
type: schema
entity: epic
version: 1
schema:
  id?: string, optional body observation mirror of artifact id
  project_id?: string, optional body observation mirror of planning project identifier
  title?: string, optional body observation mirror of epic title
  status?(enum, optional body observation mirror of lifecycle status): [planning, active, on-hold, completed, cancelled]
  idea?: Idea, optional source idea wiki-link relation
  stories?(array, optional linked story wiki-link relations): Story
  research?(array, optional supporting research wiki-link relations): Research
  decisions?(array, optional decision wiki-link relations): Decision
  learnings?(array, optional learning wiki-link relations): Learning
settings:
  validation: strict
  frontmatter:
    id: string, artifact id matching filename id segment
    project_id: string, planning project identifier
    title: string, epic title
    status(enum, lifecycle status): [planning, active, on-hold, completed, cancelled]
    idea?: string, canonical memory:// machine link for source idea
    stories?(array, canonical memory:// machine links for linked stories): string
    research?(array, canonical memory:// machine links for supporting research): string
    decisions?(array, canonical memory:// machine links for linked decisions): string
    learnings?(array, canonical memory:// machine links for linked learnings): string
---
```

Required sections in note body:
- Vision/Goal
- Success Criteria
- Stories
- Phases
- Dependencies
