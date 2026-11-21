---
description: Frozen source review with separate Standards and Spec axes
title: "Independent review: receipt path repair"
type: Concept
---

# Independent review: receipt path repair

Verdict: **FAILURE**. Standards: zero blocking findings. Spec: two P1 blocking findings.

## Frozen target

- **Ticket:** `tracker/tickets/worktree-receipt-recovery-04-repair.md`.
- **Source branch:** `feature/worktree-receipt-recovery-04-repair`. Base branch: `master`.
- **Source commit:** `edf4e5585799abb093d1b8df3211fe72c72da93c`.
- **Source tree:** `defadfc579887d577800e27302621fbbb756757d`.
- **Review base:** `caf5124fe0b9743d35cf970b73ae1e8d99be9c88`.
- **Merge base:** `d0ab2088b54d84e413ce3262a563fbc1e310902b`.
- **Timestamp:** `2026-11-21T01:42:53.534849Z`. Review attempt: 2. Receipt: `review-0007`.

The source was clean before and after the review exercises. The source commit and tree stayed unchanged.
Source changes were read with `git diff caf5124fe0b9743d35cf970b73ae1e8d99be9c88...edf4e5585799abb093d1b8df3211fe72c72da93c`.
The review did not use a live branch name.

## Scope

- **Path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/path-repair.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/repair.test.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/repair.ts`.
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`.

## Standards

No blocking standards defect found.

The implementation uses the existing append-only supplement mechanism. repair.ts:123-174 validates the approval holder, rechecks the plan, and publishes one immutable event. workflow.ts:367-386 checks the target checksum, exact plan fingerprint, allowed correction fields, and retained launch inputs before constructing effective fields. path-repair.ts:54-66 binds launch evidence to the historical receipt and changes only worktree and workspace_path. These paths follow receipts.md sections ‘Append-only envelope repair’ and ‘Targeted source path plans’.

The new modules separate repair planning/publication from source-identity proof. No baseline code smell warrants blocking this change.

## Spec

### SPEC-1: P1

File: `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/path-repair.ts:60`. ADR: NO ADR.

Requirement: ‘If one path identifies the parent checkout, require retained launch records and source evidence to identify the actual source.’ The consumer accepts only worktree-launch-evidence/v1 with target receipt identity. No production launcher emits this format. spawn.ts:60-62 and signals.ts:87-96 retain run.json with runId/cwd/target, while phase-start records use worktree-receipt/v1 or v2. Copying genuine retained records into artifacts still fails this schema check. Only repair.test.ts:53 creates the accepted format. Existing launch evidence cannot support parent-checkout repair without manufacturing a new record.

Required change: Consume and validate actual retained launch and source records. Preserve their original bytes and provenance. Add a compatibility case using production-produced launch records.

