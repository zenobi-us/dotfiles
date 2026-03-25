---
id: pi611s02
title: Tool Call Typing Audit for 0.61.1
created_at: 2026-03-24T09:02:06+10:30
updated_at: 2026-03-24T09:44:00+10:30
status: completed
epic_id: pi611e01
priority: medium
story_points: 1
test_coverage: full
---

# Tool Call Typing Audit for 0.61.1

## User Story
As an extension maintainer, I want tool call hooks audited against Pi 0.61.1 typing guidance so that any `tool_call` handlers return explicitly typed values when introduced.

## Acceptance Criteria
- [x] Local extension event hooks are audited for `tool_call` usage.
- [x] If no `tool_call` hooks exist, finding is recorded with evidence.
- [x] Follow-up guardrail task is defined for future `tool_call` hook additions.

## Context
Pi 0.61.1 adds typed `tool_call` return values via `ToolCallEventResult`. Current extension code appears to use `tool_result` and other events, but this must be documented to avoid future drift.

## Out of Scope
- Refactoring unrelated event handlers.
- Adopting 0.62.0 `sourceInfo` migration (separate epic).

## Tasks
- [task-pi611t04-audit-tool-call-event-result-typing](./task-pi611t04-audit-tool-call-event-result-typing.md)

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
| --- | --- | --- | --- |
| AC1 | tool_call usage audited | n/a (static code scan evidence) | passed |
| AC2 | no-usage finding documented | memory task outcome | passed |
| AC3 | guardrail task defined | memory task outcome | passed |

### Unit Test Coverage (via Tasks)
- Task `pi611t04`: static search + API usage verification output → satisfies AC1, AC2, AC3.

## Notes
Reference source: `badlogic/pi-mono` changelog `0.61.1` added `ToolCallEventResult` export.
