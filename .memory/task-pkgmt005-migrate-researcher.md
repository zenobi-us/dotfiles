---
id: pkgmt005
type: task
title: Migrate Researcher Prompts and Skills
created_at: 2026-04-01
updated_at: 2026-04-01
status: todo
epic_id: pkgmig01
phase_id: Phase 2
story_id: pkgms001
assigned_to: 
---

# Migrate Researcher Prompts and Skills

## Objective
Move researcher prompts/skills into `ai/files/packages/researcher/`.

## Steps
1. Move prompts:
   - `ai/files/commands/research.md`
   - `ai/files/commands/review-documetation.md` → rename to `review-documentation.md`
2. Move skills:
   - `devtools/lynx-web-search`
   - `experts/data-ai/`
   - `experts/research-analysis/`
   - `experts/specialized-domains/quant-analyst`
3. Verify researcher prompts load with renamed file.

## Expected Outcome
Researcher package contains research prompt set and analysis/data skill set.

## Actual Outcome

Moved researcher prompts and renamed `review-documetation.md` to `review-documentation.md`. Migrated researcher-domain skills to `packages/researcher`.
