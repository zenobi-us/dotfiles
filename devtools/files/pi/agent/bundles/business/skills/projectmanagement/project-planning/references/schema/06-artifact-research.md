### [Research] Picoschema Definition

```yaml
---
title: Research
type: schema
entity: research
version: 1
schema:
  id?: string, optional body observation mirror of artifact id
  project_id?: string, optional body observation mirror of planning project identifier
  title?: string, optional body observation mirror of research title
  status?(enum, optional body observation mirror of lifecycle status): [in-progress, complete, inconclusive, superseded]
  related_task?: Task, optional related task wiki-link relation
  ideas?(array, optional related idea wiki-link relations): Idea
  epics?(array, optional related epic wiki-link relations): Epic
  stories?(array, optional related story wiki-link relations): Story
  decisions?(array, optional decision wiki-link relations): Decision
  references?(array, optional sources): string
settings:
  validation: strict
  frontmatter:
    id: string, artifact id matching filename id segment
    project_id: string, planning project identifier
    title: string, research title
    status(enum, lifecycle status): [in-progress, complete, inconclusive, superseded]
    related_task?: string, canonical memory:// machine link for related task
    ideas?(array, canonical memory:// machine links for related ideas): string
    epics?(array, canonical memory:// machine links for related epics): string
    stories?(array, canonical memory:// machine links for related stories): string
    decisions?(array, canonical memory:// machine links for decision links): string
    references?(array, sources): string
---
```

Required sections in note body:
- Research Questions
- Summary
- Findings
- Analysis
- Recommendations
- References
