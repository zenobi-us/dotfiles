### [Idea] Picoschema Definition

```yaml
---
title: Idea
type: schema
entity: idea
version: 1
schema:
  id?: string, optional body observation mirror of artifact id
  project_id?: string, optional body observation mirror of planning project identifier
  title?: string, optional body observation mirror of short idea title
  status?(enum, optional body observation mirror of lifecycle status): [triaged, incubating, promoted, rejected]
  horizon?(enum, optional body observation mirror of planning horizon): [now, next, later]
  promote_criteria?: string, optional body observation mirror of criteria to promote to epic
  related_epic?: Epic, optional linked epic wiki-link relation when promoted
  references?(array, optional body/source refs): string
settings:
  validation: strict
  frontmatter:
    id: string, artifact id matching filename id segment
    project_id: string, planning project identifier
    title: string, short idea title
    status(enum, lifecycle status): [triaged, incubating, promoted, rejected]
    horizon(enum, planning horizon): [now, next, later]
    promote_criteria?: string, criteria to promote to epic
    related_epic?: string, canonical memory:// machine link for linked epic when promoted
    references?(array, URLs or source refs): string
---
```

Required sections in note body:
- Problem/Opportunity
- Expected Impact
- Unknowns
- Promotion Decision
