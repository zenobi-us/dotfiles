# [Project Constitution] Content Structure

## Purpose

Defines project-level governance: overall goals, principles, constraints, guidelines, decision authority, and amendment rules.

This is a singleton governing artifact, not a normal ID-bearing work item.

## Filename

- Filename MUST be exactly `constitution.md`.
- Filename MUST NOT include an id or title slug.
- Exactly one `constitution.md` MUST exist per project before planning exits.

## Frontmatter

```yaml
---
title: Project Constitution
project_id: { ProjectId }
status: { draft | active | superseded }
version: { semver or integer }
ratified_at: { date, optional }
---
```

## Basic Memory Schema Note

When Basic Memory is the selected storage backend, create or validate the constitution with a schema note equivalent to:

```yaml
---
title: Project Constitution
type: schema
entity: constitution
version: 1
schema:
  project_id?: string, optional body observation mirror of planning project identifier
  status?(enum, optional body observation mirror of constitution lifecycle status): [draft, active, superseded]
  version?: string, optional body observation mirror of constitution version
settings:
  validation: strict
  frontmatter:
    title: string, must be Project Constitution
    project_id: string, planning project identifier
    status(enum, constitution lifecycle status): [draft, active, superseded]
    version: string, semver or integer-like version string
    ratified_at?: string, optional ratification date
---
```

New Basic Memory notes MUST use `project_id` so metadata keys stay snake_case across artifact types.

## Authority

- Constitution is the highest-priority planning artifact.
- Epics, Stories, Tasks, Research, Decisions, Learning, and Retrospectives MUST NOT contradict the active constitution.
- Any intentional deviation MUST link to a Decision explaining the exception.
- Governance-changing Decisions MUST update `constitution.md` or explicitly defer amendment with rationale.

## Required Sections

- **Mission**
- **Overall Goals**
- **Non-Goals**
- **Guiding Principles**
- **Operating Guidelines**
- **Constraints**
- **Decision Rights**
- **Escalation Rules**
- **Amendment Process**
- **Active Exceptions**

## Better Section

A constitution SHOULD include a **Better** section describing how the project should improve beyond minimum delivery:

- long-term quality direction,
- maintainability expectations,
- documentation and knowledge goals,
- automation opportunities,
- practices to eliminate recurring waste.

The **Better** section MUST NOT override **Constraints**, **Decision Rights**, or **Active Exceptions**.
