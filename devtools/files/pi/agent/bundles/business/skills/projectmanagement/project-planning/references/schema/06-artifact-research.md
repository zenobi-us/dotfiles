### [Research] Picoschema Definition

```yaml
---
title: Research
type: schema
entity: Research
version: 1
schema:
  id: string, artifact id matching filename id segment
  project_id: string, planning project identifier
  title: string, research title
  status(enum): [in-progress, complete, inconclusive, superseded], lifecycle status
  related_task?: Task, optional related task
  ideas?(array): Idea, related ideas
  epics?(array): Epic, related epics
  stories?(array): Story, related stories
  decisions?(array): Decision, decision links
  references?(array): string, sources
settings:
  validation: strict
---
```

Required sections in note body:
- Research Questions
- Summary
- Findings
- Analysis
- Recommendations
- References
