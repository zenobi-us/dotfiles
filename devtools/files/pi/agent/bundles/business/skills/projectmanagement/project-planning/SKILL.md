---
name: project-planning
description: Planning artifact model and workflow for markdown-based project execution (miniproject-aligned).
---

This skill defines the project planning artifact model and workflow for markdown-based project execution. It includes artifact types, workflow phases, escalation guidelines, estimation practices, relationship management, status transitions, and detailed artifact schemas. 

1. Before using any concept here you MUST detect a StorageSystem strategy from one of the available backend references for the project you are operating in. If no strategy is detected, you MUST escalate to Q and stop before execution.
2. You MUST follow the defined artifact types, workflow phases, and relationships when creating and managing planning artifacts.
3. You MUST adhere to the filename conventions for all artifact files and links.
4. You MUST use the provided schemas for each artifact type to ensure consistency and completeness of information
5. You MUST escalate to Q for any strategic decisions, scope changes, timeline shifts, major refactors, or resource constraints that arise during planning.

## Planning Artifact Types

Every project planning file must be one of the following: 

- [Idea]: low-commitment opportunity framing; may promote to Epic.
- [Epic]: committed direction with phase planning sections.
- [Story]: phase-agnostic requirement (WHAT) with acceptance criteria and test spec.
- [Task]: scheduled implementation work (WHEN) with required `phase_id`; links to story when applicable.
- [Research]: structured discovery feeding decisions and scope.
- [Decision]: explicit choice with rationale and trade-offs.
- [Learning]: distilled reusable knowledge.
- [Retrospective]: closeout review; MUST include unresolved decision review.

## Workflow Phases

Depending on the artifact type you're working with, you may need to execute different workflow phases. The core workflow includes:

1. Planning — define artifacts and links
   - See: [Planning Phase](./references/workflow/planning-phase.md)
2. Execution — advance work through status transitions
   - See: [Execution Phase](./references/workflow/execution-phase.md)
3. Closing — reconcile artifacts and prepare closeout
   - See: [Closing Phase](./references/workflow/closing-phase.md)
4. Retrospective — capture lessons and follow-ups
   - See: [Retrospective Phase](./references/workflow/retrospective-phase.md)

See complete model: [Workflow Overview](./references/workflow/overview.md)

## Escalation

Escalate strategic decisions to Q: scope changes, timeline shifts, major refactors, resource constraints.

## Estimation

See: [Estimations](./references/estimations.md)

## Relationships

See: [Relationships](./references/relationships.md)

## Filename Conventions

See: [Filename Conventions](./references/filename-conventions.md)

## Storage System

You MUST select one storage backend before execution:
- [Basic Memory Storage](./references/storage-system/basic-memory.md)
- [GitHub Issues Storage](./references/storage-system/github-issues.md)
- [GitHub Projects Storage](./references/storage-system/github-projects.md)
- [Jira Storage](./references/storage-system/jira.md)

If the selected backend document is still a TODO/stub, the agent MUST escalate to Q and stop before execution.
## Status Transitions

See: [Status Flow](./references/status-flow.md)

## Artifact Schemas

- Idea: [Idea Schema](./references/schema/01-artifact-idea.md)
- Epic: [Epic Schema](./references/schema/02-artifact-epic.md)
- Story: [Story Schema](./references/schema/03-artifact-story.md)
- Task: [Task Schema](./references/schema/04-artifact-task.md)
- Decision: [Decision Schema](./references/schema/05-artifact-decision.md)
- Research: [Research Schema](./references/schema/06-artifact-research.md)
- Learning: [Learning Schema](./references/schema/07-artifact-learning.md)
- Retrospective: [Retrospective Schema](./references/schema/08-artifact-retrospective.md)
