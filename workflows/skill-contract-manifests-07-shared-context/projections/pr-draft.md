---
schemaVersion: worktree-pr-draft/v1
workflow_id: skill-contract-manifests-07-shared-context
receipt_id: review-complete-0032
source_commit: 109f3e0ebf668a6ab9d0002af19c906da4298c94
source_tree: 290dad56a125ae56be029fa773889ef054d237da
---
# Reviewed resolved source candidate

## Ticket and implementation

Ticket: `tracker/tickets/skill-contract-manifests-07-shared-context.md`. Initiative: `tracker/initiatives/skill-contract-manifests/index.md`.

Source branch: `resolve/skill-contract-manifests-07-shared-context-finish`. Base branch: `master`. Source commit: `109f3e0ebf668a6ab9d0002af19c906da4298c94`. Source tree: `290dad56a125ae56be029fa773889ef054d237da`. Frozen review base: `6b64c4aaad9ebc97783aaf52d4a182e38b7eef5f`.

The implementation declares shared-context-owned formats and validates resolution, indexing, configuration, and explicit supported upgrades. It keeps external tracker and workflow definitions with their owners. It preserves authored records and historical plans, lexical upgrade reporting with canonical safety checks, and logical index identity before realpath.

The resolved candidate retains original source 79250a53 as its first parent and accepted base b3136010 as its second parent. Manual conflict resolution affected only three bundle-version files. The committed versions differ from the earlier pre-commit observation:

| Bundle | Manual resolution before commit | Frozen committed source |
| --- | --- | --- |
| agent-core | 0.1.42 | 0.1.43 |
| matt-pocock | 0.1.16 | 0.1.17 |
| developer | 0.2.77 | 0.2.77 |

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

## Verification and preparation correction

Fresh review-0031 ran 263 tests with 1,299 assertions and no failures on the exact frozen commit/tree above. Actual owning commands proved alias indexing, authored-byte preservation, rejection before persistence, route configuration, explicit partial bulk conversion, retained migration-plan behavior, physical storage-copy preservation, equivalent historical identity preservation, and worktree/backlog consumer compatibility. All three owner manifests validated. No typecheck is claimed.

Earlier finish preparation statements that the pre-commit test run exercised the same complete tree were too strong. The final commit includes the version changes shown above. Historical records remain unchanged. Fresh review-0031 supplies exact committed-source validation and supersedes that preparation claim.

The parent also ran actual shared-context workflow resolution from the frozen executable against the canonical publication checkout. It returned shared-context-resolution/v1 and the expected workflow reference.

## Review history and findings

| Review | Source | Verdict |
| --- | --- | --- |
| review-0005 | 2d577903 | FAILURE |
| review-0011 | 3a70f87b | FAILURE |
| review-0018 | fc4bf19e | FAILURE |
| review-0024 | 79250a53 | SUCCESS for original source |
| review-0031 | 109f3e0e | SUCCESS for resolved candidate |

All review artifacts remain immutable under `workflows/skill-contract-manifests-07-shared-context/artifacts/reviews/`. Prior implementation and fix receipts remain unchanged. SPEC-0018-01 was resolved by fix-0021. Current review has no blocker. STD-0018-01, STD-0031-01 and STD-0031-02 are nonblocking P3 heuristics. No optional refactor is required for finish.

## Receipt validation and resources

The parent validated the assigned transport binding/hash, exact authoritative review event, source identity, artifact, scope, contracts, and checks before acknowledgement. The review tab and both axis tabs are closed. Resource observations confirmed shutdown for all three registered runs. The target app space is absent. No extra signal or broad kill was used. Both filesystem worktrees remain preserved.

## Merge, publication and next action

State: REVIEW_PASSED. No product integration or push has occurred. The canonical ticket remains claimed. The unrelated `mise/conf.d/devtools-omp/config.yml` change remains untouched. No unresolved design question remains.

Resume finish with current-base compatibility assessment, configured squash integration, checks bound to the actual integration commit/tree, non-force publication, backend completion, and scoped cleanup. The source review alone does not prove integration.

## Canonical records

Consumed: `tracker/tickets/skill-contract-manifests-07-shared-context.md`, `workflows/skill-contract-manifests-07-shared-context/events/source-approval-0029.yaml`, `workflows/skill-contract-manifests-07-shared-context/events/review-start-0030.yaml`, `workflows/skill-contract-manifests-07-shared-context/events/review-0031.yaml`, and `workflows/skill-contract-manifests-07-shared-context/artifacts/reviews/review-review-0031.md`.

Resource evidence: `workflows/skill-contract-manifests-07-shared-context/artifacts/snapshots/resources-review-complete-0032.json`. Launch handoff: `workflows/skill-contract-manifests-07-shared-context/artifacts/snapshots/review-launch-0030.json`. Review inputs and coordination remain under `workflows/skill-contract-manifests-07-shared-context/artifacts/snapshots/`. Parent completion: `workflows/skill-contract-manifests-07-shared-context/events/review-complete-0032.yaml`.
