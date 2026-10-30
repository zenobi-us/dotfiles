---
title: Shared-context feedback PR draft snapshot
type: Report
---

# Shared-context feedback implementation

## Ticket summary

[tracker/tickets/pi-shared-context-ux-07-feedback.md](../../../../tracker/tickets/pi-shared-context-ux-07-feedback.md) remains the ongoing feedback log. Its state remains `claimed`. All six screenshot links and all earlier feedback remain unchanged.

## Problem

Loaded workflow diagnostics overwhelmed ticket rows. Selection markers repeated across wrapped lines. Lists and fields lacked spacing. The Markdown reader lacked a separate background. Initiative path copy and progress were not discoverable.

## Implementation

Keep list warnings short and preserve full detail inspection. Add blank separators, retain selected backgrounds and mark only the first line of each selected item. Add a separate padded Markdown body background. Expose `c copy path` for canonical Local Markdown records. Count executable-ticket progress as `todo`, `completed`, or `X/Y completed`, including `0/Y completed` once work starts.

The path action uses typed shared-context resolution. Hosted initiatives and generated collections do not offer nonexistent local paths. Actions and progress share the untouched-state classification.

## Source identity

- **Branch:** `feat/pi-shared-context-ux-07-feedback`.
- **Base:** `master`, authorized starting commit `1999f642d88f61cca1f5b0b185a2b640605d16d1`.
- **Implementation commit:** `7b7cfa90`.
- **Documentation commit and resulting HEAD:** `782b15da5a72240dc4b1d52c79277e119422f559`.
- **Resulting tree:** `d87ce8fca61332fe8aebdb0f356a9e11e359d94f`.

## Changed files

- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/actions.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/events.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.test.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/model.ts`
- `mise/conf.d/devtools-agent/bundles/agent-core/docs/USAGE.md`

## Validation

- **Regression suite:** `mise exec -- bun test ./extensions/pi-shared-context`, from agent-core. Passed: 96 tests, 1911 assertions, 10 files.
- **Scoped typecheck:** `mise exec -- bun x tsc --noEmit -p tsconfig.feedback-smoke.json`. Passed. The removed temporary configuration is preserved in [typecheck scope](../evidence/implementation-0002/typecheck-scope.json).
- **Actual modal:** Pi 1.4.0 under termscope. Exercised real-record loading and loaded diagnostics, wrapped selection, item spacing, ticket and receipt fields, Markdown body background, canonical path copy and exact Wayland clipboard bytes.
- **Progress boundaries:** Labeled synthetic records exercised untouched, started zero-completed, mixed and fully completed states. Final smoke also checked `new`/`to do` aliases and hosted path-copy suppression.
- **Report integrity:** Portable report validation passed. Chromium opened the report and its screenshot lightbox. Terminal processes and the preview server closed.
- **Commit hooks:** Bundle-version checks passed.

The full `bun run typecheck` failed in unrelated muxer-subagents and writing-skills scripts. The implementation receipt records exact files and diagnostics. Those source files remain unchanged.

## Review history

Two independent fresh Herdr sessions ran the implementation skill's Standards and Spec reviews. This was not a worktree review phase.

Resolved S1: progress used a second untouched-state classification that omitted `new` and `to do`. Resolved P1: hosted initiatives offered nonexistent local paths. Both fixes have regression coverage and actual modal smoke evidence.

Remaining findings: none. Latest formal worktree reviewer verdict: not run. [Implementation code review](../reviews/review-implementation-0002.md) records both axes and their disposition.

## Merge status

Not merged. Not pushed. The ticket remains claimed and available for more feedback. Source changes and commits exist only in the authorized source worktree. Original workspace source and tracker edits were not copied, staged, altered or discarded.

## Open questions

None within the ticket scope. Broader bundle type errors and terminal theme/clipboard platform limits remain documented validation limits, not hidden acceptance claims.

## Supporting records

- [Parent start receipt](../../events/start-0001.yaml).
- [Immutable implementation result](../../events/implementation-0002.yaml).
- [Acceptance report and screenshots](../evidence/implementation-0002/report/index.html).
- [Final native clipboard verification](../evidence/implementation-0002/clipboard-final-verified.json).
- [Final terminal protocol](../evidence/implementation-0002/protocol-final-smoke.json).
- [Colour acceptance protocol](../evidence/implementation-0002/protocol-dark-verified.json).
- [Implementation code review](../reviews/review-implementation-0002.md).
- [Immutable PR draft snapshot](pr-draft-implementation-0002.md).

No formal review or finish phase was launched. Continue through the parent workflow when the user requests the next phase.

