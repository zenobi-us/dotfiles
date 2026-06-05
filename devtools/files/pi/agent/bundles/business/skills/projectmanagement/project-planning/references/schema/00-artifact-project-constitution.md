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
projectId: { ProjectId }
status: { draft | active | superseded }
version: { semver or integer }
ratified_at: { date, optional }
---
```

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
