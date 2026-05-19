---
id: llcp0106
type: task
title: End-to-end diagnostics across commands and failures
created_at: 2026-05-19
updated_at: 2026-05-19
status: todo
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 6
story_id: 
assigned_to: 
---

# End-to-end diagnostics across commands and failures

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Normalize failure reporting across router management, provider refresh, managed process lifecycle, commands, and request gating so Operational Status gives enough information for an AFK agent or user to diagnose local llama.cpp failures without reading raw code.

## Acceptance criteria

- [ ] `/llamacpp status` includes router reachability, ownership, preset file state, provider registration state, model status counts, timeout settings, last error, and recent managed process logs when relevant.
- [ ] `/llamacpp list` exposes raw Router Model List availability and runtime status.
- [ ] `/llamacpp start`, `/llamacpp stop`, `/llamacpp reload`, and `/llamacpp list` report clear success/failure outcomes.
- [ ] Router auth failures, unavailable router, malformed `/models` responses, load failures, missing preset files, and timeout errors are normalized consistently.
- [ ] Request gate errors include enough detail to distinguish load failure from provider chat failure.
- [ ] Error output avoids leaking resolved secret values.
- [ ] Integration-style tests combine fake settings, fake router responses, fake process operations, and fake Pi provider API to verify startup, reload, list, status, start/stop, and request-gate diagnostic flows.

## Blocked by

[Managed Llama Server Router lifecycle](./task-llcp0104-managed-router-lifecycle.md)
[Explicit Load Gate for chat requests](./task-llcp0105-explicit-load-gate.md)

## User stories covered

7, 8, 9, 13, 17
