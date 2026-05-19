---
id: llcp0104
type: task
title: Managed Llama Server Router lifecycle
created_at: 2026-05-19
updated_at: 2026-05-20
status: completed
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 4
story_id: 
assigned_to: general-purpose-llcp0104-20260520
---

# Managed Llama Server Router lifecycle

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Implement managed llama-server start/stop/adoption behavior while preserving strict ownership boundaries. The package may start and stop its own managed Llama Server Router, but must treat already-running compatible routers as External Routers and never kill them.

## Acceptance criteria

- [x] `/llamacpp start` starts a managed Llama Server Router when no compatible router is reachable and managed start is enabled.
- [x] Managed start uses configured server binary path, Configured Preset File, Server Base URL, and start timeout behavior.
- [x] Managed process stdout and stderr are captured as bounded recent log tails.
- [x] Operational Status reports managed/external ownership, process state, recent log tail, preset file state, timeout values, and last error.
- [x] A compatible already-running router is adopted as External Router and is not marked package-owned.
- [x] `/llamacpp stop` stops only the package-owned managed process.
- [x] `/llamacpp stop` does not unload models from or terminate an External Router.
- [x] Pi quit stops the managed process only when `stopOnQuit` is enabled.
- [x] Extension reload/session reload does not kill a running llama-server; new instance re-adopts reachable router as External Router unless safe ownership proof exists.
- [x] Unit tests cover managed start, external adoption, stop refusal for external routers, log tail bounds, `stopOnQuit`, missing preset file blocking, and reload behavior.

## Blocked by

[Preset Metadata enrichment and Configured Preset File validation](./task-llcp0103-preset-metadata-validation.md)

## User stories covered

3, 5, 6, 8, 9, 17, 24, 25, 28

## Actual Outcome

Implemented `ManagedRouterProcess` with injectable spawner/probe, managed/external ownership state, start-time preset validation, bounded stdout/stderr log tails, stop-only-owned semantics, and `stopOnQuit`. `/llamacpp start`, `/llamacpp stop`, and Operational Status now include managed lifecycle details. Reload/new extension instances adopt reachable routers as External Router unless current instance owns the process.

Review hardening added child `error` handling for spawn failures, explicit persistent-process `unref()` when `stopOnQuit` is false, non-dropping stop ownership on kill refusal/timeout, timed-out start state instead of stale `starting`, post-stop reachability refresh, info-level successful stop reporting, and invalid Server Base URL reporting through Operational Status `lastError`.

## Unit Tests

- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: managed start uses configured binary, Configured Preset File, Server Base URL host/port, start polling, and bounded log tails.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: reachable routers are adopted as External Router and `/llamacpp stop` refuses to terminate them.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: package-owned managed processes stop correctly and `stopOnQuit` gates shutdown.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: missing Configured Preset File blocks managed spawn.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: reload behavior leaves prior process alive and re-adopts reachability as External Router.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: spawn `error` events, kill refusal, ignored SIGTERM stop timeout, start timeout state, persistent unref behavior, and invalid Server Base URL command reporting.

## Lessons Learned

- Ownership must be instance-local; safe reload behavior is external adoption, not attempting to recover ownership without proof.
- Lifecycle status is only useful if process log tails are bounded and visible beside timeout/preset state.
- Keeping spawn/probe injectable prevents accidental real `llama-server` execution in tests.
- Child process lifecycle must handle `error` as a first-class terminal path; `try/catch` around `spawn()` is insufficient for ENOENT/EACCES.
- Stop must retain ownership until actual `exit` or explicit timeout; dropping ownership before proof hides leaked managed processes.
- Persistent managed routers need explicit `unref()` on process and pipes or Pi can be held open accidentally.
