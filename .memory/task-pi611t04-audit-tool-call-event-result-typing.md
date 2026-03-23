---
id: pi611t04
title: Audit tool_call event result typing
created_at: 2026-03-24T09:02:06+10:30
updated_at: 2026-03-24T09:02:06+10:30
status: todo
epic_id: pi611e01
phase_id: phase-3-validation-and-guardrails
story_id: pi611s02
assigned_to: Elf8ku0kc9KBBBtrhN2odZ83
---

# Audit tool_call event result typing

## Objective
Audit local extension event hooks for `tool_call` usage and define guardrails for `ToolCallEventResult` adoption in Pi 0.61.1.

## Related Story
[story-pi611s02-tool-call-typing-audit-for-0-61-1](./story-pi611s02-tool-call-typing-audit-for-0-61-1.md) — contributes to AC1, AC2, AC3.

## Related Phase
Phase 3: Validation and Guardrails in [epic-pi611e01-update-extensions-for-pi-0-61-1](./epic-pi611e01-update-extensions-for-pi-0-61-1.md).

## Steps
- Search extension sources for `pi.on("tool_call"` and related signatures.
- Confirm current hook coverage (`tool_result`, `session_start`, etc.).
- Record finding and add implementation guardrail note for future `tool_call` hooks.

## Unit Tests
- `hook signature static audit`: verifies no untyped `tool_call` handlers exist in local extensions → supports AC1/AC2/AC3 of story `pi611s02`.

## Expected Outcome
Explicitly documented no-op migration for 0.61.1 `ToolCallEventResult` with future-proofing guidance.

## Actual Outcome
Pending.

## Lessons Learned
Pending.
