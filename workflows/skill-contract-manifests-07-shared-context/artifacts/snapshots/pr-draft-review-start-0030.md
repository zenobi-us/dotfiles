---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-07-shared-context
receipt_id: review-start-0030
source_commit: 109f3e0ebf668a6ab9d0002af19c906da4298c94
source_tree: 290dad56a125ae56be029fa773889ef054d237da
---
# Resolved source candidate for independent review

## Ticket summary

Ticket: `tracker/tickets/skill-contract-manifests-07-shared-context.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source: `resolve/skill-contract-manifests-07-shared-context-finish` at `109f3e0ebf668a6ab9d0002af19c906da4298c94`, tree `290dad56a125ae56be029fa773889ef054d237da`. Base branch: `master`. Frozen review base: `6b64c4aaad9ebc97783aaf52d4a182e38b7eef5f`.

## Problem and implementation

Declare shared-context-owned contracts and validate resolution, indexing, configuration, and supported upgrades at operation boundaries. Keep external tracker and workflow definitions with their owners. Preserve authored data and historical records.

The implementation keeps lexical upgrade reporting with canonical safety checks, reads retained migration-plan resolutions without rewriting them, and preserves historical project identity. The last fix derives index identity from the logical path before canonicalization and validates generated metadata before persistence.

The accepted base produced three version-file conflicts. This separate candidate retains original source `79250a53fad0780ac51d40f17121b50d8d76ef6f` as its first parent and accepted base `b31360101dafd23ae07fe82dc3813973a56935e8` as its second parent. Manual resolution preserves agent-core 0.1.42 and matt-pocock 0.1.16. The combined marketplace retains developer 0.2.77. No product-code hunk required manual resolution.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/contracts.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/changelog.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/configuration-upgrades.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/ingest.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/layout.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/config.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/contracts.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/layout.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/contracts.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/test/shared-context.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/upgrades.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/tasks/migrate.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/record-migration.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.test.ts`

## Validation

The resolved staged tree passed 263 tests with 1,299 assertions and no failures across 11 files. The later merge commit freezes the same tested tree. Actual ticket resolution and shared-context, tracker, and worktree contract-manifest validation passed. These are preparation checks, not integration-commit-bound validation.

Real dependencies: YAML 2.8.1, AJV 8.20.0, Crust core 0.0.19, and plugins 0.1.2. Qualified aliases are inside ignored candidate node_modules. No fake package or tracked dependency change was made. No typecheck is claimed.

Full commands and outcomes: `workflows/skill-contract-manifests-07-shared-context/events/finish-failed-0027.yaml`. Detailed observation: `workflows/skill-contract-manifests-07-shared-context/artifacts/snapshots/finish-resolution-0026.json`. Runtime output: `workflows/skill-contract-manifests-07-shared-context/artifacts/snapshots/validation-finish-resolution-0026.log`.

## Review history and findings

Earlier immutable reviews remain source-bound: review-0005 FAILURE at 2d577903; review-0011 FAILURE at 3a70f87b; review-0018 FAILURE at fc4bf19e; review-0024 SUCCESS at 79250a53. Their artifacts remain under `workflows/skill-contract-manifests-07-shared-context/artifacts/reviews/`. Implementation and fix receipts remain unchanged.

SPEC-0018-01 was resolved by fix-0021. STD-0018-01 remains an unchanged nonblocking P3 heuristic. The old SUCCESS does not apply to this new candidate. A new independent review is required.

## Latest verdict and open questions

Review pending for the exact candidate above. The user selected “Review candidate, then finish” and approved this exact commit and tree. No unresolved design question remains. New blocking review findings would stop finish.

## Merge and publication status

No product integration or push occurred. Ticket status remains claimed. Original and resolved worktrees remain available. The unrelated `mise/conf.d/devtools-omp/config.yml` change remains untouched. Integration must use the configured squash policy, an accepted current base, and checks bound to the actual integration commit and tree.

## Canonical inputs and outputs

Consumed: `tracker/tickets/skill-contract-manifests-07-shared-context.md`, `workflows/skill-contract-manifests-07-shared-context/events/fix-0021.yaml`, `workflows/skill-contract-manifests-07-shared-context/events/fix-complete-0022.yaml`, `workflows/skill-contract-manifests-07-shared-context/events/review-0024.yaml`, `workflows/skill-contract-manifests-07-shared-context/events/review-complete-0025.yaml`, `workflows/skill-contract-manifests-07-shared-context/events/finish-complete-0028.yaml`, and `workflows/skill-contract-manifests-07-shared-context/events/source-approval-0029.yaml`.

Prepared review: `workflows/skill-contract-manifests-07-shared-context/events/review-start-0030.yaml`. The reviewer must publish one new immutable artifact at `workflows/skill-contract-manifests-07-shared-context/artifacts/reviews/review-review-0031.md` and one assigned review result. Neither exists as a completed result yet.
