# Changelog

## [0.3.0] - 2026-03-18

## [0.2.0] - 2026-03-17

### Added
- `/project init` command to scaffold `.project/` directory with default schemas and empty block files
- Update check on session start for `@davidorex/pi-project-workflows` meta-package
- Monorepo integration as workspace package

## [0.1.0] - 2026-03-14

### Added
- Block CRUD: `readBlock`, `writeBlock`, `appendToBlock`, `updateItemInBlock` with atomic writes (tmp + rename)
- Write-time schema validation via AJV against `.project/schemas/*.schema.json`
- `ValidationError` class with structured error reporting
- Post-step block validation: `snapshotBlockFiles`, `validateChangedBlocks`, `rollbackBlockFiles`
- Derived project state: `projectState(cwd)` computes all metrics dynamically (source files, tests, phases, block summaries, agents, workflows, schemas, templates, recent commits)
- Block discovery: `availableBlocks(cwd)`, `availableSchemas(cwd)`, `findAppendableBlocks(cwd)`
- Generic block tools: `append-block-item` and `update-block-item` (work with any user-defined block type)
- `/project` command with `status` and `add-work` subcommands
- `PROJECT_DIR` and `SCHEMAS_DIR` constants as single source of truth for `.project/` path
