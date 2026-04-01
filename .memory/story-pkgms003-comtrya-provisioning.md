---
id: pkgms003
title: Comtrya Provisions Packages Symlink
created_at: 2026-04-01
updated_at: 2026-04-01
status: todo
epic_id: pkgmig01
priority: high
story_points: 1
test_coverage: none
---

# Comtrya Provisions Packages Symlink

## User Story

As a developer setting up a new machine, I want comtrya to declaratively provision the pi packages symlink so that running `comtrya apply ai` correctly wires up all pi packages without manual steps.

## Acceptance Criteria

- [ ] AC1: `ai/pi.yml` removes the old `prompts`, `skills`, `agents` symlinks from `~/.pi/agent/` on apply
- [ ] AC2: `ai/pi.yml` creates a single symlink `~/.pi/agent/packages` → `ai/files/packages/`
- [ ] AC3: `ai/pi.yml` still symlinks `AGENTS.md`
- [ ] AC4: `comtrya validate ai/pi.yml` passes
- [ ] AC5: `comtrya apply -m ai --dry-run` shows expected actions without errors

## Context

The current `ai/pi.yml` symlinks `ai/files/commands/` → `~/.pi/agent/prompts` and `ai/files/skills/` → `~/.pi/agent/skills` as separate directory symlinks. After migration, the packages directory replaces both with a single link. Comtrya's `file.link` action handles directory symlinks; the source path resolves relative to the manifest's `files/` subdirectory (`ai/files/`).

## Out of Scope

- Per-package symlinks (the single `packages/` link replaces all of them)
- Windows provisioning (existing pattern uses `pwsh` only for `devtools.pi` — not needed here)

## Tasks

- [task-pkgmt009](./task-pkgmt009-update-ai-pi-yml.md)

## Test Specification

### E2E Tests

| AC# | Criterion | Test | Status |
|---|---|---|---|
| AC1 | Old symlinks cleaned | `ls ~/.pi/agent/prompts` exits non-zero after apply | pending |
| AC2 | packages symlink created | `readlink ~/.pi/agent/packages` points to correct real path | pending |
| AC3 | AGENTS.md symlinked | `readlink ~/.pi/agent/AGENTS.md` non-empty | pending |
| AC4 | Validate passes | `comtrya validate ai/pi.yml` exits 0 | pending |
| AC5 | Dry-run clean | `comtrya apply -m ai --dry-run` exits 0 | pending |

## Notes

- Comtrya `file.link` source paths are relative to the manifest directory's `files/` subdir. Since the manifest is `ai/pi.yml`, sources resolve against `ai/files/`. So `from: packages` → `ai/files/packages/`.
