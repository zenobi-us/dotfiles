---
title: Historical evidence PR draft
type: Concept
---

# SPEC-03 manifest read fix

## Ticket and source

Ticket: tracker/tickets/collect-evidence-feedback-09-history.md.
Branch: feature/collect-evidence-feedback-09-history. Base: master.
Commit: 6a99dc3b3b7e61d293dc47492cbc6590677ce994. Tree: 417db5cbd797ef7c1c65c19c4e1b1f8335b295ee. Source is committed and clean.

## Problem and implementation

The shared run and session validators converted filesystem failures into invalid input. They now translate only JSON syntax and record-shape errors to code 2. Filesystem failures retain their original identity through the safe file and JSON readers. Existing CLI boundaries classify them as code 1. Explicit schema, path, hash and sealing validation still uses CliError(2).

The bounded feedback reader already preserves filesystem failures. Its enclosing session validator no longer masks them. Common report, collector validation and feedback export use the same corrected validators. No exported signatures or report-only workaround changed.

## Changed files

- **Changed path:** `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- **Changed path:** `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- **Changed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts`
- **Changed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`
- **Changed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/records.ts`
- **Changed path:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts`

The commit hook generated the two plugin manifest version changes. Integration must assess their overlap with other work streams.

## Verification

- **Scoped suite:** mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/devtools/writing-reports/scripts/test/report-cli.test.ts mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/history-workflow.test.ts. Cwd: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-09-history. Exit 0; 7 tests passed, 0 failed, 157 assertions. A prior parallel tool call returned no suite result or job; this records only the observed run.
- **Real CLI smoke:** mise exec -- bun /tmp/spec03-fix-0028-smoke.ts. Cwd: /tmp. Exit 0; UID 1000; 36 public command invocations. [Exact argv, conditions, exit codes and hashes](../artifacts/snapshots/runtime-fix-0028.json).
- **Permission failures:** session.json, source/run.json, source/plan.json, source/cases/original/case.json, feedback case.json, annotation JSON and source/native directory each return code/exit 1. Collector validate, feedback validate/export and plain evidence report also preserve operation failures.
- **Invalid records:** malformed JSON and unsupported schemas return code/exit 2 for session, run, plan, feedback case and annotation records. Permanent regressions also cover null record shapes. Existing parser cases retain code 2.
- **Preservation:** restored every original mode, including sealed run.json 0444. Restored reads return 0. Full source and saved-session before/after hashes match. No viewer changes or browser run.
- **Tool limit:** TypeScript LSP initialization failed because the workspace has no valid TypeScript installation. Reference fallback audited shared validator callers. Their existing error boundaries need no changes.

## Review history and findings

- **Initial implementation:** [implementation-0002](../events/implementation-0002.yaml), [original draft and visual evidence](../artifacts/snapshots/pr-draft-implementation-0002.md).
- **First review:** [review-0005](../events/review-0005.yaml), [review artifact](../artifacts/reviews/review-review-0005.md): FAILURE. SPEC-01 resolved by [fix-0008](../events/fix-0008.yaml).
- **Second review:** [review-0011](../events/review-0011.yaml), [review artifact](../artifacts/reviews/review-review-0011.md): FAILURE. SPEC-02 resolved by [fix-0016](../events/fix-0016.yaml).
- **Third review:** [review-0019](../events/review-0019.yaml), [review artifact](../artifacts/reviews/review-review-0019.md): FAILURE. STD-01 resolved by [fix-0022](../events/fix-0022.yaml). [Prior immutable draft](../artifacts/snapshots/pr-draft-fix-0022.md).
- **Consumed review:** [review-0025](../events/review-0025.yaml), [immutable review](../artifacts/reviews/review-review-0025.md): FAILURE for prior source 5e1ba904a178a7076aa556225beb4aff3288c65e. SPEC-01, SPEC-02 and STD-01 remain resolved.
- **Current fix:** [fix-start-0027](../events/fix-start-0027.yaml), [fix-0028](../events/fix-0028.yaml). SPEC-03 resolved. No unresolved finding remains in this fix scope. Fresh independent review is required; no current-source verdict is claimed.

## Cleanup and publication

Temporary smoke stores and script removed. Smoke and regression servers stopped. No browser worker started. Child terminal remains open for parent closure. No merge, rebase, push, tracker mutation or publication commit. Context-root artifacts/ remains untouched. Parent must validate and commit workflow publication, close this child terminal, and complete the fix phase. Open questions: none.

## Status and cleanup

SPEC-03 is resolved by fix-0028. No unresolved findings remain from review-0025. Latest reviewer verdict: FAILURE for the prior source only. Fresh independent review and parent phase completion remain pending. No merge, rebase, push, tracker mutation or publication commit occurred. Temporary stores and scripts are removed. No browser workers ran. The child terminal remains open for parent closure.


## Parent completion fix-complete-0029

Parent verified clean source 6a99dc3b3b7e61d293dc47492cbc6590677ce994 and authoritative fix-0028 transport match. Seven tests passed with 157 assertions; public historical report succeeded. Fixer t1f7 removed; operator-approved broker and worker shutdown confirmed with exact process identities. [Completion](../events/fix-complete-0029.yaml); [resource observation](../artifacts/snapshots/resources-fix-0028.json). Source preserved for fresh independent review. No merge or push.
