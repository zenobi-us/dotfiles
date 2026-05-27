---
name: project-planning
description: |
  Versitile project planning skill for tracking ideas, defining detail and tracking progress on delivery.
  Use when you need to create, manage, or understand project planning artifacts like Epics, Stories, Tasks, Research, and Decisions. Follow the defined workflow phases and artifact relationships to ensure consistent and effective project planning.
  Results in well-structured project plans, clear traceability, and informed decision-making throughout the project lifecycle.
---

# Project Planning

## Rule Zero

This skill presents a router to the agent for following the project planning workflow. It provides guidance on artifact types, workflow phases, estimation techniques, relationships, and status transitions.

The user will invoke the agent to use this skill in various scenarios, so there are two main steps to follow: 


1. Detecting the storage system for the current CWD.
2. Lazy loading only the relevant resources when needed based on the current workflow phase and artifact type.


## Detecting Storage System

When the agent is invoked, it should first determine the storage system in use for the current CWD or request.

1. Look in these places for this information in order:
   - There might be a `$PROJECT_PLANNING_STORAGE_SYSTEM` environment variable defined that indicates the storage system. If so, use that information.
   - The `AGENTS.md` might have already described the storage system for this agent. If so, use that information.
   - The user might have specified the storage system in their request or in the context of the conversation. If so, use that information.
2. Qualify the storage system defined. It might not exist. Only valid storage systems defined in ./references/storage-systems are valid. If the storage system is invalid, respond with an error message indicating that the storage system is not supported and provide a list of valid storage systems.

## Planning Artifacts

1. Before using any concept here you MUST detect a StorageSystem strategy from one of the available backend references for the project you are operating in. If no strategy is detected, you MUST escalate to Q and stop before execution.
2. You MUST follow the defined artifact types, workflow phases, and relationships when creating and managing planning artifacts.
3. You MUST adhere to the filename conventions for all artifact files and links.
4. You MUST use the provided schemas for each artifact type to ensure consistency and completeness of information
5. You MUST escalate to Q for any strategic decisions, scope changes, timeline shifts, major refactors, or resource constraints that arise during planning.

### Planning Artifact Types

Every project planning file must be one of the following: 

- [Idea](./references/schema/01-artifact-idea.md): low-commitment opportunity framing; may promote to Epic.
- [Epic](./references/schema/02-artifact-epic.md): committed direction with phase planning sections.
- [Story](./references/schema/03-artifact-story.md): phase-agnostic requirement (WHAT) with acceptance criteria and test spec.
- [Task](./references/schema/04-artifact-task.md): scheduled implementation work (WHEN) with required `phase_id`; links to story when applicable.
- [Research](./references/schema/06-artifact-research.md): structured discovery feeding decisions and scope.
- [Decision](./references/schema/05-artifact-decision.md): explicit choice with rationale and trade-offs.
- [Learning](./references/schema/07-artifact-learning.md): distilled reusable knowledge.
- [Retrospective](./references/schema/08-artifact-retrospective.md): closeout review; MUST include unresolved decision review.

### Filename Conventions

See: [Filename Conventions](./references/filename-conventions.md)

### Storage System

You MUST select one storage backend before execution:
- [Basic Memory Storage](./references/storage-system/basic-memory.md)
- [GitHub Issues Storage](./references/storage-system/github-issues.md)
- [GitHub Projects Storage](./references/storage-system/github-projects.md)
- [Jira Storage](./references/storage-system/jira.md)

If the selected backend document is still a TODO/stub, the agent MUST escalate to Q and stop before execution.

### Planning Artifact Relationships

See: [Relationships](./references/relationships.md)

## Process Principles

### Workflow Phases

Depending on the artifact type you're working with, you may need to execute different workflow phases. The core workflow includes:

0. Initialization — Setup Storage System with necessary templates and structure (The storage system instructions will define how to do this for each backend)

1. Planning — define artifacts and links
   - See: [Planning Phase](./references/workflow/planning-phase.md)
2. Execution — advance work through status transitions
   - See: [Execution Phase](./references/workflow/execution-phase.md)
3. Closing — reconcile artifacts and prepare closeout
   - See: [Closing Phase](./references/workflow/closing-phase.md)
4. Retrospective — capture lessons and follow-ups
   - See: [Retrospective Phase](./references/workflow/retrospective-phase.md)

See complete model: [Workflow Overview](./references/workflow/overview.md)

### Status Transitions

See: [Status Flow](./references/status-flow.md)

### Escalation

Escalate strategic decisions to Q: scope changes, timeline shifts, major refactors, resource constraints.

### Estimation

See: [Estimations](./references/estimations.md)

