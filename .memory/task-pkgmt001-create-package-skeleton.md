---
id: pkgmt001
title: Create Package Skeleton
created_at: 2026-04-01
updated_at: 2026-04-01
status: done
epic_id: pkgmig01
phase_id: Phase 1
story_id: pkgms001
---

# Create Package Skeleton

## Objective

Create the directory structure for all 6 pi-packages under `ai/files/packages/`, with empty `prompts/` and `skills/` subdirectories ready for file migration.

## Related Story

[pkgms001](./story-pkgms001-domain-scoped-package-structure.md) — AC1 (6 package dirs exist)

## Related Phase

Phase 1: Package Skeleton

## Steps

1. Create `ai/files/packages/` directory
2. For each package (`agent-core`, `developer`, `creator`, `researcher`, `business`): create `<pkg>/prompts/` and `<pkg>/skills/`
3. For `platform`: create `<pkg>/skills/` only (no prompts)
4. Add a `.gitkeep` to each empty leaf directory so git tracks them

```bash
for pkg in agent-core developer creator researcher business; do
  mkdir -p ai/files/packages/$pkg/prompts
  mkdir -p ai/files/packages/$pkg/skills
  touch ai/files/packages/$pkg/prompts/.gitkeep
  touch ai/files/packages/$pkg/skills/.gitkeep
done
mkdir -p ai/files/packages/platform/skills
touch ai/files/packages/platform/skills/.gitkeep
```

## Expected Outcome

`ai/files/packages/` contains 6 subdirectories, each with the appropriate empty scaffold. No files from `ai/files/commands/` or `ai/files/skills/` have been moved yet.

## Actual Outcome

Created `ai/files/packages/` with 6 package directories and scaffolded `prompts/` / `skills/` leaf directories (platform skills-only). Added `.gitkeep` where needed.

## Lessons Learned

(to be filled on completion)
