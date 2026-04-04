---
id: pkgmt010
type: task
title: Update settings.json Packages Array
created_at: 2026-04-01
updated_at: 2026-04-01
status: todo
epic_id: pkgmig01
phase_id: Phase 3
story_id: pkgms003
assigned_to: 
---

# Update settings.json Packages Array

## Objective
Add local package entries in `devtools/files/pi/agent/settings.json` so pi loads resources from migrated local packages.

## Steps
1. Edit `packages` array in `devtools/files/pi/agent/settings.json`.
2. Add local entries:
   - `./packages/agent-core`
   - `./packages/developer`
   - `./packages/creator`
   - `./packages/researcher`
   - `./packages/business`
   - `./packages/platform`
3. Keep existing npm package entries.
4. Validate JSON format.

## Expected Outcome
Pi settings include all six local packages.

## Actual Outcome

Updated `devtools/files/pi/agent/settings.json` packages array with six local package entries (`./packages/*`) while preserving existing npm package entries.
