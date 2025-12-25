# Artifact Schemas and Content Structure

This document defines the schema and content structure for each artifact type in the project management framework.

## Universal Frontmatter Schema

All artifacts use this consistent frontmatter structure for relationships and metadata:

```markdown
---
title: { Artifact Title }
projectId: { ProjectId }
status: { See status-flow.md for valid values per artifact type }
links:
  - "[[artifact-id|link-type]]"
---

{Artifact Body}
```

### Common Fields Across All Artifacts

- **title**: Artifact title for quick identification
- **projectId**: The project this artifact belongs to (required for basicmemory organization and retrieval)
- **status**: Current state of the artifact (see `references/status-flow.md` for valid values per artifact type)
- **links**: Relationships to other artifacts or tasks

### Link Types

#### Artifact-Type Links (Cross-artifact relationships)
Used to link between different artifact types:
- `prd`: Link to a [PRD]
- `epic`: Link to an [Epic]
- `spec`: Link to a [Spec]
- `research`: Link to [Research]
- `decision`: Link to a [Decision]
- `story`: Link to a [Story]
- `task`: Link to a [Task]
- `retrospective`: Link to a [Retrospective]

#### Task-to-Task Relationship Links
Used for relationships between [Task] artifacts only:
- `blocking`: This task blocks another task
- `dependent_on`: This task is blocked by another task
- `related_to`: This task is related but not blocked
- `duplicate_of`: This task is a duplicate

#### Influence Links
Used to trace decisions and research impact:
- `influenced_by_research`: This artifact was shaped by research/investigation
- `influenced_by_decision`: This artifact was created based on a decision

---
