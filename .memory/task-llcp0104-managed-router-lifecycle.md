---
id: llcp0104
type: task
title: Managed Llama Server Router lifecycle
created_at: 2026-05-19
updated_at: 2026-05-19
status: todo
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 4
story_id: 
assigned_to: 
---

# Managed Llama Server Router lifecycle

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Implement managed llama-server start/stop/adoption behavior while preserving strict ownership boundaries. The package may start and stop its own managed Llama Server Router, but must treat already-running compatible routers as External Routers and never kill them.

## Acceptance criteria

- [ ] `/llamacpp start` starts a managed Llama Server Router when no compatible router is reachable and managed start is enabled.
- [ ] Managed start uses configured server binary path, Configured Preset File, Server Base URL, and start timeout behavior.
- [ ] Managed process stdout and stderr are captured as bounded recent log tails.
- [ ] Operational Status reports managed/external ownership, process state, recent log tail, preset file state, timeout values, and last error.
- [ ] A compatible already-running router is adopted as External Router and is not marked package-owned.
- [ ] `/llamacpp stop` stops only the package-owned managed process.
- [ ] `/llamacpp stop` does not unload models from or terminate an External Router.
- [ ] Pi quit stops the managed process only when `stopOnQuit` is enabled.
- [ ] Extension reload/session reload does not kill a running llama-server; new instance re-adopts reachable router as External Router unless safe ownership proof exists.
- [ ] Unit tests cover managed start, external adoption, stop refusal for external routers, log tail bounds, `stopOnQuit`, missing preset file blocking, and reload behavior.

## Blocked by

[Preset Metadata enrichment and Configured Preset File validation](./task-llcp0103-preset-metadata-validation.md)

## User stories covered

3, 5, 6, 8, 9, 17, 24, 25, 28
