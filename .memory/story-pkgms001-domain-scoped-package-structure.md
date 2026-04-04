---
id: pkgms001
type: story
title: Domain-Scoped Package Structure for ai/files
created_at: 2026-04-01
updated_at: 2026-04-01
status: todo
epic_id: pkgmig01
priority: critical
test_coverage: none
story_points: 8
---

# Domain-Scoped Package Structure for ai/files

## User Story

As a developer using pi, I want `ai/files/` organized into 6 domain-scoped pi-packages so that prompts and skills are grouped by purpose, making it easy to understand what each package provides.

## Acceptance Criteria

- [ ] AC1: A `packages/` directory exists under `ai/files/` containing exactly 6 subdirectories: `agent-core`, `developer`, `creator`, `researcher`, `business`, `platform`
- [ ] AC2: Each package has a `package.json` with `name`, `version`, `keywords: ["pi-package"]`, and `pi.skills`/`pi.prompts` declarations
- [ ] AC3: Each package has a `prompts/` subdirectory containing only the prompts assigned to that package
- [ ] AC4: Each package has a `skills/` subdirectory containing only the skills assigned to that package (preserving internal subdirectory structure)
- [ ] AC5: `ai/files/commands/` and `ai/files/skills/` flat directories are removed (no orphan files)
- [ ] AC6: The `platform` package has no `prompts/` (it has no commands)

## Context

Currently, ~200 skills and 12 top-level + 17 design prompts live in two flat directories: `ai/files/commands/` and `ai/files/skills/`. The skill categories (devtools, experts, homeassistant, projectmanagement, shells, skill-development, superpowers) already exist but aren't co-located with their related prompts. Packaging groups them by workflow domain.

## Package Assignment

| Package | Prompts | Skills |
|---|---|---|
| `agent-core` | create-skill, install-skill | superpowers/*, skill-development/*, shells/* |
| `developer` | codemap, commit, pr, fix-in-worktree, resolve-pr | devtools/* (non-design), experts/developer-experience, experts/language-specialists, experts/quality-security |
| `creator` | design/* (17) | devtools/figma, devtools/visual-explainer, devtools/webdesign/*, experts/core-development/*, specialized-domains/api-documenter, game-developer, mobile-app-developer |
| `researcher` | research, review-documentation | devtools/lynx-web-search, experts/data-ai/*, experts/research-analysis/*, specialized-domains/quant-analyst |
| `business` | jira, miniproject | projectmanagement/*, experts/business-product/*, experts/meta-orchestration/*, specialized-domains/payment-integration, risk-manager, seo-specialist |
| `platform` | (none) | devtools/cloudflare/*, devtools/provisioning-with-comtrya, homeassistant/*, experts/infrastructure/*, specialized-domains/blockchain-developer, embedded-systems, iot-engineer |

## Out of Scope

- Changes to `~/.claude/skills/` (Claude Code skill path — separate concern)
- Publishing packages to npm
- Changes to how prompts are loaded by pi (pi handles `prompts/` via convention)

## Tasks

- [task-pkgmt001](./task-pkgmt001-create-package-skeleton.md)
- [task-pkgmt002](./task-pkgmt002-migrate-agent-core.md)
- [task-pkgmt003](./task-pkgmt003-migrate-developer.md)
- [task-pkgmt004](./task-pkgmt004-migrate-creator.md)
- [task-pkgmt005](./task-pkgmt005-migrate-researcher.md)
- [task-pkgmt006](./task-pkgmt006-migrate-business.md)
- [task-pkgmt007](./task-pkgmt007-migrate-platform.md)
- [task-pkgmt008](./task-pkgmt008-add-package-json-files.md)

## Test Specification

### E2E Tests

| AC# | Criterion | Test | Status |
|---|---|---|---|
| AC1 | 6 package dirs exist | `ls ai/files/packages/ \| wc -l` == 6 | pending |
| AC2 | Valid package.json | `cat ai/files/packages/*/package.json \| jq .pi` non-null | pending |
| AC3 | Prompts present | Each package prompts/ contains expected files | pending |
| AC4 | Skills present | Each package skills/ contains expected subdirs | pending |
| AC5 | Flat dirs removed | `ls ai/files/commands ai/files/skills` exits non-zero | pending |
| AC6 | Platform no prompts | `ls ai/files/packages/platform/prompts/` empty or missing | pending |

## Notes

- The `review-documetation.md` file has a typo in the filename — rename to `review-documentation.md` during migration (AC3 for researcher package)
- `devtools/lynx-web-search` goes to researcher (research tool), not developer
- `devtools/mise` and `devtools/provisioning-with-comtrya` — mise goes to developer, provisioning-with-comtrya goes to platform
