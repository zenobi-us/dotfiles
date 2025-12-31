
### [Story] Content Structure

**Frontmatter:**
```yaml
---
title: { Story Title }
projectId: { ProjectId }
status: { To Do | In Progress | In Review | Done | Blocked | Cancelled }
storyPoints: { 3, 5, 8, 13 (typical range for stories) }
links:
  - "[[abc123-epic-separate-cli-tool|epic]]"
  - "[[def456-spec-cli-requirements|spec]]"
  - "[[ghi789-task-implement-extraction|task]]"
---
```

**Links:**
- to a single [Epic]
- to a single [Spec]
- to one or more [Task]
- optionally to [Research] and [Decision]

**Sections:**
- **Scenario Description**: Context and user scenario
- **User Stories** (in BDD format): "As a [user], I want [feature], so that [benefit]"
- **Acceptance Criteria**: Specific, testable criteria for story completion
- **Dependencies**: Other stories or external blockers
- **Notes**: Implementation hints or gotchas

---
