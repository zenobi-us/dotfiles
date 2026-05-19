---
id: llcp0101
type: task
title: Package settings and status baseline
created_at: 2026-05-19
updated_at: 2026-05-19
status: completed
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 1
story_id: 
assigned_to: worker-llcp0101-20260519
---

# Package settings and status baseline

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Create a loadable `llamacpp` Pi package extension that reads package settings, derives Server Base URL, Provider Base URL, Provider API Key behavior, timeout configuration, and exposes a baseline `/llamacpp status` command even when no router is reachable.

This slice must prove the package can load, report Operational Status, and avoid registering dead Provider Models before router discovery exists.

## Acceptance criteria

- [x] The extension loads from the package entrypoint without throwing.
- [x] Settings parsing supports Server Base URL, server binary path, Configured Preset File path, Provider API Key, `loadOnSelect`, `stopOnQuit`, and separate timeout values.
- [x] Provider Base URL is derived by appending `/v1` to Server Base URL without corrupting trailing slash inputs.
- [x] Provider API Key resolution supports literal values and environment variable names only.
- [x] Shell-command-style Provider API Key values are rejected or reported as unsupported.
- [x] `/llamacpp status` reports Operational Status when no router is reachable, including router reachability, provider registration state, timeout settings, and last error if present.
- [x] No `llamacpp` Provider Models are registered when compatible router discovery has not succeeded.
- [x] Unit tests cover settings parsing, base URL derivation, API key resolution, timeout defaults, and baseline status output.

## Blocked by

None - can start immediately

## User stories covered

8, 17, 18, 19, 31, 32

## Actual Outcome

Implemented a loadable `llamacpp` extension baseline with public settings parsing helpers, safe Provider Base URL derivation, literal/env Provider API Key resolution, shell-command credential rejection, and `/llamacpp status` Operational Status output. Review follow-up wired the status command to package settings via Pi config-service conventions, so configured Server Base URL, binary/preset paths, Provider API Key, booleans, and timeouts appear in command output. The extension intentionally registers no Provider Models before compatible router discovery.

## Unit Tests

- Added `devtools/files/pi/agent/packages/pi-llamacpp/index.test.ts` using `node:test`.
- Covered settings parsing, default timeouts, base URL derivation, Provider API Key literal/env/missing-env/shell rejection, baseline Operational Status output, command-level configured settings flow from project config, missing env status diagnostics, and no-provider-registration extension load behavior.

## Lessons Learned

- Node 25 can run and syntax-check this TypeScript baseline directly, but this repo does not currently have TypeScript installed for `npx tsc`.
- Keep router discovery and provider registration out of this slice to preserve the no-router baseline contract.
- Use `env:<name>` for lowercase/mixed-case or intentionally missing Provider API Key env references; bare env-name compatibility remains deterministic for all-uppercase names or names present in the environment.
