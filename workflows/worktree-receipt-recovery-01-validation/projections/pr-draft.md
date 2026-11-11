# Implementation draft

## Ticket

[Reject inconsistent receipts before publication](../../../tracker/tickets/worktree-receipt-recovery-01-validation.md). Ticket remains claimed and incomplete.

## Problem

The writer used a private validator that accepted different `worktree` and `workspace_path` values. Git source-identity commands also accepted nested directories. The writer could publish a receipt that inspection would reject.

## Implementation

Share receipt envelope validation between publication and inspection. Require identical absolute source paths and verify available paths against the real Git worktree root before publication or result delivery. Preserve immutable prior events. Keep historical removed-worktree inspection and sibling-ticket behavior unchanged.

Source commit: `b2764c46af75893c000cae3d2ea62b26062b7848`.

Source tree: `9322e9541dfcdfb3a158665d368ce74d9cd80202`.

## Changed files

- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspect.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/receipt-validation.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/write-result.ts`

## Checks

All commands ran from `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-01-validation`.

- **failed (expected before fix):** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts --test-name-pattern 'writer and inspector reject'` — Mismatch and nested-directory cases published with exit 0. The relative-path case rejected with the old diagnostic.
- **passed:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts` — 14 tests passed; actual writer/inspector paths and missing transport results covered.
- **passed:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts` — Final run: 53 tests, 278 assertions, zero failures across four files.
- **passed:** `mise exec -- bun /tmp/worktree-validation-smoke.ts` — Disposable smoke exercised actual source-checkout CLIs. Mismatch, relative and nested paths rejected; prior event bytes preserved; valid event and result identical; actual inspector accepted. Script removed after execution.
- **failed:** `mise exec -- bunx tsc --noEmit -p mise/conf.d/devtools-agent/bundles/developer/tsconfig.json` — Project dependency environment lacks Bun type definitions.
- **failed:** `mise exec -- bun /tmp/receipt-validation-typecheck/node_modules/typescript/bin/tsc --noEmit -p mise/conf.d/devtools-agent/bundles/developer/tsconfig.json --typeRoots /tmp/receipt-validation-typecheck/node_modules/@types` — Isolated Bun definitions resolved the first failure. Project check reports versioned Crust/helpPlugin export and resulting implicit-parameter errors, including existing writer/router imports. No clean project-wide typecheck is claimed.
- **passed:** `mise exec -- bun /tmp/receipt-validation-typecheck/node_modules/typescript/bin/tsc --noEmit -p /tmp/receipt-validation-typecheck/tsconfig.json` — Focused strict check of the new shared validator and its transitive imports. Temporary configuration and dependencies removed after checking.
- **passed:** `/home/zenobius/.omp/agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts check --repository /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-worktree-receipt-recovery-01-validation --ticket worktree-receipt-recovery-01-validation` — Canonical ticket schema, normal tracker discovery and dependency graph passed; ticket remains claimed.
- **passed:** `mise exec -- git commit` — Pre-commit bundle-version check passed. No hooks changed or stashes applied.

## Local review

Standards: checked the complete source diff and new module. No remaining local findings. Removed one error-wording assertion; retained the behavioral history-repair test.

Spec: covered mismatched paths, absolute paths, root verification, shared validation, valid publication, actual inspection and unchanged prior events. No sibling identity, repair or recovery-UX feature was added.

## Review history
Attempt 1: [review-0005](../events/review-0005.yaml), [immutable artifact](../artifacts/reviews/review-review-0005.md). Verdict SUCCESS for commit b2764c46af75893c000cae3d2ea62b26062b7848 at 2026-11-11T06:46:37.468Z. No findings or resolved findings. [Parent completion](../events/review-complete-0006.yaml). Merge and push have not run.
Independent review has not run. No review verdict exists. No findings are marked resolved by an independent reviewer. No merge or push occurred. The parent validated the result and recorded completion. Independent review is the next phase.

## Records and source identity

[Parent phase-start](../events/start-0001.yaml). [Implementation result](../events/implementation-0002.yaml).

The source commit contains only the six implementation files. The parent preserved workflow records byte-identically in the base store and removed redundant untracked copies from the source checkout. The source checkout is clean.

## Open questions

None for the implemented path contract. Project-wide static checking remains limited by the recorded dependency/type errors. No evidence run exists.

[Immutable draft snapshot](../artifacts/snapshots/pr-draft-implementation-0002.md).


## Parent completion
[Validated phase completion](../events/start-0003.yaml). Child terminal t44 closed. Source worktree retained. Independent review passed; finish is the next phase. No push or merge occurred.

## Review validation
Parent integration check: 14 tests and 86 assertions passed. Post-review targeted check: 4 tests and 34 assertions passed. Source stayed clean and unchanged. Review terminals closed.
