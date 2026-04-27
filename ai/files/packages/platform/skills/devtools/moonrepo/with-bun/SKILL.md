---
name: moonrepo/with-bun
description: Configures moonrepo to use Bun for JavaScript and TypeScript projects, when setting up or standardizing Bun-based toolchains and tasks, resulting in deterministic runtime versions, correct toolchain resolution, and fewer task/runtime mismatches.
---

# Moonrepo with Bun

## Overview
Use this skill to apply the **moon Bun handbook** defaults correctly.

Core principle: Bun support in moon is **explicit opt-in**. Enable both `javascript` and `bun` toolchains, and configure JavaScript to use Bun as package manager.

## When to Use
- Adding Bun to a moonrepo.
- Fixing inconsistent runtime behavior across dev/CI.
- Standardizing project/task commands on `bun`/`bunx`.
- Migrating from `package.json` scripts to moon tasks.

Do **not** use as-is if your repo intentionally standardizes on Node runtime.

## Canonical Setup

### 1) Enable Bun in `.moon/toolchains.yml`
```yaml
javascript:
  packageManager: 'bun'

bun: {}
```

### 2) Pin Bun version for deterministic environments
```yaml
bun:
  version: '1.0.0'
```

Alternative pinning path:
```toml
# .prototools
bun = "1.0.0"
```

### 3) Set project/task toolchains when needed
moon may default to Node in ambiguous scenarios. Force Bun for project/task execution when required:

```yaml
# moon.yml
toolchains:
  default: ['javascript', 'bun']

tasks:
  build:
    command: 'webpack'
    toolchains: ['javascript', 'bun']
```

Important caveat: explicit task/project toolchains are primarily needed when executing `node_modules` binaries in ambiguous runtime contexts. Running the `bun` binary itself already implies Bun runtime.

## Task Patterns
Prefer explicit Bun commands in tasks:

```yaml
tasks:
  test:
    command: 'bun test'
  typecheck:
    command: 'bunx tsc --noEmit'
  build:
    command: 'bunx tsc -p tsconfig.build.json'
```

## Migration Option
For short-term migration/prototyping, moon can infer tasks from `package.json` scripts:

```yaml
javascript:
  inferTasksFromScripts: true
```

If your repo policy forbids package scripts, treat this as temporary bootstrap only.

## What Bun Enablement Gives You
- Auto dependency install when `package.json`/lockfile changes.
- Workspace-aware install location handling.
- Project relationship discovery via `dependencies`, `devDependencies`, and `peerDependencies`.

## Verification Checklist
- `moon toolchain info javascript`
- `moon toolchain info bun`
- `moon query projects`
- `moon query tasks <project>`
- Run one Bun-backed task: `moon run <project>:typecheck`

## Common Mistakes
- Enabling `bun.version` but forgetting `javascript.packageManager: bun`.
- Assuming moon will always infer Bun from `package.json`.
- Mixing `npm/pnpm/yarn` commands in Bun-designated tasks.
- Treating inferred scripts as permanent task strategy.

## Scope Note
The Bun handbook is intentionally compact. For repository structure, dependency management, and broader JavaScript guidance, apply the Node.js handbook patterns as compatible with Bun.
