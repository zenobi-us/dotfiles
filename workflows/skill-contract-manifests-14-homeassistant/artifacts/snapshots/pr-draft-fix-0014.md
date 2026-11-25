---
receipt_id: fix-0014
schemaVersion: worktree-pr-draft/v1
source_commit: b0c57a266b38c54f6a02ad1a2d4643f24c12398e
source_tree: 59ddce610e75c9340a56b2bbbc69ce1c39fb47e1
title: Home Assistant cleanup CLI test lifecycle
type: WorktreePrDraft
workflow_id: skill-contract-manifests-14-homeassistant
---

# Home Assistant cleanup CLI test lifecycle

## Ticket summary
Resolve only VALIDATION-001 for tracker/tickets/skill-contract-manifests-14-homeassistant.md. Preserve the owning record contracts and all expected statuses.

## Problem
Eight serial owning CLI rejection invocations exceeded Bun's default 5000ms test timeout in review-0011. The independent failure remains historical evidence.

## Implementation summary
Use the adjacent fixture scenario's bounded 20000ms timeout for both multi-process reader scenarios. Track all children in this file. Teardown kills only still-running owned children and awaits their exit. It also closes the controlled fixture server after test completion or timeout. Keep all eight rejection cases, exit status 2, successful v1/v2 reader assertions and the fixture dry-run assertions unchanged.

## Changed files
- mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/tests/cleanup-plan.test.ts
- mise/conf.d/devtools-agent/bundles/platform/skills/homeassistant/homeassistant-ops/CHANGELOG.md

The commit hook's unrelated bundle-version bumps were removed. HK=0 was used for the scoped amend only.

## Validation results
The required full-directory command ran once after the fix: 5 pass, 0 fail, 39 assertions, exit 0. See [tests.json](../evidence/fix-0014/tests.json).

Ten newly executed offline owning CLI cases passed. Historical/current records validate; all eight rejected records exit 2. Every record preserves its bytes. All children were reaped and temporary fixtures removed. No live Home Assistant connection or personal credential was used. See [cli-smoke.json](../evidence/fix-0014/cli-smoke.json) and [smoke-run.json](../evidence/fix-0014/smoke-run.json).

Checks ran on the fixed working tree before changelog and commit. The committed test blob is identical. No final-commit rerun, forced-timeout execution, typecheck or fresh independent review is claimed. See [source-identity.json](../evidence/fix-0014/source-identity.json).

## Review history
[implementation-0002](../../events/implementation-0002.yaml) and [original draft](pr-draft-implementation-0002.md) retain initial implementation evidence.
[review-0005](../reviews/review-review-0005.md) returned FAILURE for the original source. [fix-0008](../../events/fix-0008.yaml) and [prior draft](pr-draft-fix-0008.md) addressed SPEC-001.
[review-0011](../reviews/review-review-0011.md) independently confirmed SPEC-001 resolved, then returned FAILURE for VALIDATION-001 on 6bee44cc99483bd230e584e36217b86223ad4d6b. [Parent completion](../../events/review-complete-0012.yaml) preserves that outcome. Neither historical review is rewritten or relabelled.

## Resolved findings
VALIDATION-001 addressed by this scoped source change and new runtime proof. SPEC-001 remains independently resolved by review-0011.

## Remaining findings
No selected blocking finding remains unresolved. The retained nonblocking P3 serializer duplication is unchanged. Latest reviewer verdict: FAILURE on the prior source; fresh review required for this commit.

## Open questions
None.

## Merge status
Not merged, pushed or rebased. Ticket remains claimed. The parent owns closure, review and integration. Worktree remains available.

## Canonical inputs and outputs
Inputs: [fix-start-0013](../../events/fix-start-0013.yaml), [review-0011](../../events/review-0011.yaml), [finding evidence](../evidence/review-0011/findings.json), tracker/tickets/skill-contract-manifests-14-homeassistant.md and workflows/goal-skill-contract-manifests/events/dispatch-reserved-0002.yaml.
Outputs: [fix-0014](../../events/fix-0014.yaml), this immutable snapshot, workflow manifest, latest-status, PR draft and implementation-log projections, and evidence run workflows/skill-contract-manifests-14-homeassistant/artifacts/evidence/fix-0014.
Source: b0c57a266b38c54f6a02ad1a2d4643f24c12398e; tree: 59ddce610e75c9340a56b2bbbc69ce1c39fb47e1.

