---
created_at: 2026-11-22T05:19:05.179Z
review_base_commit: e89668ebab19e7b40b7cb03edcf59a2c2e3ba0ba
source_commit: 4a0df18caa4d1ee1c1aaca2729291e0e66c59823
source_tree: efbb160b9d23b9088416d8bd239c2d9ce011882f
title: skill-contract-manifests-08-worktree review attempt 2
type: Review
---

# Worktree review attempt 2

## Verdict

FAILURE. Standards: one P2 finding. Spec: two P2 findings.

## Frozen source

Ticket: tracker/tickets/skill-contract-manifests-08-worktree.md. Initiative: tracker/initiatives/skill-contract-manifests/index.md.

Branch: feature/skill-contract-manifests-08-worktree. Base branch: master.

Source commit: 4a0df18caa4d1ee1c1aaca2729291e0e66c59823. Source tree: efbb160b9d23b9088416d8bd239c2d9ce011882f. Review timestamp: 2026-11-22T05:19:05.179Z.

The review covers the full three-dot diff, not only fix hunks:

`git diff e89668ebab19e7b40b7cb03edcf59a2c2e3ba0ba...4a0df18caa4d1ee1c1aaca2729291e0e66c59823`

Commits: a20008e3, 2783e66e, 4a0df18c. Source remained clean and exact. Source and publication checkouts share the same physical Git common directory. Publication uses /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.

## Scope and affected interfaces

```json
{
  "review_base_commit": "e89668ebab19e7b40b7cb03edcf59a2c2e3ba0ba",
  "changed_scope": [
    "bun.lock",
    "mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json",
    "mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json",
    "mise/conf.d/devtools-agent/bundles/developer/package.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/CHANGELOG.md",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/SKILL.md",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/contracts.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/concurrency.md",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts.md",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/coordination-v1.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/coordination-v2.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/goal-v1.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/goal-v2.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/inspection-error-v1.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/inspection-v1.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/integration-v2.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/latest-status-v1.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/latest-status-v2.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/phase-context-v1.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/phase-context-v2.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/pr-draft-v1.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v1.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v2.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/receipt-v3.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/view-result-v1.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/view-upgrade.md",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/workflow-v2.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/contracts/workflow-v3.json",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/fix.md",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/review.md",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/start.md",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/contract-identity.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.test.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/coordination.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/goal-contract.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-contract.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-diagnostics.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.test.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts",
    "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-view.ts",
    "mise/conf.d/devtools-agent/bundles/developer/types/versioned-imports.d.ts"
  ],
  "affected_contracts": [
    "worktree-receipt/v1",
    "worktree-receipt/v2",
    "worktree-receipt/v3",
    "worktree-phase-context/v1",
    "worktree-phase-context/v2",
    "worktree-goal/v1",
    "worktree-goal/v2",
    "worktree-inspection/v1",
    "worktree-coordination/v2",
    "worktree-workflow/v2",
    "worktree-workflow/v3",
    "worktree-latest-status/v1",
    "worktree-latest-status/v2",
    "worktree-pr-draft/v1",
    "tracker-ticket/v2",
    "result-delivery/v2",
    "shared-context locations",
    "yaml@2.8.1"
  ],
  "integration_checks": [
    {
      "argv": [
        "mise",
        "exec",
        "--",
        "bun",
        "test",
        "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts"
      ]
    }
  ]
}
```

## Standards

One documented-standard violation. The new manifest validator and current JSON definition accept manifests without initiative, although references/receipts.md requires that field and requires null when no initiative applies. The owning creation command therefore accepts a manifest that violates its documented contract. No baseline smell warrants a separate finding. Reviewed the full frozen diff, production validators and writers, contract definitions, dependency declarations, guidance, repository context, and the ADR index. ADR 0001 concerns Pi Ink device cleanup and does not apply. No builds, tests, lint, formatters, or workflow operations ran.

### STANDARDS-1 — P2

NO ADR: worktree projection contract applies; ADR 0001 concerns Pi Ink and does not apply.

[mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/view-contracts.ts:31]

Documented-standard violation: references/receipts.md, Projection requirements, says manifest.yaml MUST contain initiative and says to use null when no initiative applies. Changed hunk: `if (contract.startsWith("worktree-workflow/")) return typeof fields.ticket_ref === "string" && fields.ticket_ref.length > 0 && fields.event_root === "events" && fields.artifact_root === "artifacts" && fields.projection_root === "projections";`. Neither this validator nor references/contracts/workflow-v3.json requires initiative. scripts/write-view.ts accepts initial current manifests through this validator, so omitting initiative succeeds. The new test fixture also omits initiative.

