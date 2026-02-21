---
id: a1f3c9d2
title: Core pi-tui questionnaire rendering and navigation
created_at: 2026-02-20T22:51:00+10:30
updated_at: 2026-02-20T22:51:00+10:30
status: todo
epic_id: 9c7e21ab
phase_id: 8b1e4d2f
priority: critical
story_points: 8
---

# Core pi-tui questionnaire rendering and navigation

## User Story
As a Pi user, I want questionnaires to render directly in pi-tui with clear navigation so that I can complete structured prompts without leaving the terminal.

## Acceptance Criteria
- [ ] Questionnaire schema is rendered in pi-tui using native components only.
- [ ] `text`, `single`, `multi`, and `info` question types render correctly for MVP.
- [ ] Keyboard navigation supports next/previous movement and submission.
- [ ] Validation prevents submission when required questions are incomplete.
- [ ] Progress and current question context are visible while navigating.
- [ ] Collected answers are returned in a deterministic structure compatible with existing interview response shape.

## Context
Phase 8b1e4d2f requires moving from browser-based interview UX to a local pi-tui extension MVP. This story defines baseline questionnaire behavior independent of image upload and command replacement wiring.

## Out of Scope
- Image-specific input behavior.
- Command interception/replacement semantics.
- Browser/server fallback paths.

## Tasks
- [task-d1a4e6b8-build-pi-tui-questionnaire-renderer.md](task-d1a4e6b8-build-pi-tui-questionnaire-renderer.md)
- [task-e5c2f9a1-implement-questionnaire-navigation-validation.md](task-e5c2f9a1-implement-questionnaire-navigation-validation.md)

## Notes
Keep interaction state machine explicit to avoid regressions when adding additional question types later.
