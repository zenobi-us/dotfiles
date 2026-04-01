---
id: pkgms002
title: Skill Auto-Discovery from Pi Packages
created_at: 2026-04-01
updated_at: 2026-04-01
status: todo
epic_id: pkgmig01
priority: critical
story_points: 3
test_coverage: none
---

# Skill Auto-Discovery from Pi Packages

## User Story

As a developer using pi, I want the skills extension to automatically discover skills from local packages declared in `settings.json`, so that adding a new package to `settings.json` makes its skills available without any additional configuration.

## Acceptance Criteria

- [ ] AC1: `skill-registry.ts` exports a `resolvePackageSkillPaths(agentDir: string): string[]` function that reads `settings.json` via `SettingsManager`, iterates the `packages` array, filters to local paths, resolves them against `agentDir`, and returns the `skills/` subdirectory of each (or the paths declared in `pi.skills` in each package's `package.json`)
- [ ] AC2: `loadSkills()` calls `resolvePackageSkillPaths` when `includeDefaults: true` and includes the results in the scan
- [ ] AC3: npm/git package sources are skipped with a TODO comment noting the install location is unknown
- [ ] AC4: Qualified names for all skills remain unchanged after the migration (e.g. `experts-language-specialists-python-pro` stays the same)
- [ ] AC5: The extension builds without TypeScript errors after the change

## Context

The current skills extension scans two hardcoded locations: `~/.pi/agent/skills/` and `<cwd>/.pi/skills/`. After the file migration, skills will live in `~/.pi/agent/packages/<name>/skills/`. The `SettingsManager` from `@mariozechner/pi-coding-agent` (already a peer dep) provides `getPackages()` to read the packages array. Local paths resolve relative to `agentDir` (`~/.pi/agent/`).

The qualified name is computed as `relative(skillsRoot, skillDir)` → kebab-case. Since each package preserves the same internal subdirectory structure (e.g. `skills/experts/language-specialists/python-pro/`), and `skillsRoot` is each package's `skills/` dir, the qualified names remain identical to what they are today.

## Out of Scope

- Resolving npm/git package install locations (deferred, TODO marker in code)
- Changes to the `find_skills` or `read_skill` tool implementations
- Changes to the search strategy or lazy loading behavior

## Tasks

- [task-pkgmt011](./task-pkgmt011-patch-skill-registry.md)

## Test Specification

### E2E Tests

| AC# | Criterion | Test | Status |
|---|---|---|---|
| AC1 | resolvePackageSkillPaths returns paths | Unit test with mock SettingsManager | pending |
| AC2 | loadSkills includes package paths | Integration: skills count > 0 after migration | pending |
| AC3 | npm/git sources skipped | TODO marker present in source | pending |
| AC4 | Qualified names unchanged | `/find_skills query="python"` returns `experts-language-specialists-python-pro` | pending |
| AC5 | TS builds clean | `tsc --noEmit` in extensions dir exits 0 | pending |

## Notes

- `SettingsManager.create(undefined, agentDir)` reads `~/.pi/agent/settings.json` — the same file that gets symlinked by comtrya
- The `pi.skills` field in `package.json` is an array of globs relative to the package root. Simple `./skills` entries are the expected case; complex globs are treated as-is via `resolve(pkgDir, entry)`
- After migration, the old `~/.pi/agent/skills/` symlink no longer exists. The extension should handle `includeDefaults: true` gracefully when that dir is missing (it already does — `existsSync` check in `loadSkillsFromDirInternal`)
