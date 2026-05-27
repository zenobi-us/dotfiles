### [Idea] Picoschema Definition

```yaml
---
title: Idea
type: schema
entity: Idea
version: 1
schema:
  id: string, artifact id matching filename id segment
  project_id: string, planning project identifier
  title: string, short idea title
  status(enum): [triaged, incubating, promoted, rejected], lifecycle status
  horizon(enum): [now, next, later], planning horizon
  promote_criteria?: string, criteria to promote to epic
  related_epic?: Epic, linked epic when promoted
  references?(array): string, URLs or source refs
settings:
  validation: strict
---
```

Required sections in note body:
- Problem/Opportunity
- Expected Impact
- Unknowns
- Promotion Decision
