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

## Basic Memory Dual-Link Policy

When Basic Memory is the selected storage backend, relationships MUST be represented in two layers:

1. Canonical machine relationship: frontmatter field containing `memory://...` URL.
2. Human/graph relationship: body wiki-link `[[...]]`, preferably as a typed relation.

Obsidian resolves `[[Note Title]]` by vault path/title. Basic Memory resolves wiki-links by note title/permalink. This is good for shared human graph navigation, but unsafe as the only machine identity layer.

Rules:
- Frontmatter `memory://...` links are source of truth for parent/child/dependency relationships.
- Body wiki-links MAY mirror frontmatter links for Obsidian and BM graph context.
- If frontmatter and body relation disagree, frontmatter wins and body MUST be corrected.
- Planning validators MUST verify frontmatter `memory://...` links; they MUST NOT rely only on wiki-link resolution.

Example:
```yaml
epic: memory://planning/epic-b17c0de5-auth
```

```md
## Relations
- part_of [[epic-b17c0de5-auth]]
```

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
Use markdown links for human-readable documents and typed body relations.
Link targets MUST follow filename conventions where file links are used.
For Basic Memory-backed artifacts, canonical machine links MUST use frontmatter `memory://...` URLs; body `[[...]]` wiki-links are graph/human mirrors.
More details: see [Filename Conventions](./filename-conventions.md) and [Basic Memory Storage](./storage-system/basic-memory.md).
