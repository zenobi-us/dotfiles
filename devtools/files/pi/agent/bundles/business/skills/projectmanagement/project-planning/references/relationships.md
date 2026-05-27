---
name: relationships
description: Relationship rules for miniproject-aligned planning artifacts.
---

# Artifact Relationships

## Core Hierarchy
```text
[Idea] -> [Epic] -> [Story] -> [Task]
```

## Mandatory Links
- Task MUST include `phase_id` (phase section inside Epic).
- Task SHOULD include `story_id`; MAY be omitted only for infra/exploratory work.
- Story MUST link to one Epic.
- Retrospective MUST link unresolved Decisions.
- Artifact files MUST follow `type-<8hex>-<kebab-title>.md` naming conventions, except reserved snapshot files.
- Reserved snapshot files (`summary.md`, `todo.md`, `team.md`, `roadmap.md`, `knowledge-codemap.md`, `knowledge-data-flow.md`, optional `constitution.md`) MUST keep exact names.
- More details: see [Filename Conventions](./filename-conventions.md).

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
