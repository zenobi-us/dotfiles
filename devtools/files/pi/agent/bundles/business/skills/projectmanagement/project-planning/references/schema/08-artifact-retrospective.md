### [Retrospective] Picoschema Definition

```yaml
---
title: Retrospective
type: schema
entity: Retrospective
version: 1
schema:
  id: string, artifact id matching filename id segment
  project_id: string, planning project identifier
  title: string, retrospective title
  status(enum): [in-progress, complete], lifecycle status
  epic?: Epic, related epic or project-level closeout
  unresolved_decisions?(array): Decision, unresolved decisions under review
  stories?(array): Story, related stories
  tasks?(array): Task, related tasks
  learnings?(array): Learning, related learnings
settings:
  validation: strict
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
