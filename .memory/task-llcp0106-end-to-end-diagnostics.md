---
id: llcp0106
type: task
title: End-to-end diagnostics across commands and failures
created_at: 2026-05-19
updated_at: 2026-05-20
status: completed
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 6
story_id: 
assigned_to: general-purpose-llcp0106-20260520
claimed_by_owner_id: general-purpose-llcp0106-20260520
claimed_by_workspace_id: ws-76c947008ec4
claimed_by_run_id: run-20260520-085002-447783
claim_started_at: 2026-05-19T23:20:02Z
last_heartbeat_at: 2026-05-19T23:24:41Z
lease_expires_at: 
claim_state: released
lock_reason: completed
---

# End-to-end diagnostics across commands and failures

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Normalize failure reporting across router management, provider refresh, managed process lifecycle, commands, and request gating so Operational Status gives enough information for an AFK agent or user to diagnose local llama.cpp failures without reading raw code.

## Acceptance criteria

- [x] `/llamacpp status` includes router reachability, ownership, preset file state, provider registration state, model status counts, timeout settings, last error, and recent managed process logs when relevant.
- [x] `/llamacpp list` exposes raw Router Model List availability and runtime status.
- [x] `/llamacpp start`, `/llamacpp stop`, `/llamacpp reload`, and `/llamacpp list` report clear success/failure outcomes.
- [x] Router auth failures, unavailable router, malformed `/models` responses, load failures, missing preset files, and timeout errors are normalized consistently.
- [x] Request gate errors include enough detail to distinguish load failure from provider chat failure.
- [x] Error output avoids leaking resolved secret values.
- [x] Integration-style tests combine fake settings, fake router responses, fake process operations, and fake Pi provider API to verify startup, reload, list, status, start/stop, and request-gate diagnostic flows.

## Blocked by

[Managed Llama Server Router lifecycle](./task-llcp0104-managed-router-lifecycle.md)
[Explicit Load Gate for chat requests](./task-llcp0105-explicit-load-gate.md)

## User stories covered

7, 8, 9, 13, 17


## Actual Outcome

Implemented normalized end-to-end diagnostics for `pi-llamacpp`: Operational Status now renders model status counts and sanitizes `lastError`, `/llamacpp list` reports a clear completion outcome plus raw availability/runtime status columns, router `/models` auth failures include sanitized HTTP details, and provider chat failures after a successful Load Gate are wrapped separately from load-gate failures. Added HTTP error body normalization so JSON-string error bodies are readable and secret values are redacted.

## Unit Tests

- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: integration-style diagnostics flow verifies fake settings, fake router responses, fake managed process logs, fake Pi provider registration, and `/llamacpp start/status/list/reload/stop` outcomes.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: failure normalization flow verifies auth failures, malformed `/models`, missing preset file, request-gate timeout, provider chat failure wrapping, and secret redaction.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: updated Router Model List assertions verify availability and runtime-status columns.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: added regression coverage for value-based Provider API Key redaction across status/list/reload/start/provider chat diagnostics and HTTP 200 invalid `/models` JSON normalization.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: added review-regression coverage for settings-aware redaction in load-gate failed model diagnostics, managed log tails, router list display fields, post-stop ECONNREFUSED suppression, empty `/models` JSON normalization, and default low-entropy API key non-redaction.

## Lessons Learned

- Operational Status must include derived model state counts, not only raw model totals; totals cannot diagnose mixed loaded/failed/unloaded router state.
- Command success output needs an explicit outcome header for agents to distinguish successful empty/short lists from silent partial output.
- Provider chat failures happen after Load Gate success and need a distinct wrapper; otherwise users cannot tell load failures from OpenAI-compatible chat dispatch failures.
- Error-body normalization must handle plain text and JSON-string bodies before redaction, or diagnostics either leak formatting noise or hide the useful router detail.
- Diagnostic redaction must include resolved secret values, not only token-shaped patterns; local literal/env credentials can be arbitrary strings echoed by routers/providers.
- Value-based redaction must be settings-aware at every display boundary, but must ignore low-entropy defaults like `llamacpp` to avoid damaging normal diagnostics.
