---
id: b4e9a2d7
title: Wire local extension interview replacement
epic_id: 9c7e21ab
phase_id: 8b1e4d2f
story_id: c93d7ab4
created_at: 2026-02-20T22:54:00+10:30
updated_at: 2026-02-20T22:54:00+10:30
status: todo
assigned_to: session-20260220-1938
---

# Task: Wire local extension interview replacement

## Objective
Register local extension behavior that replaces `interview` invocation with the new pi-tui flow.

## Related Story
[story-c93d7ab4-interview-command-replacement-semantics.md](story-c93d7ab4-interview-command-replacement-semantics.md)

## Steps
1. Identify and implement extension entrypoint override for `interview`.
2. Route parsed question schema to pi-tui questionnaire runtime.
3. Remove browser/server launch paths from this local replacement.
4. Verify invocation compatibility with representative existing callers.

## Expected Outcome
Calling `interview` in this environment executes local pi-tui questionnaire behavior.

## Actual Outcome
Not started.

## Lessons Learned
Pending execution.