Required change: Require an explicit initiative field on current manifests. Accept null for no initiative or a non-empty initiative identifier. Align workflow-v3.json and current creation fixtures with the documented rule. Preserve historical input compatibility explicitly.

Validation: `Exercise scripts/write-view.ts --repository <temporary-publication-repository> --id TASK-1 --kind manifest --input <current-manifest-without-initiative.json>; require rejection without creating manifest.yaml. Repeat with initiative:null and with a valid initiative identifier; require successful creation.`

## Spec

Two specification gaps remain. SPEC-1 now rejects fresh v2 starts and permits assigned retained v2 results, but its completion gate rejects the established start/implementation reconciliation mapping. SPEC-2 binds both current and historical view families to canonical filenames before shared upgrades. The full diff preserves immutable event bytes, adds explicit historical identity readers, and updates launch guidance, recovery validation and explorer validation. Mutable conversions preserve unknown YAML data and comments and reject unsupported content. Tracker and delivery definitions resolve to their external owners; muxer accepts arbitrary assigned domain schemas and delivery checks either single identity field. The shared-context reference does not define its advertised contract. No additional scope creep found. ADR 0001 concerns Pi Ink only; no applicable worktree ADR exists.

### SPEC-3 — P2

NO ADR: ticket and initiative requirements apply.

[mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts:25]

The requirement is “update current producers and all consumers, including recovery and explorer readers, together.” The retained-v2 reconciliation gate requires parent.phase === context.phase for a phase-result. A valid start phase-complete has phase start and names an implementation phase-result. receipt-diagnostics.ts:33 explicitly maps start to implementation, but this new gate rejects it before that validator. The new test uses phase implementation for completion and misses this supported path. Thus SPEC-1 remains partial: valid retained v2 start reconciliation fails.

Required change: Use the established completion-to-result phase mapping in the retained-v2 gate. Keep fresh v2 starts rejected. Add a retained v2 start -> implementation result -> start completion regression and preserve prior event bytes.

Validation: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts; parent smoke: invoke write-result.ts --parent-event with phase-context/v1, receipt_schema worktree-receipt/v2, phase start, event phase-complete, and a valid retained implementation phase-result parent; inspect recovery and verify unchanged historical bytes.`

### SPEC-4 — P2

NO ADR: initiative contract ownership rules apply.

[mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/contracts.json:65]

The consumer maps shared-context-resolution/v1 to references/layout.md. That document defines retained location semantics, but not the versioned resolution identity or complete JSON contract. The current shared-context owner declares this identifier at references/contracts.md: Resolution, which explicitly extends layout.md and requires schemaVersion plus kind, adapter, store, root, path, ref and publication. The frozen dependency emits unversioned results. Public manifest resolve only proves that layout.md exists; it does not establish conformance to the declared external contract. This is an external-owner integration gap, not an unrelated master-only edit.

Required change: Coordinate the shared-context owner dependency and reference its authoritative references/contracts.md definition. Keep supported unversioned historical resolution handling explicit. Validate the combined installation instead of assigning the current identifier to the retained layout-only definition.

Validation: `Parent: compare the referenced shared-context definition with actual shared-context resolve workflow --id <ID> --json output, including supported historical/current identities; run manifest validate/resolve afterward.`

## Historical findings

SPEC-1 fresh-v2-start rejection is fixed. Assigned retained v2 output still works. The additional supported start-completion mapping fails; SPEC-3 records that regression.

SPEC-2 is resolved. Both swapped-family directions reject for current and historical inputs through write-view and public bulk. All rejected bytes remain equal. Correct-family updates upgrade and preserve comments and unknown fields.

The original FAILURE remains historical. This verdict applies only to the frozen commit above.

## Integration compatibility

Observed master: 6135b9dd5d24f828689922b0aeabc34f6735a0bb. Its movement after the review base contains workflow metadata only. Those paths are not source edits. Base advancement does not invalidate this frozen source.

The separate shared-context owner declares shared-context-resolution/v1 at references/contracts.md, while retaining layout.md for location semantics. Its read-only current command emits that identifier. The frozen consumer points to layout.md and ships the unversioned dependency. SPEC-4 therefore concerns actual owner-definition compatibility, not unrelated base metadata. Do not integrate an unreviewed external branch implicitly.

Tracker and delivery references resolve to their owners. Current and retained delivery scenarios pass. The pinned yaml@2.8.1 dependency works in the full suite. No exclusive integration resource was claimed. Other streams remained unchanged.

## Verification

- **Command:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts`
  Cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-08-worktree`. Exit: 0. 176 pass; 0 fail; 1025 assertions across 11 files.

- **Command:** `mise exec -- bun /tmp/review2-smoke.ts /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-08-worktree`
  Cwd: `/tmp`. Exit: 0. Independent owning CLI scenarios passed: current v3 start/result/delivery/inspection/recovery, retained v2 assigned result and implementation-named reconciliation, rejected fresh/unassigned/mismatched v2 with unchanged history, correct-family upgrades, both swapped-family directions/current+historical through owning update/public bulk with byte preservation. Also confirmed SPEC-3 rejection of valid start-named completion and STANDARDS-1 acceptance of missing initiative. Temporary script and fixtures removed after proof.

- **Command:** `/home/zenobius/.omp/agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts validate --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-08-worktree/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree`
  Cwd: `/tmp`. Exit: 0. Manifest structure, declarations, references and procedures resolve; this does not validate semantic completeness of an external prose definition.

- **Command:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-08-worktree/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts tracker/tickets/skill-contract-manifests-08-worktree.md --json`
  Cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. Exit: 0. Current inspection identity; retained live history valid, no diagnostics, frozen clean source, retry observation for this already active review.

