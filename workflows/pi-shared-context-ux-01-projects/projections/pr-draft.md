---
title: Projects implementation draft
type: Concept
---

# Projects implementation draft

## Ticket summary

[tracker/tickets/pi-shared-context-ux-01-projects.md](../../../tracker/tickets/pi-shared-context-ux-01-projects.md) adds project selection to the existing shared-context modal. The canonical ticket remains claimed. The parent owns ticket state changes.

## Problem statement

The modal only opened the current project. It did not expose stored projects through interactive breadcrumbs or retain independent workspace state across project selection.

## Implementation summary

Added focusable and clickable Projects navigation with canonical deduplication, route-owned tracker and Files reads, independent cached workspaces, watcher replacement, checkoutless shared and mixed-route reads, disabled action reasons, and preserved fresh-chat staging through Pi withSession.

The command still opens the current project. Selection changes only the modal context. The storage indicator uses the alignment route. No other UX ticket was implemented.

Source branch: `feature/pi-shared-context-ux-01-projects`.
Base branch: `master`.
Final source commit: `afb6b874f70afb2035ed76288140daf1ff589691`.
Final source tree: `bc8acd4597834dc04cb5169bdf93be44db95ab32`.
The source worktree is clean. Source commits are `26531a0a` and `afb6b874f70afb2035ed76288140daf1ff589691`.

## Changed files

- **Source file:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/actions.ts`
- **Source file:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/actions.test.ts`
- **Source file:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.ts`
- **Source file:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts`
- **Source file:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/index.ts`
- **Source file:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/modal.ts`
- **Source file:** `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/projects.test.ts`
- **Source file:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib.ts`
- **Source file:** `mise/conf.d/devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/README.md`

## Validation results

| Check | Result | Evidence |
| --- | --- | --- |
| Focused modal and affected contracts | 90 passed, 0 failed | [Log](../artifacts/evidence/implementation-0002/focused-tests-final.txt) |
| Extension suite | 59 passed, 0 failed | [Log](../artifacts/evidence/implementation-0002/extension-suite-final.txt) |
| Fresh-session regression | 12 passed, 0 failed | [Log](../artifacts/evidence/implementation-0002/session-regression-final.txt) |
| Scoped TypeScript compilation | Passed | [Log](../artifacts/evidence/implementation-0002/scoped-typecheck-success.txt) |
| Actual Pi terminal acceptance | 40x12, 80x24, 120x40; colour and monochrome | [Observations](../artifacts/evidence/implementation-0002/terminal-acceptance.md) |
| Bundle-wide typecheck | Fails in untouched muxer-subagents and writing-skills scripts | [Log](../artifacts/evidence/implementation-0002/bundle-typecheck-remaining.txt) |

Required modal, contract, suite, and terminal checks pass. The broader bundle typecheck remains an unrelated limitation.

## Review history

The [parent start receipt](../events/start-0001.json) started the independent implementation phase. No implementation or formal review result existed before this phase.
Two independent agents performed the implementation code review. The owner applied their findings and verified the final diff and runtime behavior. [Implementation review](../artifacts/evidence/implementation-0002/implementation-review.md).
No formal worktree review phase ran. Latest formal reviewer verdict: null.

## Resolved findings

- **Route ownership:** Files now uses newly resolved routes before watcher attachment and reads.
- **Focus traversal:** The modal re-enters tracker panes at the correct traversal boundary and shares one focus order.
- **Mixed routes:** Projects retain readable shared records without a checkout, including repository alignment with shared records.
- **Behavior tests:** New tests use public input and meaningful visible outcomes instead of breadcrumb decoration.
- **Fresh chats:** Actual Pi acceptance exposed stale-context use after newSession. withSession now stages the unsent command in the replacement context.

## Remaining findings and risks

No known implementation finding remains. The parent still must perform the formal worktree review.
The full bundle typecheck reports errors in untouched scripts. Existing narrow tracker title clipping and the host ctrl+shift+g conflict remain outside this ticket.
The isolated runtime had no model credentials. The UI and fresh-chat staging ran without a model request.
Stored project enumeration does not retain checkout locations. Checkout-dependent actions remain disabled until that project opens from a known checkout.

## Merge status

Not merged. Not pushed. The source worktree and feature branch remain available. Canonical workflow artifacts remain for the parent to commit.

## Durable records

- **Start receipt:** [start-0001](../events/start-0001.json).
- **Implementation result:** [implementation-0002](../events/implementation-0002.json).
- **Draft snapshot:** [pr-draft-implementation-0002](../artifacts/snapshots/pr-draft-implementation-0002.md).
- **Evidence directory:** [implementation-0002 evidence](../artifacts/evidence/implementation-0002).
- **Terminal observations:** [Terminal acceptance](../artifacts/evidence/implementation-0002/terminal-acceptance.md).
- **Implementation review:** [Standards and specification review](../artifacts/evidence/implementation-0002/implementation-review.md).

## Parent phase completion

[Phase completion](../events/implementation-complete-0003.json) records the checked implementation result. The completed agent pane is closed. The worktree remains available for formal review. The ticket state is implemented, not completed.

