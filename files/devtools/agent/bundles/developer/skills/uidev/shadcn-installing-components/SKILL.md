---
name: shadcn-installing-components
description: Installs shadcn registry components into ui-foundation with monorepo-safe paths, when adding official or third-party shadcn components to pkgs/libs/ui-foundation, resulting in registry-folder placement, relative imports, explicit subpath exports, and no root barrel exports.
---

# shadcn ui-foundation installer

## Overview
Use this skill to add shadcn components into `pkgs/libs/ui-foundation` without breaking package boundaries.

This skill is a strict wrapper around the base `shadcn` skill for this repo layout.

## When to Use
Use when:
- You are adding any component via `shadcn add`
- Component source is official shadcn/ui or external registry
- You must publish component through package subpath exports

Do not use when:
- You are editing an already-installed component only
- You are installing into a package other than `pkgs/libs/ui-foundation`

## Non-Negotiable Rules
1. **Always use the base `shadcn` skill first.**
2. **Always run from `pkgs/libs/ui-foundation`.**
3. **Always install with:**
   - `bun x --bun shadcn@latest add {provided component registry item}`
4. **Component path must be registry-scoped:**
   - Official shadcn → `src/components/ui/{component}`
   - Third-party registry `{registry_name}` → `src/components/{registry_name}/{component}`
5. **All imports in added files must be relative paths. No aliases.**
6. **`package.json` exports must explicitly cover the new component subpath(s).**
7. **Do NOT export newly added component(s) from `src/index.ts`.**

## Workflow
1. **Load base skill**
   - Use the `shadcn` skill for upstream conventions.
   - Minimum required read: the shadcn skill's `AGENTS.md` in the resolved skill directory from the Skill tool output (do not stop at index `SKILL.md`).

2. **Enter package dir**
   ```bash
   cd pkgs/libs/ui-foundation
   ```

3. **Install component**
   ```bash
   bun x --bun shadcn@latest add {provided component registry item}
   ```

4. **Move/verify destination folder**
   - Determine registry source.
   - Ensure target file location is:
     - `src/components/ui/*` for official
     - `src/components/{registry_name}/*` for non-official
   - Keep all generated files for that component under the same registry folder (`ui` or `{registry_name}`), including helper files created during install.

5. **Rewrite imports to relative paths**
   Replace aliases like:
   - `@/components/...`
   - `@/lib/...`
   - `~/...`

   With relative imports from the file location (examples):
   - `../../lib/cn`
   - `../ui/button`
   - `./internal-helper`

6. **Update `package.json` exports**
   Add explicit export entries for each newly installed component entry file. Do not rely only on broad wildcards.

   Example:
   ```json
   {
     "exports": {
       "./components/acme/fancy-card": {
         "types": "./src/components/acme/fancy-card.tsx",
         "default": "./src/components/acme/fancy-card.tsx"
       }
     }
   }
   ```

7. **Protect tree shaking boundary**
   - Do not add `export * from "./components/..."` lines for newly installed components in `src/index.ts`.

8. **Verify**
   - Component exists in registry folder.
   - No alias imports in new/changed component files.
   - `package.json` has subpath export for installed component.
   - `src/index.ts` unchanged for this component.

   Verification commands:
   ```bash
   # no alias imports in component trees
   grep -R "@/\|~/" src/components/ui src/components/* 2>/dev/null || true

   # confirm explicit subpath export exists
   cat package.json

   # confirm root barrel did not expose new component
   grep -n "components/acme/fancy-card" src/index.ts || true
   ```

## Quick Reference
- Working directory: `pkgs/libs/ui-foundation`
- Install command: `bun x --bun shadcn@latest add {provided component registry item}`
- Official registry folder: `src/components/ui`
- Third-party registry folder: `src/components/{registry_name}`
- Alias imports: forbidden
- Root `src/index.ts` export for new component: forbidden

## Common Mistakes
- Installing from repo root instead of `pkgs/libs/ui-foundation`
- Leaving `@/` or `~/` aliases in generated files
- Putting third-party component under `src/components/ui`
- Skipping explicit `package.json` subpath export
- Exporting new component from root barrel (`src/index.ts`) and hurting tree-shaking behavior
