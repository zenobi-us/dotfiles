---
id: dpat1102
title: Design pattern-skill schema and template contract
epic_id: dpat2601
phase_id: dpatp101
story_id: null
created_at: 2026-03-04T20:04:20+10:30
updated_at: 2026-03-04T20:57:00+10:30
status: completed
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
Completed. Produced strict schema/template contract artifacts:
- `research-dpatr003-design-pattern-skill-schema-contract.md`
- `research-dpatr004-design-pattern-skill-template-canonical.md`

Key outcomes delivered:
- Converted boundary constraints from `research-dpatr002` into hard, non-optional policy rules.
- Enforced strict policy for generated skills: **no direct quotes** and **no images** from Refactoring.Guru.
- Defined mandatory/optional sections, frontmatter schema, and validation gates.
- Validated schema completeness against pilot patterns: Strategy, Factory Method, Observer.

## Lessons Learned
- The safest reusable contract is policy-first: frontmatter + mandatory sections + validation gates.
- Attribution remains required even when direct quotes and images are fully disallowed.
- Pilot validation against multiple pattern families catches section gaps early and reduces template churn in authoring phase.
