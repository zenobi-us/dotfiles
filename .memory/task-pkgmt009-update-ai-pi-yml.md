---
id: pkgmt009
type: task
title: Update ai/pi.yml to Symlink Packages Directory
created_at: 2026-04-01
updated_at: 2026-04-01
status: todo
epic_id: pkgmig01
phase_id: Phase 3
story_id: pkgms003
assigned_to: 
---

# Update ai/pi.yml to Symlink Packages Directory

## Objective
Replace old prompt/skills symlink model with a single packages directory symlink.

## Steps
1. Edit `ai/pi.yml` cleanup action to remove `~/.pi/agent/packages` (already included in brace expansion).
2. Remove `file.link` actions for `prompts`, `skills`, and `agents`.
3. Add one `file.link` action:
   - `to: "{{ user.home_dir }}/.pi/agent/packages"`
   - `from: packages`
4. Keep `AGENTS.md` link action.
5. Run `comtrya validate ai/pi.yml`.

## Expected Outcome
`ai/pi.yml` provisions package symlink only.

## Actual Outcome

Updated `ai/pi.yml` to use a single `packages` symlink target and removed legacy `prompts/skills/agents` link actions while keeping `AGENTS.md` link.
