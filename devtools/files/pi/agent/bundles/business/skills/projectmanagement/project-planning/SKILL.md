---
name: project-planning
description: Use to know about Planning Artifacts used in project management.
---

## What are [Planning Artifact] Types?

Throughout the project-planning instructions you will see often refernces to types in the form of [Epic], [Spec], [Story], [Task], [Research], and [Decision].

This is to reinforce to you the reader or agent that these are distinct artifact types with specific roles.

- [PRD]: Product Requirements Document, A high-level statement of what the product should achieve. They capture the needs and expectations of stakeholders. A [PRD] informs managers in the creation of one or more [Epic].
- [Epic]: A large body of work that is described by Stories. An [Epic] is always accompanied by a [Spec], they have a 1:1 relationship.
- [Spec]: A detailed description of the project's requirements and objectives. It leads to creation of one or more [Story].
- [Research]: Information gathering and analysis conducted to inform project decisions. Primary phase: Planning/Initiation (during PRD/Epic/Spec creation). Secondary phase: ad-hoc during Execution when implementation raises unknowns. [Research] informs [Spec], [Decision], and project direction. Linked to [PRD], [Epic], [Spec], [Decision], [Story], or [Task].
- [Decision]: A conclusion reached after evaluating options, often based on [Research]. [Decision] can influence [Spec] and project direction. Created during Initiation/Planning (for strategic decisions) or during Execution (for implementation decisions). Status must be "Decided" or "Unresolved". All [Decision] artifacts with status "Unresolved" MUST be linked to the [Retrospective] during the Closing phase.
- [Story]: A scenario or use case, manageable piece of work derived from an [Epic]. [Story] always contain "user stories". [Story] are always implemented by [Task].
- [Task]: A specific piece of work that needs to be completed as part of a [Story]. They are always linked to both a [Story] and an [Epic]. They can also be linked to other [Task] in interesting ways (e.g., blocking, dependent on, related to).
- [Retrospective]: A reflective artifact created at the end of an epic or project phase to capture lessons learned, successes, and areas for improvement. It summarizes insights from the team and stakeholders to inform future projects. Each [Retrospective] is linked to its corresponding [Epic] and any unresolved [Decision] artifacts.

## Workflow Phases

Projects flow through five distinct phases. Understanding where artifacts belong is critical for agents executing this skill.

**Agents make tactical decisions autonomously** (which artifact to create, when to move statuses, validating content) **but escalate strategic decisions to Q** (scope changes, timeline shifts, technical refactoring, resource constraints).

### Phase Overview

1. **Planning** — Create artifacts defining the work (PRD → Epic → Spec → Stories → Tasks)
   - → **See: skill_reference(`references/workflow/planning-phase.md`)** for detailed artifact creation sequence and validation gates

2. **Execution** — Move work to completion through status transitions
   - → **See: skill_reference(`references/workflow/execution-phase.md`)** for execution guidance

3. **Closing** — Archive completed work and formally close Epic/Project
   - → **See: skill_reference(`references/workflow/closing-phase.md`)** for closing procedures

4. **Retrospective** — Capture learnings (can follow Epic or Project completion)
   - → **See: skill_reference(`references/workflow/retrospective-phase.md`)** for retrospective guidance

### Escalation Matrix

Pause and escalate to Q when encountering:
- **Scope changes** — Feature additions/removals mid-Epic or mid-Planning
- **Timeline shifts** — Projected delivery date moves >1 week
- **Technical refactoring** — Discovered design changes during work
- **Resource constraints** — Task/Story complexity exceeds capacity

→ **See: skill_reference(`references/workflow/overview.md`)** for complete escalation matrix, artifact relationship diagram, and agent decision model.

## Estimation 

When estimation is required, read the resources: 

- → **See: skill_reference(`references/estimation.md`)** for detailed estimation techniques and best practices.

## Relationships

Artifacts maintain clear relationships to ensure traceability and context throughout the project lifecycle.

- → **See: skill_reference(`references/relationships.md`)** for detailed relationship types and usage guidelines for all artifact types (PRD, Epic, Research, Story, Task, Retrospective, Decision).

## Artifact Status Transitions

Each artifact type has valid status progressions that guide state management throughout the project lifecycle.

- → **See: skill_reference(`references/status-flow.md`** for detailed status flow diagrams and descriptions for all artifact types (PRD, Epic, Research, Story, Task, Retrospective, Decision).

## Artifact Schemas and Content Structure

All artifacts follow consistent schema patterns for organization and linking. 
Each artifact type has specific frontmatter requirements and content sections.

→ Use the linked skill resources for detailed schema definitions, artifact content structure, and link type definitions for all artifact types (PRD, Epic, Research, Story, Task, Retrospective, Decision).

**See below for specific artifact schemas:**

- → **PRD** skill_reference(`schema/01-artifact-prd.md`)
- → **Epic** skill_reference(`schema/02-artifact-epic.md`)
- → **Spec** skill_reference(`schema/03-artifact-spec.md`)
- → **Research** skill_reference(`schema/04-artifact-research.md`)
- → **Decision** skill_reference(`schema/05-artifact-decision.md`)
- → **Story** skill_reference(`schema/06-artifact-story.md`)
- → **Task** skill_reference(`schema/07-artifact-task.md`)
- → **Retrospective** skill_reference(`schema/08-artifact-retrospective.md`)

