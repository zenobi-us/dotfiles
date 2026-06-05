---
name: relationships
description: Relationship rules for miniproject-aligned planning artifacts.
---

# Artifact Relationships

## Core Hierarchy
```text
[Project Constitution]
          |
          v
[Idea] -> [Epic] -> [Story] -> [Task]
```

## Mandatory Links
- Task MUST include `phase_id` (phase section inside Epic).
- Task SHOULD include `story_id`; MAY be omitted only for infra/exploratory work.
- Story MUST link to one Epic.
- Retrospective MUST link unresolved Decisions.
- ID-bearing artifact files MUST follow `type-<8hex>-<kebab-title>.md` naming conventions.
- Singleton/reserved files (`constitution.md`, `summary.md`, `todo.md`, `team.md`, `roadmap.md`, `knowledge-codemap.md`, `knowledge-data-flow.md`) MUST keep exact names.
- `constitution.md` is a singleton artifact: exactly one MUST exist per project before planning exits, and a project MUST NOT contain more than one constitution file.
- More details: see [Filename Conventions](./filename-conventions.md).

## Project Constitution Rules
- `constitution.md` is the highest-priority planning artifact.
- Epics, Stories, Tasks, Research, Decisions, Learning, and Retrospectives MUST NOT contradict the active constitution.
- Any artifact that intentionally deviates from `constitution.md` MUST link to a Decision explaining the exception.
- Decisions that amend governance MUST update `constitution.md` or explicitly defer amendment with rationale.

## Cross-Cutting Links
- `influenced_by_research`
- `influenced_by_decision`
- `dependent_on`
- `related_to`
- `duplicate_of`
- `blocks`

## Link Format
Use markdown links only.
Link targets MUST follow filename conventions.
More details: see [Filename Conventions](./filename-conventions.md).
