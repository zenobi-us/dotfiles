---
id: dpatr001
title: Refactoring.Guru design-pattern catalog intake
created_at: 2026-03-04T16:46:07+10:30
updated_at: 2026-03-04T16:46:07+10:30
status: completed
epic_id: dpat2601
phase_id: dpatp101
related_task_id: dpath001
---

# Research: Refactoring.Guru design-pattern catalog intake

## Research Questions
1. Does Refactoring.Guru provide a coherent pattern taxonomy suitable for skill derivation?
2. What immediate scope signal exists for pilot-vs-full rollout planning?
3. What source references should be retained in memory artifacts?

## Summary
Using `lynx -dump -nolist https://refactoring.guru/design-patterns`, the source was verified as a design-pattern catalog that explicitly states a **list of 22 classic design patterns grouped by intent**. This is suitable as a canonical taxonomy seed for skill derivation planning.

## Findings
- The page identifies design patterns as reusable solutions to common software design problems.
- The catalog section confirms grouping by intent and cites 22 classic patterns.
- Supporting sections on benefits, classification, history, and criticism indicate enough context to build balanced skills (not just usage, but tradeoffs/misuse).
- This supports phased delivery: pilot subset first, then full catalog expansion.

## References
- Refactoring.Guru — Design Patterns: https://refactoring.guru/design-patterns
- Verification command output captured in session transcript via `lynx -dump -nolist`.
