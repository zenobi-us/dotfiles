---
blocked_by: 
  - idea-capture-and-conversion-05-to-spec
id: idea-capture-and-conversion-06-to-tickets
parent: idea-capture-and-conversion
schema: tracker-ticket/v1
sequence: 6
title: Convert an idea directly into tickets
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Extend /to-tickets to accept a canonical idea reference. Use the shared coverage and grilling gates to create or update executable tickets from the confirmed idea. Preserve the command's normal tracer-bullet breakdown and user-approval interaction.

Allow tickets-only conversion without forcing a new initiative. If the user selects an existing initiative, preserve its specification and discussion and maintain child membership through normal tracker operations.

## Acceptance criteria

- **Explicit conversion:** /to-tickets converts an idea only after the user's explicit command. It does not run automatically after capture, research, grilling, or advice.
- **Shared gate:** Before destination writes, use the authoritative grilling and clarification checks. Missing grilling leaves destination records unchanged and reports the affected concepts.
- **Approved breakdown:** Present complete vertical slices and direct blocking edges for user approval before ticket publication. Do not treat coverage approval as approval of an undisclosed breakdown.
- **Tickets-only path:** Create or update destination tickets without creating an initiative when the idea does not require one. Absence of a parent is valid and does not trigger an automatic hierarchy.
- **Existing destinations:** Support new tickets, updates to existing tickets, or a combination. Preserve unrelated intent and existing record identity.
- **Optional membership:** If the user approves initiative membership, maintain both child parent fields and the initiative's ticket links. Preserve unrelated specification content, comments, and children.
- **Dependency meaning:** Store only direct blocking edges. Validate unique destinations, no self-edges or cycles, and real start-time dependencies. Sequence is display order, not a dependency.
- **Confirmed coverage:** Reuse the shared concept-to-destination proposal and user confirmation operations. Related records alone and unapproved suggestions do not count.
- **Tickets-only completion:** Mark the idea done when the persisted ticket destinations have confirmed coverage of every concept. No initiative or implementation completion is required.
- **Failure integrity:** Partial writes, invalid membership, dependency errors, or required publication failures cannot produce false complete conversion. Report exact persisted changes.
- **Compatibility:** Ordinary conversation and initiative inputs keep their existing behavior. Do not alter ticket claims or implementation status during conversion.

## Verification

Use a real grilled idea for tickets-only conversion. Approve its breakdown, publish the tickets, confirm concept coverage, and observe done status without a new initiative. Repeat with approved membership in an existing initiative and an existing-ticket update.

Add behavior cases for the shared pre-write gate, optional parent, mixed destinations, incomplete coverage, dependency cycles, membership consistency, and partial failure. Verify normal tracker discovery and preserve the initiative specification and discussion on membership updates.

Exercise the real /to-tickets interaction and confirm the resulting idea status and canonical links in a later read.

## Scope boundaries

Do not duplicate the shared coverage implementation or force an initiative. Do not implement, claim, review, or finish the generated tickets. Keep worktree unchanged.

## Comments

The user approved this slice after initiative conversion because it reuses the shared coverage operations. It does not depend on the corrections slice.

