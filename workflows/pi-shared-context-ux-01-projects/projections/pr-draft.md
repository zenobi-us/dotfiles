---
title: Projects current worktree draft
type: Concept
---

# Projects worktree draft

## Current status

FINISH_FAILED before merge for source fa5c5427d3b541d80b17d3acfc16b518d111e724; review remains SUCCESS. Review-0023 returned SUCCESS. The latest reviewer verdict is SUCCESS from review-0023 for the current source. Parent phase completion and pane closure succeeded in fix-complete-0021. The source is not merged or pushed.

## Ticket summary and problem

[Canonical ticket](../../../tracker/tickets/pi-shared-context-ux-01-projects.md) adds a focusable, clickable Projects breadcrumb and project switching within the shared-context modal. The selected project owns tracker reads, Files reads, and action targets. Pi’s session directory and instructions stay unchanged.

The reviewed Projects list required linear traversal. It had no query, fuzzy filtering, filtered/total count, or active-filter indicator. [Review finding](../artifacts/reviews/review-review-0017.md) records STANDARDS-001.

## Implementation

The modal reuses Pi’s Input and fuzzyMatch utilities. Search checks project names and identities independently and ignores case. Substrings and character subsequences match. The header shows the filtered/total count and the active query.

Filtering retains the selected identity when it survives. Otherwise, selection moves to the first result. Zero results show an explanation, and Enter cannot open a stale target. Backspace edits the query; Ctrl+U clears it. Printable q, 1 and 2 are search text in Projects. Existing workspace number shortcuts remain unchanged outside Projects. Tab focus and mouse breadcrumb behavior remain intact.

Escape closes Projects, even with an active filter or focused breadcrumb. It does not first clear the filter. Rendering keeps terminal sanitization and display-width clipping.

## Source identity

| Field | Value |
| --- | --- |
| Branch | feature/pi-shared-context-ux-01-projects |
| Base | master |
| Source commit | fa5c5427d3b541d80b17d3acfc16b518d111e724 |
| Source tree | 58a4e85a43a983575f385d96c8e18cc8ada8b328 |
| Fixer | omp pi-context-projects-fix-0003 |
| Pane | w7A:pA |
| Session | 01a17bac-cd2a-744c-83bf-e0de34fbef25 |

## Changed files

