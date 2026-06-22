### [Retrospective] Picoschema Definition

```yaml
---
title: Retrospective
type: schema
entity: retrospective
version: 1
schema:
  id?: string, optional body observation mirror of artifact id
  project_id?: string, optional body observation mirror of planning project identifier
  title?: string, optional body observation mirror of retrospective title
  status?(enum, optional body observation mirror of lifecycle status): [in-progress, complete]
  epic?: Epic, optional related epic or project-level closeout wiki-link relation
  unresolved_decisions?(array, optional unresolved decision wiki-link relations): Decision
  stories?(array, optional related story wiki-link relations): Story
  tasks?(array, optional related task wiki-link relations): Task
  learnings?(array, optional related learning wiki-link relations): Learning
settings:
  validation: strict
  frontmatter:
    id: string, artifact id matching filename id segment
    project_id: string, planning project identifier
    title: string, retrospective title
    status(enum, lifecycle status): [in-progress, complete]
    epic?: string, canonical memory:// machine link for related epic; omit for project-level closeout
    unresolved_decisions?(array, canonical memory:// machine links for unresolved decisions): string
    stories?(array, canonical memory:// machine links for related stories): string
    tasks?(array, canonical memory:// machine links for related tasks): string
    learnings?(array, canonical memory:// machine links for related learnings): string
---
```

Required sections in note body:
- Meeting Date & Attendees
- Successes
- Challenges
- Lessons Learned
- Action Items
- Unresolved Decisions Review
- Team Feedback
- Stakeholder Feedback
