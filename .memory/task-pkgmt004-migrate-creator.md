---
id: pkgmt004
title: Migrate Creator Prompts and Skills
created_at: 2026-04-01
updated_at: 2026-04-01
status: done
epic_id: pkgmig01
phase_id: Phase 2
story_id: pkgms001
---

# Migrate Creator Prompts and Skills

## Objective
Move creator prompts/skills into `ai/files/packages/creator/`.

## Steps
1. Move prompts:
   - entire `ai/files/commands/design/` directory
2. Move skill dirs:
   - `devtools/figma`
   - `devtools/visual-explainer`
   - `devtools/webdesign/`
   - `experts/core-development/`
   - `experts/specialized-domains/api-documenter`
   - `experts/specialized-domains/game-developer`
   - `experts/specialized-domains/mobile-app-developer`
3. Verify creator package has 17 design prompts.

## Expected Outcome
Creator package contains design + user-facing implementation skills.

## Actual Outcome

Moved full design prompt directory plus creator-domain devtools/core-development/specialized creator skills into `packages/creator`. Verified 17 design prompt files present.
