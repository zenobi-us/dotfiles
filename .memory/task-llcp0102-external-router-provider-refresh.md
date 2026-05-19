---
id: llcp0102
type: task
title: External Router discovery and Provider Refresh
created_at: 2026-05-19
updated_at: 2026-05-19
status: completed
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 2
story_id: 
assigned_to: worker-llcp0102-20260519
claimed_by_owner_id: worker-llcp0102-20260519
claimed_by_workspace_id: ws-76c947008ec4
claimed_by_run_id: llcp0102-impl
claim_started_at: 2026-05-19T12:45:19Z
last_heartbeat_at: 2026-05-19T12:51:13Z
lease_expires_at: 
claim_state: released
lock_reason: completed
---

# External Router discovery and Provider Refresh

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Connect the package to a compatible External Router at Server Base URL, read the Router Model List, map router models into Pi Provider Models, and refresh `llamacpp` provider registration through unregister-before-register behavior. `/llamacpp list` and `/llamacpp reload` must be useful with an external router and must not require managed process support.

## Acceptance criteria

- [x] RouterClient can fetch and normalize the raw `/models` Router Model List from Server Base URL.
- [x] Router management requests use Provider API Key bearer auth when configured.
- [x] Compatible External Router reachability is reflected in Operational Status.
- [x] Provider Models are registered only after compatible Router Model List retrieval succeeds.
- [x] Provider Refresh calls unregister for `llamacpp` before registering current Provider Models.
- [x] Stale Provider Models disappear after `/llamacpp reload` when the router model list changes.
- [x] `/llamacpp list` displays the Router Model List, not just Pi-registered models.
- [x] `/llamacpp reload` refreshes the router list and provider registration without requiring Pi restart.
- [x] Unit tests cover router response mapping, auth header behavior, registration ordering, stale model removal, empty list behavior, and command output shape.

## Blocked by

[Package settings and status baseline](./task-llcp0101-package-settings-status-baseline.md)

## User stories covered

1, 4, 7, 10, 11, 12, 18, 20, 27, 29

## Actual Outcome

Implemented External Router discovery for `/models`, Router Model List normalization, bearer auth for router management fetches, Provider Refresh unregister-before-register semantics, and `/llamacpp list` / `/llamacpp reload` command behavior. Compatible router discovery now registers current `llamacpp` Provider Models; incompatible or failed discovery unregisters `llamacpp` first so stale Provider Models cannot survive. `/llamacpp status` now refreshes router reachability instead of reusing stale reachable cache, and unsupported Pi provider APIs report a clear unsupported state.

## Unit Tests

- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: router response mapping and auth header behavior.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: provider refresh ordering, compatible gating, stale model removal on reload, and empty list registration.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: `/llamacpp list` and `/llamacpp reload` output shape with mocked router/provider APIs.
- `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts`: reload failure stale-provider removal, status reachability refresh, and unsupported provider API reporting.

## Lessons Learned

- Treating the Router Model List as source of truth keeps Provider Refresh deterministic and makes stale removal a simple unregister-before-register flow.
- Provider Refresh must clear old registration before any router fetch that may fail; unregister-after-success still leaves stale models selectable.
- Node's built-in test runner can exercise TypeScript package behavior directly here, while whole-workspace `tsc` remains noisy from unrelated packages and fixtures.
