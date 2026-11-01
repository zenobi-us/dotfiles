---
blocked_by: []
id: pi-shared-context-ux-08-prototypes
parent: pi-shared-context-tui-ux-spec
schema: tracker-ticket/v1
sequence: 8
title: Route prototype tickets to the prototype skill
triage: ready-for-agent
type: task
work_status: completed
---

## What to build

Add a Prototype action for prototype tickets in pi-shared-context. Use the existing prototype skill and fresh-session confirmation flow. Keep prototype tickets separate from production worktree phases.

## Acceptance criteria

1. Prototype tickets offer Ask Matt and a discoverable p Prototype action.
2. The action prepares /skill:prototype with the canonical ticket reference in a fresh session.
3. Prototype tickets do not offer start, review, fix, finish or submit worktree actions, including when stale worktree receipts exist.
4. If skill:prototype is unavailable, show a disabled reason and do not open a session.
5. Preserve ordinary ticket, research, planning and unknown-record actions. Match prototype type names without case or surrounding-space sensitivity.
6. Preserve canonical record refresh, confirmation, safe data quoting and fresh-session behavior.
7. Verify the menu in native Pi without starting or claiming the Paper Pro hardware prototype.

## Testing decisions

The user approved the existing action/session interfaces as the regression boundary. Test action eligibility and session guards. Use a native Pi smoke check for the visible menu.

## Scope limits

Do not implement a hardware prototype. Do not change prototype capture rules, worktree authority, other record workflows or Paper Pro ticket state.

## Comments

The prototype example is pi-ink-bridge-01-pen-prototype. Its state must remain unchanged during this implementation.


This session claimed this ticket for the requested pi-shared-context action routing change. The user approved regression tests at the existing action/session interfaces. This claim does not start or claim the Paper Pro prototype.

### Implementation review and completion

Ticket: `pi-shared-context-ux-08-prototypes`. Tracker: `tracker/tickets/pi-shared-context-ux-08-prototypes.md`.

Timestamp: `2026-11-01T05:42:59.911Z`. Verdict: SUCCESS.

The reviewed source commit is `f5fa34a272c74186ca530247b305a020da8e1708`. The source and base branches are `master`. The fixed point is `cf4a02f85b8b7db064852dd298376f319b3f53ca`.

The review covers committed, staged, and unstaged changes in the action code, model, regressions, initiative contract, this ticket, and native evidence. The reviewers also checked the two pending prose corrections in this ticket and `native-smoke.json`. They did not review or change the separate Paper Pro prototype work.

Two independent fresh OMP sessions performed the reviews. Standards used `w64:p0`. Spec used `w64:pZ`. Herdr confirmed that both sessions completed. The parent closed only those review panes.

#### Validation and publication

- The initial regression failed because the Prototype action was absent. The existing 12 action/session tests passed before the change.
- The final action/session tests passed with 14 tests and 74 assertions.
- The full affected extension/worktree suite passed with 135 tests and 2,081 assertions across 12 files.
- Scoped typechecking passed for the extension, shared workflow scripts, and bundle types. The check did not rerun the known unrelated `muxer-subagents/scripts/wait.ts` type errors.
- Native Pi 1.4.0 displayed `[p] Prototype`, accepted its shortcut, and prepared the canonical command at fresh-chat confirmation. Cancellation returned to the selected prototype. The check did not start a model request or hardware work.
- The native check used an isolated repository copy with `type: prototype`. The canonical Paper Pro ticket has `type: task` from the separate approved session. This implementation did not change that ticket.
- An ancestry check confirmed that local `master` contains the exact reviewed source commit. The implementation uses the current branch, so it needs no separate worktree merge.
- The source push to `origin/master` succeeded at `f5fa34a272c74186ca530247b305a020da8e1708`. Validation, review, integration, and source publication passed before this completion change.

Native evidence: [result](../../workflows/pi-shared-context-ux-08-prototypes/artifacts/evidence/prototype-actions/native-smoke.json), [action menu](../../workflows/pi-shared-context-ux-08-prototypes/artifacts/evidence/prototype-actions/prototype-actions.svg), and [confirmation](../../workflows/pi-shared-context-ux-08-prototypes/artifacts/evidence/prototype-actions/prototype-confirmation.svg). The local SVG preview collapses spaces. The raw SVG preserves the terminal columns.

#### Standards

Zero findings.

I found no supported documented-standard breaches or baseline smells in the scoped changes.

`actions.ts` follows the existing action-table and fresh-session conventions. It selects Prototype only from normalized `documentType`, keeps prototype records outside production transitions, and reuses existing skill-availability checks.

`model.ts` extends the existing action and shortcut unions without adding another abstraction.

`actions.test.ts` covers consumer-visible eligibility and launch guards. The cases address normalized types, unavailable skills, stale production evidence, and rejected launches without opening a session. They respect the approved action/session regression boundary.

The ticket and initiative action contract agree with the implementation. The native evidence records `[p] Prototype`, the canonical `/skill:prototype` command, and cancellation at confirmation. It explicitly states that no model request or hardware prototype ran.

I reviewed the current scoped source diff, Markdown records through mq-query, native evidence JSON, and raw SVG captures. I did not run builds, tests, linters, or formatters. The parent owns verification.

#### Spec

Zero findings.

Reviewed `tracker/tickets/pi-shared-context-ux-08-prototypes.md` against the initiative action contract, scoped implementation, current worktree corrections, and native evidence.

No supported missing requirements, unrequested behavior, or incorrectly implemented requirements.

- Type-based eligibility: Only normalized `documentType === "prototype"` selects Ask Matt and `[p] Prototype`. IDs, titles, and bodies do not affect eligibility. Other record actions retain their existing routing.
- Production separation: Prototype records bypass worktree transitions, including when stale receipts exist. The prompt invokes `/skill:prototype "<canonical-ticket-ref>"`, without a worktree subcommand.
- Session safeguards: Missing skills disable the action and prevent session creation. Existing canonical refresh, optional prompt collection, confirmation, quoted data, and fresh-session delivery remain in use. Revalidation rejects changed record types before opening a session.
- Native evidence: Raw SVG captures show `[p] Prototype`, no production worktree actions, and confirmation containing the canonical command. `native-smoke.json` records cancellation in an isolated clone, without executing the prototype or starting a model request.
- Scope limits: The scoped changes do not alter prototype capture rules, worktree authority, hardware behavior, or the canonical Paper Pro ticket.

No builds, tests, linters, or formatters run during this review. The supplied validation results remain parent-owned. Native evidence stops at confirmation; fresh-session delivery is supported by the unchanged shared implementation and existing guard coverage, not a live model run.

Axis totals: Standards 0; Spec 0. Neither axis has an open issue.
