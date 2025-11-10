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
  - type: { artifact-type | relationship-type }
    target: { Artifact ID or target artifact ID }
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

## [Task] Frontmatter Schema

Every [Task] uses the following expanded frontmatter schema:

```markdown
---
title: { Task Title }
projectId: { ProjectId }
storyId: { Parent Story ID (e.g., 4.3.1-story-template-extraction) }
epicId: { Parent Epic ID (e.g., 2.1.1-epic-separate-cli-tool) }
status: { To Do | In Progress | In Review | Done | Blocked }
storyPoints: { 1, 2, 3, 5, 8 (1-8 range for tasks) }
links:
  - type: story
    target: 4.3.1-story-template-extraction
  - type: epic
    target: 2.1.1-epic-separate-cli-tool
  - type: blocking
    target: 5.1.2-task-database-schema
  - type: influenced_by_decision
    target: 6.1.1-decision-jwt-vs-session
---

{Task Body}
```

**Key Fields:**
- **title**: Task title for quick identification
- **projectId**: The project this task belongs to (required for basicmemory organization)
- **storyId**: Parent story identifier in Johnny Decimal format (e.g., 4.3.1-story-template-extraction)
- **epicId**: Parent epic identifier in Johnny Decimal format (e.g., 2.1.1-epic-separate-cli-tool)
- **status**: Current state of the task (see `references/status-flow.md` for Task status flow)
- **storyPoints**: Fibonacci points (1, 2, 3, 5, 8) - Tasks should NOT exceed 8 points
- **links**: Relationships to parent artifacts and other tasks (see Link Types section above)

---

## Artifact Content Structure

The body of each artifact type follows a consistent pattern with specific sections.

### [PRD] Content Structure

**Frontmatter:**
```yaml
---
title: { PRD Title }
projectId: { ProjectId }
status: { Draft | In Review | Approved | Superseded }
links: []  # PRDs don't typically link to other artifacts in frontmatter
---
```

**Links:**
- to one or more [Epic]

**Sections:**
- **Executive Summary**: High-level business direction and strategic context
- **Market/User Problem**: What problem does this solve?
- **Vision Statement**: What success looks like
- **Key Objectives**: Business goals (3-5 key objectives)
- **Success Metrics**: How we'll measure success
- **Timeline**: Expected timeline or phasing
- **Assumptions**: Underlying business assumptions
- **Constraints**: Budget, resource, or technical constraints
- **Out of Scope**: What is explicitly NOT included

---

### [Epic] Content Structure

**Frontmatter:**
```yaml
---
title: { Epic Title }
projectId: { ProjectId }
status: { Active | On Hold | Completed | Cancelled }
links:
  - type: prd
    target: 1.1.1-prd-user-authentication
  - type: spec
    target: 2.1.1-spec-epic-requirements
---
```

**Links:**
- to a single [Spec]
- to one or more [Story]
- to one or more [Task] via linked [Story]
- optionally to [Research] and [Decision]

**Sections:**
- **Preamble**: High-level description of the epic
- **Objectives**: What the epic aims to achieve
- **Scope**: What is included and excluded
- **Success Criteria**: How we'll know the epic is complete
- **Timeline**: Estimated duration or phase timeline
- **Dependencies**: External dependencies or blockers

---

### [Spec] Content Structure

**Frontmatter:**
```yaml
---
title: { Spec Title }
projectId: { ProjectId }
status: { Draft | In Review | Approved | Superseded }
links:
  - type: epic
    target: 2.1.1-epic-separate-cli-tool
  - type: research
    target: 3.1.1-research-cli-patterns
---
```

**Links:**
- to a single [Epic]
- to one or more [Story]
- to one or more [Research]
- to one or more [Decision]

