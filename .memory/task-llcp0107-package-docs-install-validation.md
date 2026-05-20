---
id: llcp0107
type: task
title: Package docs install validation and test harness cleanup
created_at: 2026-05-19
updated_at: 2026-05-20
status: completed
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 7
story_id: 
assigned_to: general-purpose-llcp0107-20260520
claimed_by_owner_id: general-purpose-llcp0107-20260520
claimed_by_workspace_id: ws-76c947008ec4
claimed_by_run_id: run-llcp0107-20260520
claim_started_at: 2026-05-20T06:36:46Z
last_heartbeat_at: 2026-05-20T06:40:05Z
lease_expires_at: 
claim_state: released
lock_reason: completed
---

# Package docs install validation and test harness cleanup

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Finalize package documentation, manifest behavior, command/settings reference, and mocked test harness so the provider package is ready for AFK implementation review without requiring real GGUF files or a real llama-server E2E setup.

## Acceptance criteria

- [x] README documents settings, defaults, commands, External Router behavior, managed router behavior, Load Gate behavior, and troubleshooting.
- [x] Package metadata follows Pi package conventions for extensions and peer dependencies.
- [x] Tests document that real llama-server plus GGUF E2E is out of first-pass scope and provide any manual smoke-test guidance separately.
- [x] Mocked unit and integration-style test commands are documented and runnable by an AFK agent.
- [x] No tests require downloading GGUF files, GPU access, or a locally installed llama-server unless explicitly marked manual/optional.
- [x] Documentation uses domain glossary vocabulary from the PRD and package CONTEXT.
- [x] Final verification confirms extension entrypoint, commands, mocked tests, and package manifest behavior.

## Blocked by

[End-to-end diagnostics across commands and failures](./task-llcp0106-end-to-end-diagnostics.md)

## User stories covered

27, 28, 29, 30, 31, 32

## Actual Outcome

Added `devtools/files/pi/agent/packages/pi-llamacpp/package.json` as a Pi package manifest with `pi.extensions: ["index.ts"]`, `pi-package` metadata, and Pi runtime peer dependencies. Rewrote the package README as install/validation documentation covering settings/defaults, slash commands, External Router behavior, managed router behavior, Preset Metadata, Explicit Load Gate behavior, mocked AFK test commands, optional manual smoke testing, and troubleshooting. Added a manifest regression test to confirm package entrypoint and peer-dependency behavior.

## Unit Tests

- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: package manifest regression verifies extension entrypoint, module metadata, `pi-package` keyword, Pi peer dependencies, and empty runtime dependencies.
- Existing mocked unit/integration-style tests continue to cover fake settings, fake router responses, fake process operations, fake Pi provider APIs, Provider Refresh, Load Gate, commands, and diagnostics without real GGUF files, GPU access, or local `llama-server`.

## Lessons Learned

- Package install readiness needs executable metadata tests, not README claims only.
- First-pass validation must keep real `llama-server` plus GGUF E2E manual/optional; automating it would make AFK validation host-dependent and flaky.
- README wording should use the domain glossary exactly: Llama Server Router, Router Model List, Provider Model, Configured Preset File, Provider Refresh, Operational Status, Explicit Load, Load Gate, External Router.
