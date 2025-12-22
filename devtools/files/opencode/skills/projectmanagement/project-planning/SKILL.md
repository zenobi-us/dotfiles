---
name: project-planning
description: Use to know about Planning Artifacts used in project management.
---

## What are [Planning Artifact] Types?

- [PRD]: Product Requirements Document, A high-level statement of what the product should achieve. They capture the needs and expectations of stakeholders. A [PRD] informs managers in the creation of one or more [Epic].
- [Epic]: A large body of work that is described by Stories. An [Epic] is always accompanied by a [Spec], they have a 1:1 relationship.
- [Spec]: A detailed description of the project's requirements and objectives. It leads to creation of one or more [Story].
- [Research]: Information gathering and analysis conducted to inform project decisions. Primary phase: Planning/Initiation (during PRD/Epic/Spec creation). Secondary phase: ad-hoc during Execution when implementation raises unknowns. [Research] informs [Spec], [Decision], and project direction. Linked to [PRD], [Epic], [Spec], [Decision], [Story], or [Task].
- [Decision]: A conclusion reached after evaluating options, often based on [Research]. [Decision] can influence [Spec] and project direction. Created during Initiation/Planning (for strategic decisions) or during Execution (for implementation decisions). Status must be "Decided" or "Unresolved". All [Decision] artifacts with status "Unresolved" MUST be linked to the [Retrospective] during the Closing phase.
- [Story]: A scenario or use case, manageable piece of work derived from an [Epic]. [Story] always contain "user stories". [Story] are always implemented by [Task].
- [Task]: A specific piece of work that needs to be completed as part of a [Story]. They are always linked to both a [Story] and an [Epic]. They can also be linked to other [Task] in interesting ways (e.g., blocking, dependent on, related to).
- [Retrospective]: A reflective artifact created at the end of an epic or project phase to capture lessons learned, successes, and areas for improvement. It summarizes insights from the team and stakeholders to inform future projects. Each [Retrospective] is linked to its corresponding [Epic] and any unresolved [Decision] artifacts.

## [Planning Artifact] Require a ProjectId [CRITICAL]

Every [Planning Artifact] must be associated with a [ProjectId] to ensure proper organization and retrieval.

We use this [ProjectId] before interacting with any [Planning Artifact]. (Or if required, on every interaction)

<ProjectId>
  !`wiki project id | jq -r .projectId`
</ProjectId>


See individual artifact templates for detailed linking examples in frontmatter and body.

## Effort Estimation Hierarchy

[PRD] and [Spec] are not estimated directly. Instead, estimation flows down the hierarchy.

[Epic], [Story], and [Task] have different estimation levels:

### [Epic] Estimation

- Estimated in **weeks or months** (high-level)
- Derived from Story points of child [Story] (sum all stories)
- Used for: Timeline planning, resource allocation
- Refinement: As [Story] are created and estimated

### [Story] Estimation

- Estimated in **story points** (3-13 points typical range)
- Based on: Complexity, risk, dependencies
- Used for: Release planning, sprint capacity
- Refinement: During Planning phase before creating [Task]

### [Task] Estimation

- Estimated in **story points** (1-8 points)
- Based on: Specific implementation work, clear acceptance criteria
- Constraint: If [Task] > 8 points, it should be split into smaller [Task]
- Used for: Day-to-day execution, capacity planning, identifying blockers
- Refinement: Continuous during Execution as understanding grows

**Why this hierarchy matters:**

- Epic scale helps executives understand project timeline
- Story scale helps team understand sprint commitment
- Task scale helps individual contributors understand daily work
- Misalignment = surprises (story was "5 points" but contained "3x13 point tasks")

## How are [Task] relationships described?

[Task] can be linked to other [Task] in interesting ways. Choose the relationship type that best describes the interaction:

### Task Relationship Types

**When to use "blocking":**

- THIS Task must finish BEFORE other Task can start
- Use: Document dependencies for critical path analysis
- Example: "Database schema design blocks API implementation"
- From Task perspective: "This task blocks: api-task-001"

**When to use "dependent_on":**

- THIS Task cannot start UNTIL another Task finishes
- Use: Identify what's blocking your progress
- Example: "API implementation depends on database schema design"
- From Task perspective: "This task is dependent_on: database-task-001"
- Note: "blocking" and "dependent_on" are the same relationship viewed from opposite directions

**When to use "related_to":**

- THIS Task is connected but does NOT have direct dependency
- Use: Track work in same area (e.g., similar components, same feature)
- Example: "Frontend auth task is related to backend auth task" (parallel, not blocking)
- Use sparingly - don't link everything

**When to use "duplicate_of":**

- THIS Task is a duplicate of another [Task]
- Use: When duplicate work is discovered, mark the duplicate and consolidate
- Example: "This task is duplicate_of: auth-task-002"
- Action: Cancel this task, redirect work to the original

**Linking to [Research] or [Decision]:**

- "influenced_by_research": This task was shaped by investigation/analysis
- "influenced_by_decision": This task was created based on a decision made
- Use: For traceability and understanding "why was this built this way?"

**Parent artifact links (MANDATORY):**

- Every [Task] MUST link to: parent [Story] AND parent [Epic]
- This establishes the hierarchy and enables queries like "all tasks in this epic"

## Artifact Status Transitions

Each artifact type has valid status progressions that guide state management throughout the project lifecycle.

→ **See: skill_reference(`references/status-flow.md`** for detailed status flow diagrams and descriptions for all artifact types (PRD, Epic, Research, Story, Task, Retrospective, Decision).

## Artifact Schemas and Content Structure

All artifacts follow consistent schema patterns for organization and linking. Each artifact type has specific frontmatter requirements and content sections.

→ **See: `references/schema.md`** for detailed schema definitions, artifact content structure, and link type definitions for all artifact types (PRD, Epic, Research, Story, Task, Retrospective, Decision).
