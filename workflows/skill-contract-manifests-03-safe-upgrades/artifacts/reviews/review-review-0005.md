---
description: Independent Standards and Spec review
title: Safe upgrades review
type: Report
---

# Safe upgrades review

## Review identity

Timestamp: 2026-11-20T22:41:12.367Z. Verdict: SUCCESS. No blocking findings.

Canonical ticket: tracker/tickets/skill-contract-manifests-03-safe-upgrades.md. Initiative: tracker/initiatives/skill-contract-manifests/index.md.

Source branch: feature/skill-contract-manifests-03-safe-upgrades. Base branch: master. Frozen source commit: 61325389b18be55808813456371f0ebdb270e285. Frozen source tree: 6e606a819342ae734a569a304861c723d8e3a743. review_base_commit: 7c6b604922e6d1a2c4b90f16a8903caaaa12612d. Source commits: e3e1c5cc36f927adfbab13e8d10dc9416ea92c60 and 61325389b18be55808813456371f0ebdb270e285.

Exact review: git diff 7c6b604922e6d1a2c4b90f16a8903caaaa12612d...61325389b18be55808813456371f0ebdb270e285. Also assessed the direct base-to-source diff.

## Changed scope

changed_scope:
- **Path:** mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/SKILL.md
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/upgrades/contracts.json
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/upgrades/definitions.txt
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/upgrades/owner.ts
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/upgrades/upgrade.txt
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/how-to-validate-contracts.md
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/manifest.md
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/references/upgrades.md
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts
- **Path:** mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.ts

## Affected contracts

affected_contracts:
- **Contract:** skill-contract-manifest/v1
- **Contract:** UpgradeOwner adapter interface
- **Contract:** safe-upgrade and bulk-upgrade public CLI
- **Contract:** atomic mutable-artifact persistence and immutable-history policy
- **Contract:** example-note/v1
- **Contract:** example-note/v2
- **Contract:** agent-core plugin/catalogue metadata

## Integration checks

```json
[
  {
    "argv": [
      "mise",
      "exec",
      "--",
      "bun",
      "test",
      "mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts"
    ]
  }
]
```

## Validations

- **Command:** mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts
  Exit code: 0. 72 pass, 0 fail, 291 assertions across 2 files. Independently run after both axis reports.

- **Command:** mise exec -- bun /tmp/review-0005-smoke.ts
  Exit code: 0. Actual executable router: validate/resolve preserve bytes; safe-upgrade performs structural conversion and requested rename; Unicode text and nested unknown values preserved; bulk persists mutable input and rejects immutable/unsupported inputs unchanged with partial/nonzero result. Temporary records removed.

- **Command:** git status --porcelain=v1
  Exit code: 0. Empty before and after review. HEAD 61325389b18be55808813456371f0ebdb270e285; tree 6e606a819342ae734a569a304861c723d8e3a743.

All commands used source workspace /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-skill-contract-manifests-03-safe-upgrades. No source files changed. No independent typecheck ran. The implementation receipt reports a scoped strict typecheck; this review does not reuse it as independent verification. No evidence run exists.

## Standards

Reviewed the pinned three-dot diff and direct two-dot scope. Base-only workflow records are not source regressions. Found two non-blocking documented layout violations. No blocking standards finding or separate smell finding. Source inspection only; no build, lint, tests, or formatting ran.

### STD-01: P3, non-blocking

ADR: NO ADR. File: mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.ts:165.

Documented-standard violation: iso-24495-code rule 2 requires helpers at module scope. The new upgradePaths function contains the nested visit helper, so readers must enter its container to inspect the traversal.

Required change: Move visit to module scope and pass its traversal state explicitly. Keep path selection behavior unchanged.

Validation command: mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts

Blocking assessment: Non-blocking maintainability issue. The inspected code does not establish a behavior defect.

### STD-02: P3, non-blocking

ADR: NO ADR. File: mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/examples/upgrades/owner.ts:28.

Documented-standard violation: iso-24495-code rule 1 requires the public entry point before its helpers. The new default owner export follows parse, preserveNumber, and decimalValue, so readers encounter implementation detail before the adapter contract.

Required change: Place the default owner export before its helper functions. Keep prerequisite constants above the export.

Validation command: mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/skill-contracts/scripts/upgrades.test.ts

Blocking assessment: Non-blocking reading-order issue. No runtime defect is claimed.

## Spec

No blocking spec findings. Reviewed commit 61325389b18be55808813456371f0ebdb270e285 against 7c6b604922e6d1a2c4b90f16a8903caaaa12612d using the canonical safe-upgrades ticket and initiative. The implementation checks supported source identity and content, follows one declared operation-appropriate path, validates each destination, compares owner-defined preservation values, rejects uncertain legacy identity and immutable content, and commits only validated output. Bulk results distinguish persisted changes from failures, including post-commit cleanup failures; CLI failures set a nonzero exit status. Public-command scenarios cover the requested boundaries and structural conversion rather than label changes. Direct two-dot comparison shows the same source changes; base-only workflow records are not source regressions. Validation was static review only. No build, lint, tests, or formatter ran, as instructed. No applicable ADR.

The parent review independently checked source validation, operation destinations, unique declared paths, per-step destination validation, preservation snapshots, explicit legacy identity and immutable refusal. The CLI smoke confirmed actual persisted partial bulk results and public failure status. The example preserves unknown JSON values and exact authored text. Owner hooks remain trusted and pure by contract; the shared layer does not infer domain meaning. No additional owner adoption is required for this ticket.

## Compatibility and coordination

The direct diff contains the same 13 source paths and nine base-only workflow files. Those metadata files are not source deletions or regressions. The generated agent-core plugin and catalogue entries both advance from 0.1.31 to 0.1.33. Shared catalogue paths overlap other active streams. Integration must regenerate the combined catalogue and check plugin/catalogue consistency in a separate candidate, then run the listed integration check. Do not overwrite another stream's catalogue or preserve an arbitrary conflicting copy.

The parent supplied current ownership and empty proposed reservations. Inventory remains incomplete because unrelated histories have errors and unknown scopes. This read-only review uses no exclusive resource and does not block on initiative membership. Preserve unrelated Zsh changes and repair artifacts. The only indexed ADR concerns Pi Ink cleanup; NO ADR applies here.

## Child resource observations

Both typed results verified and acknowledged. hc kill and hc rm removed only owned terminals. herdr-app ls confirms child tabs removed and reviewer pane retained. Resource observer still reports child PIDs live; ps reports orphaned stopped state Tl with PPID 2683. Shutdown is not confirmed. No direct signals sent outside normal terminal closure. Parent must authorize exact-PID cleanup after fresh identity checks.

```json
[
  {
    "run_id": "e61ff479-df3e-49ce-bde9-cdb43024b922",
    "target": "t1v0",
    "pane_removed": true,
    "shutdown": "pending",
    "pid": 1163242,
    "start_ticks": "9269139"
  },
  {
    "run_id": "db06b112-d696-4a9d-8276-e5a38872619b",
    "target": "t1tz",
    "pane_removed": true,
    "shutdown": "pending",
    "pid": 1163162,
    "start_ticks": "9269135"
  }
]
```

## Verdict

SUCCESS for the frozen source commit and tree. Standards: two non-blocking P3 layout findings; no blocking findings. Spec: zero findings. Cleanup remains pending and does not establish process shutdown. Parent owns tracker comments, projections, completion, metadata commits and integration.