**Sections:**
- **Detailed Preamble**: Comprehensive description of requirements
- **Requirements**: Specific functional and non-functional requirements
- **Objectives**: Goals the spec aims to achieve
- **Constraints**: Technical, business, or organizational constraints
- **Assumptions**: Underlying assumptions made
- **Success Criteria**: Specific, measurable completion criteria

---

### [Research] Content Structure

**Frontmatter:**
```yaml
---
title: { Research Title }
projectId: { ProjectId }
status: { In Progress | Complete | Inconclusive | Superseded }
links:
  - type: epic
    target: 2.1.1-epic-separate-cli-tool
  - type: decision
    target: 6.1.1-decision-cli-framework
---
```

**Links:**
- to one or more [PRD], [Epic], [Spec], [Story], [Task] (informing artifacts)
- optionally to [Decision] (research that led to decision)

**Sections:**
- **Research Question**: What is being investigated?
- **Methodology**: How is the research being conducted?
- **Findings**: What was discovered? (data, analysis, observations)
- **Analysis**: What do the findings mean?
- **Recommendations**: What should we do based on this research?
- **Limitations**: What are the boundaries/limitations of this research?
- **References**: Links to sources, external documents, tools used

---

### [Decision] Content Structure

**Frontmatter:**
```yaml
---
title: { Decision Title }
projectId: { ProjectId }
status: { Pending | Decided | Unresolved | Superseded }
links:
  - type: research
    target: 3.1.1-research-jwt-vs-sessions
  - type: epic
    target: 2.2.1-epic-user-auth-system
---
```

**Links:**
- to one or more [Research] (informing the decision)
- to one or more [Spec], [Story], [Task] (influenced artifacts)
- if Superseded: to the new [Decision]

**Sections:**
- **Context**: Why is this decision needed?
- **Options Considered**: What were the alternatives?
- **Decision**: What option was chosen and why?
- **Rationale**: The reasoning behind this choice
- **Trade-offs**: What are we accepting/sacrificing?
- **Implications**: How does this affect the project?
- **Review Schedule**: When should this decision be revisited?

---

### [Story] Content Structure

**Frontmatter:**
```yaml
---
title: { Story Title }
projectId: { ProjectId }
status: { To Do | In Progress | In Review | Done | Blocked | Cancelled }
storyPoints: { 3, 5, 8, 13 (typical range for stories) }
links:
  - type: epic
    target: 2.1.1-epic-separate-cli-tool
  - type: spec
    target: 2.1.1-spec-cli-requirements
  - type: task
    target: 5.1.1-task-implement-extraction
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

### [Task] Content Structure

**Frontmatter:**
```yaml
---
title: { Task Title }
projectId: { ProjectId }
storyId: 4.3.1-story-template-extraction
epicId: 2.1.1-epic-separate-cli-tool
status: { To Do | In Progress | In Review | Done | Blocked | Cancelled }
storyPoints: { 1, 2, 3, 5, 8 (max 8 for tasks) }
links:
  - type: story
    target: 4.3.1-story-template-extraction
  - type: epic
    target: 2.1.1-epic-separate-cli-tool
  - type: blocking
    target: 5.1.2-task-database-schema
  - type: influenced_by_decision
    target: 6.1.1-decision-jwt-vs-session
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

### [Retrospective] Content Structure

**Frontmatter:**
```yaml
---
title: { Retrospective Title }
projectId: { ProjectId }
status: { In Progress | Complete }
links:
  - type: epic
    target: 2.1.1-epic-separate-cli-tool
  - type: decision
    target: 6.1.1-decision-cli-framework
---
```

**Links:**
- to a single [Epic] or [PRD] (the closed-out work package)
- to all unresolved [Decision] artifacts from that epic (MANDATORY)

