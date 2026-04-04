---
id: pkgmig01
type: epic
title: AI Files Pi-Packages Migration
created_at: 2026-04-01
updated_at: 2026-04-01
status: planning
---

# AI Files Pi-Packages Migration

## Vision/Goal

Reorganize `ai/files/` into 6 domain-scoped pi-packages (agent-core, developer, creator, researcher, business, platform), each bundling related prompts and skills together. Update the custom skills extension to auto-discover skills from packages declared in `settings.json`, so adding a new package automatically makes its skills available without manual path configuration.

## Success Criteria

- [ ] All skills and prompts from `ai/files/` live inside one of 6 packages under `ai/files/packages/`
- [ ] Each package has a valid `package.json` with `pi.skills` and `pi.prompts` declarations
- [ ] `ai/pi.yml` symlinks `ai/files/packages/` → `~/.pi/agent/packages/` as a single directory link
- [ ] `settings.json` declares all 6 local packages in the `packages` array
- [ ] `skill-registry.ts` auto-resolves skill paths from local package declarations in settings.json
- [ ] `/find_skills` in pi discovers all previously available skills with unchanged qualified names
- [ ] `/commit` and other slash commands remain functional

## Stories

- [pkgms001](./story-pkgms001-domain-scoped-package-structure.md) — Domain-scoped package structure for ai/files
- [pkgms002](./story-pkgms002-skill-auto-discovery-from-packages.md) — Skill auto-discovery from pi packages
- [pkgms003](./story-pkgms003-comtrya-provisioning.md) — Comtrya provisions packages symlink

## Phases

### Phase 1: Package Skeleton
- **Status**: todo
- **Start Criteria**: Epic approved
- **End Criteria**: All 6 package directories exist with `package.json` and empty `prompts/`/`skills/` subdirs
- **Tasks**:
  - [ ] [task-pkgmt001-create-package-skeleton](./task-pkgmt001-create-package-skeleton.md)
  - [ ] [task-pkgmt008-add-package-json-files](./task-pkgmt008-add-package-json-files.md)

### Phase 2: File Migration
- **Status**: todo
- **Start Criteria**: Phase 1 complete
- **End Criteria**: All prompts and skills moved into their target packages; old `ai/files/commands/` and `ai/files/skills/` removed
- **Tasks**:
  - [ ] [task-pkgmt002-migrate-agent-core](./task-pkgmt002-migrate-agent-core.md)
  - [ ] [task-pkgmt003-migrate-developer](./task-pkgmt003-migrate-developer.md)
  - [ ] [task-pkgmt004-migrate-creator](./task-pkgmt004-migrate-creator.md)
  - [ ] [task-pkgmt005-migrate-researcher](./task-pkgmt005-migrate-researcher.md)
  - [ ] [task-pkgmt006-migrate-business](./task-pkgmt006-migrate-business.md)
  - [ ] [task-pkgmt007-migrate-platform](./task-pkgmt007-migrate-platform.md)

### Phase 3: Configuration
- **Status**: todo
- **Start Criteria**: Phase 2 complete
- **End Criteria**: `ai/pi.yml` and `settings.json` updated; comtrya dry-run passes
- **Tasks**:
  - [ ] [task-pkgmt009-update-ai-pi-yml](./task-pkgmt009-update-ai-pi-yml.md)
  - [ ] [task-pkgmt010-update-settings-json](./task-pkgmt010-update-settings-json.md)

### Phase 4: Skill Registry Extension
- **Status**: todo
- **Start Criteria**: Phase 3 complete
- **End Criteria**: `skill-registry.ts` auto-resolves package skill paths; extension rebuilt
- **Tasks**:
  - [ ] [task-pkgmt011-patch-skill-registry](./task-pkgmt011-patch-skill-registry.md)

### Phase 5: Validation
- **Status**: todo
- **Start Criteria**: Phase 4 complete
- **End Criteria**: All skills discoverable; all slash commands functional; comtrya apply succeeds
- **Tasks**:
  - [ ] [task-pkgmt012-validate-end-to-end](./task-pkgmt012-validate-end-to-end.md)

## Dependencies

- `@mariozechner/pi-coding-agent` — `SettingsManager` must be importable in the skills extension (peer dep, already in `node_modules`)
- `comtrya` — `file.link` action used to symlink packages directory
- Existing `devtools.pi` manifest (dependency declared in `ai/pi.yml`)
