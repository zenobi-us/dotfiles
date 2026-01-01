
### [Task] Content Structure

**Frontmatter:**
```yaml
---
title: { Task Title }
projectId: { ProjectId }
status: { To Do | In Progress | In Review | Done | Blocked | Cancelled }
storyPoints: { 1, 2, 3, 5, 8 (max 8 for tasks) }
---
```

**Links:**
- to a single [Story] (MANDATORY)
- to a single [Epic] (MANDATORY)
- to other [Task] (blocking, dependent on, related to, duplicate of)
- optionally to [Research] and [Decision]

**Sections:**
- **Work Item Description**: Specific implementation work required
- **Implementation Steps**: Concrete steps to complete the task
- **Out of Scope**: What is explicitly NOT included in this task
- **Definition of Done**: Checklist items that must be completed
- **Notes**: Additional context, gotchas, or implementation hints
- **Work Log**: To be filled during execution (current status, progress notes)
- **QA Testing Steps**: To be filled during execution (test cases, verification steps)

---
