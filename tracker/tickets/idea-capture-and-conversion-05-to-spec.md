---
blocked_by: 
  - idea-capture-and-conversion-04-grilling
id: idea-capture-and-conversion-05-to-spec
parent: idea-capture-and-conversion
schema: tracker-ticket/v1
sequence: 5
title: Convert an idea into an initiative
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Extend /to-spec to accept a canonical idea reference. Create or update an initiative from its concept checklist and linked exploration records. Preserve the existing initiative publication and verification procedures.

Add the shared tracker operations for proposed coverage, user-confirmed coverage, destination links, and idea completion. These operations must support both initiative and ticket destinations. The later /to-tickets slice reuses them rather than duplicating coverage rules.

## Acceptance criteria

- **Explicit command:** /to-spec starts conversion only when the user invokes it. Completed grilling and an Ask Matt recommendation do not authorize destination writes.
- **Pre-write gate:** Before any destination write, require completed grilling for every current concept and confirmed resolution of all clarification blocks. If the gate fails, name affected concepts and leave destinations unchanged.
- **No automatic detour:** A blocked conversion does not start grilling or create a partial initiative. It explains the missing prerequisite and waits for user direction.
- **Initiative destination:** Create a new initiative or update an existing one through normal tracker operations. Preserve unrelated specification content, discussion, and children.
- **Checklist scope:** Use the user's concepts as required scope. The paragraph supplies context. Unapproved agent suggestions do not become requirements or completion blockers.
- **Coverage proposal:** Explain which canonical destination records cover each concept. An ordinary related link is not proof of coverage.
- **User authority:** Require user confirmation before recording covered concepts or checking their items. One response can confirm several concepts. Manual checkbox changes cannot bypass validation.
- **Destination proof:** Read back and validate persisted destinations through normal tracker discovery before recording successful coverage. Apply their actual publication rules.
- **Initiative-only completion:** Mark the idea done when an initiative alone has confirmed coverage of every concept. Do not wait for child tickets or implementation.
- **Partial coverage:** Keep the idea open when any concept lacks confirmed coverage. Preserve valid links and existing confirmed coverage without inventing full completion.
- **Failure integrity:** Failed destination writes, validation, or required publication cannot mark the idea done. Report any persisted changes precisely and preserve incomplete conversion state.
- **Shared contract:** Make confirmation freshness and full-coverage completion rules authoritative in tracker operations. Herdr reflects the resulting counts and status without its own completion logic.
- **Compatibility:** Ordinary /to-spec conversation and initiative inputs retain their existing behavior. Idea-specific gates do not apply to unrelated inputs.

## Verification

Exercise /to-spec against a real persisted idea. First use incomplete grilling and observe that no destination record changes. Then complete grilling, create or update an initiative, confirm coverage, and observe done status in a fresh read and Herdr filter view.

Add deterministic behavior cases for unresolved clarifications, stale confirmations, relation-versus-coverage, unapproved checkboxes, partial coverage, failed publication, and initiative-only completion. Exercise public tracker operations and the real conversion skill rather than source-text assertions.

Confirm that destination content and initiative membership survive an update. Record runtime proof for the changed conversion path.

## Scope boundaries

This ticket creates the shared coverage operations and complete initiative conversion. It does not implement /to-tickets conversion or execute any resulting work. Keep worktree unchanged.

## Comments

The user approved this slice after grilling. Both tickets-only conversion and post-conversion corrections reuse its coverage operations.

