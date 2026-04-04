---
id: pkgmt002
type: task
title: Migrate Agent-Core Prompts and Skills
created_at: 2026-04-01
updated_at: 2026-04-01
status: todo
epic_id: pkgmig01
phase_id: Phase 2
story_id: pkgms001
assigned_to: 
---

# Migrate Agent-Core Prompts and Skills

## Objective
Move agent-core prompts/skills into `ai/files/packages/agent-core/`.

## Steps
1. Move prompts:
   - `ai/files/commands/create-skill.md` → `ai/files/packages/agent-core/prompts/create-skill.md`
   - `ai/files/commands/install-skill.md` → `ai/files/packages/agent-core/prompts/install-skill.md`
2. Move skill dirs:
   - `ai/files/skills/superpowers/` → `ai/files/packages/agent-core/skills/superpowers/`
   - `ai/files/skills/skill-development/` → `ai/files/packages/agent-core/skills/skill-development/`
   - `ai/files/skills/shells/` → `ai/files/packages/agent-core/skills/shells/`
3. Verify moved paths exist.

## Expected Outcome
All agent-core content exists only under `packages/agent-core`.

## Actual Outcome

Moved agent-core prompts (`create-skill`, `install-skill`) and skill trees (`superpowers`, `skill-development`, `shells`) into `packages/agent-core`.
