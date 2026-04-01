---
id: pkgmt007
title: Migrate Platform Skills
created_at: 2026-04-01
updated_at: 2026-04-01
status: done
epic_id: pkgmig01
phase_id: Phase 2
story_id: pkgms001
---

# Migrate Platform Skills

## Objective
Move platform skills into `ai/files/packages/platform/`.

## Steps
1. Move skills:
   - `devtools/cloudflare/`
   - `devtools/provisioning-with-comtrya`
   - `homeassistant/`
   - `experts/infrastructure/`
   - `experts/specialized-domains/blockchain-developer`
   - `experts/specialized-domains/embedded-systems`
   - `experts/specialized-domains/iot-engineer`
2. Confirm no prompts directory required for platform package.

## Expected Outcome
Platform package contains infra/deployment/homeautomation skills only.

## Actual Outcome

Migrated platform-domain skills (`cloudflare`, `provisioning-with-comtrya`, `homeassistant`, `infrastructure`, selected specialized domains) into `packages/platform` (skills-only package).
