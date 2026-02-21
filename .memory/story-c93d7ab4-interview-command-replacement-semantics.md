---
id: c93d7ab4
title: Replace interview command with local pi-tui semantics
created_at: 2026-02-20T22:51:00+10:30
updated_at: 2026-02-20T22:51:00+10:30
status: todo
epic_id: 9c7e21ab
phase_id: 8b1e4d2f
priority: critical
story_points: 8
---

# Replace interview command with local pi-tui semantics

## User Story
As a Pi operator, I want the local extension to replace `interview` behavior so that existing workflows use pi-tui questionnaires transparently.

## Acceptance Criteria
- [ ] Local extension registers replacement behavior for `interview`.
- [ ] Replacement preserves expected invocation contract for existing callers.
- [ ] Flow uses pi-tui directly and does not start browser/server fallback paths.
- [ ] No timeout is applied to the questionnaire session.
- [ ] Cancel/exit behavior is explicit and returns predictable cancellation output.
- [ ] Response payload remains compatible with prior interview consumer expectations.

## Context
MVP decision is to implement locally in Dotfiles, replace `interview`, include no browser fallback, and remove timeout behavior.

## Out of Scope
- Upstream PR/change to original `pi-interview-tool` package.
- Feature-flagged dual-mode (browser + pi-tui) behavior.
- Additional command aliases beyond `interview`.

## Tasks
- [task-b4e9a2d7-wire-local-extension-interview-replacement.md](task-b4e9a2d7-wire-local-extension-interview-replacement.md)
- [task-c6f1b8e2-enforce-no-timeout-and-compatibility-contract.md](task-c6f1b8e2-enforce-no-timeout-and-compatibility-contract.md)

## Notes
Replacement must be explicit and observable to minimize migration risk for existing automation.