**Sections:**
- **Meeting Date & Attendees**: When and who participated
- **Successes**: What went well? (team accomplishments, positive outcomes)
- **Challenges**: What was difficult? (obstacles, surprises, pain points)
- **Lessons Learned**: What should we remember for next time? (patterns, anti-patterns)
- **Action Items**: What will we change/improve? (prioritized list)
- **Unresolved Decisions Review**: Review of all unresolved [Decision] artifacts from this epic
  - Status: Were they resolved? Still pending?
  - Impact: What was the impact of uncertainty?
  - Next Steps: Revisit during planning phase?
- **Team Feedback**: Open feedback from team members
- **Stakeholder Feedback**: Any feedback from product/business stakeholders

---

## Relationship Patterns

### Epic → Spec → Story → Task Hierarchy

Every artifact maintains clear parent-child relationships:

```
[Epic]
  ├→ [Spec] (1:1 relationship)
  └→ [Story] (1:many)
      └→ [Task] (1:many)
```

**Important:** Tasks must always link to both their parent Story AND parent Epic for full traceability.

### Cross-cutting Relationships

Research and Decisions can be linked to any artifact type:

```
[Research] → can inform → [Spec], [Story], [Task]
[Decision] → can guide → [Spec], [Story], [Task]
```

Use `influenced_by` links in Task relationships to trace decisions made.

---

## Link Types Summary

### Artifact-Type Links (Cross-artifact relationships)
Used to link between different artifact types:

| Link Type | Usage |
|-----------|-------|
| `prd` | Link to a [PRD] |
| `epic` | Link to an [Epic] |
| `spec` | Link to a [Spec] |
| `research` | Link to [Research] |
| `decision` | Link to a [Decision] |
| `story` | Link to a [Story] |
| `task` | Link to a [Task] |
| `retrospective` | Link to a [Retrospective] |

### Task-to-Task Relationship Links
Used for relationships between [Task] artifacts only:

| Link Type | Direction | Usage |
|-----------|-----------|-------|
| `blocking` | Task A → Task B | "This task blocks that task" |
| `dependent_on` | Task A → Task B | "This task is blocked by that task" |
| `related_to` | Task A ↔ Task B | "Similar work in same area" |
| `duplicate_of` | Task A → Task B | "This task is a duplicate" |

### Influence Links

| Link Type | Usage |
|-----------|-------|
| `influenced_by_research` | "This artifact was shaped by investigation" |
| `influenced_by_decision` | "This artifact was created based on a decision" |

---

## Obsidian Linking in Artifacts

Use wiki-style linking within artifact bodies. Links must match the exact Johnny Decimal filename (without `.md`):

```markdown
This epic is part of [[1.1.1-prd-user-authentication]] PRD.
It includes [[4.1.1-story-user-login-flow]] story.
The design was influenced by [[3.2.1-research-oauth-alternatives]] research.
Implemented based on [[6.1.1-decision-jwt-vs-session]] decision.
After completion, see [[9.1.1-retrospective-epic-1-closeout]] retrospective.
```

### Linking Examples by Category

- **PRD**: `[[1.1.1-prd-user-authentication]]` or `[[1.2.1-prd-dayz-modding]]`
- **Epic**: `[[2.1.1-epic-separate-cli-tool]]` or `[[2.2.1-epic-user-auth-system]]`
- **Spec**: `[[2.1.1-spec-cli-requirements]]` or `[[2.2.1-spec-auth-requirements]]`
- **Research**: `[[3.1.1-research-jwt-best-practices]]` or `[[3.2.1-research-oauth-alternatives]]`
- **Decision**: `[[6.1.1-decision-jwt-vs-session]]` or `[[6.2.1-decision-cli-framework]]`
- **Story**: `[[4.1.1-story-user-login-flow]]` or `[[4.3.1-story-template-extraction]]`
- **Task**: `[[5.1.1-task-database-schema]]` or `[[5.3.1-task-extract-files]]`
- **Retrospective**: `[[9.1.1-retrospective-epic-1-closeout]]`

Links enable navigation and relationship discovery in basicmemory. All frontmatter links should use the `target:` field with the same format as wiki-style links (without brackets).
