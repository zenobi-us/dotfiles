---
title: STD-01 annotation read fix
type: Concept
---

# STD-01 annotation read fix

## Scope and source

Ticket: tracker/tickets/collect-evidence-feedback-09-history.md. Only blocking STD-01 from review-0019 changed.

Branch: feature/collect-evidence-feedback-09-history. Base: master.
Commit: 5e1ba904a178a7076aa556225beb4aff3288c65e.
Tree: f691de272e6f2a040eb594438236000de451f40a.
Source checkout: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-09-history. Source is clean.

## Problem and change

listAnnotations caught filesystem failures and replaced them with an invalid-input AnnotationError. The bounded read now runs outside the JSON parse handler. Only JSON syntax failures become malformed-record errors; stored-record validation stays unchanged. The report boundary remains explicit and unchanged: CliError uses its exit code, invalid JSON or status-400 AnnotationError uses 2, other failures use 1. Path safety and bounded-read checks remain in place.

## Changed files

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/annotations.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts

The two plugin manifests changed only through repository commit hooks.

## Verification

- Run once from /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-09-history: mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/test/report-cli.test.ts mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts. Exit 0; 7 tests, 89 assertions.
- Run the public report command from /tmp as UID 1000: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-09-history/mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/report-cli.ts evidence /tmp/std01-runtime-Z3CFBp/repository/workflows/std01/artifacts/evidence/review --feedback --json. Unreadable annotation: exit/code 1. Restored permission: exit 0. Malformed JSON and unsupported schema: exit/code 2 each. Restored bytes: exit 0.
- Each failing command emitted one versioned error. Repeated reads preserved source and session hashes.
- [Exact commands, exit codes and cleanup](runtime-fix-0022.json). Disposable smoke command: mise exec -- bun /tmp/std01-fix-0022-smoke.ts, cwd /tmp, final exit 0. Initial run failed read-only-directory cleanup; both temporary stores and the script are now removed.
- LSP references could not initialize because TypeScript was unavailable. No signatures changed. The viewer did not change; no browser verification ran.

## Review history and findings

- [review-0005](../../events/review-0005.yaml): FAILURE; SPEC-01 resolved by [fix-0008](../../events/fix-0008.yaml).
- [review-0011](../../events/review-0011.yaml): FAILURE; SPEC-02 resolved by [fix-0016](../../events/fix-0016.yaml).
- [review-0019](../../events/review-0019.yaml): FAILURE; [immutable review](../reviews/review-review-0019.md) identifies STD-01.
- [fix-0022](../../events/fix-0022.yaml): STD-01 resolved. SPEC-01 and SPEC-02 remain resolved. No unresolved findings from the consumed review. Fresh review is required for the new source; no new verdict is claimed.

## Cleanup and publication

Temporary stores and smoke script removed. No browser workers started. Regression-owned server stopped through existing cleanup. Child terminal t1f3 remains open for parent closure. No merge, rebase, push, tracker mutation or publication commit. Existing root artifacts/ remain untouched. Workflow artifacts live only in the context checkout. Parent completion and fresh review remain pending.

