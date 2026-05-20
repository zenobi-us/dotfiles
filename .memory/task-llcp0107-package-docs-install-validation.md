---
id: llcp0107
type: task
title: Package docs install validation and test harness cleanup
created_at: 2026-05-19
updated_at: 2026-05-19
status: todo
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 7
story_id: 
assigned_to: 
claimed_by_owner_id: general-purpose-llcp0107-20260520
claimed_by_workspace_id: ws-76c947008ec4
claimed_by_run_id: run-llcp0107-20260520
claim_started_at: 2026-05-20T06:36:46Z
last_heartbeat_at: 2026-05-20T06:36:46Z
lease_expires_at: 2026-05-20T08:06:46Z
claim_state: claimed
lock_reason: active work
---

# Package docs install validation and test harness cleanup

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Finalize package documentation, manifest behavior, command/settings reference, and mocked test harness so the provider package is ready for AFK implementation review without requiring real GGUF files or a real llama-server E2E setup.

## Acceptance criteria

- [ ] README documents settings, defaults, commands, External Router behavior, managed router behavior, Load Gate behavior, and troubleshooting.
- [ ] Package metadata follows Pi package conventions for extensions and peer dependencies.
- [ ] Tests document that real llama-server plus GGUF E2E is out of first-pass scope and provide any manual smoke-test guidance separately.
- [ ] Mocked unit and integration-style test commands are documented and runnable by an AFK agent.
- [ ] No tests require downloading GGUF files, GPU access, or a locally installed llama-server unless explicitly marked manual/optional.
- [ ] Documentation uses domain glossary vocabulary from the PRD and package CONTEXT.
- [ ] Final verification confirms extension entrypoint, commands, mocked tests, and package manifest behavior.

## Blocked by

[End-to-end diagnostics across commands and failures](./task-llcp0106-end-to-end-diagnostics.md)

## User stories covered

27, 28, 29, 30, 31, 32
