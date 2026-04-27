---
name: moonrepo/adding-new-tasks
description: Adds or refactors moonrepo project tasks in moon.yml, when teams need canonical task definitions and reproducible execution, resulting in clearer task ownership, better caching, and less script drift.
---

# Moonrepo Adding New Tasks

## Overview
Use this skill when introducing new project tasks in a moon workspace.

The canonical task definition location **MUST** be moon project configuration (`moon.yml`), not language-specific script registries (for example `package.json#scripts`).

## When to Use
- A project needs a new runnable target (for example `lint`, `test:integration`, `docker:build`).
- Existing scripts are fragmented across language tooling and need consolidation.
- Task dependencies, cache inputs/outputs, or execution order must be explicit.

## Core Rules
- You **MUST** define new project tasks in `moon.yml`.
- You **MUST NOT** treat `package.json#scripts` (or equivalent framework task systems) as the source of truth for project automation.
- You **SHOULD** use moon task dependencies instead of shell-chaining commands because dependency edges are analyzable and cache-aware.
- You **SHOULD** keep task names stable and intention-revealing (`build`, `test`, `lint`, `typecheck`, etc.).
- You **MAY** keep compatibility scripts temporarily during migration, but they **SHOULD** delegate to moon and be removed once consumers are updated.

## Workflow
1. **Inspect existing project tasks**
   - Run `moon query tasks <project>` to discover current targets.
   - Check the project `moon.yml` for naming and dependency conventions.

2. **Design the new task contract**
   - Define: task name, command/action, required inputs, expected outputs, and dependencies.
   - Decide whether this is a standalone target or depends on upstream targets.

3. **Implement in `moon.yml`**
   - Add the task in the project’s moon config.
   - Add task dependencies rather than embedding fragile shell command chains.
   - Declare inputs/outputs where applicable to improve cache correctness.

4. **Validate task discovery and execution**
   - Run `moon query tasks <project>` to confirm target registration.
   - Run `moon run <project>:<target>` and verify successful completion.

5. **Migrate/clean legacy script entrypoints (if needed)**
   - Remove or reduce duplicated definitions in language-native task systems.
   - Keep one canonical ownership path: moon config.

## Why This Is Better
- `moon.yml` supports multiline task definitions for readability.
- Dependency syntax is explicit and maintainable.
- Inputs/outputs allow stronger caching and faster iterative runs.
- Centralized task ownership reduces drift across frameworks and tooling.

## Common Pitfalls
- Adding a task only in `package.json` and assuming moon will treat it as canonical.
- Hiding dependency order in shell pipelines instead of task graph edges.
- Forgetting to validate with both `moon query tasks` and `moon run`.

## Quick Example
```bash
moon query tasks app
moon run app:lint
```

If `app:lint` is missing, add it to `apps/app/moon.yml` (or the project’s moon config path), then re-run both commands.
