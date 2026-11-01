---
blocked_by: []
id: pi-shared-context-ux-08-prototypes
parent: pi-shared-context-tui-ux-spec
schema: tracker-ticket/v1
sequence: 8
title: Route prototype tickets to the prototype skill
triage: ready-for-agent
type: task
work_status: claimed
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


Claimed for the requested pi-shared-context action routing change. The user approved regression tests at the existing action/session interfaces. This claim does not start or claim the Paper Pro prototype.
