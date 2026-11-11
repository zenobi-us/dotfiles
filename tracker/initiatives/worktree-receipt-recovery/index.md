---
schema: tracker-initiative/v1
id: worktree-receipt-recovery
title: Record reliable worktree receipts and recover blocked workflows
---

## Problem Statement

Agents copy source and session identity into receipt fields. The writer can accept path values that the inspector rejects later. Invalid history blocks phase recovery.

## Solution

Record verified source identity through the receipt tools. Use one validation contract at publication and inspection. Report supported recovery actions. Repair proven metadata errors through append-only evidence.

## Success criteria

- Reject inconsistent receipts before publication or successful delivery.
- Generate receipt identity from validated phase context and observed source state.
- Explain blockers with stable codes, evidence, and supported recovery actions.
- Repair proven path errors without rewriting original receipts.
- Recover retained source through Worktrunk when evidence permits recovery.
- Reconcile interrupted phases without repeated work or invented results.

## Implementation Decisions

Keep worktree-receipt/v1 for this initiative. Generate worktree and workspace_path from one verified source-worktree root. Keep the execution directory separate from source identity.

Use one validator for the writer and inspector. Compare observed source identity with phase expectations. Do not silently accept another checkout or a changed review source.

Extend the existing supplement mechanism for targeted path repairs. Require an approved repair plan and unchanged preconditions. Keep original receipts and parent links immutable.

Use the existing recovery decision and phase procedures. A location returned by shared-context does not prove valid workflow history. A common Git repository alone does not identify the source checkout.

## Testing Decisions

Exercise the actual writer, inspector, repair procedure, and phase recovery commands. Verify accepted publication and rejection before side effects. Cover stale repair plans, ambiguous source identity, changed review source, unknown ownership, and interrupted finish.

For moved and removed worktrees, exercise recovery through Worktrunk. Verify the source branch, commit, and tree. Report missing uncommitted work instead of claiming recovery from a commit.

## Out of Scope

- Remove duplicate fields or introduce a new receipt schema.
- Rewrite historical receipts or change recorded outcomes.
- Infer a review verdict or fabricate execution evidence.
- Recover uncommitted source when no retained copy exists.
- Initialize or migrate shared-context storage.
- Implement the tickets as part of publication.

## Approval

The user approved the initiative, six child tickets, and direct blockers in this conversation on 2026-11-11.

## Tickets

- [Reject inconsistent receipts before publication](../../tickets/worktree-receipt-recovery-01-validation.md)
- [Generate receipt identity from verified phase context](../../tickets/worktree-receipt-recovery-02-identity.md)
- [Report blockers with supported recovery actions](../../tickets/worktree-receipt-recovery-03-blockers.md)
- [Repair verified receipt path errors without changing history](../../tickets/worktree-receipt-recovery-04-repair.md)
- [Recover a moved or removed source worktree](../../tickets/worktree-receipt-recovery-05-worktree.md)
- [Guide interrupted workflows through existing recovery actions](../../tickets/worktree-receipt-recovery-06-interruptions.md)

## Comments