- **Command:** `/home/zenobius/.omp/agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts resolve --skill /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-08-worktree/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree --contract shared-context-resolution/v1`
  Cwd: `/tmp`. Exit: 0. Resolves retained layout.md, not the current owner declaration at references/contracts.md.

- **Command:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-07-shared-context/mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts resolve workflow --id skill-contract-manifests-08-worktree --json`
  Cwd: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. Exit: 0. Read-only external-owner observation returns schemaVersion shared-context-resolution/v1 and the documented location fields. This is not approval of the external branch.

The source branch has no tracker/workflow changes in the reviewed diff. Fixture checks compare historical bytes before and after read-only inspection and rejected publication. The live inspector reports valid retained history, no diagnostics and the exact clean frozen source. No independent typecheck ran in this attempt.

Three preliminary temporary-fixture attempts failed on tracker serialization. The final fixture uses owning mq serialization and passes. All temporary repositories, Worktrunk fixtures and smoke scripts were removed after proof.

## Independent sessions and shutdown

- **Standards:** 92cac2bc-3a45-40b6-99f1-4b21edb93c43; review-axis/v1; validated source identity and domain result; SHA-256 44c68429172456aa79d89f24a1fb18e2dd8fc3e9435662e9fbd8b85d1fa0936b; acknowledged; owned terminal removed; process shutdown confirmed at 2026-11-22T05:14:41.125Z.
- **Spec:** e15c5679-cac6-4d37-a51b-e307989ccc3f; review-axis/v1; validated source identity and domain result; SHA-256 039bca57bf7d566015af7de31be92bbcddd694a976a93a83f40f86378089844a; acknowledged; owned terminal removed; process shutdown confirmed at 2026-11-22T05:14:41.125Z.

Both helpers reviewed independently in parallel. Neither ran builds, tests, lint or formatters. The reviewer integrated their reports and ran verification afterward. The three blocking findings remain in their original axes.

## Consumed and produced references

Consumed: `tracker/tickets/skill-contract-manifests-08-worktree.md`, `tracker/initiatives/skill-contract-manifests/index.md`, `workflows/skill-contract-manifests-08-worktree/events/review-start-0011.yaml`, `workflows/skill-contract-manifests-08-worktree/events/fix-0009.yaml`, `workflows/skill-contract-manifests-08-worktree/events/fix-complete-0010.yaml`, `workflows/skill-contract-manifests-08-worktree/artifacts/snapshots/pr-draft-fix-0009.md`, `workflows/skill-contract-manifests-08-worktree/events/review-0006.yaml`, `workflows/skill-contract-manifests-08-worktree/artifacts/reviews/review-review-0006.md`.

Produced: `workflows/skill-contract-manifests-08-worktree/artifacts/reviews/review-review-0012.md` and `workflows/skill-contract-manifests-08-worktree/events/review-0012.yaml`. This is the only review body. Parent owns ticket publication and reviewer closure.

## Next action

Fix the three current findings in a fresh authorized fixer session. Preserve this reviewed source and all historical bytes. Obtain a fresh review after source changes.

