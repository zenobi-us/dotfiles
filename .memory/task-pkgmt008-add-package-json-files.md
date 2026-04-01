---
id: pkgmt008
title: Add package.json to Each Package
created_at: 2026-04-01
updated_at: 2026-04-01
status: done
epic_id: pkgmig01
phase_id: Phase 1
story_id: pkgms001
---

# Add package.json to Each Package

## Objective

Write `package.json` for all 6 packages with correct metadata and `pi` declarations.

## Related Story

[pkgms001](./story-pkgms001-domain-scoped-package-structure.md) — AC2 (valid package.json with pi declarations)

## Related Phase

Phase 1: Package Skeleton

## Steps

Create `package.json` in each package root. All follow this pattern:

**agent-core:**
```json
{
  "name": "@zenobius/pi-agent-core",
  "version": "0.1.0",
  "description": "Superpowers, skill management, and shell environment for pi",
  "private": true,
  "keywords": ["pi-package"],
  "pi": {
    "prompts": ["./prompts"],
    "skills": ["./skills"]
  }
}
```

Repeat for each package with appropriate `name` and `description`:
- `@zenobius/pi-developer` — "Code writing, git workflow, testing, and language/quality experts"
- `@zenobius/pi-creator` — "Design commands, UI/API building, and user-facing product experts"
- `@zenobius/pi-researcher` — "Research methodology, deep analysis, and data/AI expert personas"
- `@zenobius/pi-business` — "Product planning, stakeholder management, and organizational orchestration"
- `@zenobius/pi-platform` — "Cloudflare, home automation, infra ops, and specialized deployment experts" (omit `prompts` key)

## Expected Outcome

`cat ai/files/packages/*/package.json | jq .pi` returns non-null for all 6. `platform` has no `prompts` key.

## Actual Outcome

Added `package.json` for all 6 packages with `pi.skills` declarations and `pi.prompts` for all except `platform`. Verified `.pi` metadata via `jq`.

## Lessons Learned

(to be filled on completion)
