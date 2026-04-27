---
name: moonrepo/project-generators
description: Creates and operates moonrepo project generators through template authoring, discovery, and safe generation flows, when scaffolding repeatable apps/packages/config in a workspace, resulting in standardized code generation with predictable destinations and variables.
---

# Moonrepo Project Generators

## Overview
Use this skill to create, inspect, and run Moon templates for repeatable project scaffolding.

This is built around Moon’s generator system: `moon generate`, `moon templates`, `moon template`, `template.yml`, and `generator.templates` in `.moon/workspace.yml`.

## When to Use
- You need a reusable scaffold for apps/packages/config.
- Teams are copy-pasting old projects and drifting from standards.
- You want consistent prompts/variables and destination rules.
- You need to share templates across repos (git/npm/archive/file/glob locations).

## Core Workflow
1. **Verify template locations** in `.moon/workspace.yml`:
   ```yml
   generator:
     templates:
       - './templates'
       - 'file://./other/templates'
       - 'git://github.com/org/repo#main'
       - 'npm://@org/templates#1.2.3'
   ```
2. **List and inspect available templates**:
   ```bash
   moon templates
   moon templates --json
   moon template <id>
   moon template <id> --json
   ```
3. **Create a new template scaffold**:
   ```bash
   moon generate <name> --template
   ```
4. **Define schema in `template.yml`**:
   ```yml
   title: 'npm package'
   description: |
     Scaffolds an npm package with baseline files.
   destination: 'packages/[name]'
   variables:
     name:
       type: 'string'
       default: ''
       required: true
       prompt: 'Package name?'
   ```
5. **Render with safety flags first**:
   ```bash
   moon generate <id> --to ./packages/example --dry-run
   moon generate <id> --to ./packages/example --defaults
   moon generate <id> --to ./packages/example -- --name '@company/example'
   ```

## Template Authoring Rules
- A template is a directory with a `template.yml`/`template.yaml` file at its root.
- Template ID is folder name unless overridden by `id`.
- `destination` can standardize output and supports `[varName]` interpolation.
- Variables support: `array`, `boolean`, `string`, `object`, `number`, `enum`.
- Prompt behavior:
  - Interactive by default.
  - `--defaults` uses configured defaults.
  - CLI variable overrides are passed after `--` and names must match variable names exactly.
  - Boolean vars can be negated with `--no-<arg>`.
  - Array vars can be repeated (`--tag a --tag b`).
  - Object vars are **not** supported via CLI args; set via prompt/default.

## High-Value File Features
- **Interpolation in paths**: `src/[type].ts` → `src/bin.ts`.
- **Partials**: include `partial` in filename/path so they are not generated.
- **Raw templates**: add `.raw` extension to bypass rendering.
- **Frontmatter controls in file content**:
  - `force: true` overwrite existing destination file.
  - `to: ...` remap output file path.
  - `skip: ...` conditionally skip file generation.

## Shared Template Strategies
- Local workspace folder (`./templates`) for single-repo usage.
- `git://...#revision` when centralizing templates in a shared repo.
- `npm://...#version` when distributing versioned templates.
- `https://...archive.zip` or glob locators when needed for external or multi-template layouts.

## Pitfalls and Recovery
- **Template not found**: run `moon templates`, then confirm `generator.templates` paths and ordering.
- **Wrong destination**: check `destination` and `--to`; use `--dry-run` before write.
- **Variable not applied**: ensure variable name matches CLI arg name exactly after `--`.
- **Unexpected overwrite prompts**: use explicit `--force` or per-file frontmatter `force` intentionally.
- **Template drift across repos**: pin shared templates to git revision or npm version.

## Quick Validation Loop
```bash
moon templates --json
moon template <id> --json
moon generate <id> --to <dest> --dry-run
moon generate <id> --to <dest> --defaults
```

## Sources
- moonrepo docs: `docs/guides/codegen`
- moonrepo docs: `docs/commands/generate`
- moonrepo docs: `docs/commands/template`
- moonrepo docs: `docs/commands/templates`
- moonrepo docs: `docs/config/workspace#generator`
- moonrepo docs: `docs/config/template`
