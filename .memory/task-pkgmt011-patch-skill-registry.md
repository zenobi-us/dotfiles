---
id: pkgmt011
title: Patch Skills Extension Registry for Package Discovery
created_at: 2026-04-01
updated_at: 2026-04-01
status: done
epic_id: pkgmig01
phase_id: Phase 4
story_id: pkgms002
---

# Patch Skills Extension Registry for Package Discovery

## Objective
Make `devtools/files/pi/agent/extensions/skills/service/skill-registry.ts` discover skill roots from local package declarations in settings.

## Steps
1. Import `SettingsManager` from `@mariozechner/pi-coding-agent`.
2. Add `resolvePackageSkillPaths(agentDir: string): string[]`:
   - create settings manager `SettingsManager.create(undefined, agentDir)`
   - read `getPackages()`
   - for each package source:
     - if local path, resolve against `agentDir`
     - inspect package `package.json` `pi.skills` or fallback to `<pkg>/skills`
3. In `loadSkills()`, when `includeDefaults`, also load each path from `resolvePackageSkillPaths(agentDir)`.
4. Preserve existing behavior for missing dirs and collision handling.
5. Add TODO marker for npm/git package resolution:
   ```ts
   // TODO: npm/git packages — pi install location is not exposed via SettingsManager.
   // Research package resolution/install dirs and include these package skill roots later.
   if (/^(npm:|git:|https?:\/\/|ssh:\/\/)/.test(source)) continue;
   ```
6. Build/verify extension compiles.

## Expected Outcome
Skills extension discovers skills from local packages listed in settings without requiring `~/.pi/agent/skills` flat directory.

## Actual Outcome

Patched skill registry to resolve local package skill roots from settings packages, load package skill paths before legacy defaults, and added explicit TODO for npm/git source resolution.
