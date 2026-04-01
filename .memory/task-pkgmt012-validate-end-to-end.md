---
id: pkgmt012
title: Validate End-to-End Migration
created_at: 2026-04-01
updated_at: 2026-04-01
status: in_progress
epic_id: pkgmig01
phase_id: Phase 5
story_id: pkgms002
---

# Validate End-to-End Migration

## Objective
Validate comtrya provisioning, package loading, skill discovery, and prompt behavior after migration.

## Steps
1. Run `comtrya validate ai/pi.yml`.
2. Run `comtrya -d . apply -m ai --dry-run`.
3. Run `comtrya -d . apply -m ai`.
4. Launch pi and verify:
   - `/find_skills query="superpowers"` returns expected skill
   - `/find_skills query="python"` includes `experts-language-specialists-python-pro`
   - `/skill using-superpowers` resolves correctly
   - Slash prompts still available (`/commit`, `/pr`, `/research`, design commands)
5. Verify no duplicate collisions unexpectedly introduced.
6. Record outcomes in summary + task files.

## Expected Outcome
All package-based resources load and behave correctly; migration accepted.

## Actual Outcome
Partial verification complete:
- `comtrya validate ai/pi.yml` is not a valid command in installed comtrya (checked via `comtrya --help`).
- Migration structure and package manifests verified on filesystem.
- Full `comtrya apply` (including non-dry-run), pi runtime launch checks, and collision/runtime behavior verification are pending manual execution.
