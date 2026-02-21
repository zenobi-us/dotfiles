---
id: b7e24f1a
title: Image input and attachment flow in pi-tui MVP
created_at: 2026-02-20T22:51:00+10:30
updated_at: 2026-02-20T22:51:00+10:30
status: todo
epic_id: 9c7e21ab
phase_id: 8b1e4d2f
priority: high
story_points: 5
---

# Image input and attachment flow in pi-tui MVP

## User Story
As a Pi user, I want `image` questions to accept local file paths and produce attachment outputs so that media prompts are usable in the terminal-first questionnaire flow.

## Acceptance Criteria
- [ ] `image` question type is rendered and discoverable in the questionnaire flow.
- [ ] User can enter one or more local file paths for an image question.
- [ ] Paths are validated for existence/readability before submission.
- [ ] Invalid paths show actionable validation errors in pi-tui.
- [ ] Successful image answers are serialized into response attachments expected by downstream consumers.
- [ ] Image handling works without browser dependency.

## Context
`image` is explicitly in MVP scope per confirmed product decisions. Current browser flow behavior must be translated to terminal-native file selection/input semantics.

## Out of Scope
- Drag/drop or clipboard image capture.
- Remote URL fetching for images.
- Advanced media previews.

## Tasks
- [task-f7b3c4d9-add-image-question-input-ui.md](task-f7b3c4d9-add-image-question-input-ui.md)
- [task-a8d6e1c3-implement-image-attachment-serialization.md](task-a8d6e1c3-implement-image-attachment-serialization.md)

## Notes
File-path UX should be deterministic and testable in headless/local development environments.
