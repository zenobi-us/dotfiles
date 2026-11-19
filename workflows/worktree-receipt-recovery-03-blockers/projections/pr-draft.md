# Report blockers with supported recovery actions

## Ticket

[Canonical ticket](../../../tracker/tickets/worktree-receipt-recovery-03-blockers.md).

## Problem

Operators need stable blocker codes, observed evidence, missing evidence, approval requirements, and supported recovery actions without workflow mutation.

## Implementation

Added inspector blocker reports and a shared human formatter. Recovery actions come only from the existing recovery decision. Invalid path diagnostics now carry `path_inconsistency`. No production phase-selection rule or producer contract changed. Retained v1 and v2 validation semantics remain unchanged. Commit hooks also updated plugin version metadata.

## Source

Branch: `feature/worktree-receipt-recovery-03-blockers`. Commit: `3f6bd3017b6820f64d3b7bf480165e6dbc83c129`. Tree: `8aa9bcb8cdbd76d77688269437295bd451c14b80`.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/inspection-blockers.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection-blockers.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection-blockers.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`

## Validation

Affected tests: 62 passed; zero failures. Separate actual CLI smoke scenarios covered inconsistent paths, unavailable source, and unusable review evidence. Reports also exposed missing parent completion and unknown ownership. Both output forms preserved event inventory, receipt bytes, source status, and Git index bytes. No receipts were created. Fixtures were removed.

Commands, working directories, and results:

```json
[
  {
    "argv": [
      "mise",
      "x",
      "--",
      "bun",
      "test",
      "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.test.ts",
      "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/recovery.test.ts",
      "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-diagnostics.test.ts",
      "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection-blockers.test.ts"
    ],
    "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-03-blockers",
    "exit_code": 0,
    "result": "62 pass, 0 fail; 367 assertions; affected suite executed once."
  },
  {
    "argv": [
      "mise",
      "x",
      "--",
      "bun",
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-03-blockers/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts",
      "tracker/tickets/T-1.md",
      "--json"
    ],
    "cwd": "/tmp/blocker-cli-smoke-N6iaIO",
    "exit_code": 0,
    "scenario": "path_inconsistency",
    "decision": {
      "mode": "blocked",
      "label": "Repair workflow history",
      "reason": "workflows/T-1/events/start.json: [path_inconsistency] Receipt worktree and workspace_path must name the same absolute worktree.",
      "requiredApproval": false,
      "inputs": [
        "tracker/tickets/T-1.md"
      ]
    },
    "read_only": {
      "eventBytes": true,
      "index": true,
      "sourceStatus": true,
      "receiptsCreated": 0
    },
    "result": "JSON and human CLI exercised. Event inventory, receipt bytes, Git index bytes and source status unchanged. No receipts created. Temporary fixture removed."
  },
  {
    "argv": [
      "mise",
      "x",
      "--",
      "bun",
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-03-blockers/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts",
      "tracker/tickets/T-1.md",
      "--json"
    ],
    "cwd": "/tmp/blocker-cli-smoke-N6iaIO",
    "exit_code": 0,
    "scenario": "source_unavailable",
    "decision": {
      "mode": "blocked",
      "label": "Locate source worktree",
      "reason": "ENOENT: no such file or directory, access '/tmp/blocker-cli-smoke-N6iaIO/absent'",
      "requiredApproval": false,
      "parentReceipt": "workflows/T-1/events/start.json",
      "inputs": [
        "tracker/tickets/T-1.md",
        "workflows/T-1/events/start.json"
      ]
    },
    "read_only": {
      "eventBytes": true,
      "index": true,
      "sourceStatus": true,
      "receiptsCreated": 0
    },
    "result": "JSON and human CLI exercised. Event inventory, receipt bytes, Git index bytes and source status unchanged. No receipts created. Temporary fixture removed."
  },
  {
    "argv": [
      "mise",
      "x",
      "--",
      "bun",
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-03-blockers/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.ts",
      "tracker/tickets/T-1.md",
      "--json"
    ],
    "cwd": "/tmp/blocker-cli-smoke-N6iaIO",
    "exit_code": 0,
    "scenario": "unusable_review_evidence",
    "decision": {
      "action": "review",
      "mode": "retry",
      "label": "Recover review evidence",
      "reason": "The child review has no usable source-bound result artifact. Preserve its history and use a fresh reviewer; do not append a successful parent completion.",
      "requiredApproval": true,
      "parentReceipt": "workflows/T-1/events/result.json",
      "inputs": [
        "tracker/tickets/T-1.md",
        "workflows/T-1/events/result.json",
        "workflows/T-1/events/start.json"
      ]
    },
    "read_only": {
      "eventBytes": true,
      "index": true,
      "sourceStatus": true,
      "receiptsCreated": 0
    },
    "result": "JSON and human CLI exercised. Event inventory, receipt bytes, Git index bytes and source status unchanged. No receipts created. Temporary fixture removed."
  }
]
```

LSP reference lookup was unavailable because the workspace has no TypeScript installation. No typecheck result is claimed.

## Integration validation

Squash integration: `b70136f32d947c2f588fe3098ccfc75fab718cdd`; tree: `e6ab0f3feeff157fccff2d2c9914b0a91299f149`; parent: `a679a4a854fe57e27af5b6a0f4962f362f1186f0`. Candidate-bound affected tests, integration helper tests, pre-merge hook check, and actual inspector CLI smoke all exited zero. The smoke preserved event inventory, receipt bytes, index bytes, and source status. See [candidate-bound results](../artifacts/snapshots/integration-result-0012.json) and [exact check commands](../artifacts/snapshots/integration-checks-0010.json).

The first plan was refused before candidate creation because the base advanced by one unrelated workflow record. A refreshed plan preserved the same source review and completed once. Both plans and the refusal remain in append-only history.

## Review history

Latest reviewer verdict: SUCCESS for `3f6bd3017b6820f64d3b7bf480165e6dbc83c129` at 2026-11-19T11:36:08.823Z.

Standards: one low, non-blocking heuristic (STD-01). Spec: no findings. Resolved findings: none. Remaining findings: STD-01; see the [immutable review](../artifacts/reviews/review-review-0005.md).

Parent validation: 3 focused tests passed. Reviewer validation: 62 tests and five actual CLI scenarios passed. Source remains frozen and clean. Reviewer and both axis panes are closed; registered process shutdown is confirmed.

## Merge status

Integrated by squash as `b70136f32d947c2f588fe3098ccfc75fab718cdd` and published to `origin/master`. Ticket completion commit `6e870aff2bfeba7587fa9286737d04b33b09f3c7` is published. Source and candidate branches/workspaces were removed through cleanup-merged. App spaces are absent and phase-owned process shutdown is confirmed. The reviewed source remains retained at `refs/worktree-reviews/3f6bd3017b6820f64d3b7bf480165e6dbc83c129`. Terminal state: FINISHED.

## Receipts and artifacts

- [Start receipt](../events/start-0001.yaml).
- [Implementation receipt](../events/implementation-0002.yaml).
- [Immutable draft](../artifacts/snapshots/pr-draft-implementation-0002.md).


- [Implementation completion](../events/start-complete-0003.yaml).
- [Review start](../events/review-start-0004.yaml).
- [Review result](../events/review-0005.yaml).
- [Review completion](../events/review-complete-0006.yaml).
- [Immutable review](../artifacts/reviews/review-review-0005.md).


- [finish-start-0007](../events/finish-start-0007.yaml).
- [finish-prepared-0008](../events/finish-prepared-0008.yaml).
- [finish-failed-0009](../events/finish-failed-0009.yaml).
- [finish-start-0010](../events/finish-start-0010.yaml).
- [finish-prepared-0011](../events/finish-prepared-0011.yaml).
- [finish-merged-0012](../events/finish-merged-0012.yaml).
- [finish-pushed-0013](../events/finish-pushed-0013.yaml).
- [finish-ticket-completed-0014](../events/finish-ticket-completed-0014.yaml).
- [finish-worktree-removed-0015](../events/finish-worktree-removed-0015.yaml).
- [finish-complete-0016](../events/finish-complete-0016.yaml).
- [integration-plan-0007.json](../artifacts/snapshots/integration-plan-0007.json).
- [integration-checks-0007.json](../artifacts/snapshots/integration-checks-0007.json).
- [integration-assessment-0007.json](../artifacts/snapshots/integration-assessment-0007.json).
- [integration-message-0007.txt](../artifacts/snapshots/integration-message-0007.txt).
- [integration-plan-0010.json](../artifacts/snapshots/integration-plan-0010.json).
- [integration-checks-0010.json](../artifacts/snapshots/integration-checks-0010.json).
- [integration-assessment-0010.json](../artifacts/snapshots/integration-assessment-0010.json).
- [integration-message-0010.txt](../artifacts/snapshots/integration-message-0010.txt).
- [integration-result-0012.json](../artifacts/snapshots/integration-result-0012.json).
- [cleanup-result-0015.json](../artifacts/snapshots/cleanup-result-0015.json).

## Open questions

None. No services or external resources remain. Cleanup is verified.

