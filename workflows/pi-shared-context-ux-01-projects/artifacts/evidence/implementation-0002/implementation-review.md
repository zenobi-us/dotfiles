---
title: Projects implementation code review
type: Concept
---

# Implementation code review

Ticket: `tracker/tickets/pi-shared-context-ux-01-projects.md`
Tracker root: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/tracker`
Branches: `feature/pi-shared-context-ux-01-projects` against `master`.
Owner-reviewed source commit: `afb6b874f70afb2035ed76288140daf1ff589691`.
Source tree: `bc8acd4597834dc04cb5169bdf93be44db95ab32`.
Timestamp: `2026-10-26T23:13:19.771033Z`.

## Scope and method

Two independent OMP agents reviewed standards and specification fidelity in Herdr panes w77:p2 and w77:p3. They inspected the initial uncommitted implementation against d458207915067db9d1a3699aebe198840cffb905. Both agents performed read-only reviews. Both panes are closed.
The owner applied the findings, inspected the complete final diff, and verified the fixes. This is the implementation code review, not the formal worktree review phase. No formal review receipt or ticket state change exists.

## Standards

| Finding | Severity | Resolution |
| --- | --- | --- |
| Cached Files retained an old alignment root after project return. | P2 hard violation | Apply the resolved Files root before activation. A complete-modal regression changes alignment while the project is inactive. |
| New tests asserted breadcrumb decoration and a header hint. | P2 hard violation | Remove those assertions. Activate public controls and assert project identities and navigation results. |
| Two focus-order implementations can diverge. | P3 judgment call | Share focusOrder between modal traversal and standalone tracker navigation. |

Initial standards findings: two hard violations and one judgment-call smell. All three have listed fixes and passing regression checks.

## Specification

| Finding | Severity | Resolution |
| --- | --- | --- |
| Cached Files used stale routes on return, contrary to route ownership. | P1 | Synchronize the resolved root before watcher attachment and reads. |
| Focus wrapping re-entered the retained pane instead of the traversal boundary. | P2 | Enter the first pane on forward traversal and the last pane on reverse traversal. A complete-modal reader-scroll regression covers both directions. |
| Repository alignment rejected checkoutless projects with readable shared records. | P2 | Resolve stored routes without requiring a checkout. Read available shared records and explain unavailable repository records. Keep stored Files accessible. |

Initial specification findings: three. All three have listed fixes and passing regression checks. No initiative redesign, Research tab, conversion command, storage migration, or Files cross-link was added.

## Runtime addendum

Actual Pi acceptance exposed a fresh-chat host-contract error. The old code used its parent command context after newSession. The owner replaced it with withSession and a regression that rejects access to the stale parent editor. The final actual Pi run staged the canonical command in the new editor without sending it.
The owner also guarded pending Files path insertion against a generation change after workspace suspension.

## Validation and verdict

[Focused modal and contract checks](focused-tests-final.txt): 90 passed.
[Extension suite](extension-suite-final.txt): 59 passed.
[Session regression](session-regression-final.txt): 12 passed.
[Scoped TypeScript check](scoped-typecheck-success.txt): passed.
[Actual terminal acceptance](terminal-acceptance.md): completed at all requested sizes in colour and monochrome.
[Bundle-wide typecheck](bundle-typecheck-remaining.txt): fails only in untouched muxer-subagents and writing-skills scripts.

Owner verdict: no known implementation findings remain after the listed corrections. The independent agents did not perform a second review after these corrections. The parent still owns the formal worktree review. Latest formal reviewer verdict remains null.

