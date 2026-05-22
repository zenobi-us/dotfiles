---
name: project-planning
description: Planning artifact model and workflow for markdown-based project execution (miniproject-aligned).
---

This skill defines the project planning artifact model and workflow for markdown-based project execution. It includes artifact types, workflow phases, escalation guidelines, estimation practices, relationship management, status transitions, and detailed artifact schemas. 

Before using any concept here you MUST select a StorageSystem strategy from one of the available backend references for the project you are operating in.

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
