---
name: moonrepo/create-project
description: Creates new moonrepo projects with placement, task wiring, and validation steps, when onboarding packages/apps into an existing moon workspace, resulting in consistent project setup and fewer integration regressions.
---

# Moonrepo Create Project

## Overview
Use this skill when adding a new app/package/service to an existing moon workspace and you need consistent placement, task wiring, and post-create validation.

## When to Use
- New project scaffold in a mono-repo.
- Standardizing creation steps across maintainers.
- Reducing onboarding mistakes in task/dependency config.

## Creation Workflow
1. **Choose location + id conventions**
   - Place app/package in repository convention (`apps/`, `packages/`, etc.).
   - Choose stable project id used by moon config.
2. **Scaffold project files**
   ```bash
   mkdir -p apps/new-app
   ```
   (Use framework generator as needed, then align with workspace conventions.)
3. **Register moon project config**
   - Add project config (`moon.yml`/workspace config according to repo convention).
   - Define baseline targets: `lint`, `test`, `build` (as applicable).
4. **Wire dependencies**
   - Declare upstream project dependencies explicitly.
   - Ensure task deps reflect real build/test ordering.
5. **Validate immediately**
   ```bash
   moon query projects
   moon query tasks new-app
   moon run new-app:lint
   moon run new-app:test
   ```

## Pitfalls and Recovery
- **Project not discovered:** verify config path/naming and rerun `moon query projects`.
- **Target missing:** confirm target key exists in project task config.
- **Unexpected fan-out:** inspect dependency edges and remove accidental broad deps.
- **CI-only failure:** compare local/CI env inputs in task definitions.

## Caveats
- Do not copy task config from unrelated project without pruning stale dependencies.
- Validate each target right after creation; delayed validation compounds setup mistakes.

