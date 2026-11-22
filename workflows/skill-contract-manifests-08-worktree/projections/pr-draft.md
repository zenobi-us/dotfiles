---
receipt_id: implementation-0002
schemaVersion: worktree-pr-draft/v1
source_commit: a20008e3e548e98ecf568b06d1c762898337bcb3
source_tree: aacf1e028ca5c8c221138b2deeb96d4f00467909
workflow_id: skill-contract-manifests-08-worktree
---

# Worktree contract adoption

## Implementation summary

Declare worktree-owned contracts and external owner references. Emit current v3 receipts through v2 phase contexts; preserve explicit v1/v2 history, live v2 handoffs and checksum-bound recovery. Validate current coordinator events and version inspection/coordination output. Upgrade only mutable generated manifests/status views before authorized updates, preserving YAML comments and unknown metadata.

Source commit: `a20008e3e548e98ecf568b06d1c762898337bcb3`. Source tree: `aacf1e028ca5c8c221138b2deeb96d4f00467909`.

The assigned implementation result remains `worktree-receipt/v2` through retained phase-context v1. Future launches use v3. No event, receipt, review, snapshot or hash-linked historical record was converted.

## History

- `start-0001`: retained v2 parent, started from commit `0df9e026e0a8461e3ddba4ed620ac0efaf637320` and tree `adc1ac79d5417bb4ceaa51964223a2b9c6307295`.
- `implementation-0002`: independent implementation in the assigned worktree; commit and tree above. Review has not run. Ticket status remains claimed.

## Changed files

- `bun.lock`
- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/package.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/CHANGELOG.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/contracts.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/concurrency.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/coordination-v1.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/coordination-v2.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/goal-v1.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/goal-v2.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/inspection-error-v1.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/inspection-v1.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/integration-v2.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/latest-status-v1.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/latest-status-v2.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/phase-context-v1.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/phase-context-v2.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/pr-draft-v1.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v1.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v2.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v3.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/view-result-v1.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/view-upgrade.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/workflow-v2.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/workflow-v3.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/fix.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/review.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/start.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/contract-identity.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/goal-contract.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-contract.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-diagnostics.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-view.ts`
- `mise/conf.d/devtools-agent/bundles/developer/types/versioned-imports.d.ts`

The commit hook updated the developer plugin and marketplace version metadata. Dependency metadata adds pinned YAML support and type aliases.

## Validation results

- `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts` — exit 0. 168 pass, 0 fail, 971 expect calls across 11 files; final pre-commit run.
- `/tmp/worktree-contract-typecheck/node_modules/.bin/tsc --noEmit -p /tmp/worktree-contract-typecheck/tsconfig.json` — exit 0. All worktree production sources, tests and imported dependencies typecheck with real temporary dependencies and the declared versioned aliases. The ordinary bundle entrypoint initially lacked installed Bun types; no runtime source-path remapping was used.
- `mise exec -- bun /tmp/worktree-contract-smoke.ts /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-08-worktree` — exit 0. Post-commit owning CLI smoke: v1/v2/v3 start/result/inspection/recovery, typed delivery, rejected identities, manifest initialization, both view upgrades, read-only/rejected-write byte preservation, v1/v2 goal reservations. All seven scenario groups passed.
- `/home/zenobius/.omp/agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts resolve --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-08-worktree/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree --contract worktree-receipt/v2` — exit 0. Public resolution validated all manifest definitions and upgrade procedures from outside the caller checkout.
- `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-08-worktree/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts tracker/tickets/skill-contract-manifests-08-worktree.md --json` — exit 0. Live retained v2 start history valid; read-only inspection preserved SHA-256 44ae0e22634278b5c25b918fe28c26900b29d8287ff26d9d3d4b76b69fbaf947.

Temporary smoke repositories, the smoke script and compiler dependencies are removed after verification. No manual evidence run was created.

## Open questions

None. Independent review, integration, ticket completion and push remain parent-controlled workflow phases, not missing implementation.

## Canonical references

Consumed:

- ticket: `tracker/tickets/skill-contract-manifests-08-worktree.md`
- initiative: `tracker/initiatives/skill-contract-manifests/index.md`
- prerequisite: `tracker/tickets/skill-contract-manifests-03-safe-upgrades.md`
- receipt: `workflows/skill-contract-manifests-08-worktree/events/start-0001.yaml`
- tracker-contracts: `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/contracts.json`
- delivery-contracts: `mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/contracts.json`
- shared-context-definition: `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/references/layout.md`

Produced:

- receipt: `workflows/skill-contract-manifests-08-worktree/events/implementation-0002.yaml`
- snapshot: `workflows/skill-contract-manifests-08-worktree/artifacts/snapshots/pr-draft-implementation-0002.md`
- manifest: `workflows/skill-contract-manifests-08-worktree/manifest.yaml`
- projection: `workflows/skill-contract-manifests-08-worktree/projections/pr-draft.md`
- projection: `workflows/skill-contract-manifests-08-worktree/projections/implementation-log.md`
- projection: `workflows/skill-contract-manifests-08-worktree/projections/latest-status.yaml`
- source-commit: `a20008e3e548e98ecf568b06d1c762898337bcb3`
- source-contracts: `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/contracts.json`


## Review history

- **Review attempt 1:** FAILURE for commit `a20008e3e548e98ecf568b06d1c762898337bcb3`. Standards: 0 findings. Spec: 2 blocking P2 findings, `SPEC-1` and `SPEC-2`.
- **Review body:** [Immutable review](../artifacts/reviews/review-review-0006.md).
- **Review result:** [review-0006](../events/review-0006.yaml).
- **Parent completion:** [review-complete-0007](../events/review-complete-0007.yaml).
- **Validation:** Reviewer full suite: 168 pass, 0 fail. Parent view-contract checks: 9 pass, 0 fail. Owning-command scenarios reproduced both findings.
- **Resolved findings:** None.
- **Remaining findings:** `SPEC-1`, `SPEC-2`. No merge or push.
- **Lifecycle:** Reviewer and both helper terminals closed; owned process shutdown confirmed.
