---
id: pkgmt006
title: Migrate Business Prompts and Skills
created_at: 2026-04-01
updated_at: 2026-04-01
status: done
epic_id: pkgmig01
phase_id: Phase 2
story_id: pkgms001
---

# Migrate Business Prompts and Skills

## Objective
Move business prompts/skills into `ai/files/packages/business/`.

## Steps
1. Move prompts:
   - `jira.md`
   - `miniproject.md`
2. Move skills:
   - `projectmanagement/`
   - `experts/business-product/`
   - `experts/meta-orchestration/`
   - `experts/specialized-domains/payment-integration`
   - `experts/specialized-domains/risk-manager`
   - `experts/specialized-domains/seo-specialist`
3. Verify miniproject references still valid.

## Expected Outcome
Business package contains planning + business expert assets.

## Actual Outcome

Moved business prompts (`jira`, `miniproject`) and business-domain skill trees (`projectmanagement`, `business-product`, `meta-orchestration`, selected specialized domains) into `packages/business`.
