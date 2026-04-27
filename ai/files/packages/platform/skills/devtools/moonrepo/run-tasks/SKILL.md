---
name: moonrepo/run-tasks
description: Runs moonrepo tasks with project/target selectors and troubleshooting flow, when daily execution needs predictable scoped runs, resulting in faster feedback and fewer ad hoc command mistakes.
---

# Moonrepo Run Tasks

## Overview
Use this skill for routine execution of moonrepo tasks by project and target, with selector-driven filtering and failure triage.

## When to Use
- Running one project target quickly.
- Running affected subsets instead of whole repo.
- Diagnosing common moon task execution failures.
- Running tasks in CI

## Core Command Patterns
1. **Single project target**
   ```bash
   moon run app:build
   moon run api:test
   ```
2. **Multiple targets/projects**
   ```bash
   moon run :lint
   moon run app:build api:test
   ```
3. **Affected/scope workflows**
   ```bash
   moon run :test --affected
   moon run :lint --projects app,api
   ```
4. **Inspect before running**
   ```bash
   moon query projects
   moon query tasks app
   ```

## Running Commands in CI

when running tasks in CI, use `ci` instead of `run`.

```bash
moon ci :lint
moon ci app:build api:test

moon query projects
moon query tasks app
```

## Triage Flow
1. **Unknown target/project**
   - Run `moon query projects` and `moon query tasks <project>`.
2. **Unexpected dependencies or task fan-out**
   - Re-run with explicit project/target pair.
   - Inspect task config and inheritance in `.moon/` + project configs.
3. **Tool/runtime mismatch**
   - Confirm runtime versions via project toolchain manager before retry.
4. **Cache confusion**
   - Capture run output first, then compare with clean run (`--updateCache` only when needed by your policy).

## Caveats
- Prefer selectors over broad `moon run :target` when repo is large.
- Avoid “just run everything” in CI-like local checks; it hides dependency problems.
- Always verify project and target names from query commands; don’t guess.

## Quick Examples
```bash
# validate only one changed app
moon run app:test --affected

# lint two projects only
moon run :lint --projects app,dashboard
```
