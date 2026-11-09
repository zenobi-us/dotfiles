---
schema: worktree-draft/v1
title: Web fix fix-0026
type: PRDraft
---

# Preserve Surf and Playwright in collect-evidence

FIXED. Waiting for fresh independent review. Selected findings are fixed; the scoped validation suite is not green. Parent validation and publication remain pending.

## Source

Ticket: tracker/tickets/collect-evidence-feedback-01-web.md. Branch: feature/collect-evidence-feedback-01-web against master.

Commit: 8c4015418f6b3fee244708d9937e45bb358fc45d. Tree: 28784b1a67c200888c53a947b3b056f2569cccbc. Owned source commits: b711ef1b (empty slug), 8c401541 (Surf maps).

## Problem and implementation

Separated Surf workflows (.json) from private maps (.json.map), so a and a.map cannot overwrite each other. Accepted shot: "" as no screenshot while preserving rejection of invalid non-empty slugs. Added public compile and real-driver regression coverage without changing public IDs or their grammar.

The original cutover established collect-evidence as the canonical skill, retained Surf and Playwright, and migrated active callers. Its typed plans, preconditions, attended behavior, approval safety, native logs, resource ownership, immutable records, reports and generated comments remain available. This fix leaves the five earlier blocking fixes intact: STD-001, SPEC-001, SPEC-002, SPEC-003 and SPEC-R3-001. No compatibility alias or alternate plan grammar was added.

## Changed source files

- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/drivers/surf-cli.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts`

## Actual verification

The new public empty-slug regression failed before the change (expected compile 0, received 2). After correcting its required plan metadata, the targeted public regression passed 3/3, including rejection of ../invalid and bad slug. The rendered public plan retained the empty value.

Both real-driver focused smokes passed a and a.map together through CLI init, compile, render, run and validate from /tmp with temporary resolved stores. Empty navigation slugs produced no image. Explicit capture steps produced native screenshots. All public IDs and step IDs remained unchanged. All four actual PNGs were inspected and showed Identity a or Identity a.map. Session lists matched before/after; only owned resources were released. Both finalized sealed runs validated.

The single final scoped suite ran both drivers: 15 passed, 2 failed, 73 expectations, exit 1. Its compile regression fixture lacked required schema/kind and approval metadata; corrected targeted coverage passed. Surf blocked.1 timed out during pre-workflow about:blank navigation, before credential fill. Its native diagnostic is retained. The timeout cause is unknown. The full suite was not repeated. The Playwright public workflow passed in that suite; this does not resolve earlier Playwright failures.

Scoped TypeScript passed using existing base dependencies. TypeScript LSP initialization failed. Source hooks passed for both commits with --stash none.

[Evidence and native outputs](../evidence/fix-0026/index.md). [Exact check records](../evidence/fix-0026/validation.json). [Failed Surf suite case](../evidence/fix-0026/failed-suite-surf/cases/blocked/case.json).

## Findings and review status

Selected and resolved: SPEC-R4-001 and SPEC-R4-002. Prior resolved: STD-001, SPEC-001, SPEC-002, SPEC-003 and SPEC-R3-001. Unresolved: STD-R3-001 (P3 advisory, unselected). CleanupRow and cleanupRow hooks are unchanged.

No reviewer verdict covers this commit. Current/latest reviewer verdict is null. review-0023 FAILURE is historical and applies only to 12b6345ac32f4ae30b078e5344fb5bae7a1ee244, tree 77e90021870efcf8c8d8cb1f8dc36ac0cc0107f6. Earlier FAILURE reviews remain historical.

[Consumed immutable review](../reviews/review-review-0023.md). [Earlier fix draft](../snapshots/pr-draft-fix-0020.md). [Original implementation draft](../snapshots/pr-draft-implementation-0005.md).

## Limits and merge status

The single both-driver scoped suite returned 1: 15 passed and 2 failed. The new compile fixture metadata was corrected and its targeted regression passed 3/3; the full suite was not repeated. Surf blocked.1 timed out during pre-workflow about:blank navigation. Its actual native log and sealed failed case are retained. The underlying timeout cause remains unknown.

The earlier fix-0020 Playwright pass-case suite failure and the separate review-0023 approved-space assertion failure (expected Submitted once, got Ready) remain unexplained. Neither was repeated to confirm or erase it. Historical review-0023 failed native output is retained and labelled historical.

The initial throwaway smoke fixture omitted required says and capture locator/as. Its failed native output and commands are retained. Corrected fixture smoke passed both real drivers without another production change.

No current reviewer verdict covers the new source. STD-R3-001 and cleanupRow hooks remain unchanged. No new video proof, tool installation, remote Git operation, stash operation, base-store commit, formal review, merge, push or ticket completion. Existing records reported no changelog; the existing Surf driver reference was updated.

Source fixes are committed locally. No base-store file was staged or committed. No merge or push occurred. The canonical ticket remains implemented. The parent owns base publication, tracker changes, result acknowledgement, pane closure and phase completion. Fresh pane w73:p7 and workspace w73 remain open.

