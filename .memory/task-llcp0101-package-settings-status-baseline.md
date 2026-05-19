---
id: llcp0101
type: task
title: Package settings and status baseline
created_at: 2026-05-19
updated_at: 2026-05-19
status: todo
triage: ready-for-agent
epic_id: llcpprd1
phase_id: Slice 1
story_id: 
assigned_to: 
---

# Package settings and status baseline

## Parent

[Pi LlamaCpp Provider PRD](./epic-llcpprd1-pi-llamacpp-provider.md)

## What to build

Create a loadable `llamacpp` Pi package extension that reads package settings, derives Server Base URL, Provider Base URL, Provider API Key behavior, timeout configuration, and exposes a baseline `/llamacpp status` command even when no router is reachable.

This slice must prove the package can load, report Operational Status, and avoid registering dead Provider Models before router discovery exists.

## Acceptance criteria

- [ ] The extension loads from the package entrypoint without throwing.
- [ ] Settings parsing supports Server Base URL, server binary path, Configured Preset File path, Provider API Key, `loadOnSelect`, `stopOnQuit`, and separate timeout values.
- [ ] Provider Base URL is derived by appending `/v1` to Server Base URL without corrupting trailing slash inputs.
- [ ] Provider API Key resolution supports literal values and environment variable names only.
- [ ] Shell-command-style Provider API Key values are rejected or reported as unsupported.
- [ ] `/llamacpp status` reports Operational Status when no router is reachable, including router reachability, provider registration state, timeout settings, and last error if present.
- [ ] No `llamacpp` Provider Models are registered when compatible router discovery has not succeeded.
- [ ] Unit tests cover settings parsing, base URL derivation, API key resolution, timeout defaults, and baseline status output.

## Blocked by

None - can start immediately

## User stories covered

8, 17, 18, 19, 31, 32
