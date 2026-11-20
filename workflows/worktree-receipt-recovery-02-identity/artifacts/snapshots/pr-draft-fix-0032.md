---
description: Fix attempt 4 for worktree-receipt-recovery-02-identity
source_commit: 2a843de309311b624fd64e8671fb83a414d4e774
source_tree: 7773e1f8683022ad985d59c17b90a728e8a34190
title: SPEC-3 retained workflow-root fix
type: Concept
---

# Fix attempt 4: SPEC-3

## Scope

Consumed [review-0028](../../events/review-0028.yaml). Resolve only SPEC-3. No ADR applies. STD-1 documentation deduplication stays out of scope. Preserve the SPEC-2 branch guard. No new review verdict.

## Source

Commit: `2a843de309311b624fd64e8671fb83a414d4e774`. Tree: `7773e1f8683022ad985d59c17b90a728e8a34190`. Branch: `feature/worktree-receipt-recovery-02-identity`; base: `master`. Source is committed and clean. No rebase, merge, push, tracker mutation, or source-workflow write.

## Change

Extract the inspector’s retained-root compatibility rule into receipt-validation.ts. Both inspection and generated parent validation use it. Require matching real Git common directories for supported recorded repository/source roots. Keep store/ref strict. Preserve retained parent bytes and emit the current resolved workflow root. Existing archive-only handling remains unchanged.

## Changed files

- **Path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/phase-context.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-validation.ts`
- **Path:** `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`

The commit hook updated the existing plugin and marketplace version files.

## Validation

- **Scoped suite:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts` ran once: 131 pass, 0 fail, 767 assertions, 7 files; Bun 1.4.4; 45.82 seconds.
- **Actual CLI smoke:** `mise exec -- bun /tmp/spec3-cli-smoke.ts` passed in 2.43 seconds. Isolated linked Git fixture: actual `inspect.ts tracker/tickets/TASK-1.md --json` exited 0 with historyValid=true for retained-v1 source-root history. Actual `write-result.ts --repository /tmp/delivery-workflow-wCyksw/repository --phase-context /tmp/delivery-workflow-wCyksw/retained-root.json.phase.json --input /tmp/delivery-workflow-wCyksw/retained-root.json` exited 0 and wrote v2 with the current context root. Four invalid parents (foreign Git root with matching origin, unsupported root, foreign store, foreign ref) each exited 1 with `Phase parent does not match the resolved workflow`, before event/assigned transport writes. All retained parent bytes stayed unchanged. Transport result equalled the published event. Fixture and harness were removed.
- **Known limits:** TypeScript LSP could not initialize: no valid TypeScript installation. Narrow observed source fallback used. Known missing-tsc and unrelated whole-bundle failures were not rerun. Review-0028 supplies failing-before evidence; it was not rerun merely to confirm.

## Disposition

Resolved: SPEC-3. Unresolved authorized findings: none. A fresh formal review is required for this new source. Preserve all prior failed reviews and fix history. Parent owns acknowledgement, session closure, fix-complete-0033, workflow commits, and next-action inspection.

