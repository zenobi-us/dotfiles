---
title: "Implementation draft: receipt path repair"
type: Concept
---

# Repair verified receipt path errors

## Ticket summary

Implement targeted, approved path repair for `tracker/tickets/worktree-receipt-recovery-04-repair.md`.

## Problem

A proven source path error can block receipt inspection. Rewriting an old event would erase its provenance.

## Implementation

- **Read-only plans:** Capture original SHA-256 values, original paths, corrections, source and parent identities, retained launch evidence, inventory, and blockers.
- **Exact approval:** Recheck all observed preconditions and serialize concurrent repairs before one immutable append.
- **Source proof:** Require retained launch and source evidence for parent-checkout mismatches. Common Git identity alone cannot select source.
- **History:** Consume path corrections through existing supplements. Preserve originals, outcomes, parents, source objects, and verdicts. Retained proof survives detached HEAD and normal source removal.
- **Compatibility:** Keep v1 history and v2 execution envelopes. Existing supplement types remain supported. No recovery worktree or interrupted-phase execution was added.

## Source

Commit: `edf4e5585799abb093d1b8df3211fe72c72da93c`. Tree: `defadfc579887d577800e27302621fbbb756757d`. Branch: `feature/worktree-receipt-recovery-04-repair`. Source is clean.

Commits: `1ce4136927e0db878272b924b4f7e39ede46d6c9` and `edf4e5585799abb093d1b8df3211fe72c72da93c`. Commit hooks updated the two plugin version records.

## Changed files

- **File:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/path-repair.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/repair.test.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/repair.ts`
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`

## Validation

- **Scoped tests:** 147 passed, zero failed, 817 assertions across 11 files.
- **Changed-file types:** Strict TypeScript check passed with isolated Bun and Node types.
- **Actual CLI:** Approved repair and inspector passed in an isolated fixture. Ambiguous launch and changed checksums were rejected without a partial append. Original bytes remained unchanged.

The initial bundle-wide typecheck was not clean. It included versioned Crust imports and unrelated collect-feedback errors. One local store-narrowing error was fixed; the changed-file check then passed. The final bundle-wide check was not rerun.

See [validation results](../artifacts/evidence/repair-cli-smoke-0001/validation-results.json), [actual CLI result](../artifacts/evidence/repair-cli-smoke-0001/smoke-result.json), and [exercised fixture](../artifacts/evidence/repair-cli-smoke-0001/repair-cli-smoke.ts). No historical repair was applied.

## Review history

Internal standards and specification checks found two issues: ignored aggregate history failures and reliance on live historical worktrees. Both were fixed and covered by passing regression cases. These checks are advisory, not the independent review phase.

## Resolved findings

- **Aggregate failures:** Plans now block broken supplements and non-path envelope defects.
- **Retained history:** Inspection now uses approved retained proof after source removal and detached HEAD.

## Remaining findings

No unresolved implementation finding is known. Independent review is pending.

## Latest reviewer verdict

None. No review receipt exists.

## Merge status

Implemented and committed only. Not independently reviewed, merged, pushed, or marked complete in the tracker. Parent phase completion is recorded in [start-complete-0003](../events/start-complete-0003.yaml). The parent independently exercised the CLI smoke and confirmed child shutdown. Workflow metadata is local; remote publication remains pending.

## Receipts

- **Launch:** [start-0001](../events/start-0001.yaml).
- **Implementation:** [implementation-0002](../events/implementation-0002.yaml).

