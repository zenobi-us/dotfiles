---
id: c6f1b8e2
title: Enforce no-timeout and compatibility contract
epic_id: 9c7e21ab
phase_id: 8b1e4d2f
story_id: c93d7ab4
created_at: 2026-02-20T22:54:00+10:30
updated_at: 2026-02-20T22:54:00+10:30
status: todo
assigned_to: session-20260220-1938
---

# Task: Enforce no-timeout and compatibility contract

## Objective
Guarantee no timeout behavior and preserve expected response/cancel semantics for interview consumers.

## Related Story
[story-c93d7ab4-interview-command-replacement-semantics.md](story-c93d7ab4-interview-command-replacement-semantics.md)

## Steps
1. Remove/disable timeout logic for questionnaire sessions.
2. Define and implement explicit cancel output semantics.
3. Validate final response schema/shape against known consumer expectations.
4. Add tests for long-running session behavior and cancellation.

## Expected Outcome
Interview replacement has no timeout and maintains predictable, compatible outputs.

## Actual Outcome
Not started.

## Lessons Learned
Pending execution.
