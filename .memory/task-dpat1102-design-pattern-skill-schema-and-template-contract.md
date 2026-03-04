---
id: dpat1102
title: Design pattern-skill schema and template contract
epic_id: dpat2601
phase_id: dpatp101
story_id: null
created_at: 2026-03-04T20:04:20+10:30
updated_at: 2026-03-04T20:04:20+10:30
status: todo
assigned_to: session-20260304-2003
---

# Task: Design pattern-skill schema and template contract

## Objective
Define a canonical, reusable skill template that maps each design pattern to coding-agent decision signals, implementation guidance, and misuse checks.

## Related Story
N/A

## Steps
1. Consume boundary constraints from `research-dpatr002-refactoring-guru-content-usage-boundaries.md` and convert them into non-optional template rules.
2. Audit existing skill format conventions under `/home/zenobius/.pi/agent/skills`.
3. Define mandatory sections (intent, applicability signals, contraindications, implementation checklist, verification rubric, references, attribution).
4. Define optional sections for language-specific examples and migration guidance.
5. Author a template specification artifact with frontmatter and section constraints.
6. Validate template against at least 3 pilot patterns (Strategy, Factory Method, Observer) for completeness and boundary compliance.

## Unit Tests
- N/A (planning/specification task).

## Expected Outcome
A stable skill-schema contract ready for pilot skill authoring in `dpatp102`.

## Actual Outcome
Not started.

## Lessons Learned
TBD.
