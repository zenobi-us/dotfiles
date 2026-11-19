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

## Review history

No review has run. Latest reviewer verdict: none. Resolved findings: none. Remaining findings: none recorded.

## Merge status

Not merged or pushed. Implementation only. Ticket remains claimed.

## Receipts and artifacts

- [Start receipt](../events/start-0001.yaml).
- [Implementation receipt](../events/implementation-0002.yaml).
- [Immutable draft](../artifacts/snapshots/pr-draft-implementation-0002.md).

## Open questions

None. No services or external resources were created. Parent session owns child-pane closure and workflow publication.