Validation command: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/repair.test.ts`.

### SPEC-2: P1

File: `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/repair.ts:170`. ADR: NO ADR.

Requirement: ‘Before apply, recheck checksums, source evidence, and other plan preconditions. Reject stale plans without a partial repair.’ After the final inventory comparison at 168-169, observeSource awaits multiple Git commands before publication at 173. A normal receipt writer can append an event in that interval; only repair.ts observes .path-repair.lock. Apply then publishes against the old parent tip and approved inventory instead of rejecting the stale plan. The resulting history can fork.

Required change: Use a common publication lock for repair and normal event writers. Keep final inventory, parent-tip, and evidence checks inside that boundary through the immutable append.

Validation command: `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/repair.test.ts`.

The coordinator confirmed both findings after the independent sessions completed.
The production-record probe used unchanged bytes from a retained muxer `run.json`.
Planning rejected the record with `Launch evidence requires the retained source path.`
Static inspection also found no production emitter for the required `worktree-launch-evidence/v1` format.

The concurrency probe appended a valid checkpoint during the final `observeSource` call at `repair.ts:170`.
`applyRepair` returned `workflows/T-1/events/repair-2.yaml` instead of rejecting the changed inventory.
Both the checkpoint and repair named `start-1` as their parent. Inspection still reported `historyValid: true`.
The probe used an injected `Exec` boundary and real Git commands in a disposable fixture. It changed no repository source.

## Base-only movement and compatibility

The base advanced separately from the seven source paths. Its worktree changes extract `repositoryIdentity` and `linkedWorkflowRoot` into `receipt-validation.ts`.
They also add generated phase context and retained-v1 publication gates in `write-result.ts`.
These changes do not remove the new supplement consumer, but candidate integration must combine both `workflow.ts` edits.
The repair CLI still supplies a full approval envelope through its own apply interface; the changed writer interface is a separate producer contract.

The source's developer plugin versions agree at `0.2.60`. The frozen base has already advanced them to `0.2.63`.
Integration must preserve that later version history and keep the marketplace and plugin versions aligned.
These base changes are integration considerations, not source findings. No merge or integration candidate was created.
Source-only checks do not prove a combined candidate. Parent-owned integration must run the declared checks against that candidate.

## Affected contracts

- **Contract:** worktree-path-repair-plan/v1 exact-plan approval and precondition binding.
- **Contract:** checksum-bound append-only history_supplements and retained source identity.
- **Contract:** worktree-receipt/v1 and v2 validation/inspection compatibility.
- **Contract:** shared-context workflow root and artifact path safety.
- **Contract:** plugin manifest version alignment.

## Validation

| Exercise | Observed result |
| --- | --- |
| Retained actual repair/inspect CLI smoke | Exit 0. Damaged history changed from invalid to valid. Ambiguous launch and stale checksum were rejected. Original bytes remained unchanged. No partial append. |
| Scoped worktree scripts suite | Exit 0. 147 passed, zero failed, 817 assertions, 11 files. Ran once. |
| Production launch-record compatibility probe | Defect reproduced. Unchanged native launch bytes were rejected for missing the required source path field. |
| Stale inventory race probe | Defect reproduced. Apply published after a normal checkpoint changed the approved inventory and history tip. |

Declared commands:

```sh
mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts
```

```sh
mise exec -- bun /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/worktree-receipt-recovery-04-repair/artifacts/evidence/repair-cli-smoke-0001/repair-cli-smoke.ts
```


The two additional probes ran as `mise exec -- bun /tmp/repair-review-producer.ts` and `mise exec -- bun /tmp/repair-review-race.ts`.
They used temporary fixtures and left retained evidence unchanged. No permanent regression test or source fix was added.
No bundle-wide typecheck or combined-candidate check was run. Historical implementation results are not this review's evidence.

## Records and independent sessions

- **Implementation receipt:** `workflows/worktree-receipt-recovery-04-repair/events/implementation-0002.yaml`.
- **Implementation snapshot:** `workflows/worktree-receipt-recovery-04-repair/artifacts/snapshots/pr-draft-implementation-0002.md`.
- **Approval:** `workflows/worktree-receipt-recovery-04-repair/events/review-takeover-0005.yaml`.
- **Phase start:** `workflows/worktree-receipt-recovery-04-repair/events/review-start-0006.yaml`.
- **Standards session:** `3c98dde8-b954-443e-8110-90fc7a02f4c3`; payload SHA-256 `337dfbe549d59714a08ab4fad926c3a706cdc03e65eb9855109e7c537f327843`.
- **Spec session:** `e9e1d080-bccd-4be4-8d61-2cc77012b4dc`; payload SHA-256 `3a8886d6ae6ad6ff886d86c34b954986e5392a2eb90a0101cbe73bae24adb4c9`.

Both axis sessions were fresh muxer children at depth 2. They ran concurrently and made no source changes or validation runs.
Their transport payloads are inputs to this one review body, not additional workflow review artifacts.
The coordinator read the canonical ticket, implementation receipt, snapshot, context map, context, and ADR index.
ADR: **NO ADR**. The indexed Pi Ink cleanup trust-boundary decision does not govern this change.

Standards: 0 findings, no blocking standards issue. Spec: 2 findings, worst severity P1.