- **Source:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/modal.ts`.
- **Source:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/projects.test.ts`.
- **Source:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`.

## Validation

| Check | Observed result | Evidence |
| --- | --- | --- |
| Required Projects suite | 17 passed; 0 failed; 98 assertions | [Evidence](../artifacts/evidence/fix-0020/projects-tests.txt) |
| Affected extension suites | 67 passed; 0 failed; 1829 assertions | [Evidence](../artifacts/evidence/fix-0020/focused-suites.txt) |
| Scoped TypeScript | Exit 0; package-relative compiler | [Evidence](../artifacts/evidence/fix-0020/scoped-typecheck-final.txt) |
| Actual Pi v1.1.0 | Typed query; 2/2, 0/2, 1/2 counts; zero-result Enter stayed open; filtered Enter opened beta; Escape closed | [Evidence](../artifacts/evidence/fix-0020/terminal-acceptance.md) |

[Exact commands, results and harness corrections](../artifacts/evidence/fix-0020/validation.json). The first compiler command used an unavailable root path; the corrected package-relative command passed. The first runtime identity query legitimately matched both origins; a unique identity query selected beta.

Actual Pi used disposable local Git/context fixtures and ran offline. No live GitHub or model request ran. Existing hosted-target regression tests use deterministic responses. Terminal captures cover 120x40, 80x24 and 40x12. Count, query and selected rows remain visible; long text truncates at narrow widths. Requested colour and monochrome sessions both produced monochrome SVG captures. No full colour/contrast audit is claimed. Known broad TypeScript failures, tracker clipping and host shortcut conflicts remain out of scope.

## Finding status

| Finding | Status | Basis |
| --- | --- | --- |
| STANDARDS-001 | Resolved by this fix; awaiting review | Modal behavior tests and actual Pi |
| SPEC-001 | Historically resolved; coverage preserved | review-0017 and passing legacy identity recovery regressions |
| SPEC-002 | Historically resolved; coverage preserved | review-0017 and passing current-entry/capability regressions |
| SPEC-003 | Historically resolved; coverage preserved | review-0017 and passing selected-project execution regressions |

No selected finding remains unresolved. Historical resolution claims are not a new review verdict.

## Receipt history

Earlier implementation and resolution claims are historical. Review-0011 superseded earlier SPEC-001 claims and added SPEC-003. Review-0017 confirmed the Spec fixes and found STANDARDS-001.

| Receipt | Event | Recorded result | Source commit |
| --- | --- | --- | --- |
| [start-0001](../events/start-0001.json) | start phase-start | started | `d458207915067db9d1a3699aebe198840cffb905` |
| [implementation-0002](../events/implementation-0002.json) | implementation phase-result | completed | `afb6b874f70afb2035ed76288140daf1ff589691` |
| [implementation-complete-0003](../events/implementation-complete-0003.json) | implementation phase-complete | completed | `afb6b874f70afb2035ed76288140daf1ff589691` |
| [review-start-0004](../events/review-start-0004.json) | review phase-start | started | `afb6b874f70afb2035ed76288140daf1ff589691` |
| [review-0005](../events/review-0005.json) | review phase-result | FAILURE | `afb6b874f70afb2035ed76288140daf1ff589691` |
| [review-complete-0006](../events/review-complete-0006.json) | review phase-complete | FAILURE | `afb6b874f70afb2035ed76288140daf1ff589691` |
| [fix-start-0007](../events/fix-start-0007.json) | fix phase-start | started | `afb6b874f70afb2035ed76288140daf1ff589691` |
| [fix-0008](../events/fix-0008.json) | fix phase-result | completed | `f4dffcaebf159cb857eb6008fad80dfb03e214fc` |
| [fix-complete-0009](../events/fix-complete-0009.json) | fix phase-complete | completed | `f4dffcaebf159cb857eb6008fad80dfb03e214fc` |
| [review-start-0010](../events/review-start-0010.json) | review phase-start | started | `f4dffcaebf159cb857eb6008fad80dfb03e214fc` |
| [review-0011](../events/review-0011.json) | review phase-result | FAILURE | `f4dffcaebf159cb857eb6008fad80dfb03e214fc` |
| [review-complete-0012](../events/review-complete-0012.json) | review phase-complete | FAILURE | `f4dffcaebf159cb857eb6008fad80dfb03e214fc` |
| [fix-start-0013](../events/fix-start-0013.json) | fix phase-start | started | `f4dffcaebf159cb857eb6008fad80dfb03e214fc` |
| [fix-0014](../events/fix-0014.json) | fix phase-result | completed | `34e28395c83826cdf46e1f09b8ad7761df2be219` |
| [fix-complete-0015](../events/fix-complete-0015.json) | fix phase-complete | completed | `34e28395c83826cdf46e1f09b8ad7761df2be219` |
| [review-start-0016](../events/review-start-0016.json) | review phase-start | started | `34e28395c83826cdf46e1f09b8ad7761df2be219` |
| [review-0017](../events/review-0017.json) | review phase-result | FAILURE | `34e28395c83826cdf46e1f09b8ad7761df2be219` |
| [review-complete-0018](../events/review-complete-0018.json) | review phase-complete | FAILURE | `34e28395c83826cdf46e1f09b8ad7761df2be219` |
| [fix-start-0019](../events/fix-start-0019.json) | fix phase-start | started | `34e28395c83826cdf46e1f09b8ad7761df2be219` |
| [fix-0020](../events/fix-0020.json) | fix phase-result | completed | `fa5c5427d3b541d80b17d3acfc16b518d111e724` |

## Immutable artifacts and receipt links

- **Record:** [Implementation receipt](../events/implementation-0002.json).
- **Record:** [Prior fix receipt](../events/fix-0014.json).
- **Record:** [Prior draft](../artifacts/snapshots/pr-draft-fix-0014.md).
- **Record:** [First review](../artifacts/reviews/review-review-0005.md).
- **Record:** [Second review](../artifacts/reviews/review-review-0011.md).
- **Record:** [Latest review](../artifacts/reviews/review-review-0017.md).
- **Record:** [Fix start](../events/fix-start-0019.json).
- **Record:** [Fix result](../events/fix-0020.json).
- **Record:** [Immutable fix draft](../artifacts/snapshots/pr-draft-fix-0020.md).

## Merge and workflow status

The source fix is committed. No merge, rebase, push, formal review, or tracker change ran. Canonical workflow records remain uncommitted for the parent. The parent owns pane closure, phase completion, projection refresh and workflow commit. The next command after parent validation is `review pi-shared-context-ux-01-projects`.


## Parent phase completion
[fix-complete-0021](../events/fix-complete-0021.json) validates the immutable fix result, exact source commit and tree, test evidence, terminal observations, snapshot and WORKTREE_FIX_DONE marker. Herdr reported done, sequence 379. Pane w7A:pA closed successfully. The workspace remains available. Workflow records are included in the parent phase commit. No merge, push, tracker change or new review ran.
Next command: `submit pi-shared-context-ux-01-projects` or `finish pi-shared-context-ux-01-projects`.


## Latest formal review: review-0023
Verdict: SUCCESS for source fa5c5427d3b541d80b17d3acfc16b518d111e724 and tree 58a4e85a43a983575f385d96c8e18cc8ada8b328. Standards and Spec each report zero findings. STANDARDS-001 and SPEC-001/002/003 are resolved.
The [immutable fourth review](../artifacts/reviews/review-review-0023.md) contains the sole review body. The [review result](../events/review-0023.json) and [parent completion](../events/review-complete-0024.json) are authoritative. Parent [Projects validation](../artifacts/evidence/review-0023/parent-focused-validation.txt) passed 17 tests, zero failed. The reviewer passed 67 extension tests and exercised actual Pi filtering. Captures remain monochrome; no full colour/contrast or live-service claim.
Frozen source and clean worktree remained unchanged. Both axis panes and reviewer pane closed; workspace remains available. The tracker records SUCCESS with reviewed commit, timestamp and artifact link. No merge, push or ticket completion ran.
Next command: `submit pi-shared-context-ux-01-projects` or `finish pi-shared-context-ux-01-projects`.


## Finish attempt: FINISH_FAILED before merge
The [finish start](../events/finish-start-0025.json) and [failure receipt](../events/finish-failed-0026.json) record preflight against published master 78029b50dd399ece54f456edd58d5716d36d00d2. Review-0023 remains SUCCESS for unchanged source fa5c5427d3b541d80b17d3acfc16b518d111e724. [Recorded extension validation](../artifacts/evidence/finish-0025/reviewed-source-validation.txt) passed 67 tests, zero failed.
The base checkout contains user-owned unstaged edits to pi-shared-context/data.ts, which the reviewed integration also changes. Those edits were not staged, stashed, committed or discarded. Worktrunk --no-rebase also requires source ancestry that this graph lacks. An [isolated real-CLI probe](../artifacts/evidence/finish-0025/worktrunk-preflight.json) returned Branch not rebased onto master without changing either test branch.
The committed trees have a clean computed integration tree d610941a177e48b332239b0793f9512339b2fd12. This is not an integration commit or permission to rewrite the approved source. No product merge, push, ticket completion or resource cleanup occurred. Source worktree and workspace are preserved. Resolve the base edits and authorize a source-preserving integration method before retrying finish.
The migration hold is released. Canonical specification: [initiative](../../../tracker/initiatives/pi-shared-context-tui-ux-spec/index.md). Ticket path and state remain unchanged. Historical receipt and review artifacts were not rewritten.
