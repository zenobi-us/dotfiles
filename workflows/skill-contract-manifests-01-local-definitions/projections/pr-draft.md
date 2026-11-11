---
title: Pr draft
type: Report
---

# Validate manifests and resolve local definitions

## Ticket

[Canonical ticket](../../../tracker/tickets/skill-contract-manifests-01-local-definitions.md).

## Problem

Consumers need one shared manifest specification and validator. Input support, output production, and definition ownership must remain distinct.

## Implementation

The public validate and resolve commands validate declarations before resolving local authoritative definitions. Installed-skill paths do not depend on the caller directory. The built-in manifest definition avoids recursive self-resolution. Historical Git resolution, upgrade execution, and owner adoption remain out of scope.

## Current state

FINISHED. Reviewed source: `a53c09ef6fc30a4aaf072761dc3f4e9defd7f4c1`, tree `009468ec2f7311d2d2f9a20e40bcb2a0ddb7755c`. Merge commit: `26f56acbda0de958891709d4152ee9b123d96327`. Latest receipt: [finish-finished-0033](../events/finish-finished-0033.json).

## Changed files

- `bun.lock`
- `mise/conf.d/devtools-agent/bundles/agent-core/package.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/contracts.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/empty/contracts.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/local/contracts.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/local/record-v1.schema.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/local/record-v2.schema.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/local/upgrade.txt`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/how-to-validate-contracts.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/manifest.md`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/manifest.schema.json`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/contracts.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/contracts.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/types/versioned-imports.d.ts`
- `tracker/tickets/skill-contract-manifests-01-local-definitions.md`
- `workflows/skill-contract-manifests-01-local-definitions/manifest.yaml`
- `workflows/skill-contract-manifests-01-local-definitions/projections/implementation-log.md`
- `workflows/skill-contract-manifests-01-local-definitions/projections/latest-status.yaml`
- `workflows/skill-contract-manifests-01-local-definitions/projections/pr-draft.md`

## Validation

- `mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents`: PASS: 122 tests, 0 failures, 534 assertions across 6 files
- `mise exec -- bun /tmp/skill-contract-finish-smoke.ts /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`: PASS: actual public executable from /tmp; exact local/builtin definitions; valid/empty/malformed/unresolved manifests; separate produces/accepts; persisted bytes unchanged
- `retained bundle typecheck baseline`: Known unrelated muxer-subagents/scripts/router.ts:154 TS2554 retained and not rerun; no clean typecheck claim
- `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/cleanup-merged/scripts/cleanup-merged.test.ts`: PASS: 8 tests, 0 failures, 21 assertions; inline-option regression failed before fix
- `cleanup-merged.ts remove feature/skill-contract-manifests-01-local-definitions --min-age=0s`: PASS: exactly named source branch/worktree removed; refused []; source path absent
- `records.ts check after ticket completion`: PASS: tracker-ticket/v1, completed state, membership, dependencies, normal discovery

## Review history

- SUCCESS: `c2135fa5e78208c39e18e49eaa95ba0128f936e7` — [review-0008](../events/review-0008.yaml); [artifact](../artifacts/reviews/review-review-0008.md).
- SUCCESS: `7ff2f96ebf1c2eae3b795af011e197dae0314911` — [review-reconcile-0016](../events/review-reconcile-0016.yaml); [artifact](../artifacts/reviews/review-review-reconcile-0016.md).
- SUCCESS: `a53c09ef6fc30a4aaf072761dc3f4e9defd7f4c1` — [review-final-0022](../events/review-final-0022.yaml); [artifact](../artifacts/reviews/review-review-final-0022.md).

## Resolved findings

The identifier end-anchor issue was corrected before formal review. The cleanup inline-age blocker was repaired under explicit approval and verified by regression and actual removal.

## Remaining findings

No blocking ticket findings remain. The unrelated frozen-master typecheck diagnostic remains recorded in validation.

## Latest reviewer verdict

SUCCESS for the final recorded reviewed source. Earlier verdicts cover their own source identities only.

## Merge status

FINISHED; canonical publication and cleanup evidence are recorded in the terminal receipt.

## Supporting receipts

- [implementation-0002](../events/implementation-0002.yaml)
- [implementation-0005](../events/implementation-0005.yaml)
- [review-0008](../events/review-0008.yaml)
- [implementation-reconcile-0013](../events/implementation-reconcile-0013.yaml)
- [review-reconcile-0016](../events/review-reconcile-0016.yaml)
- [implementation-final-sync-0019](../events/implementation-final-sync-0019.yaml)
- [review-final-0022](../events/review-final-0022.yaml)
- [start-0001](../events/start-0001.yaml)
- [start-complete-0003](../events/start-complete-0003.yaml)
- [start-0004](../events/start-0004.yaml)
- [start-complete-0006](../events/start-complete-0006.yaml)
- [review-start-0007](../events/review-start-0007.yaml)
- [review-complete-0009](../events/review-complete-0009.yaml)
- [finish-0010](../events/finish-0010.yaml)
- [finish-approval-0011](../events/finish-approval-0011.json)
- [start-reconcile-0012](../events/start-reconcile-0012.json)
- [start-reconcile-complete-0014](../events/start-reconcile-complete-0014.json)
- [review-reconcile-start-0015](../events/review-reconcile-start-0015.json)
- [review-reconcile-complete-0017](../events/review-reconcile-complete-0017.json)
- [start-final-sync-0018](../events/start-final-sync-0018.json)
- [start-final-sync-complete-0020](../events/start-final-sync-complete-0020.json)
- [review-final-start-0021](../events/review-final-start-0021.json)
- [review-final-complete-0023](../events/review-final-complete-0023.json)
- [finish-prepared-0024](../events/finish-prepared-0024.json)
- [finish-merged-0025](../events/finish-merged-0025.json)
- [finish-validated-0026](../events/finish-validated-0026.json)
- [finish-pushed-0027](../events/finish-pushed-0027.json)
- [finish-ticket-completed-0028](../events/finish-ticket-completed-0028.json)
- [finish-cleanup-failed-0029](../events/finish-cleanup-failed-0029.json)
- [finish-cleanup-approval-0030](../events/finish-cleanup-approval-0030.json)
- [finish-cleanup-repaired-0031](../events/finish-cleanup-repaired-0031.json)
- [finish-worktree-removed-0032](../events/finish-worktree-removed-0032.json)
- [finish-finished-0033](../events/finish-finished-0033.json)

## Authorized cleanup repair

Published commit: `d42f57e1dfe631ca227af56c6b69490f75b2a3d6`. Support inline `--min-age=0s` as well as split values. Integration and busy-worktree guards remain unchanged.

### Repair changed files

- `mise/conf.d/devtools-agent/bundles/developer/skills/git/cleanup-merged/scripts/cleanup-merged.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/cleanup-merged/scripts/cleanup-merged.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/cleanup-merged/SKILL.md`
